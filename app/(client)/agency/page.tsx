import { redirect } from "next/navigation"

export default function LegacyAgencyRedirectPage() {
    redirect("/agent/dashboard")
}
