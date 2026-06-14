import Link from "next/link";

import { InformationDeleteButton } from "@/components/information/information-delete-button";
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
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {posts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Belum ada informasi yang dibuat.
                  </TableCell>
                </TableRow>
              ) : (
                posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="font-medium">{post.title}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{post.status}</Badge>
                    </TableCell>
                    <TableCell>{post.category ?? "-"}</TableCell>
                    <TableCell>{formatDate(post.publishedAt)}</TableCell>
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
