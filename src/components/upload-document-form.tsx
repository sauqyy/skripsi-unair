"use client";

import { useActionState, useRef } from "react";
import { uploadDocumentAction, type UploadDocumentState } from "@/lib/actions/document-actions";
import { Button } from "@/components/ui/button";

const initialState: UploadDocumentState = {};

export function UploadDocumentForm({
  skripsiId,
  redirectPath,
}: {
  skripsiId: string;
  redirectPath: string;
}) {
  const [state, formAction, pending] = useActionState(uploadDocumentAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await formAction(formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="skripsiId" value={skripsiId} />
      <input type="hidden" name="redirectPath" value={redirectPath} />

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <input
        type="file"
        name="file"
        accept="application/pdf"
        required
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-slate-700"
      />

      <Button type="submit" disabled={pending}>
        {pending ? "Mengunggah..." : "Unggah PDF"}
      </Button>
    </form>
  );
}
