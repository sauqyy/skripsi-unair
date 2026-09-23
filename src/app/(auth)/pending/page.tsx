import { getCurrentProfile } from "@/lib/get-current-profile";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function PendingPage() {
  const profile = await getCurrentProfile();

  if (!profile) redirect("/login");
  if (profile.status === "active") redirect(`/${profile.role}`);

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Menunggu Verifikasi</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-slate-600">
        {profile.status === "rejected" ? (
          <p>
            Pendaftaran akun kamu <Badge tone="red">ditolak</Badge> oleh koordinator.
            Hubungi koordinator program studi untuk informasi lebih lanjut.
          </p>
        ) : (
          <p>
            Akun kamu sedang <Badge tone="yellow">menunggu persetujuan</Badge> koordinator.
            Kamu akan bisa masuk ke dashboard setelah akun disetujui.
          </p>
        )}

        <form action={signOut}>
          <Button type="submit" variant="secondary" className="w-full">
            Keluar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
