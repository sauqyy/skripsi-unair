import { cn } from "@/lib/cn";

type Tone = "slate" | "green" | "yellow" | "red" | "blue";

const tones: Record<Tone, string> = {
  slate: "bg-slate-100 text-slate-600",
  green: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  yellow: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  red: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  blue: "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200",
};

export function Badge({
  tone = "slate",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    />
  );
}
