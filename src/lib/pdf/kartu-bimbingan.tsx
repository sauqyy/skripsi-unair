import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 10, fontFamily: "Helvetica" },
  title: { fontSize: 16, fontWeight: 700, marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 10, marginBottom: 16, textAlign: "center", color: "#555" },
  infoRow: { flexDirection: "row", marginBottom: 3 },
  infoLabel: { width: 110, color: "#555" },
  infoValue: { flex: 1, fontWeight: 700 },
  sectionTitle: { fontSize: 11, fontWeight: 700, marginTop: 16, marginBottom: 6 },
  table: { display: "flex", width: "100%", borderWidth: 1, borderColor: "#ccc" },
  tableRow: { flexDirection: "row" },
  tableHeaderCell: {
    backgroundColor: "#f1f5f9",
    fontWeight: 700,
    padding: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  tableCell: {
    padding: 5,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#ccc",
  },
  colNo: { width: "6%" },
  colTanggal: { width: "12%" },
  colDosen: { width: "18%" },
  colTopik: { width: "24%" },
  colCatatan: { width: "30%" },
  colTtd: { width: "10%" },
  signatureBox: { marginTop: 8, height: 40 },
  footerNote: { marginTop: 20, fontSize: 8, color: "#777" },
});

interface Props {
  mahasiswaNama: string;
  nimNip: string;
  prodi: string;
  judul: string;
  pembimbing: { ke: string; nama: string }[];
  riwayat: {
    pertemuanKe: number;
    tanggal: string;
    dosen: string;
    topik: string;
    catatanRevisi: string;
  }[];
}

export function KartuBimbinganDocument({
  mahasiswaNama,
  nimNip,
  prodi,
  judul,
  pembimbing,
  riwayat,
}: Props) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Kartu Bimbingan Skripsi</Text>
        <Text style={styles.subtitle}>Dicetak dari Sistem Monitoring Skripsi</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Nama Mahasiswa</Text>
          <Text style={styles.infoValue}>{mahasiswaNama}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>NIM</Text>
          <Text style={styles.infoValue}>{nimNip}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Program Studi</Text>
          <Text style={styles.infoValue}>{prodi}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Judul Skripsi</Text>
          <Text style={styles.infoValue}>{judul}</Text>
        </View>
        {pembimbing.map((p) => (
          <View style={styles.infoRow} key={p.ke}>
            <Text style={styles.infoLabel}>Pembimbing {p.ke}</Text>
            <Text style={styles.infoValue}>{p.nama}</Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Riwayat Bimbingan</Text>
        <View style={styles.table}>
          <View style={styles.tableRow}>
            <Text style={[styles.tableHeaderCell, styles.colNo]}>No</Text>
            <Text style={[styles.tableHeaderCell, styles.colTanggal]}>Tanggal</Text>
            <Text style={[styles.tableHeaderCell, styles.colDosen]}>Dosen</Text>
            <Text style={[styles.tableHeaderCell, styles.colTopik]}>Topik</Text>
            <Text style={[styles.tableHeaderCell, styles.colCatatan]}>Catatan Revisi</Text>
            <Text style={[styles.tableHeaderCell, styles.colTtd, { borderRightWidth: 0 }]}>
              TTD
            </Text>
          </View>
          {riwayat.length === 0 ? (
            <View style={styles.tableRow}>
              <Text
                style={[
                  styles.tableCell,
                  { width: "100%", textAlign: "center", borderRightWidth: 0 },
                ]}
              >
                Belum ada riwayat bimbingan.
              </Text>
            </View>
          ) : (
            riwayat.map((r) => (
              <View style={styles.tableRow} key={r.pertemuanKe} wrap={false}>
                <Text style={[styles.tableCell, styles.colNo]}>{r.pertemuanKe}</Text>
                <Text style={[styles.tableCell, styles.colTanggal]}>{r.tanggal}</Text>
                <Text style={[styles.tableCell, styles.colDosen]}>{r.dosen}</Text>
                <Text style={[styles.tableCell, styles.colTopik]}>{r.topik}</Text>
                <Text style={[styles.tableCell, styles.colCatatan]}>{r.catatanRevisi}</Text>
                <View style={[styles.tableCell, styles.colTtd, { borderRightWidth: 0 }]} />
              </View>
            ))
          )}
        </View>

        <Text style={styles.footerNote}>
          Kartu ini dicetak sebagai arsip bimbingan offline. Kolom tanda tangan (TTD) diisi
          dan ditandatangani secara manual oleh dosen pembimbing setelah kartu dicetak.
        </Text>
      </Page>
    </Document>
  );
}
