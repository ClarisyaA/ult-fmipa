export type RequestAttachment = {
  id: string;
  serviceSlug: string;
  sourceTable: string;
  requestId: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string | null;
  uploadedAt: string;
};

export type SavedUploadMetadata = {
  originalName: string;
  storedName: string;
  mimeType: string;
  sizeBytes: number;
  storagePath: string;
};
