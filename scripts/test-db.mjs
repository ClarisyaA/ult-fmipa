import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 13306),
  user: process.env.DB_USER ?? "ult_user",
  password: process.env.DB_PASSWORD ?? "ult_password",
  database: process.env.DB_NAME ?? "fmipa_sbpk",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

try {
  const mahasiswaCount = await prisma.mahasiswa.count();

  console.log("Koneksi Prisma berhasil.");
  console.log("Jumlah data mahasiswa:", mahasiswaCount);
} catch (error) {
  console.error("Koneksi Prisma gagal.");
  console.error(error);
} finally {
  await prisma.$disconnect();
}
