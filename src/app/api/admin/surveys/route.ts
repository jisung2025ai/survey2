import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

function isAuthed() {
  const token = cookies().get("admin_token")?.value;
  return token ? verifyToken(token) : false;
}

export async function GET() {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const surveys = await prisma.surveyToken.findMany({
    orderBy: { createdAt: "desc" },
    include: { responses: false },
    select: {
      id: true,
      token: true,
      teacherName: true,
      school: true,
      grade: true,
      sentTo: true,
      sentVia: true,
      completed: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json(surveys);
}
