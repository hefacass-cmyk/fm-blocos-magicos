import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Eraser } from "lucide-react";

export interface SignaturePadHandle {
  toDataURL: () => string | null;
  clear: () => void;
  isEmpty: () => boolean;
}

const SignaturePad = forwardRef<SignaturePadHandle, { height?: number }>(
  function SignaturePad({ height = 180 }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const drawing = useRef(false);
    const [empty, setEmpty] = useState(true);

    useEffect(() => {
      const c = canvasRef.current;
      if (!c) return;
      const ratio = window.devicePixelRatio || 1;
      const rect = c.getBoundingClientRect();
      c.width = rect.width * ratio;
      c.height = rect.height * ratio;
      const ctx = c.getContext("2d");
      if (ctx) {
        ctx.scale(ratio, ratio);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.lineWidth = 2.4;
        ctx.strokeStyle = "#0f172a";
      }
    }, []);

    const pos = (e: PointerEvent | React.PointerEvent) => {
      const c = canvasRef.current!;
      const r = c.getBoundingClientRect();
      return { x: (e as PointerEvent).clientX - r.left, y: (e as PointerEvent).clientY - r.top };
    };

    const start = (e: React.PointerEvent) => {
      e.preventDefault();
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      drawing.current = true;
      const p = pos(e);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      setEmpty(false);
    };
    const move = (e: React.PointerEvent) => {
      if (!drawing.current) return;
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;
      const p = pos(e);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };
    const end = () => { drawing.current = false; };

    const clear = () => {
      const c = canvasRef.current;
      const ctx = c?.getContext("2d");
      if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
      setEmpty(true);
    };

    useImperativeHandle(ref, () => ({
      toDataURL: () => (empty ? null : canvasRef.current?.toDataURL("image/png") ?? null),
      clear,
      isEmpty: () => empty,
    }));

    return (
      <div className="space-y-2">
        <div className="rounded-md border border-input bg-white" style={{ height }}>
          <canvas
            ref={canvasRef}
            className="h-full w-full touch-none"
            onPointerDown={start}
            onPointerMove={move}
            onPointerUp={end}
            onPointerLeave={end}
          />
        </div>
        <Button type="button" size="sm" variant="outline" onClick={clear}>
          <Eraser className="mr-1 h-3.5 w-3.5" /> Limpar
        </Button>
      </div>
    );
  },
);

export default SignaturePad;