import Link from "next/link";
import Image from "next/image";
import { CalendarDays } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInformationPostCoverImage } from "@/lib/information-post-images";
import { getPublishedInformationPosts } from "@/lib/information-posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function InformasiPage() {
  const posts = await getPublishedInformationPosts();
  const postsWithCoverImages = await Promise.all(
    posts.map(async (post) => ({
      post,
      coverImage: await getInformationPostCoverImage(post.id),
    }))
  );

  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Informasi
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            Pusat informasi layanan FMIPA
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Pengumuman dan informasi resmi terkait layanan ULT FMIPA Unpad.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {posts.length === 0 ? (
          <Card>
            <CardContent className="py-6 text-sm text-muted-foreground">
              Belum ada informasi yang dipublikasikan.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {postsWithCoverImages.map(({ post, coverImage }) => (
              <Card key={post.id}>
                {coverImage ? (
                  <Image
                    src={`/api/information/images/${coverImage.id}`}
                    alt={coverImage.altText ?? coverImage.originalName}
                    width={640}
                    height={360}
                    className="aspect-video w-full object-cover"
                  />
                ) : null}
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    {post.category ? (
                      <Badge variant="secondary">{post.category}</Badge>
                    ) : null}
                    <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                      <CalendarDays className="size-4" />
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>
                  <CardTitle>{post.title}</CardTitle>
                  {post.summary ? (
                    <CardDescription>{post.summary}</CardDescription>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/informasi/${post.slug}`}>Baca Informasi</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
