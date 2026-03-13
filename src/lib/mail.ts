import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendSurveyEmail(
  to: string,
  teacherName: string,
  school: string,
  grade: string,
  surveyUrl: string
) {
  const html = `
    <div style="font-family: 'Malgun Gothic', sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: #4F46E5; color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="margin: 0; font-size: 22px;">유아 디지털 역량 설문조사</h1>
        <p style="margin: 8px 0 0; opacity: 0.9;">연구 참여 요청</p>
      </div>
      <div style="background: #f8f9fa; padding: 32px; border-radius: 0 0 12px 12px; border: 1px solid #e9ecef;">
        <p style="font-size: 16px; color: #333;"><strong>${teacherName}</strong> 선생님, 안녕하세요!</p>
        <p style="color: #555; line-height: 1.8;">
          ${school} ${grade} 학급의 유아 디지털 역량 설문조사에 참여해 주셔서 감사합니다.<br>
          아래 버튼을 클릭하시어 학급 내 유아 4명(남아 2명, 여아 2명)에 대한 설문을 작성해 주십시오.
        </p>
        <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; color: #856404; font-size: 14px;">
            ※ 학급 출석부의 앞, 중간, 뒷 부분에서 유아 4명(남아 2명, 여아 2명)을 무작위로 선정해 주십시오.<br>
            ※ 학급 내 담임교사가 2명 이상일 경우, 메이트 교사와 대상 유아가 중복되지 않도록 유의해 주십시오.
          </p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${surveyUrl}" style="background: #4F46E5; color: white; padding: 14px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: bold; display: inline-block;">
            설문 작성하기
          </a>
        </div>
        <p style="color: #888; font-size: 13px; border-top: 1px solid #dee2e6; padding-top: 16px; margin-top: 24px;">
          이 링크는 본 설문에만 사용되며, 선생님의 개인정보는 수집되지 않습니다.<br>
          문의사항이 있으시면 연구자에게 연락해 주십시오.
        </p>
      </div>
    </div>
  `;

  await transporter.sendMail({
    from: `"유아 디지털 역량 연구" <${process.env.SMTP_FROM}>`,
    to,
    subject: `[설문요청] ${school} ${grade} 유아 디지털 역량 설문조사`,
    html,
  });
}
