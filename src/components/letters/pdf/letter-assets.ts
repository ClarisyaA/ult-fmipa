import { existsSync } from "node:fs";
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
