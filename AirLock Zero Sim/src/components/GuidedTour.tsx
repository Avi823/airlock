import { useEffect, useLayoutEffect, useState } from "react";
import { ChevronLeft, ChevronRight, X, Sparkles } from "lucide-react";

export type TourStep = {
  /** CSS selector for the element to highlight. */
  selector: string;
  title: string;
  body: React.ReactNode;
  /** Preferred placement of the tooltip relative to the target. */
  placement?: "top" | "bottom" | "left" | "right";
};

type Rect = { top: number; left: number; width: number; height: number };

function getRect(el: Element): Rect {
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

export function GuidedTour({
  open,
  steps,
  onClose,
}: {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: 0, h: 0 });

  const step = steps[index];

  // Reset when reopened
  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  // Track viewport
  useEffect(() => {
    if (!open) return;
    const update = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [open]);

  // Find & scroll to target, then measure
  useLayoutEffect(() => {
    if (!open || !step) return;
    const el = document.querySelector(step.selector);
    if (!el) {
      setRect(null);
      return;
    }
    el.scrollIntoView({ behavior: "smooth", block: "center" });

    let raf = 0;
    const measure = () => setRect(getRect(el));
    // Re-measure a few times while scroll animation completes
    const t1 = setTimeout(measure, 50);
    const t2 = setTimeout(measure, 300);
    const t3 = setTimeout(measure, 600);
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measure);
    };
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", measure);
    };
  }, [open, step, index]);

  // Keyboard nav
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") setIndex((i) => Math.min(i + 1, steps.length - 1));
      else if (e.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, steps.length]);

  if (!open || !step) return null;

  const pad = 8;
  const cardW = 320;
  const cardH = 180;
  const placement = step.placement ?? "bottom";

  // Compute card position
  let cardTop = vp.h / 2 - cardH / 2;
  let cardLeft = vp.w / 2 - cardW / 2;
  if (rect) {
    if (placement === "bottom") {
      cardTop = rect.top + rect.height + pad + 8;
      cardLeft = rect.left + rect.width / 2 - cardW / 2;
    } else if (placement === "top") {
      cardTop = rect.top - cardH - pad - 8;
      cardLeft = rect.left + rect.width / 2 - cardW / 2;
    } else if (placement === "right") {
      cardTop = rect.top + rect.height / 2 - cardH / 2;
      cardLeft = rect.left + rect.width + pad + 8;
    } else if (placement === "left") {
      cardTop = rect.top + rect.height / 2 - cardH / 2;
      cardLeft = rect.left - cardW - pad - 8;
    }
    // If not enough room below, flip to top
    if (placement === "bottom" && cardTop + cardH > vp.h - 8) {
      cardTop = Math.max(8, rect.top - cardH - pad - 8);
    }
    if (placement === "top" && cardTop < 8) {
      cardTop = rect.top + rect.height + pad + 8;
    }
  }
  cardLeft = Math.max(8, Math.min(cardLeft, vp.w - cardW - 8));
  cardTop = Math.max(8, Math.min(cardTop, vp.h - cardH - 8));

  const last = index === steps.length - 1;

  return (
    <div className="fixed inset-0 z-[100]" aria-modal role="dialog">
      {/* Dim overlay. When a target is highlighted we disable pointer events so
          the user can still interact with the spotlighted element (e.g. click
          the glossary "?" chips). Close via the X button or Escape. */}
      <div
        className={`absolute inset-0 transition-opacity ${rect ? "pointer-events-none" : ""}`}
        onClick={rect ? undefined : onClose}
        style={{ background: rect ? "transparent" : "rgba(0,0,0,0.55)" }}
      />

      {rect && (
        <div
          className="pointer-events-none absolute rounded-lg ring-2 ring-amber-glow transition-all duration-200"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            boxShadow: "0 0 0 9999px rgba(0,0,0,0.6), 0 0 24px rgba(255,179,71,0.45)",
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute rounded-xl border border-amber-glow/40 bg-surface-elevated p-4 shadow-2xl"
        style={{ top: cardTop, left: cardLeft, width: cardW }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-amber-glow">
            <Sparkles className="h-3 w-3" /> Tour · {index + 1}/{steps.length}
          </div>
          <button
            onClick={onClose}
            aria-label="Close tour"
            className="rounded-md p-1 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <h3 className="mt-2 text-sm font-bold leading-snug">{step.title}</h3>
        <div className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{step.body}</div>

        <div className="mt-4 flex items-center justify-between">
          <button
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground hover:bg-background disabled:opacity-30"
          >
            <ChevronLeft className="h-3 w-3" /> Back
          </button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 w-1.5 rounded-full ${i === index ? "bg-amber-glow" : "bg-border"}`}
              />
            ))}
          </div>
          {last ? (
            <button
              onClick={onClose}
              className="rounded-md border border-amber-glow/60 bg-amber-glow/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-glow hover:bg-amber-glow/20"
            >
              Done
            </button>
          ) : (
            <button
              onClick={() => setIndex((i) => Math.min(steps.length - 1, i + 1))}
              className="inline-flex items-center gap-1 rounded-md border border-amber-glow/60 bg-amber-glow/10 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-glow hover:bg-amber-glow/20"
            >
              Next <ChevronRight className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
