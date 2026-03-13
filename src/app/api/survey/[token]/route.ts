import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const survey = await prisma.surveyToken.findUnique({
    where: { token: params.token },
  });
  if (!survey) {
    return NextResponse.json({ error: "유효하지 않은 설문 링크입니다." }, { status: 404 });
  }
  return NextResponse.json({
    teacherName: survey.teacherName,
    school: survey.school,
    grade: survey.grade,
    completed: survey.completed,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const survey = await prisma.surveyToken.findUnique({
    where: { token: params.token },
  });
  if (!survey) {
    return NextResponse.json({ error: "유효하지 않은 링크입니다." }, { status: 404 });
  }
  if (survey.completed) {
    return NextResponse.json({ error: "이미 제출된 설문입니다." }, { status: 400 });
  }

  const body = await req.json();
  const { responses } = body;

  await prisma.$transaction([
    ...responses.map((r: {
      childIndex: number;
      childName: string;
      gender: string;
      age: string;
      answers: Record<string, number>;
    }) =>
      prisma.childResponse.create({
        data: {
          tokenId: survey.id,
          childIndex: r.childIndex,
          childName: r.childName,
          gender: r.gender,
          age: r.age,
          answers: r.answers,
        },
      })
    ),
    prisma.surveyToken.update({
      where: { id: survey.id },
      data: { completed: true, completedAt: new Date() },
    }),
  ]);

  return NextResponse.json({ success: true });
}
