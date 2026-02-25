"use client";

import { useEffect, useState } from "react";
import { getOpenPositions, type JobPosition } from "@/lib/services/careers";
import { MapPin, Briefcase } from "lucide-react";

function JobCard({ job }: { job: JobPosition }) {
    return (
        <div className="group flex flex-col md:flex-row md:items-center justify-between p-6 rounded-xl border border-border bg-card backdrop-blur-md hover:border-accent/50 hover:shadow-md transition-all duration-200">
            <div className="flex-1 mb-4 md:mb-0">
                <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors">
                    {job.title}
                </h3>
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <MapPin className="w-[18px] h-[18px]" />
                        <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <Briefcase className="w-[18px] h-[18px]" />
                        <span>{job.type}</span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-6">
                <span className="hidden md:block text-sm font-medium text-muted-foreground">{job.department}</span>
                <button className="px-6 py-2.5 rounded-lg bg-transparent border border-accent text-foreground font-bold text-sm hover:bg-accent hover:text-primary transition-all duration-200 w-full md:w-auto">
                    Apply Now
                </button>
            </div>
        </div>
    );
}

export function JobList() {
    const [jobs, setJobs] = useState<JobPosition[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All Roles");

    useEffect(() => {
        async function fetchJobs() {
            try {
                const data = await getOpenPositions();
                setJobs(data);
            } finally {
                setLoading(false);
            }
        }
        fetchJobs();
    }, []);

    const filters = ["All Roles", "Finance", "Technology", "Customer Service"]; // Simplified for now

    return (
        <section className="py-24 bg-card transition-colors duration-300" id="open-positions">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                    <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Current Openings</h2>
                    <div className="flex flex-wrap gap-3">
                        {filters.map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-4 py-2 rounded-full border border-primary/10 text-sm font-medium transition-colors ${filter === f
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-transparent text-muted-foreground hover:bg-accent/10 hover:text-accent"
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {loading ? (
                        <p className="text-center text-gray-500">Loading positions...</p>
                    ) : (
                        jobs.map((job) => <JobCard key={job.id} job={job} />)
                    )}
                </div>
            </div>
        </section>
    );
}
