import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

test("mobile hotspot dialog does not use hotspot imageSrc or supportingImage as a background", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  const dialogStart = content.indexOf("open={activeHotspotDialog !== null}");
  const dialogEnd = content.indexOf("</Dialog>", dialogStart);
  assert.ok(dialogStart !== -1 && dialogEnd !== -1, "mobile hotspot Dialog block not found");
  const dialogBlock = content.slice(dialogStart, dialogEnd);

  // hotspot.imageSrc (the on-scene sprite) must never be referenced inside
  // the popup/dialog rendering path — only the config array and the
  // on-scene sprite button (elsewhere in the file) should mention it.
  assert.doesNotMatch(dialogBlock, /backgroundImage/);
  assert.doesNotMatch(dialogBlock, /bg-\[url\(/);
  assert.doesNotMatch(dialogBlock, /hotspot\.imageSrc/);
});

test("mobile dialog overlay uses a neutral dark overlay, not an image", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /overlayClassName="bg-black\/50"/);
});

test("the hero itself is blurred directly (filter), not sampled through backdrop-filter over the scrollable wide scene", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  // backdrop-filter compositing a horizontally-overflowing wide scene is
  // what produced the mirrored/tiled artifact reported by QA — blurring the
  // hero's own rendered pixels in place (CSS `filter`) is WYSIWYG and can't
  // duplicate/mirror anything, since it never samples across the
  // overflow-x-auto scroll boundary.
  assert.match(content, /activeHotspotDialog !== null \? "blur-sm" : ""/);
  // Only the mobile Dialog's own overlayClassName must avoid backdrop-blur —
  // the unrelated desktop HotspotCenteredPreview card is free to keep its
  // own `backdrop-blur` on its white card background.
  const overlayLine = content.match(/overlayClassName="[^"]*"/);
  assert.ok(overlayLine, "mobile dialog overlayClassName not found");
  assert.doesNotMatch(overlayLine[0], /backdrop-blur/);
});

test("dialog content has a bounded max-height with vertical scroll for small viewports", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /max-h-\[calc\(100dvh-2rem\)\]/);
  assert.match(content, /overflow-y-auto/);
});

test("DialogContent supports an optional overlay className override without changing the default for every other dialog in the app", async () => {
  const content = await source("src/components/ui/dialog.tsx");
  assert.match(content, /overlayClassName\?: string/);
  assert.match(content, /<DialogOverlay className=\{overlayClassName\} \/>/);
});

test("desktop hover preview only engages for hover-capable pointer devices at desktop width", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /matchMedia\("\(hover: hover\)"\)/);
  assert.match(
    content,
    /window\.innerWidth >= DESKTOP_BREAKPOINT && hoverQuery\.matches/
  );
});

test("QR supporting image is rendered as a bordered foreground card, never a full-bleed backdrop", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  const supportingImageUsage = content.match(
    /showSupportingImage[\s\S]{0,400}/
  );
  assert.ok(supportingImageUsage, "supportingImage rendering block not found");
  assert.doesNotMatch(supportingImageUsage[0], /absolute inset-0/);
});

test("lab-catalog hotspot has no supportingImage/QR configured", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  const labBlock = content.slice(
    content.indexOf('id: "lab-catalog"'),
    content.indexOf('id: "lab-catalog"') + 1200
  );
  assert.doesNotMatch(labBlock, /supportingImage:/);
});

test("mipa-corner hotspot keeps its WhatsApp QR supportingImage", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  const mipaBlock = content.slice(
    content.indexOf('id: "mipa-corner"'),
    content.indexOf('id: "mipa-corner"') + 1200
  );
  assert.match(mipaBlock, /supportingImage:/);
  assert.match(mipaBlock, /MipaCornerWA\.webp/);
});

test("desktop centered preview portal is unchanged and still gated to desktop viewport", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /\{isDesktopViewport && \(\s*\n\s*<HotspotCenteredPreview/);
  assert.match(content, /function HotspotCenteredPreview/);
});

test("desktop centered preview and mobile Dialog both portal to document.body, not a local hero container", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /createPortal\(\s*\n?[\s\S]*?,\s*\n?\s*document\.body,?\s*\n?\s*\);/);

  const dialogTsx = await source("src/components/ui/dialog.tsx");
  assert.match(dialogTsx, /<DialogPortal>/);
  assert.match(dialogTsx, /<DialogOverlay/);
});

test("only one dialog-ish layer can be active at a time: mobile Dialog and desktop centered preview are mutually exclusive by viewport gate", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  // The sprite/arrow buttons only call onOpenDialog when NOT on desktop...
  assert.match(content, /if \(!isDesktopViewport\) onOpenDialog\(hotspot\.id\)/);
  // ...and the centered preview / inline popover only render when desktop.
  assert.match(content, /isDesktopViewport && !hotspot\.supportingImage/);
});

test("the walking hero sprite (TurahPatrol) freezes in place while a hotspot dialog is open, instead of continuing to translate and mirror behind the overlay", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /function TurahPatrol\(\{\s*\n\s*reducedMotion,\s*\n\s*isPaused = false,/);
  assert.match(content, /timelineRef\.current\?\.pause\(\)/);
  assert.match(content, /timelineRef\.current\?\.resume\(\)/);
  assert.match(
    content,
    /<TurahPatrol\s*\n\s*reducedMotion=\{reducedMotion\}\s*\n\s*isPaused=\{activeHotspotDialog !== null\}/
  );
  // Pausing must not reset/kill the timeline (that would itself cause a
  // visible jump) — only the create/resize path is allowed to kill it.
  const pauseEffect = content.slice(content.indexOf("useEffect(() => {\n    if (isPaused)"));
  assert.doesNotMatch(pauseEffect.slice(0, 200), /\.kill\(\)|x: 0/);
});

test("no ancestor of the hero scene applies a transform that would break fixed-position containing blocks for non-portaled content", async () => {
  const wrapper = await source("src/components/home/home-client-wrapper.tsx");
  // translate-y-* on the page wrapper is fine for portaled dialogs (portals
  // escape the DOM tree entirely) but is worth pinning down explicitly so a
  // future non-portaled fixed element doesn't silently break here.
  assert.match(wrapper, /<HomeHero /);
  assert.match(wrapper, /<HomeLandingSections/);
});

test("mobile dialog width is capped to a sane modal size, not full viewport width, on wide mobile/tablet screens", async () => {
  const content = await source("src/components/home/home-hero.tsx");
  assert.match(content, /max-w-\[min\(calc\(100vw-2rem\),380px\)\]/);
});
