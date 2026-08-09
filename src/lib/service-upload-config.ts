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
  "rekomendasi-beasiswa": {
    maxFiles: 3,
    minFiles: 1,
    maxFileSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
    description:
      "Dokumen pendukung wajib diunggah. Maksimal 3 file, masing-masing 5 MB. Format PDF, JPG, atau PNG.",
  },
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
  "surat-pengantar": {
    maxFiles: 3,
    minFiles: 1,
    maxFileSizeBytes: 5 * 1024 * 1024,
    allowedMimeTypes: ["application/pdf", "image/jpeg", "image/png"],
    allowedExtensions: [".pdf", ".jpg", ".jpeg", ".png"],
    description:
      "Dokumen pendukung wajib diunggah, misalnya surat perizinan, bukti persetujuan, atau tangkapan layar persetujuan dari Kaprodi/pihak terkait.",
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

export function getMaxUploadSizeOverrideBytes(): number | null {
  const envValue = process.env.MAX_UPLOAD_SIZE_MB;

  if (!envValue) {
    return null;
  }

  const parsedMb = Number(envValue);

  if (Number.isNaN(parsedMb) || parsedMb <= 0) {
    return null;
  }

  // Safe bounds: minimum 1 MB, maximum 50 MB
  const boundedMb = Math.min(Math.max(parsedMb, 1), 50);

  return Math.floor(boundedMb * 1024 * 1024);
}

export function getServiceUploadRule(serviceSlug: string): ServiceUploadRule {
  const rule = serviceUploadRules[serviceSlug] ?? defaultUploadRule;
  const overrideBytes = getMaxUploadSizeOverrideBytes();

  if (overrideBytes !== null) {
    return {
      ...rule,
      maxFileSizeBytes: Math.min(rule.maxFileSizeBytes, overrideBytes),
    };
  }

  return rule;
}
