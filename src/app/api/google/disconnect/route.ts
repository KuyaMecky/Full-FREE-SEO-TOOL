import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await prisma.googleAccount
    .delete({ where: { userId: session.id } })
    .catch(() => {
      // nothing to delete
    });

  return NextResponse.json({ success: true });
}
