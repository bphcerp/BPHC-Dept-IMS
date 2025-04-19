import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function OverflowHandler({ text }: { text: string }) {
    const textRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [maxWidth, setMaxWidth] = useState<number>(40)
    const [isOverflowing, setIsOverflowing] = useState(false);

    useEffect(() => {
        const checkOverflow = () => {
            if (textRef.current && containerRef.current) {
                setMaxWidth(containerRef.current.scrollWidth)
                setIsOverflowing(textRef.current.scrollWidth > containerRef.current.scrollWidth);
            }
        };

        checkOverflow();
        window.addEventListener("resize", checkOverflow);
        return () => window.removeEventListener("resize", checkOverflow);
    }, []);

    return (
        <div ref={containerRef} className="w-full">
            {!isOverflowing ? (
                <div ref={textRef} className="truncate" style={{ maxWidth }}>
                    {text}
                </div>
            ) : (
                <Dialog>
                    <DialogTrigger asChild>

                        <Button className="truncate px-0" variant="link"><span className="truncate" style={{ maxWidth }}>
                            {text}
                        </span></Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Full Content</DialogTitle>
                        </DialogHeader>
                        <p className="w-full overflow-auto break-words">{text}</p>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}