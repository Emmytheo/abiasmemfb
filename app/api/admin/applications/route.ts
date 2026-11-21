import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAdminUser } from "@/lib/auth/server-guard"
import { ensureBankSuiteOperationalTables, queryBankSuite, withBankSuiteTransaction } from "@/lib/banking/db-pool"
import { computeAmortizationSchedule, postBalancedGlJournal } from "@/lib/banking/gl-engine"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"

export const dynamic = "force-dynamic"

function generateNuban(prefix = "30") {
    const digits = Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join("")
    return `${prefix}${digits}`
}

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const status = req.nextUrl.searchParams.get("status")

        const [appsRes, countsRes] = await Promise.all([
            queryBankSuite(
                `
                SELECT a.id, a.user_id, a.product_type_id_id AS product_type_id,
                       a.status, a.workflow_stage, a.requested_amount, a.submitted_data,
                       a.metadata, a.created_at, a.updated_at,
                       pt.name AS product_name, pt.category AS product_category,
                       c.id AS customer_id,
                       COALESCE(NULLIF(TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')), ''), c.email, a.user_id) AS applicant_name,
                       c.email AS applicant_email, c.phone_number AS applicant_phone, c.kyc_status,
                       (SELECT account_number FROM public.accounts acc WHERE acc.user_id = a.user_id ORDER BY acc.created_at DESC LIMIT 1) AS latest_account_number,
                       (SELECT COUNT(*)::int FROM public.accounts acc WHERE acc.user_id = a.user_id) AS customer_account_count
                FROM public.product_applications a
                LEFT JOIN public.product_types pt ON pt.id = a.product_type_id_id
                LEFT JOIN public.customers c ON c.supabase_id = a.user_id
                ${status && status !== "all" ? "WHERE a.status::text = $1" : ""}
                ORDER BY a.created_at DESC
                LIMIT 150
                `,
                status && status !== "all" ? [status] : []
            ),
            queryBankSuite(`
                SELECT
                    COUNT(*)::int AS total,
                    COUNT(*) FILTER (WHERE status::text IN ('pending', 'under_review'))::int AS pending_count,
                    COUNT(*) FILTER (WHERE workflow_stage ILIKE '%Retry%' OR workflow_stage ILIKE '%Fail%')::int AS retrying_count,
                    COUNT(*) FILTER (WHERE status::text = 'approved')::int AS approved_count,
                    COUNT(*) FILTER (WHERE status::text = 'rejected')::int AS rejected_count
                FROM public.product_applications
            `),
        ])

        return NextResponse.json({
            success: true,
            applications: appsRes.rows,
            counts: countsRes.rows[0] || {
                total: 0,
                pending_count: 0,
                retrying_count: 0,
                approved_count: 0,
                rejected_count: 0,
            },
        })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Failed to load applications" }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const action = String(body.action || "")
        const appId = Number(body.application_id)

        if (!appId) {
            return NextResponse.json({ error: "application_id is required." }, { status: 400 })
        }

        const appRes = await queryBankSuite(
            `
            SELECT a.*, pt.name AS product_name, pt.category AS product_category,
                   c.id AS customer_id, c.first_name, c.last_name, c.email AS customer_email
            FROM public.product_applications a
            LEFT JOIN public.product_types pt ON pt.id = a.product_type_id_id
            LEFT JOIN public.customers c ON c.supabase_id = a.user_id
            WHERE a.id = $1
            LIMIT 1
            `,
            [appId]
        )
        const app = appRes.rows[0]
        if (!app) {
            return NextResponse.json({ error: "Application not found." }, { status: 404 })
        }

        if (action === "reject") {
            const reason = String(body.reason || "Declined by Underwriting Desk").trim()
            const upd = await queryBankSuite(
                `UPDATE public.product_applications
                 SET status = 'rejected', workflow_stage = 'Rejected',
                     metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
                     updated_at = NOW()
                 WHERE id = $2 RETURNING *`,
                [JSON.stringify({ rejection_reason: reason, rejected_by: auth.email, rejected_at: new Date().toISOString() }), appId]
            )
            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                action: "application.rejected",
                entityType: "product_application",
                entityId: appId,
                ipAddress: auth.ipAddress,
                afterState: { reason },
            })
            return NextResponse.json({ success: true, application: upd.rows[0] })
        }

        if (action === "approve_and_provision") {
            const prodLabel = `${app.product_name || ""} ${app.product_category || ""}`.toLowerCase()
            const isLoan = prodLabel.includes("loan") || prodLabel.includes("credit") || prodLabel.includes("facility")

            if (isLoan) {
                const requestedNaira = Number(body.principal_naira || app.requested_amount || 100000)
                const principalKobo = Math.max(100000, Math.round(requestedNaira * 100))
                const annualRate = Number(body.interest_rate || 18)
                const durationMonths = Math.max(1, Number(body.duration_months || 6))
                const disburseNow = body.disburse_now !== false

                const sched = computeAmortizationSchedule({
                    principalKobo,
                    annualRatePercent: annualRate,
                    durationMonths,
                })
                const nextPay = sched.schedule[0]?.dueDate || new Date(Date.now() + 30 * 86400000).toISOString()
                const maturity = sched.schedule[sched.schedule.length - 1]?.dueDate || new Date(Date.now() + durationMonths * 30 * 86400000).toISOString()

                const provisioned = await withBankSuiteTransaction(async (client) => {
                    // Find or provision customer's disbursement account
                    let accRes = await client.query(
                        `SELECT id, account_number, balance FROM public.accounts WHERE user_id = $1 AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1 FOR UPDATE`,
                        [app.user_id]
                    )
                    let targetAcc = accRes.rows[0]
                    if (!targetAcc) {
                        const nuban = generateNuban("30")
                        const insAcc = await client.query(
                            `INSERT INTO public.accounts (user_id, customer_id, account_number, account_type, balance, lien_amount, currency, status, source, is_primary, created_at, updated_at)
                             VALUES ($1, $2, $3, 'Savings', 0, 0, 'NGN', 'active', 'local', TRUE, NOW(), NOW()) RETURNING id, account_number, balance`,
                            [app.user_id, app.customer_id || null, nuban]
                        )
                        targetAcc = insAcc.rows[0]
                    }

                    const loanIns = await client.query(
                        `INSERT INTO public.loans (
                            user_id, customer_id, account_id, application_id, product_type_id,
                            principal, outstanding_balance, interest_rate, duration_months, monthly_installment,
                            disbursed_at, next_payment_date, maturity_date, status, repayment_schedule,
                            purpose, metadata, created_at, updated_at
                         ) VALUES (
                            $1, $2, $3, $4, $5,
                            $6, $7, $8, $9, $10,
                            $11, $12, $13, $14, $15::jsonb,
                            $16, $17::jsonb, NOW(), NOW()
                         ) RETURNING *`,
                        [
                            app.user_id,
                            app.customer_id || null,
                            targetAcc.id,
                            app.id,
                            app.product_type_id_id || null,
                            principalKobo,
                            sched.totalRepayableKobo,
                            annualRate,
                            durationMonths,
                            sched.monthlyInstallmentKobo,
                            disburseNow ? new Date().toISOString() : null,
                            nextPay,
                            maturity,
                            disburseNow ? "active" : "pending",
                            JSON.stringify(sched.schedule),
                            app.product_name || "Approved Credit Facility",
                            JSON.stringify({ provisioned_from_application_id: app.id, approved_by: auth.email }),
                        ]
                    )
                    const loan = loanIns.rows[0]

                    let txRef: string | null = null
                    if (disburseNow) {
                        const nextBal = Number(targetAcc.balance || 0) + principalKobo
                        await client.query(
                            `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                            [nextBal, targetAcc.id]
                        )
                        txRef = `LN_DISB_${loan.id}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`
                        await client.query(
                            `INSERT INTO public.transactions (
                                reference, type, amount, currency, to_account_id, loan_id,
                                status, narration, channel, balance_after, date, metadata, customer_id, user_id,
                                created_at, updated_at
                             ) VALUES ($1, 'disbursement', $2, 'NGN', $3, $4, 'successful', $5, 'admin', $6, NOW(), $7::jsonb, $8, $9, NOW(), NOW())`,
                            [
                                txRef,
                                principalKobo,
                                targetAcc.id,
                                loan.id,
                                `Loan Disbursement (#${loan.id} · ${app.product_name || "Credit Facility"})`,
                                nextBal,
                                JSON.stringify({ application_id: app.id, approved_by: auth.email }),
                                app.customer_id || null,
                                app.user_id,
                            ]
                        )
                    }

                    await client.query(
                        `UPDATE public.product_applications
                         SET status = 'approved', workflow_stage = 'Provisioned',
                             metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
                             updated_at = NOW()
                         WHERE id = $2`,
                        [
                            JSON.stringify({
                                provisioned_loan_id: loan.id,
                                disbursement_account: targetAcc.account_number,
                                disbursement_ref: txRef,
                                approved_by: auth.email,
                                provisioned_at: new Date().toISOString(),
                            }),
                            app.id,
                        ]
                    )

                    return { loan, targetAcc, txRef }
                })

                if (disburseNow) {
                    await postBalancedGlJournal({
                        narration: `Loan Origination & Disbursement (#${provisioned.loan.id} from App #${app.id})`,
                        sourceModule: "credit_committee",
                        sourceRef: provisioned.txRef || `LOAN_${provisioned.loan.id}`,
                        actorId: auth.userId,
                        actorEmail: auth.email,
                        ipAddress: auth.ipAddress,
                        lines: [
                            { glCode: "1200", side: "debit", amountKobo: principalKobo, narration: `Loan receivable booked (#${provisioned.loan.id})` },
                            { glCode: "2000", side: "credit", amountKobo: principalKobo, narration: `Disbursement credited to ${provisioned.targetAcc.account_number}` },
                        ],
                    })
                }

                await writeBankAuditLog({
                    actorId: auth.userId,
                    actorEmail: auth.email,
                    actorRole: auth.role,
                    action: "application.provisioned_loan",
                    entityType: "product_application",
                    entityId: app.id,
                    amountKobo: principalKobo,
                    ipAddress: auth.ipAddress,
                    afterState: { loan_id: provisioned.loan.id, account_number: provisioned.targetAcc.account_number },
                })

                return NextResponse.json({
                    success: true,
                    provisionedType: "loan",
                    loan: provisioned.loan,
                    accountNumber: provisioned.targetAcc.account_number,
                    message: `Approved & originated Loan #${provisioned.loan.id} (₦${(principalKobo / 100).toLocaleString()}) into NUBAN ${provisioned.targetAcc.account_number}.`,
                })
            }

            // Deposit Account Provisioning (Savings / Current / Fixed Deposit / Corporate)
            const accountType = prodLabel.includes("fixed")
                ? "Fixed Deposit"
                : prodLabel.includes("corporate") || prodLabel.includes("business") || prodLabel.includes("sme")
                    ? "Corporate"
                    : prodLabel.includes("current")
                        ? "Current"
                        : "Savings"

            const provisionedAcc = await withBankSuiteTransaction(async (client) => {
                // Ensure unique 10-digit NUBAN
                let nuban = generateNuban("30")
                for (let tries = 0; tries < 5; tries++) {
                    const dup = await client.query(`SELECT id FROM public.accounts WHERE account_number = $1`, [nuban])
                    if (dup.rows.length === 0) break
                    nuban = generateNuban("30")
                }

                const existingCount = await client.query(
                    `SELECT COUNT(*)::int AS c FROM public.accounts WHERE user_id = $1`,
                    [app.user_id]
                )
                const isPrimary = Number(existingCount.rows[0]?.c || 0) === 0

                const ins = await client.query(
                    `INSERT INTO public.accounts (
                        user_id, customer_id, account_number, account_type, balance, lien_amount,
                        currency, status, source, is_primary, is_frozen, pnd_enabled,
                        metadata, created_at, updated_at
                     ) VALUES (
                        $1, $2, $3, $4, 0, 0,
                        'NGN', 'active', 'local', $5, FALSE, FALSE,
                        $6::jsonb, NOW(), NOW()
                     ) RETURNING *`,
                    [
                        app.user_id,
                        app.customer_id || null,
                        nuban,
                        accountType,
                        isPrimary,
                        JSON.stringify({
                            provisioned_from_application_id: app.id,
                            product_name: app.product_name,
                            approved_by: auth.email,
                        }),
                    ]
                )

                await client.query(
                    `UPDATE public.product_applications
                     SET status = 'approved', workflow_stage = 'Provisioned',
                         metadata = COALESCE(metadata, '{}'::jsonb) || $1::jsonb,
                         updated_at = NOW()
                     WHERE id = $2`,
                    [
                        JSON.stringify({
                            provisioned_account_id: ins.rows[0].id,
                            provisioned_account_number: nuban,
                            approved_by: auth.email,
                            provisioned_at: new Date().toISOString(),
                        }),
                        app.id,
                    ]
                )

                return ins.rows[0]
            })

            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: auth.role,
                action: "application.provisioned_account",
                entityType: "product_application",
                entityId: app.id,
                ipAddress: auth.ipAddress,
                afterState: { account_id: provisionedAcc.id, account_number: provisionedAcc.account_number, account_type: accountType },
            })

            return NextResponse.json({
                success: true,
                provisionedType: "account",
                account: provisionedAcc,
                message: `Approved & provisioned live ${accountType} NUBAN ${provisionedAcc.account_number}!`,
            })
        }

        return NextResponse.json({ error: "Unsupported application action." }, { status: 400 })
    } catch (err: any) {
        return NextResponse.json({ error: err.message || "Application action failed" }, { status: 400 })
    }
}
