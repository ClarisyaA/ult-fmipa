import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

// --- Multiple images data model ---------------------------------------------

test("home activity images have their own child table with alt/fit/cover/sort per image", async () => {
  const migration = await source("database/migrations/011_create_home_activity_images.sql");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS `ult_home_activity_images`/);
  assert.match(migration, /`ACTIVITY_ID` BIGINT NOT NULL/);
  assert.match(migration, /`IMAGE_ALT` VARCHAR/);
  assert.match(migration, /`IMAGE_FIT` VARCHAR\(20\) NOT NULL DEFAULT 'cover'/);
  assert.match(migration, /`IS_COVER` TINYINT\(1\) NOT NULL DEFAULT 0/);
  assert.match(migration, /`SORT_ORDER` INT NOT NULL DEFAULT 0/);
  assert.doesNotMatch(migration, /DROP (TABLE|COLUMN)/i);
  assert.doesNotMatch(migration, /TRUNCATE/i);
});

test("migration indexes ACTIVITY_ID, IS_COVER, and SORT_ORDER", async () => {
  const migration = await source("database/migrations/011_create_home_activity_images.sql");
  assert.match(migration, /idx_ult_home_activity_images_activity.*\(`ACTIVITY_ID`\)/);
  assert.match(migration, /idx_ult_home_activity_images_cover.*\(`ACTIVITY_ID`, `IS_COVER`\)/);
  assert.match(migration, /idx_ult_home_activity_images_sort.*\(`ACTIVITY_ID`, `SORT_ORDER`\)/);
});

test("legacy single-image columns on ult_home_activities are preserved, not dropped", async () => {
  const parentMigration = await source("database/migrations/003_create_homepage_cms.sql");
  assert.match(parentMigration, /`IMAGE_PATH` VARCHAR/);
  assert.match(parentMigration, /`IMAGE_ALT` VARCHAR/);
  assert.match(parentMigration, /`IMAGE_FIT` VARCHAR/);
});

test("backfill migrates each legacy parent image into exactly one cover child row, idempotently", async () => {
  const migration = await source("database/migrations/011_create_home_activity_images.sql");
  assert.match(migration, /WHERE a\.`IMAGE_PATH` IS NOT NULL/);
  assert.match(migration, /NOT EXISTS[\s\S]*?WHERE c\.`ACTIVITY_ID` = a\.`ID`/);
  assert.match(migration, /1,\s*\n\s*0,\s*\n\s*'migration-backfill'/);
});

// --- Service layer behavior --------------------------------------------------

test("home-activity-images service exposes full multi-image CRUD + cover management", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(content, /export async function getHomeActivityImages/);
  assert.match(content, /export async function addHomeActivityImages/);
  assert.match(content, /export async function updateHomeActivityImageMetadata/);
  assert.match(content, /export async function replaceHomeActivityImage/);
  assert.match(content, /export async function deleteHomeActivityImage\(/);
  assert.match(content, /export async function deleteHomeActivityImagesForActivity/);
  assert.match(content, /export async function setHomeActivityImageCover/);
  assert.match(content, /export const MAX_HOME_ACTIVITY_IMAGES = 10/);
});

test("first image becomes cover automatically only when the activity had none yet", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(
    content,
    /shouldAutoCoverFirst = existingCount === 0 && requestedCoverInBatchIndex === -1/
  );
});

test("adding images beyond the max per activity is rejected", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(content, /existingCount \+ items\.length > MAX_HOME_ACTIVITY_IMAGES/);
  assert.match(content, /class HomeActivityImageError extends Error/);
});

test("invalid image fit values are rejected, only cover/contain accepted", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(content, /normalized === "cover" \|\| normalized === "contain"/);
  assert.match(content, /Tampilan gambar tidak valid/);
});

test("setting a cover unsets every other image for that activity first", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(
    content,
    /UPDATE ult_home_activity_images SET IS_COVER = 0 WHERE ACTIVITY_ID = \$\{BigInt\(activityId\)\}/
  );
});

test("deleting the cover image auto-promotes the next image by sort order", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(
    content,
    /if \(remaining\.length > 0 && !remaining\.some\(\(image\) => image\.isCover\)\)/
  );
  assert.match(content, /setHomeActivityImageCover\(activityId, remaining\[0\]\.id\)/);
});

test("replacing an image uploads first and only deletes the old object after DB update succeeds", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  const replaceFn = content.slice(content.indexOf("export async function replaceHomeActivityImage"));
  assert.match(replaceFn, /const savedImage = await saveHomeActivityImage\(file\)/);
  assert.match(replaceFn, /let databaseUpdated = false/);
  assert.match(replaceFn, /databaseUpdated = true/);
  assert.match(replaceFn, /await deleteHomeActivityImageFile\(existing\.IMAGE_PATH\)/);
});

test("if the DB update fails during replace, the newly uploaded object is cleaned up (not the old one)", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  const replaceFn = content.slice(
    content.indexOf("export async function replaceHomeActivityImage"),
    content.indexOf("export async function deleteHomeActivityImage(")
  );
  assert.match(replaceFn, /if \(!databaseUpdated\) \{\s*\n\s*await deleteHomeActivityImageFile\(savedImage\.storagePath\);/);
});

test("deleting an activity cleans up every child image row and its MinIO object", async () => {
  const content = await source("src/lib/home-activities.ts");
  assert.match(content, /await deleteHomeActivityImagesForActivity\(id\)/);
  assert.match(
    content,
    /Clean up child image rows \+ their MinIO objects first/
  );
});

test("deleteHomeActivityImagesForActivity removes every row for the activity and attempts MinIO cleanup for each", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  const fn = content.slice(content.indexOf("export async function deleteHomeActivityImagesForActivity"));
  assert.match(fn, /DELETE FROM ult_home_activity_images WHERE ACTIVITY_ID = \$\{BigInt\(activityId\)\}/);
  assert.match(fn, /for \(const record of records\) \{/);
  assert.match(fn, /deleteHomeActivityImageFile\(record\.IMAGE_PATH\)/);
});

test("legacy activities with no child images still surface one synthetic cover image", async () => {
  const content = await source("src/lib/home-activities.ts");
  assert.match(content, /function toLegacySyntheticImage/);
  assert.match(content, /isCover: true/);
});

test("public activity images are ordered cover-first, then sort order, then id", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(
    content,
    /ORDER BY IS_COVER DESC, SORT_ORDER ASC, ID ASC/
  );
});

test("database unavailable and missing-table are handled distinctly from validation errors", async () => {
  const content = await source("src/lib/home-activity-images.ts");
  assert.match(content, /class HomeActivityImageTableUnavailableError extends Error/);
  assert.match(content, /statusCode = 503/);
  assert.match(content, /class HomeActivityImageError extends Error/);
  assert.match(content, /statusCode = 400/);
});

// --- API ---------------------------------------------------------------------

test("public home activities endpoint stays force-dynamic, revalidate 0, no-store", async () => {
  const content = await source("src/app/api/home/activities/route.ts");
  assert.match(content, /export const dynamic = "force-dynamic";/);
  assert.match(content, /export const revalidate = 0;/);
  assert.match(content, /"Cache-Control":\s*"no-store, max-age=0"/);
});

test("public activity response includes images array and legacy compat fields pointing at the cover", async () => {
  const content = await source("src/lib/home-activities.ts");
  assert.match(content, /coverImage: PublicHomeActivityImage \| null/);
  assert.match(content, /images: PublicHomeActivityImage\[\]/);
  assert.match(content, /image: cover\?\.url \?\? null/);
  assert.match(content, /imageAlt: cover\?\.altText \?\? activity\.imageAlt \?\? activity\.title/);
});

test("admin/staff image routes require role auth and reject unauthorized/forbidden access", async () => {
  const content = await source("src/lib/home-activity-images-route-handlers.ts");
  assert.match(content, /Unauthorized/);
  assert.match(content, /Forbidden/);
  assert.match(content, /rolePrefix === "admin" \? user\.role === "ADMIN" : \["ADMIN", "STAFF"\]\.includes\(user\.role\)/);
});

test("admin/staff image create route enforces the max image count server-side", async () => {
  const content = await source("src/lib/home-activity-images-route-handlers.ts");
  assert.match(content, /files\.length > MAX_HOME_ACTIVITY_IMAGES/);
});

test("image ownership is verified before update/delete/cover routes act on it", async () => {
  const content = await source("src/lib/home-activity-images-route-handlers.ts");
  assert.match(content, /async function assertImageBelongsToActivity/);
  assert.match(content, /assertImageBelongsToActivity\(activityId, imageId\)/);
});

test("public per-image route never leaks direct MinIO URLs, only proxies through the app", async () => {
  const content = await source("src/app/api/home/activities/image/[imageId]/route.ts");
  assert.match(content, /getObjectStream\(objectKey\)/);
  assert.match(content, /resolveObjectKey\("homeActivities"/);
  assert.doesNotMatch(content, /minio:9000|localhost:9000|X-Amz-/);
});

// --- Admin/staff form -------------------------------------------------------

test("activity form supports selecting/dropping multiple files with a max-count guard", async () => {
  const content = await source("src/components/home-activities/home-activity-form.tsx");
  assert.match(content, /const MAX_IMAGES = 10/);
  assert.match(content, /type="file"\s*\n\s*multiple/);
  assert.match(content, /Maksimal \$\{MAX_IMAGES\} gambar per kegiatan/);
});

test("activity form uses stable temp ids for pending images, not array index", async () => {
  const content = await source("src/components/home-activities/home-activity-form.tsx");
  assert.match(content, /crypto\.randomUUID\(\)/);
  assert.match(content, /tempId: string/);
  assert.doesNotMatch(content, /key=\{index\}/);
});

test("each pending image has its own alt, fit, and cover selection", async () => {
  const content = await source("src/components/home-activities/home-activity-form.tsx");
  assert.match(content, /updatePendingImage\(image\.tempId, \{ altText/);
  assert.match(content, /name="pending-cover"/);
  assert.match(content, /setPendingCover/);
});

test("existing image gallery supports alt/fit edit, cover, replace, and delete", async () => {
  const content = await source("src/components/home-activities/home-activity-form.tsx");
  assert.match(content, /saveExistingMetadata/);
  assert.match(content, /setExistingCover/);
  assert.match(content, /replaceExistingImage/);
  assert.match(content, /deleteExistingImage/);
  assert.match(content, /confirmToast/);
});

// --- Public carousel ----------------------------------------------------------

test("single image renders without carousel navigation controls", async () => {
  const content = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.match(content, /hasMultipleImages = images\.length > 1/);
  assert.match(content, /\{hasMultipleImages \? \(/);
});

test("carousel buttons use semantic aria-labels for prev/next/goto", async () => {
  const content = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.match(content, /aria-label="Gambar sebelumnya"/);
  assert.match(content, /aria-label="Gambar berikutnya"/);
  assert.match(content, /aria-label=\{`Tampilkan gambar ke-\$\{index \+ 1\}`\}/);
});

test("carousel supports keyboard arrow navigation and touch swipe", async () => {
  const content = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.match(content, /ArrowLeft/);
  assert.match(content, /ArrowRight/);
  assert.match(content, /onTouchStart/);
  assert.match(content, /onTouchEnd/);
  assert.match(content, /SWIPE_THRESHOLD_PX/);
});

test("carousel applies per-slide image fit (cover vs contain)", async () => {
  const content = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.match(content, /image\.imageFit === "contain" \? "object-contain p-4" : "object-cover"/);
});

test("carousel does not autoplay", async () => {
  const content = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.doesNotMatch(content, /setInterval/);
});

test("nested image carousel stops propagation so it never triggers the outer activity carousel", async () => {
  const content = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.match(content, /event\.stopPropagation\(\)/);
});

test("outer activity carousel's mobile nav buttons are hidden on desktop while the inner image carousel's are hidden on mobile, avoiding overlap", async () => {
  const carousel = await source("src/components/home-activities/home-activity-image-carousel.tsx");
  assert.match(carousel, /hidden size-9[\s\S]*sm:flex/);

  const landing = await source("src/components/home/home-landing-sections.tsx");
  assert.match(landing, /HomeActivityImageCarousel/);
});

test("public homepage renders the per-activity image carousel when images are present", async () => {
  const content = await source("src/components/home/home-landing-sections.tsx");
  assert.match(content, /act\.images\.length > 0 \? \(/);
  assert.match(content, /<HomeActivityImageCarousel/);
});
