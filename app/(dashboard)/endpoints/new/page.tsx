import { redirect } from 'next/navigation'

export default function NewEndpointPage() {
    redirect('/endpoints/new_edit') // A proxy to trigger logic in [id]
}
