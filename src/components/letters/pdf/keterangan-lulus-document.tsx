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
  getExistingLetterAssetSource,
  letterWatermarkPath,
} from "@/components/letters/pdf/letter-assets";
import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { SignatureBlock } from "@/components/letters/pdf/signature-block";
import { formatLetterDate } from "@/lib/letters/letter-format";
import type {
  KeteranganLulusLetterData,
  LetterLanguage,
} from "@/lib/letters/letter-types";

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
  },
  content: {
    position: "relative",
  },
  title: {
    marginTop: 28,
    fontFamily: "Helvetica-Bold",
    fontSize: 18,
    textAlign: "center",
  },
  letterNumber: {
    marginTop: 3,
    fontSize: 11,
    textAlign: "center",
  },
  paragraph: {
    marginTop: 22,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
  },
  shortParagraph: {
    marginTop: 10,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
  },
  identityTable: {
    marginTop: 20,
    marginLeft: 70,
    width: 390,
  },
  row: {
    flexDirection: "row",
    marginBottom: 5,
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
    marginTop: 20,
    fontFamily: "Helvetica-Bold",
    fontSize: 16,
    textAlign: "center",
  },
  validity: {
    marginTop: 18,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
  },
  validityFollowup: {
    marginTop: 5,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
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

function translatePredicate(value: string | null | undefined, language: LetterLanguage) {
  const predicate = value ?? "-";

  if (language !== "en") {
    return predicate;
  }

  const normalized = predicate.toLowerCase();

  if (normalized === "pujian") return "With Distinction";
  if (normalized === "sangat memuaskan") return "Very Satisfactory";
  if (normalized === "memuaskan") return "Satisfactory";

  return predicate;
}

export function KeteranganLulusDocument({
  data,
  language = "id",
}: {
  data: KeteranganLulusLetterData;
  language?: LetterLanguage;
}) {
  const watermarkSource = getExistingLetterAssetSource(letterWatermarkPath);
  const level = data.level?.toUpperCase() || "-";
  const birthDate = formatLetterDate(data.birthDate, language);
  const graduationDate = formatLetterDate(data.graduationDate, language);
  const validUntil = formatLetterDate(data.signer.validUntil, language);
  const isEnglish = language === "en";
  const title = isEnglish ? "CERTIFICATE OF GRADUATION" : "SURAT KETERANGAN LULUS";

  return (
    <Document
      title={`${title} ${data.npm}`}
      author="ULT FMIPA Unpad"
      subject={isEnglish ? "Certificate of Graduation" : "Surat Keterangan Lulus"}
      creator="ULT FMIPA Unpad"
      producer="ULT FMIPA Unpad"
    >
      <Page size="A4" style={styles.page}>
        {watermarkSource ? (
          <Image src={watermarkSource} style={styles.watermark} fixed />
        ) : null}
        <View style={styles.content}>
          <LetterHeader language={language} />

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.letterNumber}>
            {isEnglish ? "Number" : "Nomor"} : {data.signer.letterNumber}
          </Text>

          <Text style={styles.paragraph}>
            {isEnglish
              ? "The Dean of the Faculty of Mathematics and Natural Sciences, Universitas Padjadjaran, hereby certifies"
              : "Dekan Fakultas Matematika dan Ilmu Pengetahuan Alam  Universitas Padjadjaran, menerangkan"}
          </Text>
          <Text style={styles.shortParagraph}>{isEnglish ? "that:" : "bahwa :"}</Text>

          <View style={styles.identityTable}>
            <InfoRow label={isEnglish ? "Name" : "Nama"} value={data.studentName} />
            <InfoRow
              label={isEnglish ? "Place and Date of Birth" : "Tempat, Tanggal lahir"}
              value={[data.birthPlace, birthDate].filter(Boolean).join(", ")}
            />
            <InfoRow label="NPM" value={data.npm} />
          </View>

          <Text style={styles.passStatement}>
            {isEnglish ? `HAS GRADUATED FROM THE ${level} PROGRAM` : `TELAH LULUS PROGRAM ${level}`}
          </Text>

          <View style={styles.identityTable}>
            <InfoRow
              label={isEnglish ? "Date of Graduation" : "Tanggal"}
              value={graduationDate}
            />
            <InfoRow
              label={isEnglish ? "Study Program" : "Program Studi"}
              value={data.programStudy ?? "-"}
            />
            <InfoRow label={isEnglish ? "GPA" : "IPK"} value={data.gpa ?? "-"} />
            <InfoRow
              label={isEnglish ? "Graduation Predicate" : "Yudisium"}
              value={translatePredicate(data.predicate, language)}
            />
          </View>

          <Text style={styles.validity}>
            {isEnglish
              ? "This certificate is issued upon the request of the student while the diploma is being processed"
              : "Keterangan  ini  diberikan  atas  permintaan  yang  bersangkutan  selama  Ijazah  dalam  proses"}
          </Text>
          <Text style={styles.validityFollowup}>
            {isEnglish
              ? `and is valid until ${validUntil}.`
              : `penerbitan  dan berlaku sampai dengan ${validUntil}.`}
          </Text>

          <SignatureBlock signer={data.signer} language={language} />
        </View>
      </Page>
    </Document>
  );
}
