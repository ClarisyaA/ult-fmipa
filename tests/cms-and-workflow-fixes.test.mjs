import { access, readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

async function fileExists(path) {
  try {
    await access(new URL(`../${path}`, import.meta.url));
    return true;
  } catch {
    return false;
  }
}

// --- Issue 1 (revised): no public/module-scoped cache on these endpoints ---

test("home activities public endpoint never caches and always reads fresh state", async () => {
  const content = await source("src/app/api/home/activities/route.ts");

  assert.match(content, /export const dynamic = "force-dynamic";/);
  assert.match(content, /export const revalidate = 0;/);
  assert.match(content, /"Cache-Control":\s*"no-store, max-age=0"/);
  assert.doesNotMatch(content, /max-age=60/);
  assert.doesNotMatch(content, /stale-while-revalidate/);
  assert.doesNotMatch(content, /let cachedPayload/);
  assert.doesNotMatch(content, /home-activities-cache/);
});

test("information public endpoint never caches and always reads fresh state", async () => {
  const content = await source("src/app/api/information/route.ts");

  assert.match(content, /export const dynamic = "force-dynamic";/);
  assert.match(content, /export const revalidate = 0;/);
  assert.match(content, /"Cache-Control":\s*"no-store, max-age=0"/);
  assert.doesNotMatch(content, /max-age=60/);
  assert.doesNotMatch(content, /stale-while-revalidate/);
  assert.doesNotMatch(content, /let cachedPayload/);
  assert.doesNotMatch(content, /information-cache/);
});

test("module-scoped cache utilities were removed, not just unwired", async () => {
  assert.equal(
    await fileExists("src/lib/home-activities-cache.ts"),
    false,
    "src/lib/home-activities-cache.ts should be deleted (no consumers left)"
  );
  assert.equal(
    await fileExists("src/lib/information-cache.ts"),
    false,
    "src/lib/information-cache.ts should be deleted (no consumers left)"
  );
});

test("no remaining references to the removed cache invalidation helpers anywhere in src/", async () => {
  const files = [
    "src/app/api/admin/home/activities/route.ts",
    "src/app/api/admin/home/activities/[id]/route.ts",
    "src/app/api/staff/home/activities/route.ts",
    "src/app/api/staff/home/activities/[id]/route.ts",
    "src/lib/information-posts.ts",
    "src/lib/information-post-images.ts",
  ];

  for (const file of files) {
    const content = await source(file);
    assert.doesNotMatch(
      content,
      /invalidateHomeActivitiesCache|invalidateInformationCache/,
      `${file} should no longer reference in-memory cache invalidation`
    );
  }
});

// --- Issue 1: neutral "belum tersedia" copy --------------------------------

test("no user-facing copy references local disk storage anymore", async () => {
  const files = [
    "src/app/(public)/informasi/[slug]/page.tsx",
    "src/components/home/home-landing-sections.tsx",
    "src/components/home-activities/home-activity-form.tsx",
    "src/components/home-activities/home-activity-image.tsx",
    "src/components/information/information-image-gallery.tsx",
    "src/components/information/information-post-form.tsx",
    "src/components/requests/request-attachments-list.tsx",
  ];

  for (const file of files) {
    const content = await source(file);
    assert.doesNotMatch(
      content,
      /storage lokal/i,
      `${file} should no longer mention local storage`
    );
  }
});

// --- Issue 2 (revised): /profil renders a fully CMS-driven, recursive ------
// --- organization structure tree instead of hardcoded box content ----------

test("/profil sources the structure section from the CMS tree endpoint, not hardcoded text", async () => {
  const content = await source("src/app/(public)/profil/page.tsx");
  assert.match(
    content,
    /const \[structure, setStructure\] = useState<ProfileStructureState>/,
    "structure state must be readable, not an empty destructure slot"
  );
  assert.match(content, /fetch\("\/api\/profile\/structure"/);
  assert.match(content, /<OrganizationStructureTree roots=\{structure\.tree\}/);
  assert.match(content, /structure\.settings\.title/);
  assert.match(content, /structure\.settings\.subtitle/);

  // No fixed static labels baked directly into the JSX as literal text.
  assert.doesNotMatch(content, />Tim Pembina<\/h3>/);
  assert.doesNotMatch(content, />Penanggung Jawab Harian<\/h3>/);
  assert.doesNotMatch(content, />Koordinator Pelaksana<\/h3>/);
  assert.doesNotMatch(content, />Staf Pelaksana<\/h3>/);
  assert.doesNotMatch(content, /"Urusan Akademik",\s*\n\s*"Urusan Kemahasiswaan"/);
});

test("organization structure tree renderer is generic/recursive, not hardcoded to 5 leaves or 2 columns", async () => {
  const content = await source(
    "src/components/profile/organization-structure-tree.tsx"
  );
  assert.match(content, /export function OrganizationStructureTree/);
  assert.match(content, /node\.children/);
  assert.doesNotMatch(content, /grid-cols-5/);
  assert.doesNotMatch(content, /grid-cols-2/);
});

test("profile structure CMS models a true parent-child node hierarchy with settings and items", async () => {
  const content = await source("src/lib/profile-structure-cms.ts");
  assert.match(content, /export async function getPublicProfileStructure/);
  assert.match(content, /export async function getAdminProfileStructureState/);
  assert.match(content, /export async function updateProfileStructureSettings/);
  assert.match(content, /export async function createProfileStructureNode/);
  assert.match(content, /export async function updateProfileStructureNode/);
  assert.match(content, /export async function deleteProfileStructureNode/);
  assert.match(content, /export async function createProfileStructureItem/);
  assert.match(content, /ult_profile_structure_settings/);
  assert.match(content, /ult_profile_structure_nodes/);
  assert.match(content, /ult_profile_structure_node_items/);
  assert.match(content, /PARENT_ID/);
});

test("profile structure CMS rejects self-parenting and circular hierarchy", async () => {
  const content = await source("src/lib/profile-structure-cms.ts");
  assert.match(content, /Node tidak bisa menjadi atasan dirinya sendiri/);
  assert.match(content, /circular hierarchy/i);
  assert.match(content, /ProfileStructureConflictError/);
});

test("profile structure CMS distinguishes missing tables from validation errors", async () => {
  const content = await source("src/lib/profile-structure-cms.ts");
  assert.match(content, /class ProfileStructureTableUnavailableError/);
  assert.match(content, /class ProfileStructureValidationError/);
  assert.match(content, /statusCode = 503/);
  assert.match(content, /statusCode = 400/);
});

test("deleting a node with children requires cascade confirmation, not a silent cascade", async () => {
  const content = await source("src/lib/profile-structure-cms.ts");
  assert.match(content, /options\?\.cascade/);
  assert.match(
    content,
    /masih memiliki .* node turunan/,
    "delete must explain that children block deletion unless cascade is requested"
  );
});

test("public structure API only returns active nodes/items and does not cache", async () => {
  const content = await source("src/app/api/profile/structure/route.ts");
  assert.match(content, /getPublicProfileStructure/);
  assert.match(content, /no-store/);
});

test("admin/staff structure routes require role auth via shared handlers", async () => {
  const adminRoute = await source("src/app/api/admin/profile/structure/route.ts");
  const staffRoute = await source("src/app/api/staff/profile/structure/route.ts");
  assert.match(adminRoute, /handleProfileStructureStateGet\("admin"\)/);
  assert.match(staffRoute, /handleProfileStructureStateGet\("staff"\)/);

  const handlers = await source("src/lib/profile-structure-cms-route-handlers.ts");
  assert.match(handlers, /requireRole/);
  assert.match(handlers, /Unauthorized/);
  assert.match(handlers, /Forbidden/);
});

test("admin structure manager exposes settings, node hierarchy, and item management", async () => {
  const content = await source(
    "src/components/profile/profile-structure-manager.tsx"
  );
  assert.match(content, /Pengaturan Section/);
  assert.match(content, /Judul Section/);
  assert.match(content, /Subjudul Section/);
  assert.match(content, /Tambah Node/);
  assert.match(content, /Tambah Child/);
  assert.match(content, /Kelola Isian/);
  assert.match(content, /item\.id/, "items must use a stable id, not array index, as their key");
});

test("legacy person-photo organization node CMS is left intact for backward compatibility", async () => {
  const content = await source("src/lib/profile-cms.ts");
  assert.match(content, /ult_profile_organization_nodes/);
  assert.match(content, /export async function getPublicProfileOrganizationTree/);
});

// --- Issue 3: SIK multi-request support ------------------------------------

test("ajukan page uses the finished-request-excluding SIK lookup", async () => {
  const content = await source(
    "src/app/(public)/layanan/[slug]/ajukan/page.tsx"
  );
  assert.match(content, /getLatestUnfinishedSikRequestForStudentOrNull/);
  assert.doesNotMatch(
    content,
    /getLatestSikRequestForStudentOrNull/,
    "ajukan page must not resume a finished SIK request"
  );
});

test("sik-requests exposes a finished-request-excluding lookup alongside the unfiltered one", async () => {
  const content = await source("src/lib/sik-requests.ts");
  assert.match(content, /export async function getLatestSikRequestForStudent\(/);
  assert.match(
    content,
    /export async function getLatestUnfinishedSikRequestForStudent\(/
  );
  assert.match(content, /FINAL_SUBMITTED_TGL:\s*null/);
});

// --- Issue 4: Ajukan Layanan Lain button ------------------------------------

test("service success states offer an Ajukan Layanan Lain link to /layanan", async () => {
  const genericForm = await source(
    "src/components/services/service-request-form.tsx"
  );
  assert.match(genericForm, /href="\/layanan">Ajukan Layanan Lain/);

  const sikWorkflow = await source(
    "src/components/services/sik-request-workflow.tsx"
  );
  assert.match(sikWorkflow, /href="\/layanan">Ajukan Layanan Lain/);
});

// --- Issue 5: Unggah Karya Ilmiah placeholder removed -----------------------

test("Unggah Karya Ilmiah placeholder copy is gone", async () => {
  const content = await source(
    "src/components/services/service-request-form.tsx"
  );
  assert.doesNotMatch(
    content,
    /akan ditambahkan pada tahap berikutnya/
  );
  assert.doesNotMatch(content, /isUnggahKaryaIlmiah/);
});

// --- Issue 6: hero hotspot swap --------------------------------------------

test("stetoskop and MIPA Corner hotspots swapped stage positions but kept their own identity", async () => {
  const content = await source("src/components/home/home-hero.tsx");

  const mipaMatch = content.match(
    /id: "mipa-corner",[\s\S]*?style: (\{[^}]*\})/
  );
  const stetoskopMatch = content.match(
    /id: "lab-catalog",[\s\S]*?style: (\{[^}]*\})/
  );

  assert.ok(mipaMatch, "mipa-corner hotspot entry not found");
  assert.ok(stetoskopMatch, "lab-catalog (stetoskop) hotspot entry not found");

  assert.match(mipaMatch[1], /left: 784/);
  assert.match(stetoskopMatch[1], /left: 1265/);

  // Content identity stays bound to the object it actually describes.
  assert.match(content, /title: "Mampir ke Mipa Corner"/);
  assert.match(content, /title: "Jelajahi Laboratorium FMIPA"/);
});

// --- Issue 7: no extra confirmation on status actions -----------------------

test("status action buttons no longer show a second confirmation prompt", async () => {
  const content = await source(
    "src/components/requests/inline-status-action.tsx"
  );
  assert.doesNotMatch(content, /confirmToast/);
  assert.doesNotMatch(content, /Perbarui status permohonan\?/);
});

test("destructive request-delete confirmation is untouched", async () => {
  const content = await source(
    "src/components/requests/request-delete-button.tsx"
  );
  assert.match(content, /confirmToast/);
  assert.match(content, /variant: "destructive"/);
});

// --- Issue 8: ijazah/transkrip verification workflow ------------------------

test("ijazah and transkrip use the verification workflow, not unsupported", async () => {
  const content = await source("src/lib/legacy-request-status.ts");

  const ijazahBlock = content.match(/ijazah:\s*\{([^}]*)\}/);
  const transkripBlock = content.match(/transkrip:\s*\{([^}]*)\}/);

  assert.ok(ijazahBlock, "ijazah metadata entry not found");
  assert.ok(transkripBlock, "transkrip metadata entry not found");
  assert.match(ijazahBlock[1], /workflow:\s*"verification"/);
  assert.match(transkripBlock[1], /workflow:\s*"verification"/);
  assert.match(content, /async function updateVerificationWorkflow/);
  assert.match(content, /VERIFIKASI_TGL/);
  assert.match(content, /UNIVERSITAS_TGL/);
  assert.match(content, /DIAMBIL_TGL/);
});

test("admin request list no longer hardcodes ijazah/transkrip as unsupported", async () => {
  const content = await source("src/app/admin/requests/page.tsx");
  assert.doesNotMatch(content, /unsupportedInlineStatusTables/);
});

// --- Issue 9: survey gate ----------------------------------------------------

test("request-creation API rejects new requests while a survey is pending", async () => {
  const content = await source(
    "src/app/api/services/[slug]/requests/route.ts"
  );
  assert.match(content, /getCompletedUnsurveyedRequestsForStudent/);
  assert.match(content, /status:\s*409\s*\}/);
  assert.match(content, /PENDING_SURVEY_REQUIRED/);
});

test("survey gate dialog cannot be dismissed without completing the survey", async () => {
  const content = await source("src/components/student/survey-gate.tsx");
  assert.match(content, /showCloseButton=\{false\}/);
  assert.match(content, /onEscapeKeyDown=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(content, /onPointerDownOutside=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(content, /onInteractOutside=\{\(event\) => event\.preventDefault\(\)\}/);
  assert.match(content, /href="\/survei"/);
  assert.match(content, /signOut\(/);
});

test("survey gate is mounted globally in the root layout", async () => {
  const content = await source("src/app/layout.tsx");
  assert.match(content, /<SurveyGate/);
});
