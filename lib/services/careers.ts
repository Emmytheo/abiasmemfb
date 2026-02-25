export interface JobPosition {
    id: string;
    title: string;
    department: string;
    location: string;
    type: "Full-time" | "Part-time" | "Contract" | "Remote" | "On-site";
    description?: string;
}

export const MOCK_JOBS: JobPosition[] = [
    {
        id: "1",
        title: "Credit Officer",
        department: "Finance Dept.",
        location: "Umuahia Branch",
        type: "Full-time",
    },
    {
        id: "2",
        title: "Senior Accountant",
        department: "Finance Dept.",
        location: "Head Office",
        type: "Full-time",
    },
    {
        id: "3",
        title: "Customer Service Representative",
        department: "Operations",
        location: "Aba Branch",
        type: "On-site",
    },
    {
        id: "4",
        title: "IT Support Specialist",
        department: "Technology",
        location: "Remote/Hybrid",
        type: "Contract",
    },
];

export async function getOpenPositions(): Promise<JobPosition[]> {
    // Simulate network delay
    return new Promise((resolve) => {
        setTimeout(() => resolve(MOCK_JOBS), 500);
    });
}
