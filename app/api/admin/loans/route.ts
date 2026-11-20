import { NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { requireAdminUser } from "@/lib/auth/server-guard"
import {
    ensureBankSuiteOperationalTables,
    queryBankSuite,
    withBankSuiteTransaction,
} from "@/lib/banking/db-pool"
import { computeAmortizationSchedule, postBalancedGlJournal } from "@/lib/banking/gl-engine"
import { writeBankAuditLog } from "@/lib/banking/ledger-engine"
import {
    getCoptellerMemberLinkForCustomer,
    getCoptellerOversightSnapshot,
    processCoptellerLoanDecision,
} from "@/lib/banking/copteller-bridge"

export const dynamic = "force-dynamic"

export async function GET(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const [loansRes, customersRes, accountsRes, coptellerSnap] = await Promise.all([
            queryBankSuite(`
                SELECT l.*,
                       COALESCE(c.first_name || ' ' || c.last_name, c.email, l.user_id) AS borrower_name,
                       c.email AS borrower_email,
                       c.phone_number AS borrower_phone,
                       c.bvn AS borrower_bvn,
                       c.kyc_status AS borrower_kyc,
                       a.account_number AS linked_account_number,
                       a.balance AS linked_account_balance_kobo,
                       pt.name AS product_name
                FROM public.loans l
                LEFT JOIN public.customers c ON c.id = l.customer_id
                LEFT JOIN public.accounts a ON a.id = l.account_id
                LEFT JOIN public.product_types pt ON pt.id = l.product_type_id
                ORDER BY l.created_at DESC
                LIMIT 150
            `),
            queryBankSuite(`
                SELECT c.id, c.first_name, c.last_name, c.email, c.bvn, c.supabase_id, c.kyc_status,
                       (SELECT a.id FROM public.accounts a WHERE (a.customer_id = c.id OR a.user_id = c.supabase_id) AND a.status = 'active' ORDER BY a.is_primary DESC, a.id ASC LIMIT 1) AS primary_account_id,
                       (SELECT a.account_number FROM public.accounts a WHERE (a.customer_id = c.id OR a.user_id = c.supabase_id) AND a.status = 'active' ORDER BY a.is_primary DESC, a.id ASC LIMIT 1) AS primary_account_number
                FROM public.customers c
                WHERE COALESCE(c.is_archived, FALSE) = FALSE
                ORDER BY c.created_at DESC
                LIMIT 100
            `),
            queryBankSuite(`
                SELECT id, account_number, account_type, balance, customer_id, user_id
                FROM public.accounts
                WHERE status = 'active'
                ORDER BY id ASC
            `),
            getCoptellerOversightSnapshot().catch(() => null),
        ])

        // Enrich BankSuite loans with amortization schedule & live Copteller Behavioral Trust Score (if linked)
        const bankLoans = await Promise.all(
            loansRes.rows.map(async (l) => {
                const principalKobo = Number(l.principal || 0)
                const outstandingKobo = Number(l.outstanding_balance ?? principalKobo)
                const paidKobo = Math.max(0, principalKobo - outstandingKobo)
                const computed = computeAmortizationSchedule({
                    principalKobo,
                    annualRatePercent: Number(l.interest_rate || 18),
                    durationMonths: Number(l.duration_months || 6),
                    startDate: l.disbursed_at ? new Date(l.disbursed_at) : new Date(l.created_at),
                    paidAmountKobo: paidKobo,
                })
                const copLink = await getCoptellerMemberLinkForCustomer({
                    email: l.borrower_email,
                    bvn: l.borrower_bvn,
                }).catch(() => null)

                return {
                    ...l,
                    source: "banksuite",
                    principal_kobo: principalKobo,
                    outstanding_kobo: outstandingKobo,
                    paid_kobo: paidKobo,
                    monthly_installment_kobo: Number(l.monthly_installment || computed.monthlyInstallmentKobo),
                    schedule: Array.isArray(l.repayment_schedule) && l.repayment_schedule.length > 0
                        ? l.repayment_schedule
                        : computed.schedule,
                    copteller_telemetry: copLink,
                }
            })
        )

        // Include Copteller loans & contracts for unified credit committee oversight
        const coptellerLoans = (coptellerSnap?.loans || []).map((cl: any) => ({
            ...cl,
            source: "copteller",
            principal_kobo: Number(cl.principal || 0),
            outstanding_kobo: Number(cl.outstanding_balance ?? cl.principal ?? 0),
            paid_kobo: Math.max(0, Number(cl.principal || 0) - Number(cl.outstanding_balance ?? cl.principal ?? 0)),
        }))

        const activeExposureKobo = bankLoans
            .filter((l) => l.status === "active" || l.status === "defaulted")
            .reduce((s, l) => s + l.outstanding_kobo, 0)
        const defaultedKobo = bankLoans
            .filter((l) => l.status === "defaulted" || l.status === "written_off")
            .reduce((s, l) => s + l.outstanding_kobo, 0)
        const totalPrincipalKobo = bankLoans.reduce((s, l) => s + l.principal_kobo, 0)

        return NextResponse.json({
            success: true,
            kpis: {
                totalLoans: bankLoans.length,
                activeLoans: bankLoans.filter((l) => l.status === "active").length,
                pendingLoans: bankLoans.filter((l) => l.status === "pending").length + coptellerLoans.filter((l: any) => l.status === "pending").length,
                defaultedLoans: bankLoans.filter((l) => l.status === "defaulted").length,
                repaidLoans: bankLoans.filter((l) => l.status === "repaid").length,
                totalPrincipalKobo,
                activeExposureKobo,
                defaultedKobo,
                nplRatioPct: activeExposureKobo > 0 ? Number(((defaultedKobo / activeExposureKobo) * 100).toFixed(2)) : 0,
                coptellerContractsCount: coptellerSnap?.kpis?.activeContracts || 0,
                coptellerCollectionRatePct: coptellerSnap?.kpis?.collectionRatePct || 100,
            },
            bankLoans,
            coptellerLoans,
            customers: customersRes.rows,
            accounts: accountsRes.rows,
        })
    } catch (err: any) {
        console.error("[GET /api/admin/loans]", err)
        return NextResponse.json({ error: err.message || "Failed to load credit portfolio" }, { status: 500 })
    }
}

/**
 * POST /api/admin/loans
 * - action === "originate": Create a new MFB loan facility with full amortization schedule; optionally disburse immediately into borrower's NUBAN + post GL 1200/2000.
 * - action === "repay": Post an atomic loan repayment (debit borrower account if available OR cash repayment, reduce outstanding_balance, update schedule, mark repaid when 0, post GL 1000/1200/4000).
 */
export async function POST(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const action = String(body.action || "originate")

        if (action === "originate") {
            const customerId = Number(body.customer_id)
            const accountId = body.account_id ? Number(body.account_id) : null
            const principalNaira = Number(body.principal_naira)
            const interestRate = Number(body.interest_rate ?? 18)
            const durationMonths = Math.max(1, Math.min(60, Math.round(Number(body.duration_months || 6))))
            const purpose = String(body.purpose || "SME Working Capital Facility").trim()
            const collateral = String(body.collateral || "Cooperative / Union Executive Guarantee").trim()
            const disburseImmediately = body.disburse_immediately !== false

            if (!customerId || !Number.isFinite(principalNaira) || principalNaira < 5000) {
                return NextResponse.json({ error: "Select a customer and enter a principal of at least ₦5,000." }, { status: 400 })
            }

            const custRes = await queryBankSuite(`SELECT * FROM public.customers WHERE id = $1 LIMIT 1`, [customerId])
            const customer = custRes.rows[0]
            if (!customer) return NextResponse.json({ error: "Customer not found." }, { status: 404 })

            const principalKobo = Math.round(principalNaira * 100)
            const now = new Date()
            const maturity = new Date(now)
            maturity.setMonth(maturity.getMonth() + durationMonths)
            const nextPay = new Date(now)
            nextPay.setMonth(nextPay.getMonth() + 1)

            const amort = computeAmortizationSchedule({
                principalKobo,
                annualRatePercent: interestRate,
                durationMonths,
                startDate: now,
            })

            const ref = `LN_DISB_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

            const created = await withBankSuiteTransaction(async (client) => {
                // Resolve borrower account
                let targetAcc: any = null
                if (accountId) {
                    const aRes = await client.query(`SELECT * FROM public.accounts WHERE id = $1 FOR UPDATE`, [accountId])
                    targetAcc = aRes.rows[0]
                } else {
                    const aRes = await client.query(
                        `SELECT * FROM public.accounts WHERE (customer_id = $1 OR user_id = $2) AND status = 'active' ORDER BY is_primary DESC, id ASC LIMIT 1 FOR UPDATE`,
                        [customer.id, customer.supabase_id || ""]
                    )
                    targetAcc = aRes.rows[0]
                }

                const status = disburseImmediately ? "active" : "pending"
                const ins = await client.query(
                    `INSERT INTO public.loans (
                        user_id, customer_id, account_id, principal, outstanding_balance,
                        interest_rate, duration_months, monthly_installment,
                        disbursed_at, next_payment_date, maturity_date, status,
                        repayment_schedule, collateral, purpose, metadata, created_at, updated_at
                     ) VALUES (
                        $1, $2, $3, $4, $5,
                        $6, $7, $8,
                        $9, $10, $11, $12,
                        $13::jsonb, $14, $15, $16::jsonb, NOW(), NOW()
                     ) RETURNING *`,
                    [
                        customer.supabase_id || String(customer.id),
                        customer.id,
                        targetAcc ? targetAcc.id : null,
                        principalKobo,
                        amort.totalRepayableKobo,
                        interestRate,
                        durationMonths,
                        amort.monthlyInstallmentKobo,
                        disburseImmediately ? now.toISOString() : null,
                        nextPay.toISOString(),
                        maturity.toISOString(),
                        status,
                        JSON.stringify(amort.schedule),
                        collateral,
                        purpose,
                        JSON.stringify({
                            originated_by: auth.email,
                            total_interest_kobo: amort.totalInterestKobo,
                            total_repayable_kobo: amort.totalRepayableKobo,
                        }),
                    ]
                )

                const loan = ins.rows[0]

                if (disburseImmediately && targetAcc) {
                    const nextBal = Number(targetAcc.balance || 0) + principalKobo
                    await client.query(
                        `UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`,
                        [nextBal, targetAcc.id]
                    )
                    await client.query(
                        `INSERT INTO public.transactions (
                            reference, type, amount, currency, to_account_id, loan_id,
                            status, narration, channel, balance_after, date, metadata,
                            customer_id, user_id, created_at, updated_at
                         ) VALUES (
                            $1, 'disbursement', $2, 'NGN', $3, $4,
                            'successful', $5, 'admin', $6, NOW(), $7::jsonb,
                            $8, $9, NOW(), NOW()
                         )`,
                        [
                            ref,
                            principalKobo,
                            targetAcc.id,
                            loan.id,
                            `Loan Disbursement #${loan.id}: ${purpose}`,
                            nextBal,
                            JSON.stringify({ approved_by: auth.email, interest_rate: interestRate, duration_months: durationMonths }),
                            customer.id,
                            targetAcc.user_id || customer.supabase_id || String(customer.id),
                        ]
                    )
                }

                return { loan, creditedAccountNumber: targetAcc?.account_number || null }
            })

            if (disburseImmediately) {
                await postBalancedGlJournal({
                    journalRef: `GL_${ref}`,
                    narration: `Loan Facility #${created.loan.id} Disbursed to ${customer.first_name} ${customer.last_name}`,
                    sourceModule: "credit_committee",
                    sourceRef: ref,
                    actorId: auth.userId,
                    actorEmail: auth.email,
                    ipAddress: auth.ipAddress,
                    lines: [
                        { glCode: "1200", side: "debit", amountKobo: principalKobo, narration: `Loan receivable #${created.loan.id}` },
                        { glCode: "2000", side: "credit", amountKobo: principalKobo, narration: `Borrower account credit (${created.creditedAccountNumber || "OTC"})` },
                    ],
                }).catch(() => {})
            }

            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: "admin",
                action: disburseImmediately ? "loan.originated_and_disbursed" : "loan.originated_pending",
                entityType: "loan",
                entityId: created.loan.id,
                amountKobo: principalKobo,
                ipAddress: auth.ipAddress,
                afterState: { status: created.loan.status, reference: ref, creditedAccountNumber: created.creditedAccountNumber },
            })

            return NextResponse.json({ success: true, ...created, reference: ref }, { status: 201 })
        }

        if (action === "repay") {
            const loanId = Number(body.loan_id)
            const amountNaira = Number(body.amount_naira)
            const sourceMode = body.source_mode === "cash_otc" ? "cash_otc" : "debit_account"

            if (!loanId || !Number.isFinite(amountNaira) || amountNaira <= 0) {
                return NextResponse.json({ error: "Valid loan_id and positive repayment amount are required." }, { status: 400 })
            }

            const repayKobo = Math.round(amountNaira * 100)
            const ref = `LN_REP_${loanId}_${Date.now()}_${crypto.randomBytes(2).toString("hex").toUpperCase()}`

            const result = await withBankSuiteTransaction(async (client) => {
                const lRes = await client.query(`SELECT * FROM public.loans WHERE id = $1 FOR UPDATE`, [loanId])
                const loan = lRes.rows[0]
                if (!loan) throw new Error("Loan not found.")
                if (!["active", "defaulted"].includes(loan.status)) {
                    throw new Error(`Cannot post repayment on loan with status "${loan.status}".`)
                }

                const curOut = Number(loan.outstanding_balance || 0)
                const appliedKobo = Math.min(curOut, repayKobo)
                if (appliedKobo <= 0) throw new Error("Loan has zero remaining balance.")

                if (sourceMode === "debit_account" && loan.account_id) {
                    const aRes = await client.query(`SELECT * FROM public.accounts WHERE id = $1 FOR UPDATE`, [loan.account_id])
                    const acc = aRes.rows[0]
                    if (!acc) throw new Error("Linked borrower account not found.")
                    const avail = Number(acc.balance || 0) - Number(acc.lien_amount || 0)
                    if (avail < appliedKobo) {
                        throw new Error(`Insufficient balance in borrower account (${acc.account_number}). Available: ₦${(avail / 100).toLocaleString()}. Switch to Cash OTC Repayment if paid in cash.`)
                    }
                    const nextBal = Number(acc.balance) - appliedKobo
                    await client.query(`UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`, [nextBal, acc.id])
                    await client.query(
                        `INSERT INTO public.transactions (
                            reference, type, amount, currency, from_account_id, loan_id,
                            status, narration, channel, balance_after, date, metadata,
                            customer_id, user_id, created_at, updated_at
                         ) VALUES (
                            $1, 'repayment', $2, 'NGN', $3, $4,
                            'successful', $5, 'admin', $6, NOW(), $7::jsonb,
                            $8, $9, NOW(), NOW()
                         )`,
                        [
                            ref,
                            appliedKobo,
                            acc.id,
                            loan.id,
                            `Loan #${loan.id} Installment Repayment`,
                            nextBal,
                            JSON.stringify({ posted_by: auth.email, source_mode: sourceMode }),
                            loan.customer_id || null,
                            loan.user_id,
                        ]
                    )
                }

                const nextOut = Math.max(0, curOut - appliedKobo)
                const nextStatus = nextOut === 0 ? "repaid" : "active"
                const nextDue = new Date()
                nextDue.setMonth(nextDue.getMonth() + 1)

                const upd = await client.query(
                    `UPDATE public.loans
                     SET outstanding_balance = $1,
                         status = $2,
                         next_payment_date = CASE WHEN $2 = 'repaid' THEN NULL ELSE $3 END,
                         updated_at = NOW()
                     WHERE id = $4
                     RETURNING *`,
                    [nextOut, nextStatus, nextDue.toISOString(), loan.id]
                )
                return { loan: upd.rows[0], appliedKobo, nextOut, nextStatus }
            })

            // Split 85% principal recovery (GL 1200) + 15% recognized interest income (GL 4000)
            const interestPart = Math.round(result.appliedKobo * 0.15)
            const principalPart = result.appliedKobo - interestPart
            await postBalancedGlJournal({
                journalRef: `GL_${ref}`,
                narration: `Loan #${loanId} Repayment (${sourceMode === "cash_otc" ? "Cash OTC" : "Account Debit"})`,
                sourceModule: "loan_repayment",
                sourceRef: ref,
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
                lines: [
                    { glCode: sourceMode === "cash_otc" ? "1000" : "2000", side: "debit", amountKobo: result.appliedKobo, narration: `Repayment settlement inflow (${ref})` },
                    { glCode: "1200", side: "credit", amountKobo: principalPart, narration: `Principal reduction on Loan #${loanId}` },
                    ...(interestPart > 0
                        ? [{ glCode: "4000", side: "credit" as const, amountKobo: interestPart, narration: `Interest income recognized on Loan #${loanId}` }]
                        : []),
                ],
            }).catch(() => {})

            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: "admin",
                action: "loan.repayment_posted",
                entityType: "loan",
                entityId: loanId,
                amountKobo: result.appliedKobo,
                ipAddress: auth.ipAddress,
                afterState: { outstanding_balance: result.nextOut, status: result.nextStatus, reference: ref },
            })

            return NextResponse.json({ success: true, ...result, reference: ref })
        }

        return NextResponse.json({ error: "Unsupported loan action" }, { status: 400 })
    } catch (err: any) {
        console.error("[POST /api/admin/loans]", err)
        return NextResponse.json({ error: err.message || "Loan operation failed" }, { status: 400 })
    }
}

export async function PATCH(req: NextRequest) {
    const auth = await requireAdminUser(req)
    if (auth instanceof NextResponse) return auth

    try {
        await ensureBankSuiteOperationalTables()
        const body = await req.json().catch(() => ({}))
        const loanId = Number(body.loan_id)
        const source = body.source === "copteller" ? "copteller" : "banksuite"
        const decision = String(body.decision || "")

        if (!loanId) return NextResponse.json({ error: "loan_id is required" }, { status: 400 })

        // Forward Copteller credit committee decision through the bi-directional bridge
        if (source === "copteller") {
            const res = await processCoptellerLoanDecision({
                loanId,
                decision: decision === "disburse" || decision === "approve" ? "disburse" : "reject",
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
            })
            return NextResponse.json({ success: true, ...res })
        }

        if (decision === "disburse" || decision === "approve") {
            const ref = `LN_APR_${loanId}_${Date.now()}`
            const out = await withBankSuiteTransaction(async (client) => {
                const lRes = await client.query(`SELECT * FROM public.loans WHERE id = $1 FOR UPDATE`, [loanId])
                const loan = lRes.rows[0]
                if (!loan) throw new Error("Loan not found.")
                if (loan.status !== "pending") throw new Error(`Loan #${loan.id} is already ${loan.status}.`)

                const principalKobo = Number(loan.principal || 0)
                if (loan.account_id) {
                    const aRes = await client.query(`SELECT * FROM public.accounts WHERE id = $1 FOR UPDATE`, [loan.account_id])
                    const acc = aRes.rows[0]
                    if (acc) {
                        const nextBal = Number(acc.balance || 0) + principalKobo
                        await client.query(`UPDATE public.accounts SET balance = $1, last_transaction_at = NOW(), updated_at = NOW() WHERE id = $2`, [nextBal, acc.id])
                        await client.query(
                            `INSERT INTO public.transactions (
                                reference, type, amount, currency, to_account_id, loan_id,
                                status, narration, channel, balance_after, date, metadata,
                                customer_id, user_id, created_at, updated_at
                             ) VALUES ($1, 'disbursement', $2, 'NGN', $3, $4, 'successful', $5, 'admin', $6, NOW(), $7::jsonb, $8, $9, NOW(), NOW())`,
                            [ref, principalKobo, acc.id, loan.id, `Credit Committee Approved Loan #${loan.id}`, nextBal, JSON.stringify({ approved_by: auth.email }), loan.customer_id, loan.user_id]
                        )
                    }
                }
                const upd = await client.query(
                    `UPDATE public.loans SET status = 'active', disbursed_at = NOW(), updated_at = NOW() WHERE id = $1 RETURNING *`,
                    [loan.id]
                )
                return { loan: upd.rows[0], principalKobo }
            })

            await postBalancedGlJournal({
                journalRef: `GL_${ref}`,
                narration: `Credit Committee Disbursement — Loan #${loanId}`,
                sourceModule: "credit_committee",
                sourceRef: ref,
                actorId: auth.userId,
                actorEmail: auth.email,
                ipAddress: auth.ipAddress,
                lines: [
                    { glCode: "1200", side: "debit", amountKobo: out.principalKobo, narration: `Loan receivable #${loanId}` },
                    { glCode: "2000", side: "credit", amountKobo: out.principalKobo, narration: `Disbursed to borrower account` },
                ],
            }).catch(() => {})

            return NextResponse.json({ success: true, loan: out.loan, reference: ref })
        }

        if (["defaulted", "written_off", "active"].includes(decision)) {
            const upd = await queryBankSuite(
                `UPDATE public.loans SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
                [decision, loanId]
            )
            if (!upd.rows[0]) return NextResponse.json({ error: "Loan not found" }, { status: 404 })
            await writeBankAuditLog({
                actorId: auth.userId,
                actorEmail: auth.email,
                actorRole: "admin",
                action: `loan.status.${decision}`,
                entityType: "loan",
                entityId: loanId,
                ipAddress: auth.ipAddress,
            })
            return NextResponse.json({ success: true, loan: upd.rows[0] })
        }

        return NextResponse.json({ error: "Unsupported loan status decision" }, { status: 400 })
    } catch (err: any) {
        console.error("[PATCH /api/admin/loans]", err)
        return NextResponse.json({ error: err.message || "Loan decision failed" }, { status: 400 })
    }
}
