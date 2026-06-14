import Link from "next/link";
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
import { getPublishedInformationPosts } from "@/lib/information-posts";

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
            {posts.map((post) => (
              <Card key={post.id}>
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
