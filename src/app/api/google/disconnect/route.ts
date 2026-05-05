import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.googleAccount.delete({ where: { userId: session.id } });
  } catch (error: any) {
    if (error.code === "P2025") {
      // Record not found — this is okay
      return NextResponse.json({ success: true, message: "No account to disconnect" });
    }
    console.error("Disconnect failed:", error);
    return NextResponse.json({ error: "Failed to disconnect" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
