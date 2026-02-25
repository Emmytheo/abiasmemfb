import { MapPin } from "lucide-react";

export function BranchLocator() {
    return (
        <div className="w-full bg-background border-border">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-10">
                <div className="flex flex-col gap-4 items-center text-center">
                    <h2 className="text-foreground text-3xl font-display font-bold">Visit Our Branches</h2>
                    <p className="text-muted-foreground max-w-xl">
                        Find the nearest branch or ATM. Our exclusive lounges are available for premium members in select locations.
                    </p>
                </div>
                <div className="relative w-full h-[500px] rounded-2xl overflow-hidden shadow-xl border border-gray-200 dark:border-[#3a3425]">
                    {/* Interactive Map Visual Representation */}
                    <div className="w-full h-full bg-slate-200 relative">
                        <img
                            alt="Desaturated map showing city streets and blocks"
                            className="w-full h-full object-cover grayscale opacity-60"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCf4ECDODmkBwR05prmiiQ5Mrv6U3xODobZcDBSdSv-4xMce7hDdZm-12AZpoR7_TNVLcStDJEx4Dshnb-0yGDgr9YTUxtsfXkJnxG2N7lD5KDNOYe4p2UIbdJuBCjaJJdHwOLQn_2gl8HXv5RN3dD1Ch-AWVPy95v0WZddd8Y9icjhQrOASpLpW6k7zt0AFZg2nW2nKztSGrHyTt9XMPJ1SFgACxGYV99_GYI_2Y_aB0pnFUOfwEqi0-S3lVal-ODkvyyA-SV8ECmR"
                        />

                        {/* Custom Gold Pins */}
                        {/* Pin 1 */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 group cursor-pointer">
                            <div className="relative">
                                <MapPin className="w-12 h-12 text-accent drop-shadow-lg z-10 relative fill-current" />
                                <div className="absolute top-full left-1/2 -translate-x-1/2 w-4 h-1 bg-black/30 blur-[2px] rounded-full"></div>
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-card text-card-foreground p-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    <p className="text-xs font-bold text-foreground">Victoria Island HQ</p>
                                    <p className="text-[10px] text-muted-foreground">Premium Lounge Available</p>
                                </div>
                            </div>
                        </div>

                        {/* Pin 2 */}
                        <div className="absolute top-[30%] left-[60%] group cursor-pointer">
                            <div className="relative">
                                <MapPin className="w-10 h-10 text-accent drop-shadow-lg opacity-80 z-10 relative fill-current" />
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-card text-card-foreground p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    <p className="text-xs font-bold text-foreground">Lekki Branch</p>
                                </div>
                            </div>
                        </div>

                        {/* Pin 3 */}
                        <div className="absolute top-[65%] left-[35%] group cursor-pointer">
                            <div className="relative">
                                <MapPin className="w-10 h-10 text-accent drop-shadow-lg opacity-80 z-10 relative fill-current" />
                                {/* Tooltip */}
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-card text-card-foreground p-2 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                                    <p className="text-xs font-bold text-foreground">Ikoyi Branch</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute bottom-4 right-4 bg-card text-muted-foreground">
                        © MapBox © OpenStreetMap
                    </div>
                </div>
            </div>
        </div>
    );
}
