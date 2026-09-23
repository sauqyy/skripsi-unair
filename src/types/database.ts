/**
 * Hand-written mirror of supabase/migrations/0001_init.sql.
 *
 * Once you have a live Supabase project, regenerate this from the real
 * schema and replace this file:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/database.ts
 */

export type UserRole = "koordinator" | "dosen" | "mahasiswa";
export type AccountStatus = "pending" | "active" | "rejected";
export type SkripsiStatus = "aktif" | "selesai" | "cuti";
export type ProgressStatus = "belum" | "proses" | "selesai" | "disetujui";
export type BimbinganStatus = "diajukan" | "selesai" | "ditolak";
export type PembimbingSlot = "1" | "2";
export type NotificationType = "deadline" | "bimbingan" | "sistem";
export type ReminderKind = "h7" | "h3" | "h1";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          nama: string;
          email: string;
          role: UserRole;
          status: AccountStatus;
          nim_nip: string | null;
          prodi: string | null;
          email_reminder_optin: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & {
          id: string;
          nama: string;
          email: string;
          role: UserRole;
        };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey";
            columns: ["id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      stages: {
        Row: {
          id: string;
          nama: string;
          urutan: number;
          deskripsi: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["stages"]["Row"]> & {
          nama: string;
          urutan: number;
        };
        Update: Partial<Database["public"]["Tables"]["stages"]["Row"]>;
        Relationships: [];
      };
      bimbingan_assignments: {
        Row: {
          id: string;
          dosen_id: string;
          mahasiswa_id: string;
          pembimbing_ke: PembimbingSlot;
          periode: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["bimbingan_assignments"]["Row"]
        > & {
          dosen_id: string;
          mahasiswa_id: string;
        };
        Update: Partial<
          Database["public"]["Tables"]["bimbingan_assignments"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "bimbingan_assignments_dosen_id_fkey";
            columns: ["dosen_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bimbingan_assignments_mahasiswa_id_fkey";
            columns: ["mahasiswa_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      skripsi: {
        Row: {
          id: string;
          mahasiswa_id: string;
          judul: string | null;
          abstrak: string | null;
          current_stage_id: string | null;
          status: SkripsiStatus;
          deadline_akhir: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["skripsi"]["Row"]> & {
          mahasiswa_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["skripsi"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "skripsi_mahasiswa_id_fkey";
            columns: ["mahasiswa_id"];
            isOneToOne: true;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skripsi_current_stage_id_fkey";
            columns: ["current_stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          }
        ];
      };
      skripsi_progress: {
        Row: {
          id: string;
          skripsi_id: string;
          stage_id: string;
          status: ProgressStatus;
          tanggal_mulai: string | null;
          deadline: string | null;
          tanggal_selesai: string | null;
          approved_by: string | null;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["skripsi_progress"]["Row"]
        > & {
          skripsi_id: string;
          stage_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["skripsi_progress"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "skripsi_progress_skripsi_id_fkey";
            columns: ["skripsi_id"];
            isOneToOne: false;
            referencedRelation: "skripsi";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "skripsi_progress_stage_id_fkey";
            columns: ["stage_id"];
            isOneToOne: false;
            referencedRelation: "stages";
            referencedColumns: ["id"];
          }
        ];
      };
      bimbingan: {
        Row: {
          id: string;
          skripsi_id: string;
          dosen_id: string;
          pertemuan_ke: number;
          tanggal: string;
          topik: string | null;
          catatan_revisi: string | null;
          status: BimbinganStatus;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["bimbingan"]["Row"]> & {
          skripsi_id: string;
          dosen_id: string;
          pertemuan_ke: number;
        };
        Update: Partial<Database["public"]["Tables"]["bimbingan"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "bimbingan_skripsi_id_fkey";
            columns: ["skripsi_id"];
            isOneToOne: false;
            referencedRelation: "skripsi";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bimbingan_dosen_id_fkey";
            columns: ["dosen_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      documents: {
        Row: {
          id: string;
          skripsi_id: string;
          bimbingan_id: string | null;
          nama_file: string;
          storage_path: string;
          versi: number;
          uploaded_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["documents"]["Row"]> & {
          skripsi_id: string;
          nama_file: string;
          storage_path: string;
        };
        Update: Partial<Database["public"]["Tables"]["documents"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "documents_skripsi_id_fkey";
            columns: ["skripsi_id"];
            isOneToOne: false;
            referencedRelation: "skripsi";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "documents_bimbingan_id_fkey";
            columns: ["bimbingan_id"];
            isOneToOne: false;
            referencedRelation: "bimbingan";
            referencedColumns: ["id"];
          }
        ];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          pesan: string;
          tipe: NotificationType;
          dibaca: boolean;
          created_at: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["notifications"]["Row"]
        > & {
          user_id: string;
          pesan: string;
        };
        Update: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      email_reminders_log: {
        Row: {
          id: string;
          skripsi_progress_id: string;
          dikirim_ke: string;
          jenis: ReminderKind;
          tanggal_kirim: string;
        };
        Insert: Partial<
          Database["public"]["Tables"]["email_reminders_log"]["Row"]
        > & {
          skripsi_progress_id: string;
          dikirim_ke: string;
          jenis: ReminderKind;
        };
        Update: Partial<
          Database["public"]["Tables"]["email_reminders_log"]["Row"]
        >;
        Relationships: [
          {
            foreignKeyName: "email_reminders_log_skripsi_progress_id_fkey";
            columns: ["skripsi_progress_id"];
            isOneToOne: false;
            referencedRelation: "skripsi_progress";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      user_role: UserRole;
      account_status: AccountStatus;
      skripsi_status: SkripsiStatus;
      progress_status: ProgressStatus;
      bimbingan_status: BimbinganStatus;
      pembimbing_slot: PembimbingSlot;
      notification_type: NotificationType;
      reminder_kind: ReminderKind;
    };
    CompositeTypes: { [_ in never]: never };
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Stage = Database["public"]["Tables"]["stages"]["Row"];
export type BimbinganAssignment =
  Database["public"]["Tables"]["bimbingan_assignments"]["Row"];
export type Skripsi = Database["public"]["Tables"]["skripsi"]["Row"];
export type SkripsiProgress =
  Database["public"]["Tables"]["skripsi_progress"]["Row"];
export type Bimbingan = Database["public"]["Tables"]["bimbingan"]["Row"];
export type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
export type Notification =
  Database["public"]["Tables"]["notifications"]["Row"];
