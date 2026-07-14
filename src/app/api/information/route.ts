import { NextResponse } from "next/server";

import { getInformationPostCoverImage } from "@/lib/information-post-images";
import { getPublishedInformationPosts } from "@/lib/information-posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const posts = await getPublishedInformationPosts();
  const data = await Promise.all(
    posts.map(async (post) => {
      const coverImage = await getInformationPostCoverImage(post.id);

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
              altText: coverImage.altText,
              originalName: coverImage.originalName,
              imageFit: coverImage.imageFit,
            }
          : null,
      };
    })
  );

  return NextResponse.json({ data });
}
