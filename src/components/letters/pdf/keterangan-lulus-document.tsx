import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
/* eslint-disable jsx-a11y/alt-text */

import {
  getExistingLetterAsset,
  letterWatermarkPath,
} from "@/components/letters/pdf/letter-assets";
import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { SignatureBlock } from "@/components/letters/pdf/signature-block";
import { formatIndonesianDate } from "@/lib/letters/letter-format";
import type { KeteranganLulusLetterData } from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  page: {
    position: "relative",
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 34,
    paddingLeft: 34,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  watermark: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 579,
    height: 827,
    opacity: 0.18,
  },
  content: {
    position: "relative",
  },
  title: {
    marginTop: 34,
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    textAlign: "center",
    textDecoration: "underline",
  },
  letterNumber: {
    marginTop: 3,
    fontSize: 11,
    textAlign: "center",
  },
  paragraph: {
    marginTop: 28,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.55,
  },
  shortParagraph: {
    marginTop: 12,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.55,
  },
  identityTable: {
    marginTop: 26,
    marginLeft: 70,
    width: 390,
  },
  row: {
    flexDirection: "row",
    marginBottom: 8,
  },
  label: {
    width: 130,
    fontSize: 11,
  },
  colon: {
    width: 14,
    fontSize: 11,
  },
  value: {
    flex: 1,
    fontSize: 11,
  },
  passStatement: {
    marginTop: 24,
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    textAlign: "center",
  },
  validity: {
    marginTop: 22,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.55,
  },
});

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.colon}>:</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export function KeteranganLulusDocument({
  data,
}: {
  data: KeteranganLulusLetterData;
}) {
  const watermarkPath = getExistingLetterAsset(letterWatermarkPath);
  const level = data.level?.toUpperCase() || "-";
  const birthDate = formatIndonesianDate(data.birthDate);
  const graduationDate = formatIndonesianDate(data.graduationDate);
  const validUntil = formatIndonesianDate(data.signer.validUntil);

  return (
    <Document
      title={`Surat Keterangan Lulus ${data.npm}`}
      author="ULT FMIPA Unpad"
      subject="Surat Keterangan Lulus"
      creator="ULT FMIPA Unpad"
      producer="ULT FMIPA Unpad"
    >
      <Page size="A4" style={styles.page}>
        {watermarkPath ? (
          <Image src={watermarkPath} style={styles.watermark} fixed />
        ) : null}
        <View style={styles.content}>
          <LetterHeader />

          <Text style={styles.title}>SURAT KETERANGAN LULUS</Text>
          <Text style={styles.letterNumber}>
            Nomor : {data.signer.letterNumber}
          </Text>

          <Text style={styles.paragraph}>
            Dekan Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas
            Padjadjaran, menerangkan
          </Text>
          <Text style={styles.shortParagraph}>bahwa :</Text>

          <View style={styles.identityTable}>
            <InfoRow label="Nama" value={data.studentName} />
            <InfoRow
              label="Tempat, Tanggal lahir"
              value={[data.birthPlace, birthDate].filter(Boolean).join(", ")}
            />
            <InfoRow label="NPM" value={data.npm} />
          </View>

          <Text style={styles.passStatement}>TELAH LULUS PROGRAM {level}</Text>

          <View style={styles.identityTable}>
            <InfoRow label="Tanggal" value={graduationDate} />
            <InfoRow label="Program Studi" value={data.programStudy ?? "-"} />
            <InfoRow label="IPK" value={data.gpa ?? "-"} />
            <InfoRow label="Yudisium" value={data.predicate ?? "-"} />
          </View>

          <Text style={styles.validity}>
            Keterangan ini diberikan atas permintaan yang bersangkutan selama
            Ijazah dalam proses penerbitan dan berlaku sampai dengan {validUntil}.
          </Text>

          <SignatureBlock signer={data.signer} />
        </View>
      </Page>
    </Document>
  );
}
