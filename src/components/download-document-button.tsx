"use client";

import { useState } from "react";
import { getDocumentDownloadUrl } from "@/lib/actions/document-actions";
import { Button } from "@/components/ui/button";

export function DownloadDocumentButton({ storagePath }: { storagePath: string }) {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const url = await getDocumentDownloadUrl(storagePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Gagal membuat link unduhan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button size="sm" variant="secondary" onClick={handleClick} disabled={loading}>
      {loading ? "Membuka..." : "Unduh"}
    </Button>
  );
}
