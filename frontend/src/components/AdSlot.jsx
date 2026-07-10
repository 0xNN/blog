export default function AdSlot({ position = "in-article", enabled = true }) {
    if (!enabled) return null;
    return (
        <div
            data-testid={`ad-slot-${position}`}
            className="my-8 rounded-xl border border-dashed border-border bg-muted/30 py-8 text-center"
        >
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-1">Advertisement</div>
            <div className="text-xs text-muted-foreground/50 font-mono">
                {position === "in-article" && "AdSense · in-article slot (728×90)"}
                {position === "sidebar" && "AdSense · sidebar slot"}
                {position === "header" && "AdSense · header slot"}
            </div>
        </div>
    );
}
