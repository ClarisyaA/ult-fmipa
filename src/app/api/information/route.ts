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

export async function GET() {
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

  return NextResponse.json(
    { data },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    }
  );
}
