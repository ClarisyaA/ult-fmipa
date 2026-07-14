import { prisma } from "@/lib/prisma";

export type StudentProfile = {
  name: string | null;
  programStudy: string | null;
  level: string | null;
};

export async function getLetterStudentProfile(
  npm: string | null,
): Promise<StudentProfile | null> {
  if (!npm) {
    return null;
  }

  const activeStudent = await prisma.mahasiswa.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
      JENJANG: true,
    },
  });

  if (activeStudent) {
    return {
      name: activeStudent.NAMA,
      programStudy: activeStudent.PROGRAM_STUDI,
      level: activeStudent.JENJANG,
    };
  }

  const archivedStudent = await prisma.mahasiswa_sd_2015.findUnique({
    where: { NPM: npm },
    select: {
      NAMA: true,
      PROGRAM_STUDI: true,
      JENJANG: true,
    },
  });

  if (archivedStudent) {
    return {
      name: archivedStudent.NAMA,
      programStudy: archivedStudent.PROGRAM_STUDI,
      level: archivedStudent.JENJANG,
    };
  }

  const alumni = await prisma.alumni.findFirst({
    where: { npm },
    select: {
      nama: true,
      program: true,
      prodi: true,
    },
  });

  if (alumni) {
    return {
      name: alumni.nama,
      programStudy: [alumni.program, alumni.prodi].filter(Boolean).join(" "),
      level: alumni.program,
    };
  }

  return null;
}
