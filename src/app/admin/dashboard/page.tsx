"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Survey {
  id: string;
  token: string;
  teacherName: string;
  school: string;
  grade: string;
  sentTo: string;
  sentVia: string;
  completed: boolean;
  createdAt: string;
  completedAt: string | null;
}

export default function Dashboard() {
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  async function loadSurveys() {
    const res = await fetch("/api/admin/surveys");
    if (res.status === 401) { router.push("/admin"); return; }
    setSurveys(await res.json());
    setLoading(false);
  }

  useEffect(() => { loadSurveys(); }, []);

  async function deleteSurvey(id: string) {
    if (!confirm("이 설문을 삭제하시겠습니까?")) return;
    await fetch(`/api/admin/results/${id}`, { method: "DELETE" });
    loadSurveys();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin");
  }

  const total = surveys.length;
  const completed = surveys.filter((s) => s.completed).length;
  const pending = total - completed;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center justify-between shadow">
        <div>
          <h1 className="text-lg font-bold">📊 유아 디지털 역량 설문 백오피스</h1>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/send"
            className="bg-white text-indigo-600 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-indigo-50 transition-colors"
          >
            + 설문 발송
          </Link>
          <button
            onClick={logout}
            className="bg-indigo-700 hover:bg-indigo-800 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            로그아웃
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-indigo-600">{total}</div>
            <div className="text-sm text-gray-500 mt-1">전체 발송</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-green-600">{completed}</div>
            <div className="text-sm text-gray-500 mt-1">완료</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="text-3xl font-bold text-amber-600">{pending}</div>
            <div className="text-sm text-gray-500 mt-1">미완료</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-bold text-gray-800">설문 발송 목록</h2>
            <button onClick={loadSurveys} className="text-sm text-indigo-600 hover:underline">새로고침</button>
          </div>
          {loading ? (
            <div className="p-12 text-center text-gray-400">로딩 중...</div>
          ) : surveys.length === 0 ? (
            <div className="p-12 text-center text-gray-400">
              <p className="text-4xl mb-3">📭</p>
              <p>발송된 설문이 없습니다.</p>
              <Link href="/admin/send" className="text-indigo-600 hover:underline text-sm mt-2 inline-block">
                설문 발송하기 →
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">선생님</th>
                    <th className="px-4 py-3 text-left">학교/학급</th>
                    <th className="px-4 py-3 text-left">발송처</th>
                    <th className="px-4 py-3 text-left">방법</th>
                    <th className="px-4 py-3 text-left">상태</th>
                    <th className="px-4 py-3 text-left">발송일</th>
                    <th className="px-4 py-3 text-left">완료일</th>
                    <th className="px-4 py-3 text-left">작업</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {surveys.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.teacherName}</td>
                      <td className="px-4 py-3 text-gray-600">{s.school} {s.grade}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[150px] truncate">{s.sentTo}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.sentVia === "email"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-green-100 text-green-700"
                        }`}>
                          {s.sentVia === "email" ? "이메일" : "문자(링크)"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          s.completed
                            ? "bg-green-100 text-green-700"
                            : "bg-amber-100 text-amber-700"
                        }`}>
                          {s.completed ? "완료" : "미완료"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(s.createdAt).toLocaleDateString("ko-KR")}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {s.completedAt ? new Date(s.completedAt).toLocaleDateString("ko-KR") : "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {s.completed && (
                            <Link
                              href={`/admin/results/${s.id}`}
                              className="text-indigo-600 hover:underline text-xs"
                            >
                              결과보기
                            </Link>
                          )}
                          <button
                            onClick={() => {
                              const url = `${baseUrl}/survey/${s.token}`;
                              navigator.clipboard.writeText(url);
                              alert("링크가 복사되었습니다.");
                            }}
                            className="text-gray-500 hover:text-gray-700 text-xs"
                          >
                            링크복사
                          </button>
                          <button
                            onClick={() => deleteSurvey(s.id)}
                            className="text-red-500 hover:text-red-700 text-xs"
                          >
                            삭제
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
