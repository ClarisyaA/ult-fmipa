import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import { LetterHeader } from "@/components/letters/pdf/letter-header";
import { SignatureBlock } from "@/components/letters/pdf/signature-block";
import type {
  BaseOfficialLetterData,
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

function SignerIdentity({ data }: { data: BaseOfficialLetterData }) {
  return (
    <>
      <Text style={styles.paragraph}>Yang bertanda tangan dibawah ini :</Text>
      <View style={styles.table}>
        <InfoRow label="Nama " value={safe(data.signer.name)} />
        <InfoRow label="NIP " value={safe(data.signer.nip)} />
        <InfoRow
          label="Pangkat, Golongan/Ruang"
          value={safe(data.signer.rank)}
        />
        <InfoRow label="Jabatan" value={safe(data.signer.title)} />
      </View>
    </>
  );
}

function StudentIdentity({
  data,
  includeSemester,
  includeAcademicYearLabel,
  includeAddress,
}: {
  data: BaseOfficialLetterData;
  includeSemester?: boolean;
  includeAcademicYearLabel?: "Tahun Akademik" | "Tahun Ajaran";
  includeAddress?: boolean;
}) {
  return (
    <>
      <Text style={styles.sectionLead}>dengan ini menerangkan bahwa :</Text>
      <View style={styles.table}>
        <InfoRow label="Nama Mahasiswa " value={data.studentName} />
        <InfoRow label="Nomor Pokok Mahasiswa " value={data.npm} />
        <InfoRow label="Program Studi" value={safe(data.programStudy)} />
        <InfoRow label="Program" value={safe(data.level)} />
        {includeSemester ? (
          <InfoRow label="Semester" value={safe(data.semester)} />
        ) : null}
        {includeAcademicYearLabel ? (
          <InfoRow
            label={includeAcademicYearLabel}
            value={safe(data.academicYear)}
          />
        ) : null}
        {includeAddress ? <InfoRow label="Alamat" value={safe(data.address)} /> : null}
      </View>
    </>
  );
}

function MasihKuliahBody({ data }: { data: BaseOfficialLetterData }) {
  return (
    <>
      <StudentIdentity
        data={data}
        includeSemester
        includeAcademicYearLabel="Tahun Akademik"
      />
      <Text style={styles.paragraph}>
        adalah benar mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Padjadjaran
      </Text>
      <Text style={styles.paragraphTight}>
        dan orang tua/wali dari mahasiswa tersebut adalah :
      </Text>
      <View style={styles.table}>
        <InfoRow label="Nama" value={safe(data.parentName)} />
        <InfoRow label="NIP/NRP " value={safe(data.parentNipNrp)} />
        <InfoRow
          label="Pangkat, Golongan/Ruang"
          value={safe(data.parentRank)}
        />
        <InfoRow label="Instansi" value={safe(data.parentInstitution)} />
      </View>
      <Text style={styles.paragraph}>
        Demikian surat keterangan ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana
      </Text>
      <Text style={styles.paragraphTight}>mestinya.</Text>
    </>
  );
}

function MasihKuliahAktifBody({ data }: { data: BaseOfficialLetterData }) {
  return (
    <>
      <StudentIdentity
        data={data}
        includeSemester
        includeAcademicYearLabel="Tahun Ajaran"
        includeAddress
      />
      <Text style={styles.paragraph}>
        adalah benar mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Padjadjaran
      </Text>
      <Text style={styles.paragraphTight}>
        dan sampai saat ini masih aktif kuliah.
      </Text>
      <Text style={styles.paragraph}>
        Demikian surat keterangan ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana
      </Text>
      <Text style={styles.paragraphTight}>mestinya.</Text>
    </>
  );
}

function KelakuanBaikBody({ data }: { data: BaseOfficialLetterData }) {
  return (
    <>
      <StudentIdentity data={data} includeAddress />
      <Text style={styles.paragraph}>
        adalah benar mahasiswa Fakultas Matematika dan Ilmu Pengetahuan Alam Universitas Padjadjaran,
      </Text>
      <Text style={styles.paragraphTight}>
        berdasarkan catatan pada kami bahwa mahasiswa tersebut berkelakuan baik dan tidak terlibat pada
      </Text>
      <Text style={styles.paragraphTight}>
        penyalahgunaan Narkotika, Alkohol, Psikotropika, dan Zat Aditif (NAPZA) yang dapat merusak moral
      </Text>
      <Text style={styles.paragraphTight}>dan kesehatan.</Text>
      <Text style={styles.paragraph}>
        Demikian surat keterangan ini dibuat dengan sesungguhnya agar dapat dipergunakan sebagaimana
      </Text>
      <Text style={styles.paragraphTight}>mestinya.</Text>
    </>
  );
}

export function OfficialLetterDocument({
  data,
  template,
}: {
  data: BaseOfficialLetterData;
  template: Exclude<OfficialLetterTemplate, "keterangan-lulus" | "magang">;
}) {
  return (
    <Document
      title={`${templateTitles[template]} ${data.npm}`}
      author="ULT FMIPA Unpad"
      subject={templateTitles[template]}
      creator="ULT FMIPA Unpad"
      producer="ULT FMIPA Unpad"
    >
      <Page size="A4" style={styles.page}>
        <LetterHeader />
        <Text style={styles.title}>{templateTitles[template]}</Text>
        <Text style={styles.number}>Nomor : {data.signer.letterNumber}</Text>
        <SignerIdentity data={data} />
        {template === "masih-kuliah" ? <MasihKuliahBody data={data} /> : null}
        {template === "masih-kuliah-aktif" ? (
          <MasihKuliahAktifBody data={data} />
        ) : null}
        {template === "kelakuan-baik" ? <KelakuanBaikBody data={data} /> : null}
        <SignatureBlock signer={data.signer} />
      </Page>
    </Document>
  );
}
