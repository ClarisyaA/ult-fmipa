export type ServiceUploadRule = {
  maxFiles: number;
  maxFileSizeBytes: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  description: string;
  attachmentType?: string;
  minFiles?: number;
};

export const defaultUploadRule = {
  maxFiles: 3,
  maxFileSizeBytes: 5 * 1024 * 1024,
  allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
  allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
  description: "Maksimal 3 file, masing-masing 5 MB. Format PDF, JPG, atau PNG.",
} satisfies ServiceUploadRule;

const serviceUploadRules: Record<string, ServiceUploadRule> = {
  "permohonan-magang-kerja-praktek-ta": {
    maxFiles: 5,
    minFiles: 1,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf"],
    allowedExtensions: [".pdf"],
    description:
      "Upload Surat Permohonan dari Program Studi. Maksimal 5 file PDF, masing-masing 10 MB.",
    attachmentType: "program_study_request_letter",
  },
  "surat-izin-kegiatan:approval-proof": {
    maxFiles: 5,
    minFiles: 1,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
    description:
      "Upload bukti ACC Manajer Akademik dan Kemahasiswaan. Maksimal 5 file, masing-masing 10 MB. Format PDF, JPG, atau PNG.",
    attachmentType: "manager_approval_proof",
  },
  "surat-izin-kegiatan:final-spik": {
    maxFiles: 5,
    minFiles: 1,
    maxFileSizeBytes: 10 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
    description:
      "Upload SPIK final. Maksimal 5 file, masing-masing 10 MB. Format PDF, JPG, atau PNG.",
    attachmentType: "final_spik_document",
  },
};

export function getServiceUploadRule(serviceSlug: string) {
  return serviceUploadRules[serviceSlug] ?? defaultUploadRule;
}
