"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import { cn } from "@/lib/cn";

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = items.filter((n) => !n.dibaca).length;

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function loadNotifications() {
    const supabase = createClient();
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    return data ?? [];
  }

  useEffect(() => {
    let cancelled = false;

    loadNotifications().then((data) => {
      if (!cancelled) {
        setItems(data);
        setLoaded(true);
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function markAllRead() {
    const supabase = createClient();
    const unreadIds = items.filter((n) => !n.dibaca).map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase.from("notifications").update({ dibaca: true }).in("id", unreadIds);
    setItems((prev) => prev.map((n) => ({ ...n, dibaca: true })));
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!loaded) {
            loadNotifications().then((data) => {
              setItems(data);
              setLoaded(true);
            });
          }
        }}
        className="relative rounded-full p-2 text-slate-500 hover:bg-slate-100"
        aria-label="Notifikasi"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M15 17h5l-1.4-1.4A2 2 0 0 1 18 14.2V11a6 6 0 1 0-12 0v3.2a2 2 0 0 1-.6 1.4L4 17h5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M9 17a3 3 0 0 0 6 0" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-80 rounded-lg border border-slate-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2">
            <p className="text-sm font-semibold text-slate-900">Notifikasi</p>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-slate-500 hover:text-slate-900"
              >
                Tandai semua dibaca
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-slate-400">
                Belum ada notifikasi
              </p>
            ) : (
              items.map((n) => (
                <div
                  key={n.id}
                  className={cn(
                    "border-b border-slate-50 px-4 py-3 text-sm last:border-0",
                    !n.dibaca && "bg-slate-50"
                  )}
                >
                  <p className="text-slate-800">{n.pesan}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {new Date(n.created_at).toLocaleString("id-ID")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
