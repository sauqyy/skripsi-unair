import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogoMark } from "@/components/logo-mark";
import { quickLoginAction } from "./actions";
import { QuickLoginButton } from "./quick-login-button";
import type { Profile, UserRole } from "@/types/database";

const roleLabel: Record<UserRole, string> = {
  koordinator: "Koordinator",
  dosen: "Dosen Pembimbing",
  mahasiswa: "Mahasiswa",
};

const roleOrder: UserRole[] = ["koordinator", "dosen", "mahasiswa"];

export default async function DevLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>;
}) {
  // In production this page only unlocks with the matching DEV_LOGIN_SECRET
  // query param — it signs in as any seeded account with one click, so it
  // must stay unreachable to anyone who doesn't have the secret link.
  const { key } = await searchParams;
  if (process.env.NODE_ENV === "production") {
    const secret = process.env.DEV_LOGIN_SECRET;
    if (!secret || key !== secret) notFound();
  }

  const supabase = createAdminClient();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("status", "active")
    .order("nama");

  const byRole = new Map<UserRole, Profile[]>();
  for (const p of profiles ?? []) {
    const arr = byRole.get(p.role) ?? [];
    arr.push(p);
    byRole.set(p.role, arr);
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 flex items-center gap-3">
          <LogoMark />
          <div>
            <h1 className="text-xl font-bold text-slate-900">Quick Login (Development)</h1>
            <p className="text-sm text-slate-500">
              Klik salah satu akun untuk langsung masuk — tanpa email/password. Jangan bagikan
              tautan halaman ini.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {roleOrder.map((role) => {
            const accounts = byRole.get(role) ?? [];
            if (accounts.length === 0) return null;

            return (
              <Card key={role}>
                <CardHeader>
                  <CardTitle>{roleLabel[role]}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {accounts.map((p) => (
                    <form key={p.id} action={quickLoginAction}>
                      <input type="hidden" name="email" value={p.email} />
                      <input type="hidden" name="key" value={key ?? ""} />
                      <QuickLoginButton nama={p.nama} email={p.email} />
                    </form>
                  ))}
                </CardContent>
              </Card>
            );
          })}

          {(profiles ?? []).length === 0 && (
            <Card>
              <CardContent className="py-6 text-center text-sm text-slate-400">
                Belum ada akun aktif. Jalankan script seeding data dummy terlebih dahulu.
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
