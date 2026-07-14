import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

function publicAssetPath(...segments: string[]) {
  return path.join(process.cwd(), "public", ...segments);
}

export const letterLogoPath = publicAssetPath("letters", "logo-unpad.png");
export const letterWatermarkPath = publicAssetPath(
  "letters",
  "watermark-a4.png",
);

export function getExistingLetterAsset(assetPath: string) {
  return existsSync(assetPath) ? assetPath : null;
}

export function getExistingLetterAssetSource(assetPath: string) {
  if (!existsSync(assetPath)) return null;

  const extension = path.extname(assetPath).toLowerCase();
  const mime =
    extension === ".jpg" || extension === ".jpeg"
      ? "image/jpeg"
      : extension === ".png"
        ? "image/png"
        : "application/octet-stream";
  const base64 = readFileSync(assetPath).toString("base64");

  return `data:${mime};base64,${base64}`;
}
