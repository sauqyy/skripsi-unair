import { getCurrentProfile } from "@/lib/get-current-profile";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toggleEmailReminderAction } from "./actions";

export default async function DosenSettingsPage() {
  const profile = await getCurrentProfile();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-slate-900">Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notifikasi Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-600">
            Sistem mengirim email pengingat (H-7, H-3, H-1) saat deadline tahapan
            mahasiswa bimbinganmu mendekat. Mahasiswa selalu menerima email ini;
            kamu bisa memilih untuk ikut menerima atau tidak.
          </p>

          <div className="flex items-center gap-3 rounded-md border border-slate-100 p-3">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-900">
                Terima email pengingat deadline
              </p>
              <p className="text-xs text-slate-500">
                Status saat ini:{" "}
                {profile?.email_reminder_optin ? (
                  <span className="font-medium text-green-700">Aktif</span>
                ) : (
                  <span className="font-medium text-slate-500">Nonaktif</span>
                )}
              </p>
            </div>
            <form action={toggleEmailReminderAction}>
              <input
                type="hidden"
                name="optIn"
                value={profile?.email_reminder_optin ? "false" : "true"}
              />
              <Button type="submit" variant="secondary" size="sm">
                {profile?.email_reminder_optin ? "Matikan" : "Aktifkan"}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
