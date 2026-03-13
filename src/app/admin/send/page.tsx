"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function SendSurvey() {
  const [form, setForm] = useState({
    teacherName: "",
    school: "",
    grade: "",
    sentTo: "",
    sentVia: "email",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ surveyUrl: string } | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/admin/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setLoading(false);
    if (res.status === 401) { router.push("/admin"); return; }
    const data = await res.json();
    if (data.success) {
      setResult({ surveyUrl: data.surveyUrl });
    } else {
      setError(data.error || "발송에 실패했습니다.");
    }
  }

  if (result) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">✅</div>
            <h2 className="text-xl font-bold text-gray-800">
              {form.sentVia === "email" ? "이메일 발송 완료" : "설문 링크 생성 완료"}
            </h2>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-xs text-gray-500 mb-2">설문 링크</p>
            <p className="text-sm text-indigo-600 break-all">{result.surveyUrl}</p>
          </div>
          {form.sentVia === "sms" && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 text-sm text-amber-800">
              <p className="font-semibold mb-1">문자 발송 안내</p>
              <p>위 링크를 복사하여 선생님께 문자로 직접 발송해 주세요.</p>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={() => navigator.clipboard.writeText(result.surveyUrl).then(() => alert("복사됨"))}
              className="flex-1 py-3 border border-indigo-300 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50"
            >
              링크 복사
            </button>
            <Link
              href="/admin/dashboard"
              className="flex-1 py-3 bg-indigo-600 text-white rounded-lg font-medium text-center hover:bg-indigo-700"
            >
              목록으로
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href="/admin/dashboard" className="hover:opacity-80">← 뒤로</Link>
        <h1 className="text-lg font-bold">설문 발송</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-8">
        <div className="bg-white rounded-xl shadow p-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                선생님 성함 <span className="text-red-500">*</span>
              </label>
              <input
                name="teacherName"
                value={form.teacherName}
                onChange={handleChange}
                placeholder="예: 김민지"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학교(기관)명 <span className="text-red-500">*</span>
              </label>
              <input
                name="school"
                value={form.school}
                onChange={handleChange}
                placeholder="예: 행복유치원"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학급명 <span className="text-red-500">*</span>
              </label>
              <input
                name="grade"
                value={form.grade}
                onChange={handleChange}
                placeholder="예: 5세 장미반"
                required
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                발송 방법 <span className="text-red-500">*</span>
              </label>
              <select
                name="sentVia"
                value={form.sentVia}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              >
                <option value="email">이메일</option>
                <option value="sms">문자 (링크 생성)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {form.sentVia === "email" ? "이메일 주소" : "연락처 (메모용)"} <span className="text-red-500">*</span>
              </label>
              <input
                name="sentTo"
                value={form.sentTo}
                onChange={handleChange}
                placeholder={form.sentVia === "email" ? "teacher@school.ac.kr" : "010-0000-0000"}
                required
                type={form.sentVia === "email" ? "email" : "tel"}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              />
              {form.sentVia === "sms" && (
                <p className="text-xs text-gray-400 mt-1">
                  문자 발송 시 링크가 생성되며, 선생님께 직접 전달하시면 됩니다.
                </p>
              )}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
            >
              {loading ? "처리 중..." : form.sentVia === "email" ? "이메일 발송" : "링크 생성"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
