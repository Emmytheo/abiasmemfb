import { ExecutionTracker } from "@/components/execution-tracker";

// Next.js App Router dynamic page parameters
interface ReceiptPageProps {
    params: Promise<{
        executionId: string;
    }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
    const { executionId } = await params;
    
    return (
        <div className="container py-12">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Transaction Tracker</h1>
                <p className="text-muted-foreground text-lg">Monitoring the status of your service execution request.</p>
            </div>

            <ExecutionTracker executionId={executionId} />
        </div>
    );
}
