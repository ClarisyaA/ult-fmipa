import Link from "next/link";
import { getServerSession } from "next-auth";
import { ClipboardCheck } from "lucide-react";

import { StudentSurveyPage } from "@/components/student/student-survey-page";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

export default async function SurveiPage() {
  const session = await getServerSession(authOptions);
  const role = session?.user.role;

  return (
    <>
      <section className="border-b bg-muted/30">
        <div className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            Survei
          </p>
          <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-normal">
            Survei Kepuasan Layanan
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
            Survei dapat diisi untuk pengajuan layanan yang sudah selesai
            diproses.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
        {role === "student" ? <StudentSurveyPage /> : null}

        {role === "admin" ? (
          <Card>
            <CardHeader>
              <ClipboardCheck className="size-6 text-primary" />
              <CardTitle>Ringkasan Survei Admin</CardTitle>
              <CardDescription>
                Admin dapat melihat ringkasan respons survei dari halaman
                khusus admin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/admin/surveys">Buka Ringkasan Survei</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {role === "staff" ? (
          <Card>
            <CardHeader>
              <ClipboardCheck className="size-6 text-primary" />
              <CardTitle>Ringkasan Survei Staff</CardTitle>
              <CardDescription>
                Staff dapat melihat ringkasan respons survei dari halaman
                khusus staff.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/staff/surveys">Buka Ringkasan Survei</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}

        {!session ? (
          <Card>
            <CardHeader>
              <ClipboardCheck className="size-6 text-primary" />
              <CardTitle>Survei Kepuasan Layanan</CardTitle>
              <CardDescription>
                Login sebagai mahasiswa untuk mengisi survei dari layanan yang
                sudah selesai. Admin dan staff dapat melihat ringkasan survei
                setelah login.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/login">Login</Link>
              </Button>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </>
  );
}
