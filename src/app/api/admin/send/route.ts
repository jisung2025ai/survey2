import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendSurveyEmail } from "@/lib/mail";
import { verifyToken } from "@/lib/auth";
import { v4 as uuidv4 } from "uuid";
import { cookies } from "next/headers";

function isAuthed() {
  const token = cookies().get("admin_token")?.value;
  return token ? verifyToken(token) : false;
}

export async function POST(req: NextRequest) {
  if (!isAuthed()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { teacherName, school, grade, sentTo, sentVia } = body;

  if (!teacherName || !school || !grade || !sentTo || !sentVia) {
    return NextResponse.json({ error: "모든 항목을 입력해 주세요." }, { status: 400 });
  }

  const token = uuidv4();
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const surveyUrl = `${baseUrl}/survey/${token}`;

  const survey = await prisma.surveyToken.create({
    data: { token, teacherName, school, grade, sentTo, sentVia },
  });

  if (sentVia === "email") {
    try {
      await sendSurveyEmail(sentTo, teacherName, school, grade, surveyUrl);
    } catch (e) {
      console.error("Email error:", e);
      return NextResponse.json({ error: "이메일 발송에 실패했습니다. SMTP 설정을 확인해 주세요." }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, surveyUrl, id: survey.id });
}
