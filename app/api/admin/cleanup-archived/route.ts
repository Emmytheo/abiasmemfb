import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import configPromise from '@/payload.config';

/**
 * GET /api/admin/cleanup-archived
 * Finds all customer records with multiple 'archived_' prefixes and fixes them.
 */
export async function GET(req: NextRequest) {
    try {
        const payload = await getPayload({ config: configPromise });

        console.log(`[API CLEANUP] Scanning for abnormal archived records...`);

        // Find all archived customers
        const archivedDocs = await payload.find({
            collection: 'customers',
            where: { is_archived: { equals: true } },
            limit: 1000,
            overrideAccess: true,
        });

        let fixedCount = 0;

        for (const doc of archivedDocs.docs) {
            // Check for multiple prefixes in email
            const emailMatch = doc.email.match(/archived_\d+_/g);
            if (emailMatch && emailMatch.length > 1) {
                const timestamp = emailMatch[0].split('_')[1]; // Keep the first timestamp
                const cleanEmail = doc.email.replace(/archived_\d+_/g, '');
                const newEmail = `archived_${timestamp}_${cleanEmail}`;

                const cleanBvn = doc.bvn ? doc.bvn.replace(/archived_\d+_/g, '') : null;
                const newBvn = cleanBvn ? `archived_${timestamp}_${cleanBvn}` : null;

                console.log(`[FIX] Customer ${doc.id}: ${doc.email} -> ${newEmail}`);

                await payload.update({
                    collection: 'customers',
                    id: doc.id,
                    data: {
                        email: newEmail,
                        bvn: newBvn
                    } as any,
                    overrideAccess: true
                });
                fixedCount++;
            }
        }

        return NextResponse.json({
            success: true,
            totalArchived: archivedDocs.totalDocs,
            fixedCount,
            message: `Surgically cleaned ${fixedCount} abnormal records.`
        });

    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
