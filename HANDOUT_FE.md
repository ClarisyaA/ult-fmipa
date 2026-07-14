# Handout Frontend Developer - ULT FMIPA Unpad

For setup, database, migration, and troubleshooting, read `README.md`. This file
focuses on FE fetching and UI integration: route mapping, role-based UI, API
payloads, upload handling, response handling, and empty/error states.

## Base URL

Local base URL:

```text
http://localhost:3000
```

For client-side fetch inside this Next.js app, use relative URLs:

```ts
fetch("/api/services");
```

## Authentication Notes

- App uses NextAuth session.
- FE usually does not need to manually send token.
- Browser cookies/session are sent automatically for same-origin requests.
- For mutations, use `credentials: "same-origin"` if needed.
- PAUS OAuth is paused. Use development login for now.

## Role Summary for FE

| Role | Navbar shortcut | Allowed pages | Forbidden pages | FE behavior |
| --- | --- | --- | --- | --- |
| Guest | `Masuk` | Public pages | Student/admin/staff pages | Show login CTA |
| Student/Mahasiswa | `Riwayat Saya` | `/layanan/[slug]/ajukan`, `/mahasiswa/riwayat`, `/survei` | Admin/staff pages | Do not send NPM manually |
| Staff | `Dashboard Staff` | Staff dashboard, requests, informasi, surveys | Admin-only delete request | No service request delete button |
| Admin | `Dashboard Admin` | Admin dashboard, requests, informasi, surveys | Student-only pages | Can delete service requests |

## Frontend Route Map

### Public

| Route | Usage |
| --- | --- |
| `/` | Beranda |
| `/layanan` | Katalog layanan |
| `/layanan/[slug]` | Detail layanan |
| `/layanan/[slug]/ajukan` | Form pengajuan, student-only |
| `/informasi` | Daftar informasi publik |
| `/informasi/[slug]` | Detail informasi publik |
| `/survei` | Halaman survei |
| `/login` | Login development credentials / PAUS placeholder |

### Student

| Route | Usage |
| --- | --- |
| `/mahasiswa/riwayat` | Riwayat request milik session |
| `/mahasiswa/riwayat/[serviceSlug]/[id]` | Detail request milik session |
| `/survei` | Daftar request eligible survey |

### Staff

| Route | Usage |
| --- | --- |
| `/staff/dashboard` | Dashboard staff |
| `/staff/requests` | List request dan action status |
| `/staff/requests/[serviceSlug]/[id]` | Detail request |
| `/staff/informasi` | List informasi |
| `/staff/informasi/tambah` | Tambah informasi |
| `/staff/informasi/[id]/edit` | Edit informasi |
| `/staff/surveys` | Summary survei |

### Admin

| Route | Usage |
| --- | --- |
| `/admin/dashboard` | Dashboard admin |
| `/admin/requests` | List request, action status, delete |
| `/admin/requests/[serviceSlug]/[id]` | Detail request dan delete |
| `/admin/informasi` | List informasi |
| `/admin/informasi/tambah` | Tambah informasi |
| `/admin/informasi/[id]/edit` | Edit informasi |
| `/admin/surveys` | Summary survei |

## General Fetch Helper

```ts
export async function apiFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(options.headers ?? {}),
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Terjadi kesalahan.");
  }

  return data as T;
}
```

Notes:

- Do not set `Content-Type` manually for `FormData`.
- Use JSON for normal requests.
- Use `FormData` for file uploads.

## API Response Pattern

Success examples vary by endpoint:

```json
{ "data": {}, "message": "Berhasil." }
```

```json
{
  "data": {
    "requestId": "123",
    "attachmentCount": 2
  },
  "message": "Pengajuan layanan berhasil dikirim."
}
```

Common error:

```json
{ "error": "Pesan error" }
```

Always show a friendly error message and keep form values when possible.

## Auth and Utility APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET/POST` | `/api/auth/[...nextauth]` | NextAuth session/login/callback |
| `GET` | `/api/health` | Health check database/API |

FE usually uses NextAuth helpers/components instead of calling auth routes
manually.

## Services API

### `GET /api/services`

Access: Public. Purpose: get service catalog.

```ts
type ServicesResponse = { data: ServiceItem[] };

const result = await apiFetch<ServicesResponse>("/api/services");
```

### `GET /api/services/[slug]`

Access: Public. Purpose: get one service detail.

```ts
const result = await apiFetch<{ data: ServiceItem }>(
  `/api/services/${serviceSlug}`
);
```

### `POST /api/services/[slug]/requests`

Access: Student. Purpose: create service request. Uses `multipart/form-data`.
NPM comes from session. Attachments are optional.

```ts
const formData = new FormData();
formData.append("description", "Keperluan administrasi");
selectedFiles.forEach((file) => formData.append("attachments", file));

const result = await apiFetch<{
  data: {
    requestId: string;
    attachmentCount: number;
  };
  message: string;
}>(`/api/services/${serviceSlug}/requests`, {
  method: "POST",
  body: formData,
});
```

Common service request fields:

```text
description
email
phone
scholarshipName
semester
tahunAkademik
namaOrangTua
nipNrp
pangkatGolongan
instansi
pengantar
ditujukan
dasarSuratNo
dasarSuratPerihal
dasarSuratTgl
tempatLahir
tanggalLahir
tanggalLulus
tglLulus
ipk
yudisium
jumlahTranskrip
jumlahIjazah
jumlahTranslet
```

Only send fields relevant to the selected service.

## Attachment Rules

- FormData key: `attachments`
- Max 3 files.
- Max 5 MB per file.
- Allowed: PDF, JPG/JPEG, PNG.
- Reject invalid files client-side before submit.
- Still expect backend validation and show backend error.

Recommended selected-file pattern:

- Store selected files in React state.
- Allow user to remove one selected file.
- Reset native file input after selection.
- Append all files from state on submit.

```ts
const [files, setFiles] = useState<File[]>([]);

function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
  const selected = Array.from(event.currentTarget.files ?? []);
  event.currentTarget.value = "";

  // validate selected files here
  setFiles((current) => [...current, ...selected].slice(0, 3));
}
```

Attachment download/view endpoint:

```text
GET /api/attachments/[id]
```

Access:

- Admin/staff can open operational attachments.
- Student can open only own request attachments.
- Never use local storage path in FE.

## Student Request APIs

### `GET /api/student/requests`

Access: Student. Purpose: list own requests.

```ts
const result = await apiFetch<PaginatedResponse<RequestListItem>>(
  "/api/student/requests"
);
```

### `GET /api/student/requests/[serviceSlug]/[id]`

Access: Student. Purpose: own request detail.

```ts
const result = await apiFetch<{ data: unknown }>(
  `/api/student/requests/${serviceSlug}/${id}`
);
```

FE notes:

- Do not send NPM manually.
- Show empty state when no request exists.
- If response is 403/404, show a generic "pengajuan tidak ditemukan" message.

## Admin Request APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/summary` | Dashboard summary |
| `GET` | `/api/admin/requests` | Request list |
| `GET` | `/api/admin/requests/[serviceSlug]/[id]` | Request detail |
| `PATCH` | `/api/admin/requests/[serviceSlug]/[id]/status` | Update status |
| `DELETE` | `/api/admin/requests/[serviceSlug]/[id]` | Delete request |

Request list supports query params:

```text
service=<serviceSlug>
status=pending | inProgress | completed | delivered
page=1
limit=10
```

Status payload:

```json
{ "action": "process", "staffName": "Admin ULT" }
```

`staffName` is required by the current API.

```ts
await apiFetch(`/api/admin/requests/${serviceSlug}/${id}/status`, {
  method: "PATCH",
  body: JSON.stringify({
    action: "process",
    staffName: "Admin ULT",
  }),
});
```

Actions:

- `process` = Proses
- `complete` = Selesai
- `deliver` = Diambil/Dikirim

Admin table buttons:

```text
Proses | Selesai | Diambil/Dikirim | Detail | Hapus
```

Delete example:

```ts
await apiFetch(`/api/admin/requests/${serviceSlug}/${id}`, {
  method: "DELETE",
});
```

Always show confirmation before delete.

## Staff Request APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/staff/summary` | Dashboard summary |
| `GET` | `/api/staff/requests` | Request list |
| `GET` | `/api/staff/requests/[serviceSlug]/[id]` | Request detail |
| `PATCH` | `/api/staff/requests/[serviceSlug]/[id]/status` | Update status |
| `DELETE` | `/api/staff/requests/[serviceSlug]/[id]` | Always 403; do not call from FE |

Staff table buttons:

```text
Proses | Selesai | Diambil/Dikirim | Detail
```

Staff cannot delete service requests. The DELETE route exists only to return a
clear 403 response.

Request list response is also `{ data, pagination }` and supports the same
query params as admin.

## Status UI Mapping

| API status | UI label | Enabled action |
| --- | --- | --- |
| `pending` | Menunggu | Proses |
| `inProgress` | Diproses | Selesai |
| `completed` | Selesai | Diambil/Dikirim |
| `delivered` | Diambil/Dikirim | none |

Do not show raw status text to users. Use Indonesian labels.

Disabled action tooltip examples:

- Proses after processed: `Sudah diproses`
- Selesai before process: `Proses dulu`
- Diambil/Dikirim before complete: `Selesaikan dulu`

## Survey APIs

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/student/surveys/requests` | Student survey page data |
| `GET` | `/api/student/surveys/pending` | Optional helper for latest pending survey |
| `POST` | `/api/student/surveys` | Submit/update student survey |
| `GET` | `/api/student/requests/[serviceSlug]/[id]/survey` | Survey data for request detail |
| `POST` | `/api/student/requests/[serviceSlug]/[id]/survey` | Submit/update survey from request detail |
| `GET` | `/api/admin/surveys/summary` | Admin summary |
| `GET` | `/api/staff/surveys/summary` | Staff summary |

Survey payload:

```json
{
  "serviceSlug": "kartu-prestasi-akademik",
  "requestId": "123",
  "overallRating": 5,
  "ratingTangibility": 5,
  "ratingReliability": 5,
  "ratingResponsiveness": 4,
  "ratingAssurance": 5,
  "ratingEmpathy": 5,
  "comment": "Pelayanan cepat."
}
```

Rules:

- `overallRating` required.
- Ratings must be 1-5.
- `comment` max 500 chars.
- Student can submit only for own completed/delivered request.

```ts
await apiFetch("/api/student/surveys", {
  method: "POST",
  body: JSON.stringify(payload),
});
```

`GET /api/student/surveys/requests` returns:

```ts
{
  data: {
    pending: StudentSurveyRequest[];
    submitted: StudentSurveyRequest[];
    tableAvailable: boolean;
  }
}
```

Use `/api/student/surveys/requests` for the main `/survei` page. The
`/api/student/surveys/pending` endpoint exists as a lightweight helper if a UI
needs one latest pending request.

## Information Public Pages and APIs

Public pages:

- `/informasi`
- `/informasi/[slug]`

Public visible rule:

- `published`
- active
- not archived
- within display schedule range

Public image route:

```text
GET /api/information/images/[imageId]
```

Never use storage path directly.

## Admin/Staff Information APIs

Admin:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/admin/information` | List information |
| `POST` | `/api/admin/information` | Create |
| `GET` | `/api/admin/information/[id]` | Detail |
| `PATCH` | `/api/admin/information/[id]` | Update |
| `DELETE` | `/api/admin/information/[id]` | Delete |

Staff:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/staff/information` | List information |
| `POST` | `/api/staff/information` | Create |
| `GET` | `/api/staff/information/[id]` | Detail |
| `PATCH` | `/api/staff/information/[id]` | Update |
| `DELETE` | `/api/staff/information/[id]` | Delete |

Notes:

- Staff can delete information posts.
- Slug is auto-generated from title.
- Do not show editable slug field in FE.
- Title must be unique.

## Information FormData Fields

```text
title
category
summary
content
status          // draft | published | archived
featured        // true | false
isActive        // true | false
displayStartAt  // optional datetime-local
displayEndAt    // optional datetime-local
images          // File[], optional
imageFits       // "cover" | "contain"[], optional, aligned with images
```

Rules:

- Max 5 images.
- Max 2 MB per image.
- Allowed: WebP, PNG, JPG/JPEG, SVG.
- SVG support applies to CMS image uploads only. Official document attachments may still reject SVG.
- SVG files are rejected if they contain unsafe content such as scripts, event handlers, `javascript:`, `foreignObject`, or remote references.
- `imageFit` defaults to `cover`. Use `cover` / **Penuhi Card** for normal photos and `contain` / **Tampilkan Utuh** for logos, posters, or graphics that must not be cropped.
- `displayEndAt` must be after `displayStartAt`.

Example:

```ts
const formData = new FormData();
formData.append("title", title);
formData.append("category", category);
formData.append("summary", summary);
formData.append("content", content);
formData.append("status", status);
formData.append("featured", String(featured));
formData.append("isActive", String(isActive));
formData.append("displayStartAt", displayStartAt);
formData.append("displayEndAt", displayEndAt);

images.forEach((image, index) => {
  formData.append("images", image);
  formData.append("imageFits", imageFits[index] ?? "cover");
});

await apiFetch("/api/admin/information", {
  method: "POST",
  body: formData,
});
```

## Information Image APIs

| Method | Endpoint | Role |
| --- | --- | --- |
| `GET` | `/api/information/images/[imageId]` | Public if visible, admin/staff for draft |
| `POST` | `/api/admin/information/[id]/images` | Admin |
| `PATCH` | `/api/admin/information/[id]/images/[imageId]` | Admin |
| `DELETE` | `/api/admin/information/[id]/images/[imageId]` | Admin |
| `POST` | `/api/admin/information/[id]/images/[imageId]/cover` | Admin |
| `POST` | `/api/staff/information/[id]/images` | Staff |
| `PATCH` | `/api/staff/information/[id]/images/[imageId]` | Staff |
| `DELETE` | `/api/staff/information/[id]/images/[imageId]` | Staff |
| `POST` | `/api/staff/information/[id]/images/[imageId]/cover` | Staff |

Image metadata supports `imageFit: "cover" | "contain"`. PATCH image metadata accepts:

```json
{
  "altText": "Deskripsi gambar",
  "imageFit": "contain"
}
```

Render image:

```tsx
<img src={`/api/information/images/${image.id}`} alt={image.altText ?? ""} />
```

## Frontend UI Requirements

### Service form

- Validate required fields.
- Validate files before submit.
- Show selected file list.
- Show success state.
- Link to `/mahasiswa/riwayat` after success.

### Request table

- Show status badge.
- Show action buttons.
- Disable invalid action buttons.
- Confirmation before status mutation/delete.
- Keep `Detail` always enabled.

### Information form

- No slug input.
- Show generated public link preview if useful.
- Show image preview.
- Allow remove selected image.
- Include active/featured/status/schedule fields.
- Confirmation before delete.

### Survey

- Empty state if no completed request.
- Submitted state after survey is sent.
- Allow update existing survey when supported.

## Permission Notes

- Guest cannot call protected APIs.
- Student cannot call admin/staff APIs.
- Student cannot send NPM manually for protected student APIs.
- Staff cannot delete service requests.
- Admin can delete service requests.
- Staff and admin can delete information posts.
- Do not display `sourceTable` to users.

## Common FE Mistakes

- Setting `Content-Type: application/json` when body is `FormData`.
- Reading only `files[0]` instead of all files.
- Sending NPM manually.
- Showing raw `serviceSlug` as label.
- Not handling empty list.
- Forgetting confirmation before delete.
- Showing hidden/draft/archived information publicly.

## Profile CMS

Halaman publik `/profil` mengambil data dinamis untuk **Struktur Organisasi** dan **Lokasi Kami**. Jika API/DB tidak tersedia, UI memakai fallback statis.

Public endpoints:

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/profile/organization` | Active organization tree |
| `GET` | `/api/profile/location` | Active location settings and hours |
| `GET` | `/api/profile/images/[type]/[id]` | `type`: `organization` or `location` |

Admin endpoints:

| Method | Endpoint | Notes |
| --- | --- | --- |
| `GET` | `/api/admin/profile/organization` | List all nodes |
| `POST` | `/api/admin/profile/organization` | Create node with optional image |
| `GET` | `/api/admin/profile/organization/[id]` | Node detail |
| `PATCH` | `/api/admin/profile/organization/[id]` | Update node |
| `DELETE` | `/api/admin/profile/organization/[id]` | Delete node, blocked if it has children |
| `GET` | `/api/admin/profile/location` | Location settings |
| `PATCH` | `/api/admin/profile/location` | Update location settings with optional image |
| `POST` | `/api/admin/profile/location/hours` | Add operating hour |
| `PATCH` | `/api/admin/profile/location/hours/[id]` | Update operating hour |
| `DELETE` | `/api/admin/profile/location/hours/[id]` | Delete operating hour |

Staff endpoints mirror admin under `/api/staff/profile/...`.

Organization payload fields:

```ts
{
  parentId?: string | "root";
  name: string;
  positionTitle: string;
  roleLabel?: string;
  photoAlt?: string;
  colorVariant?: "emerald" | "red" | "amber";
  isActive?: boolean;
  sortOrder?: number;
  image?: File; // multipart only
}
```

Location settings support `imageFit: "cover" | "contain"`. Use `contain` for maps, logos, SVG, or graphics that must stay fully visible.

## Minimal TypeScript Types

These are FE-facing helper types, not a full backend mirror.

```ts
export type Role = "admin" | "staff" | "student";

export type ServiceItem = {
  title: string;
  slug: string;
  category: string;
  description: string;
  requirements: string[];
  processingTime: string;
  sourceTable?: string; // internal, do not display to users
};

export type RequestStatus =
  | "pending"
  | "inProgress"
  | "completed"
  | "delivered";

export type RequestListItem = {
  id: string;
  serviceSlug: string;
  serviceTitle: string;
  sourceTable?: string; // internal, do not display to users
  maskedNpm: string;
  requestDate: string | null;
  status: RequestStatus;
  statusLabel: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type StudentSurveyRequest = {
  id: string;
  serviceSlug: string;
  sourceTable: string;
  serviceTitle: string;
  requestDate: string | null;
  status: "completed" | "delivered";
  statusLabel: string;
  hasSurvey: boolean;
};

export type SurveyPayload = {
  serviceSlug: string;
  requestId: string;
  overallRating: number;
  ratingTangibility?: number | null;
  ratingReliability?: number | null;
  ratingResponsiveness?: number | null;
  ratingAssurance?: number | null;
  ratingEmpathy?: number | null;
  comment?: string | null;
};

export type InformationStatus = "draft" | "published" | "archived";

export type InformationPostFormInput = {
  title: string;
  category?: string;
  summary?: string;
  content: string;
  status: InformationStatus;
  featured: boolean;
  isActive: boolean;
  displayStartAt?: string;
  displayEndAt?: string;
  images?: File[];
};
```
