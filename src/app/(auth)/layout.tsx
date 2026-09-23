import { LogoMark } from "@/components/logo-mark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-1 items-center justify-center overflow-hidden bg-slate-50 px-4 py-12">
      {/* Soft decorative blobs */}
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-brand-100 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-brand-100 blur-3xl" />

      <div className="relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <LogoMark className="mb-3 h-12 w-12 [&>svg]:h-6 [&>svg]:w-6" />
          <h1 className="text-xl font-bold text-slate-900">Monitoring Skripsi</h1>
          <p className="text-sm text-slate-500">
            Koordinator &middot; Dosen Pembimbing &middot; Mahasiswa
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
