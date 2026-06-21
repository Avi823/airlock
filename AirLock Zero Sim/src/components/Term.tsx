import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/**
 * Inline glossary term. Renders children inline with a small (?) button.
 * Clicking the (?) opens a popover with a plain-language definition.
 */
export function Term({
  children,
  definition,
  label,
}: {
  children: React.ReactNode;
  definition: React.ReactNode;
  /** Bold heading shown above the definition. Defaults to the children text. */
  label?: string;
}) {
  return (
    <span className="inline-flex items-baseline gap-0.5 whitespace-nowrap">
      <span className="underline decoration-dotted decoration-amber-glow/50 underline-offset-2">
        {children}
      </span>
      <Popover>
        <PopoverTrigger
          aria-label={`What does ${label ?? "this term"} mean?`}
          className="ml-0.5 inline-grid h-3.5 w-3.5 -translate-y-px place-items-center rounded-full border border-amber-glow/40 text-amber-glow opacity-70 transition hover:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-glow/50"
        >
          <HelpCircle className="h-2.5 w-2.5" />
        </PopoverTrigger>
        <PopoverContent
          side="top"
          align="center"
          className="w-64 border-amber-glow/30 bg-surface-elevated p-3 text-sm"
        >
          {label && (
            <div className="mb-1 font-mono text-[10px] uppercase tracking-wider text-amber-glow">
              {label}
            </div>
          )}
          <div className="text-foreground/90 leading-snug">{definition}</div>
        </PopoverContent>
      </Popover>
    </span>
  );
}
