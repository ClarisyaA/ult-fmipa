import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { InformationImageGallery } from "@/components/information/information-image-gallery";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getInformationPostImages } from "@/lib/information-post-images";
import { getPublishedInformationPostBySlug } from "@/lib/information-posts";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type InformationDetailPageProps = {
  params: Promise<{ slug: string }>;
};

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

export default async function InformationDetailPage({
  params,
}: InformationDetailPageProps) {
  const { slug } = await params;
  const post = await getPublishedInformationPostBySlug(slug);

  if (!post) {
    notFound();
  }

  const images = await getInformationPostImages(post.id);

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Button asChild variant="ghost" className="-ml-2 mb-6">
        <Link href="/informasi">
          <ArrowLeft className="size-4" />
          Kembali ke Informasi
        </Link>
      </Button>

      <div className="flex flex-wrap items-center gap-2">
        {post.category ? <Badge variant="secondary">{post.category}</Badge> : null}
        <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
          <CalendarDays className="size-4" />
          {formatDate(post.publishedAt)}
        </span>
      </div>
      <h1 className="mt-4 text-3xl font-semibold tracking-normal">
        {post.title}
      </h1>
      {post.summary ? (
        <p className="mt-4 text-base leading-7 text-muted-foreground">
          {post.summary}
        </p>
      ) : null}
      <InformationImageGallery images={images} />
      <div className="mt-8 whitespace-pre-line text-sm leading-7 text-foreground">
        {post.content}
      </div>
    </article>
  );
}
