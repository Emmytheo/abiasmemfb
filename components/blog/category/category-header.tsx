export function CategoryHeader({ title }: { title: string }) {
    return (
        <header className="relative w-full h-[65vh] min-h-[600px] flex items-end justify-start overflow-hidden group">
            <div
                className="absolute inset-0 bg-cover bg-center transition-transform ease-out group-hover:scale-105 opacity-60"
                style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBFbm73wX3wpq4uxjDRQfielXOo9qvxuuwzDrJHYk1VJhPyOSYpF6cYgnhQkzLwKu49YKkUUsWL_UoX8Ff-FHlq62X2CF71LBXAprZ--dX_x0_hgURghQyIURTNm9lFxksFlOf33rNDa61EoeusuW0gkE-2MPzZbIi6Ft6HE9Jd0LAKwMQXTmmEn6NJewyEgyLOTa3pTpbB7aePu3Wl09CgD4oZsKAvFtVRs1nMdLDDt_dN5YPdqdbUuueir2ahSayzgbBPVCrXXBLN')", transitionDuration: '3000ms' }}
            ></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/50 to-transparent"></div>

            <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12 pb-20">
                <div className="max-w-4xl">
                    <div className="flex items-center gap-4 mb-8">
                        <span className="h-px w-12 bg-accent"></span>
                        <span className="text-sm font-bold tracking-[0.2em] text-accent uppercase">
                            Category: {title}
                        </span>
                    </div>
                    <h1 className="text-6xl md:text-8xl font-display text-white mb-8 leading-[1] drop-shadow-2xl">
                        Financial <br />
                        <span className="italic text-accent drop-shadow-[0_0_20px_rgba(249,188,6,0.3)]">Sovereignty</span>
                    </h1>
                    <p className="text-xl md:text-2xl text-gray-300 font-light max-w-2xl leading-relaxed border-l border-accent/30 pl-8">
                        Expert insights on navigating the complexities of modern wealth management, asset protection, and strategic legacy building.
                    </p>
                </div>
            </div>
        </header>
    );
}
