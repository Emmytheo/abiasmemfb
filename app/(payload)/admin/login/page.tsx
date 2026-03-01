import { redirect } from 'next/navigation'

export default function CustomLogin() {
    redirect('/auth/login')
}
