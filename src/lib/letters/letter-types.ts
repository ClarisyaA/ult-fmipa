export type LetterDateValue = Date | string | null;

export type LetterSigner = {
  letterNumber: string | null;
  letterDate: LetterDateValue;
  validUntil: LetterDateValue;
  place: string | null;
  actingFor: string | null;
  title: string | null;
  name: string | null;
  nip: string | null;
};

export type KeteranganLulusLetterData = {
  requestId: string;
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

export type PrintableLetterService = {
  sourceTable: "keterangan_lulus";
  template: "keterangan-lulus";
};
