import crypto from "crypto"
import { ensureBankSuiteOperationalTables, queryBankSuite } from "@/lib/banking/db-pool"

export interface WebhookPayload {
    event: string
    data: any
}

export interface WebhookDispatchOptions {
    merchantId?: number | null
    userId?: string | null
    brandHeader?: string
    retries?: number
}

export async function dispatchWebhook(
    url: string,
    secretKey: string,
    payload: WebhookPayload,
    retriesOrOpts: number | WebhookDispatchOptions = 3
): Promise<boolean> {
    if (!url || !url.startsWith("http")) return false

    const opts: WebhookDispatchOptions =
        typeof retriesOrOpts === "number" ? { retries: retriesOrOpts } : retriesOrOpts
    const retries = opts.retries ?? 3

    const bodyStr = JSON.stringify(payload)
    const signature = crypto
        .createHmac("sha256", secretKey)
        .update(bodyStr)
        .digest("hex")

    let lastStatus: number | null = null
    let lastExcerpt = ""
    let attemptsMade = 0
    let succeeded = false

    for (let attempt = 1; attempt <= retries; attempt++) {
        attemptsMade = attempt
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-banksuite-signature": signature,
                    "x-abia-signature": signature,
                    "User-Agent": `${opts.brandHeader || "BankSuite"}-Webhook-Dispatcher/2.0`,
                },
                body: bodyStr,
                signal: controller.signal,
            })

            clearTimeout(timeoutId)
            lastStatus = response.status
            lastExcerpt = (await response.text().catch(() => "")).slice(0, 300)

            if (response.ok) {
                succeeded = true
                break
            } else {
                console.warn(
                    `[Webhook Dispatcher] Endpoint returned ${response.status} on attempt ${attempt}`
                )
            }
        } catch (error: any) {
            lastExcerpt = error?.message || "Connection error"
            console.warn(
                `[Webhook Dispatcher] Failed to connect to ${url} on attempt ${attempt}: ${lastExcerpt}`
            )
        }

        if (attempt < retries) {
            await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 1000))
        }
    }

    // Persist delivery telemetry
    try {
        await ensureBankSuiteOperationalTables()
        await queryBankSuite(
            `
            INSERT INTO public.banksuite_webhook_deliveries (
                merchant_id, user_id, event, target_url, payload,
                http_status, success, attempts, response_excerpt
            ) VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9)
            `,
            [
                opts.merchantId ?? null,
                opts.userId ?? null,
                payload.event,
                url,
                bodyStr,
                lastStatus,
                succeeded,
                attemptsMade,
                lastExcerpt,
            ]
        )
    } catch (logErr: any) {
        console.warn("[Webhook Dispatcher] Delivery log write skipped:", logErr.message)
    }

    return succeeded
}
