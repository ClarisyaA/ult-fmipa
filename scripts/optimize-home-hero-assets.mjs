import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDir = path.join("public", "beranda-new", "beranda-webp");
const outputDir = path.join("public", "beranda-new", "beranda-webp-optimized");
const sectionOutputDir = path.join("public", "home-optimized");

const quality = 78;

const groups = [
  {
    names: ["ULT"],
    widths: [1280, 1920, 2560],
  },
  {
    names: [
      "Orang1",
      "Orang1Line",
      "Orang1Left",
      "Orang1Right",
      "Orang2",
      "Orang2Line",
      "Orang2Left",
      "Orang2Right",
    ],
    widths: [480, 640, 800],
  },
  {
    names: ["MejaKiri", "MejaTengah", "MejaKanan"],
    widths: [640, 800, 900],
  },
  {
    names: ["Print", "TeksULT"],
    widths: [480, 640, 800],
  },
];

await mkdir(outputDir, { recursive: true });
await mkdir(sectionOutputDir, { recursive: true });

for (const group of groups) {
  for (const name of group.names) {
    const input = path.join(sourceDir, `${name}.webp`);
    try {
      await stat(input);
    } catch {
      console.warn(`Skipping missing source: ${input}`);
      continue;
    }

    const metadata = await sharp(input).metadata();
    if (!metadata.width || !metadata.height) {
      throw new Error(`Cannot read dimensions for ${input}`);
    }

    for (const width of group.widths) {
      const targetWidth = Math.min(width, metadata.width);
      const output = path.join(outputDir, `${name}-${targetWidth}.webp`);

      await sharp(input, { animated: false })
        .resize({
          width: targetWidth,
          withoutEnlargement: true,
        })
        .webp({
          quality,
          alphaQuality: quality,
          effort: 6,
        })
        .toFile(output);

      const outputMetadata = await sharp(output).metadata();
      const before = await stat(input);
      const after = await stat(output);
      console.log(
        [
          `${name}-${targetWidth}.webp`,
          `${metadata.width}x${metadata.height}`,
          `${outputMetadata.width}x${outputMetadata.height}`,
          `${before.size}`,
          `${after.size}`,
        ].join("\t"),
      );
    }
  }
}

const sectionAssets = [
  {
    input: path.join("public", "Beranda-Section1", "Turah1.svg"),
    name: "Turah1",
    widths: [168, 256, 384],
  },
  {
    input: path.join("public", "Beranda-Section1", "LogoTeks.svg"),
    name: "LogoTeks",
    widths: [200, 320, 480],
  },
  {
    input: path.join("public", "gedung-fmipa.svg"),
    name: "gedung-fmipa",
    widths: [640, 900, 1200],
  },
];

for (const asset of sectionAssets) {
  try {
    await stat(asset.input);
  } catch {
    console.warn(`Skipping missing source: ${asset.input}`);
    continue;
  }

  const metadata = await sharp(asset.input).metadata();
  if (!metadata.width || !metadata.height) {
    throw new Error(`Cannot read dimensions for ${asset.input}`);
  }

  for (const width of asset.widths) {
    const targetWidth = Math.min(width, metadata.width);
    const output = path.join(sectionOutputDir, `${asset.name}-${targetWidth}.webp`);

    await sharp(asset.input)
      .resize({
        width: targetWidth,
        withoutEnlargement: true,
      })
      .webp({
        quality,
        alphaQuality: quality,
        effort: 6,
      })
      .toFile(output);

    const outputMetadata = await sharp(output).metadata();
    const before = await stat(asset.input);
    const after = await stat(output);
    console.log(
      [
        `${asset.name}-${targetWidth}.webp`,
        `${metadata.width}x${metadata.height}`,
        `${outputMetadata.width}x${outputMetadata.height}`,
        `${before.size}`,
        `${after.size}`,
      ].join("\t"),
    );
  }
}
