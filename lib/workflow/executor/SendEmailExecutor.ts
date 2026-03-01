import type { ExecutionEnvironment } from '../types/executor'
import nodemailer from 'nodemailer'

export async function SendEmailExecutor(
    env: ExecutionEnvironment<any>
): Promise<boolean> {
    const secretRef = env.getInput('secretRef') as string
    const to = env.getInput('to') as string
    const subject = env.getInput('subject') as string
    const body = env.getInput('body') as string
    const isHtml = env.getInput('isHtml') === 'true' || env.getInput('isHtml') === true

    if (!secretRef || !to || !subject || !body) {
        env.log.error('SendEmail: secretRef, to, subject, and body are required')
        return false
    }

    try {
        const secretJson = await env.resolveSecret(secretRef)
        const creds = typeof secretJson === 'string' ? JSON.parse(secretJson) : secretJson
        // Expected shape: { host, port, secure, user, pass }

        const transporter = nodemailer.createTransport({
            host: creds.host,
            port: Number(creds.port || 587),
            secure: creds.secure === 'true' || creds.secure === true,
            auth: { user: creds.user, pass: creds.pass },
        })

        const info = await transporter.sendMail({
            from: creds.from || creds.user,
            to,
            subject,
            [isHtml ? 'html' : 'text']: body,
        })

        env.log.info(`SendEmail: sent to ${to} — messageId: ${info.messageId}`)
        env.setOutput('success', true)
        env.setOutput('messageId', info.messageId)
        return true
    } catch (err: any) {
        env.log.error(`SendEmail: ${err.message}`)
        env.setOutput('success', false)
        return false
    }
}
