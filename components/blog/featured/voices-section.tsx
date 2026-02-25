import { Play, PlayCircle } from "lucide-react";

export function VoicesOfAbia() {
    return (
        <section className="bg-black py-24 px-6 lg:px-12 border-t border-white/5 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/black-felt.png')" }}></div>

            <div className="max-w-7xl mx-auto relative z-10">
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
                    <div>
                        <span className="flex items-center gap-2 text-accent text-xs font-bold uppercase tracking-widest mb-3">
                            <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
                            Now Streaming
                        </span>
                        <h2 className="text-4xl md:text-6xl text-white font-display tracking-tight">Voices of Abia</h2>
                        <p className="text-gray-400 mt-2 font-light max-w-md text-lg">Cinematic documentary shorts featuring the resilience of local commerce.</p>
                    </div>
                    <button className="flex items-center gap-3 px-6 py-2 border border-accent/30 rounded-full text-accent hover:bg-accent hover:text-black transition-all duration-300">
                        <span className="text-sm font-bold uppercase tracking-wider">All Episodes</span>
                        <PlayCircle className="w-5 h-5" />
                    </button>
                </div>

                {/* Content Grid */}
                <div className="grid lg:grid-cols-12 gap-8">
                    {/* Main Video Feature */}
                    <div className="lg:col-span-8 group cursor-pointer relative">
                        <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-accent/20 group-hover:border-accent transition-colors duration-500 shadow-2xl">
                            <div className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-105"
                                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDpXbNchngtGc_podGmTen9OMletT5qqE4ldxSy7Z38BhJUGrtPk0GWFu0lHTIQDY5YRvlZcHBBVi2u7oynM2tCGZyJE6J3eQV432uwooB7psVPrifUabGPRULr0DPv6Wi7RNtORI1x1gncDjHLF7eSK3QlGsmy_tnim4PRAcpCOBk6026x9M081REIs2_t32n9WNS7biUPrYYChOTDQBHTq_n5AAvnbVnLtkgjms5ELFTTzUi-gf-8lxs_1u7DjDO1AHvaExsVA1vs')" }}></div>
                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-20 h-20 rounded-full border-2 border-accent/50 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform duration-300 bg-black/20">
                                    <Play className="w-8 h-8 text-accent fill-current ml-1" />
                                </div>
                            </div>
                            <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-black via-black/80 to-transparent">
                                <span className="inline-block px-2 py-1 bg-accent text-black text-[10px] font-bold uppercase tracking-widest mb-2 rounded-sm">Season Premiere</span>
                                <h3 className="text-3xl md:text-4xl font-display text-white mb-2">The Fabric of Ariaria</h3>
                                <p className="text-gray-300 line-clamp-1">An intimate look at the textile giants supplying West Africa.</p>
                            </div>
                        </div>
                    </div>

                    {/* Sidebar List */}
                    <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
                        {[
                            { title: "Legacy of Leather", time: "12:45", type: "Documentary", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAjqMwfUvbem6NmeIxaW9_lzLJ4MMeT4PYeI1NvwIalBppypNd0LpJ2qd8Lz1xD0DVRMvCOuuTJi72VyEoUxEYkRUWsYjPR4HNyQQehy7DwYh_hWXvlPIps8nArYt0KWlKKNlXMBFHeqfnVttBI0NMzN2ynx5byk0bh7hzqr3p7Y1DvcVfM1B9yx6hp6iUn6xYWzo4M3o_9yT47oQ91Z0SVJ1corz0C7O7mpDGRGDQkQva6I9XurJaYqUpHxEaWXg7POgOm-ddUVBW2" },
                            { title: "Tech Hub Rising", time: "08:20", type: "Feature", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlTRmx7Cf4tpwc2uid4-RAbljqYFrwbmRxXkjWWIt4WCBpipzOsdCsw4mR-ThvMlwLdW4yqi5p8QZiW0CRJGX-YQUKX3rA22_pwZEnm3xxl8gpboQKpbnKmDjel3FqGC5YW3Yo4q4v681GTpbwnK3SSRmX1Lmtb0QaeXALlVzr8IPP1LOeWYNNDswAMVFMikY8UaHQgGmtDQdGKe1PB5THZvN5OL-4aZIfLtkepDcsMltrrIqnQJKKUAM87oTdHiPjFWtl5koDW9Q5" },
                            { title: "Women of Commerce", time: "15:10", type: "Interview", img: "https://lh3.googleusercontent.com/aida-public/AB6AXuAIMy_3NYaJcxVTiD1xRxWGsstjjtRhm2Qoc-ikjB7srEz5ZP7lFuf7BkCz3lmROEipm2iABYUNPmIMoms7l0PdjHXCzGTtKBFvzffmVqPdsIZ4WVWLs_bpB1m8rSfRtzBiUBLxTpDsWfDzhaAAxDt_-N-X9Ll3Db7iJuRgj-IhVOWx-r4BVK2LFFUC66gTiKbNVc2tjib7P1DdA8NcbYtua-Y235dNc9did0m2M6AWBw6J6T5Yl-QtH7XOVxqX5Hg9p9poyrBvJR55" }
                        ].map((item, i) => (
                            <div key={i} className="flex-1 group cursor-pointer relative flex gap-4 p-3 rounded-lg border border-transparent hover:border-white/10 hover:bg-white/5 transition-all">
                                <div className="w-1/3 aspect-[16/9] rounded overflow-hidden relative border border-white/10 group-hover:border-accent/50">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${item.img}')` }}></div>
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                        <PlayCircle className="text-white w-8 h-8 opacity-80 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                </div>
                                <div className="flex-1 flex flex-col justify-center">
                                    <h4 className="text-white font-display text-lg leading-tight group-hover:text-accent transition-colors">{item.title}</h4>
                                    <span className="text-gray-500 text-xs mt-1">{item.time} • {item.type}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
