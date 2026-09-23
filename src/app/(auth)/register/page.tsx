"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction, type RegisterState } from "./actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const initialState: RegisterState = {};

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, initialState);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Daftar Akun</CardTitle>
        <p className="mt-1 text-sm text-slate-500">
          Akun dosen &amp; mahasiswa perlu disetujui koordinator sebelum bisa login.
        </p>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          {state.error && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
              {state.error}
            </p>
          )}

          <div>
            <Label htmlFor="role">Daftar sebagai</Label>
            <Select id="role" name="role" defaultValue="mahasiswa">
              <option value="mahasiswa">Mahasiswa</option>
              <option value="dosen">Dosen Pembimbing</option>
            </Select>
            {state.fieldErrors?.role && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.role}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nama">Nama Lengkap</Label>
            <Input id="nama" name="nama" required autoComplete="name" />
            {state.fieldErrors?.nama && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nama}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nim_nip">NIM / NIP</Label>
            <Input id="nim_nip" name="nim_nip" required />
            {state.fieldErrors?.nim_nip && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.nim_nip}</p>
            )}
          </div>

          <div>
            <Label htmlFor="prodi">Program Studi</Label>
            <Input id="prodi" name="prodi" required />
            {state.fieldErrors?.prodi && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.prodi}</p>
            )}
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
            {state.fieldErrors?.email && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.email}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
            />
            {state.fieldErrors?.password && (
              <p className="mt-1 text-xs text-red-600">{state.fieldErrors.password}</p>
            )}
          </div>

          <div>
            <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              autoComplete="new-password"
            />
            {state.fieldErrors?.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">
                {state.fieldErrors.confirmPassword}
              </p>
            )}
          </div>

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Mendaftarkan..." : "Daftar"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-500">
          Sudah punya akun?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Masuk
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
