import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { formatEnglishDate, formatIndonesianDate } from "@/lib/letters/letter-format";
import type { LetterLanguage, MagangLetterData } from "@/lib/letters/letter-types";

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
    right: 36,
    top: 552,
    width: 250,
    lineHeight: 1.18,
  },
  signatureGap: {
    height: 50,
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

function formatMagangDate(value: Date | string | null, language: LetterLanguage) {
  return language === "en" ? formatEnglishDate(value) : formatPeriodDate(value);
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

function translateSignerText(value: string | null | undefined, language: LetterLanguage) {
  const text = safe(value);

  if (language !== "en") {
    return text;
  }

  const normalized = text.toLowerCase();

  if (normalized === "a.n. dekan" || normalized === "an. dekan") {
    return "on behalf of the Dean";
  }

  if (normalized === "dekan") {
    return "Dean";
  }

  if (normalized.includes("wakil dekan") && normalized.includes("akademik")) {
    return "Vice Dean for Academic, Student Affairs, and Research";
  }

  return text;
}

function requestTypeText(value: string | null | undefined, language: LetterLanguage) {
  const text = safe(value);

  if (language !== "en") {
    return text;
  }

  const normalized = text.toLowerCase();

  if (normalized.includes("tugas akhir") || normalized.includes("ta")) {
    return "Final Project";
  }

  if (normalized.includes("kerja praktek") || normalized.includes("praktik")) {
    return "Practical Work";
  }

  return "Internship";
}

function requestSubject(value: string | null | undefined, language: LetterLanguage) {
  if (language !== "en") {
    return "Permohonan Izin Magang Kerja";
  }

  const type = requestTypeText(value, language);

  if (type === "Final Project") return "Request for Final Project Permission";
  if (type === "Practical Work") return "Request for Practical Work Permission";

  return "Request for Internship Permission";
}

function Signature({
  data,
  language,
}: {
  data: MagangLetterData;
  language: LetterLanguage;
}) {
  const signer = data.signer;
  const title = translateSignerText(signer.title, language);
  const titleWithComma = title.endsWith(",") ? title : `${title},`;
  const nip = safe(signer.nip);

  return (
    <View style={styles.signatureWrap} wrap={false}>
      <Text>
        {language === "en"
          ? translateSignerText(actingFor(signer.actingFor), language)
          : actingFor(signer.actingFor)}
      </Text>
      <Text>{titleWithComma}</Text>
      <View style={styles.signatureGap} />
      <Text style={styles.signerName}>{safe(signer.name)}</Text>
      <Text style={styles.nip}>NIP {nip}</Text>
    </View>
  );
}

export function MagangLetterDocument({
  data,
  language = "id",
}: {
  data: MagangLetterData;
  language?: LetterLanguage;
}) {
  const isEnglish = language === "en";
  const letterDate =
    language === "en"
      ? formatEnglishDate(data.signer.letterDate)
      : formatIndonesianDate(data.signer.letterDate);
  const startDate = formatMagangDate(data.startDate, language);
  const endDate = formatMagangDate(data.endDate, language);
  const requestType = requestTypeText(data.requestType, language);
  const institutionName = safe(data.institutionName);
  const programStudy = safe(data.programStudy);
  const recipientLines = addressLines(data);
  const subject = requestSubject(data.requestType, language);

  return (
    <Document
      title={`${subject} ${data.npm}`}
      author="ULT FMIPA Unpad"
      subject={subject}
      creator="ULT FMIPA Unpad"
      producer="ULT FMIPA Unpad"
    >
      <Page size="A4" style={styles.page}>
        <LetterHeader language={language} />

        <View style={styles.metaWrap}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{isEnglish ? "Number" : "Nomor"}</Text>
            <Text style={styles.metaColon}>:</Text>
            <Text style={styles.metaValue}>{safe(data.signer.letterNumber)}</Text>
            <Text style={styles.metaDate}>{letterDate}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>{isEnglish ? "Subject" : "Hal"}</Text>
            <Text style={styles.metaColon}>:</Text>
            <Text style={styles.metaValue}>{subject}</Text>
          </View>
        </View>

        <View style={styles.recipient}>
          <Text>{isEnglish ? "To:" : "Yth."} {safe(data.recipient)}</Text>
          <Text>{institutionName}</Text>
          {recipientLines.map((line) => (
            <Text key={line}>{line}</Text>
          ))}
        </View>

        <Text style={styles.paragraph}>
          {isEnglish
            ? `In connection with the academic needs of a student of the ${programStudy} Study Program, namely:`
            : `Berkenaan dengan keperluan dari mahasiswa Program Studi ${programStudy} yaitu :`}
        </Text>

        <View style={styles.identity}>
          <IdentityRow
            label={isEnglish ? "Student Name" : "Nama Mahasiswa"}
            value={safe(data.studentName)}
          />
          <IdentityRow
            label={isEnglish ? "Student ID Number" : "NPM"}
            value={safe(data.npm)}
          />
        </View>

        <Text style={styles.paragraph}>
          {isEnglish
            ? `the student intends to request permission to undertake ${requestType} at ${institutionName}, which is planned to be carried out from ${startDate} to ${endDate}.`
            : `yang bersangkutan bermaksud mengajukan permohonan izin untuk melakukan ${requestType} di ${institutionName}, yang direncanakan akan dilaksanakan mulai tanggal ${startDate} sampai dengan ${endDate}.`}
        </Text>

        <Text style={styles.paragraph}>
          {isEnglish
            ? "In this regard, we kindly request that you grant permission for the aforementioned activity."
            : "Sehubungan dengan hal itu, kami mohon Bapak/Ibu berkenan dapat memberikan izin untuk kegiatan dimaksud."}
        </Text>

        <Text style={styles.paragraph}>
          {isEnglish
            ? "Thank you for your attention and cooperation."
            : "Atas perhatian dan kerjasama yang baik, kami ucapkan terima kasih."}
        </Text>

        <Signature data={data} language={language} />

        <View style={styles.copies}>
          <Text style={styles.copiesTitle}>
            {isEnglish ? "Copies to:" : "Tembusan :"}
          </Text>
          <Text>{isEnglish ? "Dean of FMIPA Unpad." : "Dekan FMIPA Unpad."}</Text>
          <Text>
            {isEnglish
              ? `Head of the ${programStudy} Study Program, FMIPA Unpad.`
              : `Ketua Program Studi ${programStudy} FMIPA Unpad.`}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
