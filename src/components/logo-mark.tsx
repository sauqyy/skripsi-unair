import { cn } from "@/lib/cn";

export function LogoMark({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-sm",
        className
      )}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M4 6.5C4 5.67 4.67 5 5.5 5H12v14H5.5C4.67 19 4 18.33 4 17.5v-11Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M20 6.5c0-.83-.67-1.5-1.5-1.5H12v14h6.5c.83 0 1.5-.67 1.5-1.5v-11Z"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
