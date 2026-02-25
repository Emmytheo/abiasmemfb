export function BlogPostMobileActions() {
    return (
        <div className="fixed bottom-0 left-0 w-full bg-background/95 border-t border-border p-4 xl:hidden z-40 flex justify-around items-center backdrop-blur-lg">
            <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-accent">
                <span className="material-symbols-outlined">favorite</span>
                <span className="text-[10px]">Like</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-accent">
                <span className="material-symbols-outlined">chat_bubble</span>
                <span className="text-[10px]">Comment</span>
            </button>
            <button className="flex flex-col items-center gap-1 text-muted-foreground hover:text-accent">
                <span className="material-symbols-outlined">share</span>
                <span className="text-[10px]">Share</span>
            </button>
        </div>
    );
}
