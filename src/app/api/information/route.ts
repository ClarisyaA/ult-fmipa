import { NextResponse } from "next/server";

import { getAvailableInformationPostCoverImages } from "@/lib/information-post-images";
import { getPublishedInformationPosts } from "@/lib/information-posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PublicInformationResponse = {
  id: string;
  title: string;
  slug: string;
  category: string | null;
  summary: string | null;
  publishedAt: string | null;
  coverImage: {
    id: string;
    storedName: string;
    altText: string | null;
    originalName: string;
    imageFit: "cover" | "contain";
  } | null;
};

const CACHE_TTL_MS = 60_000;
let cachedPayload:
  | {
      expiresAt: number;
      data: PublicInformationResponse[];
    }
  | null = null;

function jsonResponse(data: PublicInformationResponse[]) {
  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    }
  );
}

export async function GET() {
  const now = Date.now();

  if (cachedPayload && cachedPayload.expiresAt > now) {
    return jsonResponse(cachedPayload.data);
  }

  const posts = await getPublishedInformationPosts();
  const coverImages = await getAvailableInformationPostCoverImages(
    posts.map((post) => post.id)
  );
  const data: PublicInformationResponse[] = posts.map((post) => {
    const coverImage = coverImages.get(post.id);

    return {
      id: post.id,
      title: post.title,
      slug: post.slug,
      category: post.category,
      summary: post.summary,
      publishedAt: post.publishedAt,
      coverImage: coverImage
        ? {
            id: coverImage.id,
            storedName: coverImage.storedName,
            altText: coverImage.altText,
            originalName: coverImage.originalName,
            imageFit: coverImage.imageFit,
          }
        : null,
    };
  });

  cachedPayload = {
    expiresAt: now + CACHE_TTL_MS,
    data,
  };

  return jsonResponse(data);
}
