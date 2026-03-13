import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

function isAuthed() {
  const token = cookies().get("admin_token")?.value;
  return token ? verifyToken(token) : false;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const survey = await prisma.surveyToken.findUnique({
    where: { id: params.id },
    include: { responses: { orderBy: { childIndex: "asc" } } },
  });

  if (!survey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(survey);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  await prisma.childResponse.deleteMany({ where: { tokenId: params.id } });
  await prisma.surveyToken.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
