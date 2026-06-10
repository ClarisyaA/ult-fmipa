import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

const adapter = new PrismaMariaDb({
  host: "localhost",
  port: 13306,
  user: "ult_user",
  password: "ult_password",
  database: "ult_fmipa",
  connectionLimit: 5,
});

const prisma = new PrismaClient({ adapter });

try {
  const users = await prisma.user.findMany();
  console.log("Koneksi Prisma berhasil.");
  console.log(users);
} catch (error) {
  console.error("Koneksi Prisma gagal.");
  console.error(error);
} finally {
  await prisma.$disconnect();
}