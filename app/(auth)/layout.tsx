import type { Metadata } from "next";
import { getServerBankProfile } from "@/lib/banking/bank-profile-server";

const defaultUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

export async function generateMetadata(): Promise<Metadata> {
    const { profile } = await getServerBankProfile();
    return {
        metadataBase: new URL(defaultUrl),
        title: `${profile.shortName} — Secure Sign In`,
        description: `Secure authentication portal for ${profile.legalName}`,
    };
}

export default function AuthLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-background">
            {children}
        </div>
    );
}
