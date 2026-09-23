export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-xl font-bold text-slate-900">Monitoring Skripsi</h1>
          <p className="text-sm text-slate-500">
            Koordinator · Dosen Pembimbing · Mahasiswa
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
