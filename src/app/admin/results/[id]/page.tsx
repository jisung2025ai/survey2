"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QUESTIONS, SCALE_LABELS, CHILD_TABS } from "@/lib/questions";

interface ChildResponse {
  id: string;
  childIndex: number;
  childName: string;
  gender: string;
  age: string;
  answers: Record<string, number>;
  createdAt: string;
}

interface SurveyDetail {
  id: string;
  teacherName: string;
  school: string;
  grade: string;
  sentTo: string;
  completed: boolean;
  completedAt: string;
  responses: ChildResponse[];
}

export default function ResultDetail({ params }: { params: { id: string } }) {
  const [survey, setSurvey] = useState<SurveyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const router = useRouter();

  useEffect(() => {
    fetch(`/api/admin/results/${params.id}`)
      .then((r) => {
        if (r.status === 401) { router.push("/admin"); return null; }
        return r.json();
      })
      .then((data) => { if (data) setSurvey(data); setLoading(false); });
  }, [params.id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin h-10 w-10 border-4 border-indigo-600 border-t-transparent rounded-full" /></div>;
  if (!survey) return null;

  const childTabs = CHILD_TABS.map((t) => ({
    ...t,
    response: survey.responses.find((r) => r.childIndex === t.index),
  }));

  function getAvgScore(answers: Record<string, number>) {
    const vals = Object.values(answers);
    if (!vals.length) return 0;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2);
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-indigo-600 text-white px-6 py-4 flex items-center gap-4 shadow">
        <Link href="/admin/dashboard" className="hover:opacity-80">← 목록</Link>
        <div>
          <h1 className="text-lg font-bold">{survey.teacherName} 선생님 결과</h1>
          <p className="text-indigo-200 text-xs">{survey.school} {survey.grade}</p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {childTabs.map((tab) => {
            const resp = tab.response;
            const avg = resp ? getAvgScore(resp.answers) : "-";
            return (
              <div key={tab.index} className={`bg-white rounded-xl shadow p-4 text-center border-t-4 ${
                tab.gender === "남" ? "border-blue-400" : "border-pink-400"
              }`}>
                <div className={`text-xs font-semibold mb-1 ${tab.gender === "남" ? "text-blue-600" : "text-pink-600"}`}>
                  {tab.label}
                </div>
                <div className="font-bold text-gray-800">{resp?.childName || "-"}</div>
                <div className="text-xs text-gray-500">{resp?.age}</div>
                <div className="text-2xl font-bold text-indigo-600 mt-2">{avg}</div>
                <div className="text-xs text-gray-400">평균점수</div>
              </div>
            );
          })}
        </div>

        {/* Detail Tabs */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex border-b">
            {childTabs.map((tab) => (
              <button
                key={tab.index}
                onClick={() => setActiveTab(tab.index)}
                className={`flex-1 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.index
                    ? "bg-indigo-600 text-white"
                    : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                {tab.label}
                {tab.response && <span className="ml-1 text-green-400">✓</span>}
              </button>
            ))}
          </div>

          {childTabs.map((tab) => {
            const resp = tab.response;
            return (
              <div key={tab.index} className={activeTab === tab.index ? "block" : "hidden"}>
                {!resp ? (
                  <div className="p-8 text-center text-gray-400">응답 없음</div>
                ) : (
                  <div className="p-6">
                    <div className={`flex gap-4 mb-6 p-4 rounded-lg ${tab.gender === "남" ? "bg-blue-50" : "bg-pink-50"}`}>
                      <div><span className="text-xs text-gray-500">이름</span><p className="font-bold">{resp.childName}</p></div>
                      <div><span className="text-xs text-gray-500">성별</span><p className="font-bold">{resp.gender}아</p></div>
                      <div><span className="text-xs text-gray-500">연령</span><p className="font-bold">{resp.age}</p></div>
                      <div><span className="text-xs text-gray-500">평균</span><p className="font-bold text-indigo-600">{getAvgScore(resp.answers)}점</p></div>
                    </div>
                    <div className="space-y-3">
                      {QUESTIONS.map((q, qIdx) => {
                        const val = resp.answers[String(qIdx)] || 0;
                        const label = SCALE_LABELS.find((s) => s.value === val);
                        return (
                          <div key={qIdx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50">
                            <span className="shrink-0 bg-indigo-100 text-indigo-700 text-xs rounded px-2 py-1 font-bold">
                              {qIdx + 1}
                            </span>
                            <p className="text-sm text-gray-700 flex-1">{q}</p>
                            <div className="shrink-0 text-right">
                              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                                val >= 4 ? "bg-green-100 text-green-700" :
                                val === 3 ? "bg-yellow-100 text-yellow-700" :
                                val > 0 ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-400"
                              }`}>
                                {val ? `${val}점` : "-"}
                              </span>
                              <p className="text-xs text-gray-400 mt-0.5">{label?.label || ""}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
