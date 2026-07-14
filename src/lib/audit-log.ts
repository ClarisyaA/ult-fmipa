import type { Session } from "next-auth";

import { getSafeErrorMessage } from "@/lib/error-utils";
import { prisma } from "@/lib/prisma";

type AuditActor = Pick<Session["user"], "id" | "email" | "name"> | null | undefined;

function actorName(actor: AuditActor) {
  if (!actor) {
    return "system";
  }

  if (actor.id?.startsWith("legacy-")) {
    return actor.id.slice("legacy-".length).slice(0, 20) || "legacy-admin";
  }

  return (actor.email ?? actor.name ?? actor.id ?? "admin").slice(0, 20);
}

function requestIp(request?: Request) {
  if (!request) {
    return "0.0.0.0";
  }

  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "0.0.0.0"
  ).slice(0, 20);
}

function requestBrowser(request?: Request) {
  if (!request) {
    return "server";
  }

  return (request.headers.get("user-agent") || "unknown").slice(0, 100);
}

export async function writeAuditLog({
  actor,
  request,
  action,
}: {
  actor?: AuditActor;
  request?: Request;
  action: string;
}) {
  try {
    await prisma.log_users.create({
      data: {
        USER_NAME: actorName(actor),
        IP: requestIp(request),
        BROWSER: requestBrowser(request),
        LOG: action.slice(0, 200),
        TIME: new Date(),
      },
    });
  } catch (error) {
    console.warn("[audit-log] gagal menulis log", {
      message: getSafeErrorMessage(error),
    });
  }
}
