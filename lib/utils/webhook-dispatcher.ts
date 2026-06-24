import crypto from 'crypto'

export interface WebhookPayload {
    event: string;
    data: any;
}

export async function dispatchWebhook(url: string, secretKey: string, payload: WebhookPayload, retries = 3): Promise<boolean> {
    if (!url || !url.startsWith('http')) return false;

    const bodyStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secretKey).update(bodyStr).digest('hex');

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 10000)

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-abia-signature': signature,
                    'User-Agent': 'AbiaSMEMFB-Webhook-Dispatcher/1.0',
                },
                body: bodyStr,
                signal: controller.signal
            })
            
            clearTimeout(timeoutId)

            if (response.ok) {
                console.log(`[Webhook Dispatcher] Successfully dispatched event ${payload.event} to ${url}`)
                return true;
            } else {
                console.warn(`[Webhook Dispatcher] Endpoint returned ${response.status} on attempt ${attempt}`)
            }
        } catch (error: any) {
            console.warn(`[Webhook Dispatcher] Failed to connect to ${url} on attempt ${attempt}: ${error.message}`)
        }

        // Exponential backoff
        if (attempt < retries) {
            await new Promise((res) => setTimeout(res, Math.pow(2, attempt) * 1000));
        }
    }

    console.error(`[Webhook Dispatcher] Exhausted ${retries} retries for event ${payload.event} to ${url}`)
    return false;
}
