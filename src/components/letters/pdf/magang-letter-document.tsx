import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { SignatureBlock } from "@/components/letters/pdf/signature-block";
import {
  formatIndonesianDate,
  formatIndonesianDateRange,
} from "@/lib/letters/letter-format";
import type { MagangLetterData } from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 42,
    paddingBottom: 34,
    paddingLeft: 42,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  metaWrap: {
    marginTop: 12,
    fontSize: 11,
    lineHeight: 1.25,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 2,
  },
  metaLabel: {
    width: 60,
  },
  metaColon: {
    width: 10,
  },
  metaValue: {
    flex: 1,
  },
  recipient: {
    marginTop: 18,
    fontSize: 11,
    lineHeight: 1.3,
  },
  paragraph: {
    marginTop: 14,
    fontSize: 11,
    lineHeight: 1.35,
    textAlign: "justify",
  },
  table: {
    marginTop: 8,
    marginLeft: 28,
    width: 445,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 150,
    fontSize: 11,
  },
  colon: {
    width: 12,
    fontSize: 11,
  },
  value: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.25,
  },
  signatureWrap: {
    marginTop: 18,
  },
  copies: {
    marginTop: 18,
    fontSize: 10.5,
    lineHeight: 1.25,
  },
});

function safe(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.colon}>:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaColon}>:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function addressLine(data: MagangLetterData) {
  return [
    data.address,
    data.districtCity,
    data.city,
    data.province,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(", ");
}

export function MagangLetterDocument({ data }: { data: MagangLetterData }) {
  const dateRange = formatIndonesianDateRange(data.startDate, data.endDate);

  return (
    <Document
      title={`Surat Permohonan Izin Magang Kerja ${data.npm}`}
      author="ULT FMIPA Unpad"
      subject="Permohonan Izin Magang Kerja"
      creator="ULT FMIPA Unpad"
      producer="ULT FMIPA Unpad"
    >
      <Page size="A4" style={styles.page}>
        <LetterHeader />

        <View style={styles.metaWrap}>
          <Text>
            {safe(data.signer.place)}
            {data.signer.letterDate
              ? `, ${formatIndonesianDate(data.signer.letterDate)}`
              : ""}
          </Text>
          <MetaRow label="Nomor" value={safe(data.signer.letterNumber)} />
          <MetaRow label="Lampiran" value="-" />
          <MetaRow label="Hal" value={`Permohonan Izin ${safe(data.requestType)}`} />
        </View>

        <View style={styles.recipient}>
          <Text>Yth. {safe(data.recipient)}</Text>
          <Text>{safe(data.institutionName)}</Text>
          <Text>{addressLine(data)}</Text>
        </View>

        <Text style={styles.paragraph}>Dengan hormat,</Text>
        <Text style={styles.paragraph}>
          Dalam rangka memenuhi kegiatan akademik pada Fakultas Matematika dan
          Ilmu Pengetahuan Alam Universitas Padjadjaran, bersama ini kami
          mengajukan permohonan izin kepada Bapak/Ibu untuk menerima mahasiswa
          kami melaksanakan {safe(data.requestType)} pada instansi yang
          Bapak/Ibu pimpin.
        </Text>

        <View style={styles.table}>
          <InfoRow label="Nama" value={safe(data.studentName)} />
          <InfoRow label="NPM" value={safe(data.npm)} />
          <InfoRow label="Program Studi" value={safe(data.programStudy)} />
          <InfoRow label="Jenis Permohonan" value={safe(data.requestType)} />
          <InfoRow label="Tempat Pelaksanaan" value={safe(data.institutionName)} />
          <InfoRow label="Waktu Pelaksanaan" value={dateRange} />
        </View>

        <Text style={styles.paragraph}>
          Besar harapan kami agar permohonan ini dapat dikabulkan. Atas
          perhatian dan kerja sama Bapak/Ibu, kami ucapkan terima kasih.
        </Text>

        <View style={styles.signatureWrap}>
          <SignatureBlock signer={data.signer} />
        </View>

        <View style={styles.copies}>
          <Text>Tembusan:</Text>
          <Text>1. Dekan FMIPA Unpad.</Text>
          <Text>
            2. Ketua Program Studi {safe(data.programStudy)} FMIPA Unpad.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
