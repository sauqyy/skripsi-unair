"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

const registerSchema = z
  .object({
    nama: z.string().min(3, "Nama minimal 3 karakter"),
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
    role: z.enum(["dosen", "mahasiswa"], {
      message: "Pilih peran",
    }),
    nim_nip: z.string().min(3, "NIM/NIP wajib diisi"),
    prodi: z.string().min(2, "Prodi wajib diisi"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirmPassword"],
  });

export interface RegisterState {
  error?: string;
  info?: string;
  fieldErrors?: Record<string, string>;
}

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    nama: formData.get("nama"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    role: formData.get("role"),
    nim_nip: formData.get("nim_nip"),
    prodi: formData.get("prodi"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { fieldErrors };
  }

  const { nama, email, password, role, nim_nip, prodi } = parsed.data;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nama, role, nim_nip, prodi },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/pending`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If the Supabase project requires email confirmation, signUp() returns a
  // user but no session yet — nothing to redirect into. Show a message
  // instead and let /auth/confirm establish the session once they click the
  // link in their inbox.
  if (!data.session) {
    return {
      info: "Registrasi berhasil! Cek email kamu dan klik link konfirmasi sebelum bisa login.",
    };
  }

  redirect("/pending");
}
