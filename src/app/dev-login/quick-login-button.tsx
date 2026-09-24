"use client";

import { useFormStatus } from "react-dom";
import { Badge } from "@/components/ui/badge";

export function QuickLoginButton({ nama, email }: { nama: string; email: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-4 py-3 text-left text-sm transition-colors hover:border-brand-300 hover:bg-brand-50 disabled:cursor-wait disabled:opacity-60"
    >
      <span>
        <span className="block font-medium text-slate-900">{nama}</span>
        <span className="block text-xs text-slate-500">{email}</span>
      </span>
      {pending ? (
        <span className="flex items-center gap-1.5 text-xs font-medium text-brand-600">
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Masuk...
        </span>
      ) : (
        <Badge tone="blue">Masuk →</Badge>
      )}
    </button>
  );
}
