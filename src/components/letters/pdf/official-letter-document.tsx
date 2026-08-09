import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { SignatureBlock } from "@/components/letters/pdf/signature-block";
import type {
  BaseOfficialLetterData,
  LetterLanguage,
  OfficialLetterTemplate,
} from "@/lib/letters/letter-types";

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingRight: 34,
    paddingBottom: 34,
    paddingLeft: 34,
    fontFamily: "Helvetica",
    color: "#111111",
  },
  title: {
    marginTop: 21,
    fontFamily: "Helvetica-Bold",
    fontSize: 14,
    textAlign: "center",
  },
  number: {
    marginTop: 2,
    fontSize: 11,
    textAlign: "center",
  },
  paragraph: {
    marginTop: 18,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
  },
  paragraphTight: {
    marginTop: 5,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
  },
  sectionLead: {
    marginTop: 12,
    marginLeft: 28,
    fontSize: 11,
    lineHeight: 1.2,
  },
  table: {
    marginTop: 7,
    marginLeft: 56,
    width: 470,
  },
  tableLargeGap: {
    marginTop: 16,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontSize: 11,
  },
  colon: {
    width: 12,
    fontSize: 11,
  },
  value: {
    flex: 1,
    fontSize: 11,
    lineHeight: 1.2,
  },
});

const templateTitles = {
  "masih-kuliah": "SURAT KETERANGAN MASIH KULIAH",
  "masih-kuliah-aktif": "SURAT KETERANGAN MASIH AKTIF KULIAH",
  "kelakuan-baik": "SURAT KETERANGAN KELAKUAN BAIK",
} satisfies Record<
  Exclude<OfficialLetterTemplate, "keterangan-lulus" | "magang">,
  string
>;

const englishTemplateTitles = {
  "masih-kuliah": "CERTIFICATE FOR PARENT ALLOWANCE",
  "masih-kuliah-aktif": "CERTIFICATE OF ACTIVE ENROLLMENT",
  "kelakuan-baik": "CERTIFICATE OF GOOD CONDUCT",
} satisfies Record<
  Exclude<OfficialLetterTemplate, "keterangan-lulus" | "magang">,
  string
>;

function safe(value: string | null | undefined) {
  return value ?? "";
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

function templateTitle(
  template: Exclude<OfficialLetterTemplate, "keterangan-lulus" | "magang">,
  language: LetterLanguage,
) {
  return language === "en" ? englishTemplateTitles[template] : templateTitles[template];
}

function translateSignerText(value: string | null | undefined, language: LetterLanguage) {
  const text = safe(value).trim();

  if (language !== "en") {
    return text;
  }

  const normalized = text.toLowerCase();
  if (normalized === "dekan") return "Dean";
  if (normalized.includes("wakil dekan") && normalized.includes("akademik")) {
    return "Vice Dean for Academic, Student Affairs, and Research";
  }

  return text;
}

function SignerIdentity({
  data,
  language,
}: {
  data: BaseOfficialLetterData;
  language: LetterLanguage;
}) {
  const isEnglish = language === "en";

  return (
    <>
      <Text style={styles.paragraph}>
        {isEnglish ? "The undersigned:" : "Yang bertanda tangan dibawah ini :"}
      </Text>
      <View style={styles.table}>
        <InfoRow label={isEnglish ? "Name" : "Nama "} value={safe(data.signer.name)} />
        <InfoRow label="NIP " value={safe(data.signer.nip)} />
        <InfoRow
          label={isEnglish ? "Rank, Grade/Class" : "Pangkat, Golongan/Ruang"}
          value={safe(data.signer.rank)}
        />
        <InfoRow
          label={isEnglish ? "Position" : "Jabatan"}
          value={translateSignerText(data.signer.title, language)}
        />
      </View>
    </>
  );
}

function StudentIdentity({
  data,
  includeSemester,
  includeAcademicYearLabel,
  includeAddress,
  language,
}: {
  data: BaseOfficialLetterData;
  includeSemester?: boolean;
  includeAcademicYearLabel?: "Tahun Akademik" | "Tahun Ajaran";
  includeAddress?: boolean;
  language: LetterLanguage;
}) {
  const isEnglish = language === "en";

  return (
    <>
      <Text style={styles.sectionLead}>
        {isEnglish ? "hereby certifies that:" : "dengan ini menerangkan bahwa :"}
      </Text>
      <View style={styles.table}>
        <InfoRow
          label={isEnglish ? "Student Name " : "Nama Mahasiswa "}
          value={data.studentName}
        />
        <InfoRow
          label={isEnglish ? "Student ID Number " : "Nomor Pokok Mahasiswa "}
          value={data.npm}
        />
        <InfoRow
          label={isEnglish ? "Study Program" : "Program Studi"}
          value={safe(data.programStudy)}
        />
        <InfoRow label="Program" value={safe(data.level)} />
        {includeSemester ? (
          <InfoRow label="Semester" value={safe(data.semester)} />
        ) : null}
        {includeAcademicYearLabel ? (
          <InfoRow
            label={isEnglish ? "Academic Year" : includeAcademicYearLabel}
            value={safe(data.academicYear)}
          />
        ) : null}
        {includeAddress ? (
          <InfoRow label={isEnglish ? "Address" : "Alamat"} value={safe(data.address)} />
        ) : null}
      </View>
    </>
  );
}

function MasihKuliahBody({
  data,
  language,
}: {
  data: BaseOfficialLetterData;
  language: LetterLanguage;
}) {
  const isEnglish = language === "en";

  return (
    <>
      <StudentIdentity
        data={data}
        includeSemester
        includeAcademicYearLabel="Tahun Akademik"
        language={language}
      />
      <Text style={styles.paragraph}>
        {isEnglish
          ? "is a student of the Faculty of Mathematics and Natural Sciences, Universitas Padjadjaran"
          : "adalah benar mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Padjadjaran"}
      </Text>
      <Text style={styles.paragraphTight}>
        {isEnglish
          ? "and the parent/guardian of the student is:"
          : "dan orang tua/wali dari mahasiswa tersebut adalah :"}
      </Text>
      <View style={styles.table}>
        <InfoRow label={isEnglish ? "Name" : "Nama"} value={safe(data.parentName)} />
        <InfoRow label="NIP/NRP " value={safe(data.parentNipNrp)} />
        <InfoRow
          label={isEnglish ? "Rank, Grade/Class" : "Pangkat, Golongan/Ruang"}
          value={safe(data.parentRank)}
        />
        <InfoRow
          label={isEnglish ? "Institution" : "Instansi"}
          value={safe(data.parentInstitution)}
        />
      </View>
      <Text style={styles.paragraph}>
        {isEnglish
          ? "This certificate is issued truthfully for parent allowance or benefit administrative purposes"
          : "Demikian surat keterangan ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana"}
      </Text>
      <Text style={styles.paragraphTight}>{isEnglish ? "as appropriate." : "mestinya."}</Text>
    </>
  );
}

function MasihKuliahAktifBody({
  data,
  language,
}: {
  data: BaseOfficialLetterData;
  language: LetterLanguage;
}) {
  const isEnglish = language === "en";

  return (
    <>
      <StudentIdentity
        data={data}
        includeSemester
        includeAcademicYearLabel="Tahun Ajaran"
        includeAddress
        language={language}
      />
      <Text style={styles.paragraph}>
        {isEnglish
          ? "is registered as a student of the Faculty of Mathematics and Natural Sciences, Universitas Padjadjaran"
          : "adalah benar mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Padjadjaran"}
      </Text>
      <Text style={styles.paragraphTight}>
        {isEnglish
          ? "and is currently actively enrolled."
          : "dan sampai saat ini masih aktif kuliah."}
      </Text>
      <Text style={styles.paragraph}>
        {isEnglish
          ? "This certificate is issued truthfully for the intended administrative purposes"
          : "Demikian surat keterangan ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana"}
      </Text>
      <Text style={styles.paragraphTight}>{isEnglish ? "as appropriate." : "mestinya."}</Text>
    </>
  );
}

function KelakuanBaikBody({
  data,
  language,
}: {
  data: BaseOfficialLetterData;
  language: LetterLanguage;
}) {
  const isEnglish = language === "en";

  return (
    <>
      <StudentIdentity data={data} includeAddress language={language} />
      <Text style={styles.paragraph}>
        {isEnglish
          ? "is a student of the Faculty of Mathematics and Natural Sciences, Universitas Padjadjaran,"
          : "adalah benar mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Padjadjaran,"}
      </Text>
      <Text style={styles.paragraphTight}>
        {isEnglish
          ? "and based on our records, the student is of good conduct and has not been involved in"
          : "berdasarkan catatan pada kami bahwa mahasiswa tersebut berkelakuan baik dan tidak terlibat pada"}
      </Text>
      <Text style={styles.paragraphTight}>
        {isEnglish
          ? "the misuse of Narcotics, Alcohol, Psychotropics, and Addictive Substances (NAPZA) that may harm moral"
          : "penyalahgunaan Narkotika, Alkohol, Psikotropika, dan Zat Aditif (NAPZA) yang dapat merusak moral"}
      </Text>
      <Text style={styles.paragraphTight}>
        {isEnglish ? "character and health." : "dan kesehatan."}
      </Text>
      <Text style={styles.paragraph}>
        {isEnglish
          ? "This certificate is issued truthfully for the intended administrative purposes"
          : "Demikian surat keterangan ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana"}
      </Text>
      <Text style={styles.paragraphTight}>{isEnglish ? "as appropriate." : "mestinya."}</Text>
    </>
  );
}

export function OfficialLetterDocument({
  data,
  template,
  language = "id",
}: {
  data: BaseOfficialLetterData;
  template: Exclude<OfficialLetterTemplate, "keterangan-lulus" | "magang">;
  language?: LetterLanguage;
}) {
  const title = templateTitle(template, language);

  return (
    <Document
      title={`${title} ${data.npm}`}
      author="ULT FMIPA Unpad"
      subject={title}
      creator="ULT FMIPA Unpad"
      producer="ULT FMIPA Unpad"
    >
      <Page size="A4" style={styles.page}>
        <LetterHeader language={language} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.number}>
          {language === "en" ? "Number" : "Nomor"} : {data.signer.letterNumber}
        </Text>
        <SignerIdentity data={data} language={language} />
        {template === "masih-kuliah" ? (
          <MasihKuliahBody data={data} language={language} />
        ) : null}
        {template === "masih-kuliah-aktif" ? (
          <MasihKuliahAktifBody data={data} language={language} />
        ) : null}
        {template === "kelakuan-baik" ? (
          <KelakuanBaikBody data={data} language={language} />
        ) : null}
        <SignatureBlock signer={data.signer} language={language} />
      </Page>
    </Document>
  );
}
