import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { formatIndonesianDate } from "@/lib/letters/letter-format";
import type { MagangLetterData } from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingRight: 48,
    paddingBottom: 42,
    paddingLeft: 48,
    fontFamily: "Times-Roman",
    color: "#111111",
    fontSize: 11,
  },
  metaWrap: {
    marginTop: 10,
    lineHeight: 1.18,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  metaLabel: {
    width: 44,
  },
  metaColon: {
    width: 8,
  },
  metaValue: {
    flex: 1,
  },
  metaDate: {
    width: 124,
    textAlign: "left",
  },
  recipient: {
    marginTop: 18,
    lineHeight: 1.22,
  },
  paragraph: {
    marginTop: 12,
    lineHeight: 1.28,
    textAlign: "justify",
  },
  identity: {
    marginTop: 8,
    marginLeft: 0,
    width: 330,
  },
  identityRow: {
    flexDirection: "row",
    marginBottom: 3,
  },
  identityLabel: {
    width: 88,
  },
  identityColon: {
    width: 8,
  },
  identityValue: {
    flex: 1,
  },
  signatureWrap: {
    position: "absolute",
    right: 58,
    top: 590,
    width: 250,
    lineHeight: 1.18,
  },
  signatureGap: {
    height: 54,
  },
  signerName: {
    fontFamily: "Times-Bold",
  },
  nip: {
    marginTop: 2,
  },
  copies: {
    position: "absolute",
    left: 48,
    bottom: 46,
    width: 330,
    lineHeight: 1.22,
  },
  copiesTitle: {
    marginBottom: 10,
  },
});

function safe(value: string | null | undefined) {
  return value?.trim() ?? "";
}

function formatPeriodDate(value: Date | string | null) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function IdentityRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.identityRow}>
      <Text style={styles.identityLabel}>{label}</Text>
      <Text style={styles.identityColon}>:</Text>
      <Text style={styles.identityValue}>{value}</Text>
    </View>
  );
}

function addressLines(data: MagangLetterData) {
  return [
    data.address,
    data.districtCity,
    data.city,
    data.province,
  ]
    .map((value) => value?.trim())
    .filter(Boolean)
    .filter((value, index, values) => values.indexOf(value) === index);
}

function actingFor(value: string | null | undefined) {
  return safe(value) || "a.n. Dekan";
}

function Signature({ data }: { data: MagangLetterData }) {
  const signer = data.signer;
  const title = safe(signer.title);
  const titleWithComma = title.endsWith(",") ? title : `${title},`;
  const nip = safe(signer.nip);

  return (
    <View style={styles.signatureWrap} wrap={false}>
      <Text>{actingFor(signer.actingFor)}</Text>
      <Text>{titleWithComma}</Text>
      <View style={styles.signatureGap} />
      <Text style={styles.signerName}>{safe(signer.name)}</Text>
      <Text style={styles.nip}>NIP {nip}</Text>
    </View>
  );
}

export function MagangLetterDocument({ data }: { data: MagangLetterData }) {
  const letterDate = formatIndonesianDate(data.signer.letterDate);
  const startDate = formatPeriodDate(data.startDate);
  const endDate = formatPeriodDate(data.endDate);
  const requestType = safe(data.requestType);
  const institutionName = safe(data.institutionName);
  const programStudy = safe(data.programStudy);
  const recipientLines = addressLines(data);

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
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Nomor</Text>
            <Text style={styles.metaColon}>:</Text>
            <Text style={styles.metaValue}>{safe(data.signer.letterNumber)}</Text>
            <Text style={styles.metaDate}>{letterDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Hal</Text>
            <Text style={styles.metaColon}>:</Text>
            <Text style={styles.metaValue}>Permohonan Izin Magang Kerja</Text>
          </View>
        </View>

        <View style={styles.recipient}>
          <Text>Yth. {safe(data.recipient)}</Text>
          <Text>{institutionName}</Text>
          {recipientLines.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>

        <Text style={styles.paragraph}>
          Berkenaan dengan keperluan dari mahasiswa Program Studi {programStudy}{" "}
          yaitu :
        </Text>

        <View style={styles.identity}>
          <IdentityRow label="Nama Mahasiswa" value={safe(data.studentName)} />
          <IdentityRow label="NPM" value={safe(data.npm)} />
        </View>

        <Text style={styles.paragraph}>
          yang bersangkutan bermaksud mengajukan permohonan izin untuk melakukan{" "}
          {requestType} di {institutionName}, yang direncanakan akan dilaksanakan
          mulai tanggal {startDate} sampai dengan {endDate}.
        </Text>

        <Text style={styles.paragraph}>
          Sehubungan dengan hal itu, kami mohon Bapak/Ibu berkenan dapat
          memberikan izin untuk kegiatan dimaksud.
        </Text>

        <Text style={styles.paragraph}>
          Atas perhatian dan kerjasama yang baik, kami ucapkan terima kasih.
        </Text>

        <Signature data={data} />

        <View style={styles.copies}>
          <Text style={styles.copiesTitle}>Tembusan :</Text>
          <Text>Dekan FMIPA Unpad.</Text>
          <Text>
            Ketua Program Studi {programStudy} FMIPA Unpad.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
