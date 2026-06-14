import Link from "next/link";

import { InformationDeleteButton } from "@/components/information/information-delete-button";
import { InformationStatusAction } from "@/components/information/information-status-action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminInformationPosts } from "@/lib/information-posts";
import type { InformationPost, InformationPostStatus } from "@/lib/information-posts";

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

const statusLabels: Record<InformationPostStatus, string> = {
  draft: "Draft",
  published: "Dipublikasikan",
  archived: "Diarsipkan",
};

function getDisplayStatus(post: InformationPost) {
  if (post.status === "archived") {
    return "Diarsipkan";
  }

  if (post.status !== "published" || !post.isActive) {
    return post.isActive ? "Belum Publik" : "Non-aktif";
  }

  const now = Date.now();

  if (post.displayStartAt && new Date(post.displayStartAt).getTime() > now) {
    return "Belum Tayang";
  }

  if (post.displayEndAt && new Date(post.displayEndAt).getTime() < now) {
    return "Masa Tayang Selesai";
  }

  return "Sedang Tayang";
}

export default async function AdminInformasiPage() {
  const posts = await getAdminInformationPosts();

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-normal">
            Kelola Informasi
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Buat dan kelola pengumuman tanpa mengubah tabel layanan legacy.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/informasi/tambah">Tambah Informasi</Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Informasi</CardTitle>
          <CardDescription>Semua draft dan publikasi.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Judul</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Publikasi</TableHead>
                <TableHead>Jadwal</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-muted-foreground">
                    Belum ada informasi yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        <Badge variant="secondary">{statusLabels[post.status]}</Badge>
                        {post.featured ? (
                          <Badge variant="outline">Unggulan</Badge>
                        ) : null}
                        {!post.isActive ? (
                          <Badge variant="outline">Non-aktif</Badge>
                        ) : null}
                      </div>
                    </TableCell>
                    <TableCell>{post.category ?? "-"}</TableCell>
                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
                    <TableCell>
                      <div className="grid gap-1 text-sm">
                        <Badge variant="outline">{getDisplayStatus(post)}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Mulai: {formatDate(post.displayStartAt)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          Selesai: {formatDate(post.displayEndAt)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/admin/informasi/${post.id}/edit`}>
                            Edit
                          </Link>
                        </Button>
                        {post.status === "published" ? (
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/informasi/${post.slug}`}>
                              Lihat Halaman
                            </Link>
                          </Button>
                        ) : null}
                        {post.status === "archived" ? (
                          <InformationStatusAction
                            id={post.id}
                            rolePrefix="admin"
                            post={post}
                            targetStatus="draft"
                            label="Restore"
                            confirmMessage="Kembalikan informasi ini ke draft?"
                          />
                        ) : (
                          <InformationStatusAction
                            id={post.id}
                            rolePrefix="admin"
                            post={post}
                            targetStatus="archived"
                            label="Arsipkan"
                            confirmMessage="Arsipkan informasi ini?"
                          />
                        )}
                        <InformationDeleteButton id={post.id} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
