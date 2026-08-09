import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";

async function source(path) {
  return readFile(new URL(`../${path}`, import.meta.url), "utf8");
}

// Root cause: clicking "Selesai" immediately called router.refresh() while
// also opening the completion email dialog. On a status-filtered requests
// list, the freshly-completed row no longer matched the filter, so the
// refreshed server data removed the row (and the dialog inside it) right
// after it opened - the dialog flashed and disappeared. Fix: defer
// router.refresh() until the dialog actually closes (RequestEmailHelper's
// onClose), so the row stays mounted while the dialog is in use.

test("InlineStatusAction does not refresh immediately on complete, only on non-dialog actions", async () => {
  const content = await source("src/components/requests/inline-status-action.tsx");
  const handleClickBlocks = content.split("async function handleClick");
  assert.equal(handleClickBlocks.length, 3, "expected two handleClick functions (InlineStatusAction + RequestStatusActionButton)");

  for (const block of handleClickBlocks.slice(1)) {
    const body = block.slice(0, block.indexOf("finally"));
    assert.match(
      body,
      /if \(config\.action === "complete"\) \{\s*\n[\s\S]*?setEmailDialogSignal\(\(value\) => value \+ 1\);\s*\n\s*\} else \{\s*\n\s*router\.refresh\(\);\s*\n\s*\}/,
      "complete action must skip immediate router.refresh() and defer it"
    );
  }
});

test("InlineStatusAction and RequestStatusActionButton refresh via RequestEmailHelper's onClose instead", async () => {
  const content = await source("src/components/requests/inline-status-action.tsx");
  const onCloseMatches = content.match(/onClose=\{\(\) => router\.refresh\(\)\}/g) ?? [];
  assert.equal(onCloseMatches.length, 2, "both components must wire onClose to router.refresh()");
});

test("RequestStatusActions (detail page) applies the same deferred-refresh fix", async () => {
  const content = await source("src/components/requests/request-status-actions.tsx");
  assert.match(
    content,
    /if \(action === "complete"\) \{\s*\n[\s\S]*?setEmailDialogSignal\(\(value\) => value \+ 1\);\s*\n\s*\} else \{\s*\n\s*router\.refresh\(\);\s*\n\s*\}/
  );
  assert.match(content, /onClose=\{\(\) => router\.refresh\(\)\}/);
});

test("RequestEmailHelper's completion dialog calls onClose whenever it closes (Nanti, outside click, or Escape)", async () => {
  const content = await source("src/components/requests/request-email-helper.tsx");
  assert.match(
    content,
    /onOpenChange=\{\(open\) => \{\s*\n\s*setIsDialogOpen\(open\);\s*\n\s*if \(!open\) onClose\?\.\(\);/
  );
});

test("requests list pages support status filtering, which is exactly what made the premature refresh drop the row", async () => {
  const adminPage = await source("src/app/admin/requests/page.tsx");
  assert.match(adminPage, /params\.status/);
});
