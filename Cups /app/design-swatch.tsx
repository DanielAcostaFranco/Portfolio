"use client";
import { useEffect, useRef } from "react";
import { paintDesign } from "./design-art";
import type { DesignSpec } from "./designs";
export function DesignSwatch({ design, mark }: {
    design: DesignSpec;
    mark: string;
}) {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const c = ref.current?.getContext("2d");
        if (!c)
            return;
        c.clearRect(0, 0, 144, 144);
        c.save();
        c.scale(144 / 1024, 144 / 1024);
        c.fillStyle = "#fff";
        c.fillRect(0, 0, 1024, 1024);
        paintDesign(c, design, mark, { scale: 80, horizontal: 0, vertical: 0 });
        c.fillStyle = design.color;
        c.textAlign = "center";
        c.font = "italic bold 140px Georgia";
        c.fillText((mark || "a").slice(0, 1), 512, 556);
        c.restore();
    }, [design, mark]);
    return <canvas ref={ref} width="144" height="144" className="style-swatch" aria-hidden="true"/>;
}
