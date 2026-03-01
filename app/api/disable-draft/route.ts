import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

export async function GET() {
    const resolvedDraftMode = await draftMode()
    resolvedDraftMode.disable()
    redirect('/')
}
