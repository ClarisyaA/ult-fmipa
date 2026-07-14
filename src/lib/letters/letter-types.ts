export type LetterDateValue = Date | string | null;
export type LetterLanguage = "id" | "en";

export type LetterSigner = {
  letterNumber: string | null;
  letterDate: LetterDateValue;
  validUntil: LetterDateValue;
  place: string | null;
  actingFor: string | null;
  rank: string | null;
  title: string | null;
  name: string | null;
  nip: string | null;
};

export type KeteranganLulusLetterData = {
  requestId: string;
  languagePreference: LetterLanguage | null;
  npm: string;
  studentName: string;
  programStudy: string | null;
  level: string | null;
  birthPlace: string | null;
  birthDate: LetterDateValue;
  graduationDate: LetterDateValue;
  gpa: string | null;
  predicate: string | null;
  decreeNumber: string | null;
  decreeSubject: string | null;
  decreeDate: LetterDateValue;
  signer: LetterSigner;
};

export type BaseOfficialLetterData = {
  requestId: string;
  languagePreference: LetterLanguage | null;
  npm: string;
  studentName: string;
  programStudy: string | null;
  level: string | null;
  semester?: string | null;
  academicYear?: string | null;
  address?: string | null;
  parentName?: string | null;
  parentNipNrp?: string | null;
  parentRank?: string | null;
  parentInstitution?: string | null;
  signer: LetterSigner;
};

export type MagangLetterData = {
  requestId: string;
  languagePreference: LetterLanguage | null;
  npm: string;
  studentName: string;
  programStudy: string | null;
  requestType: string | null;
  contactPerson: string | null;
  institutionName: string | null;
  recipient: string | null;
  address: string | null;
  districtCity: string | null;
  city: string | null;
  province: string | null;
  startDate: LetterDateValue;
  endDate: LetterDateValue;
  signer: LetterSigner;
};

export type OfficialLetterTemplate =
  | "keterangan-lulus"
  | "masih-kuliah"
  | "masih-kuliah-aktif"
  | "kelakuan-baik"
  | "magang";

export type PrintableLetterService = {
  sourceTable:
    | "keterangan_lulus"
    | "masih_kuliah"
    | "masih_kuliah_aktif"
    | "kelakuan_baik"
    | "permohonan_magang";
  template: OfficialLetterTemplate;
};
