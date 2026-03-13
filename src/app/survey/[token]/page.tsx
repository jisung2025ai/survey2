"use client";

import { useState, useEffect } from "react";
import { QUESTIONS, SCALE_LABELS, CHILD_TABS } from "@/lib/questions";

interface SurveyInfo {
  teacherName: string;
  school: string;
  grade: string;
  completed: boolean;
}

type Answers = Record<string, Record<number, number>>;
type ChildInfo = { name: string; age: string };

export default function SurveyPage({ params }: { params: { token: string } }) {
  const [surveyInfo, setSurveyInfo] = useState<SurveyInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [answers, setAnswers] = useState<Answers>({ "0": {}, "1": {}, "2": {}, "3": {} });
  const [childInfo, setChildInfo] = useState<Record<string, ChildInfo>>({
    "0": { name: "", age: "만3세" },
    "1": { name: "", age: "만3세" },
    "2": { name: "", age: "만3세" },
    "3": { name: "", age: "만3세" },
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    fetch(`/api/survey/${params.token}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setSurveyInfo(data);
        setLoading(false);
      })
      .catch(() => {
        setError("설문을 불러오는데 실패했습니다.");
        setLoading(false);
      });
  }, [params.token]);

  function setAnswer(childIdx: number, qIdx: number, value: number) {
    setAnswers((prev) => ({
      ...prev,
      [childIdx]: { ...prev[String(childIdx)], [qIdx]: value },
    }));
  }

  function getTabProgress(childIdx: number) {
    const ans = answers[String(childIdx)] || {};
    return Object.keys(ans).length;
  }

  function validateAll() {
    for (const tab of CHILD_TABS) {
      const info = childInfo[String(tab.index)];
      if (!info.name.trim()) {
        setActiveTab(tab.index);
        return `${tab.label}의 이름을 입력해 주세요.`;
      }
      const ans = answers[String(tab.index)] || {};
      for (let q = 0; q < QUESTIONS.length; q++) {
        if (!ans[q]) {
          setActiveTab(tab.index);
          return `${tab.label}: ${q + 1}번 문항에 응답해 주세요.`;
        }
      }
    }
    return "";
  }

  async function handleSubmit() {
    const err = validateAll();
    if (err) {
      setValidationError(err);
      return;
    }
    setValidationError("");
    setSubmitting(true);

    const payload = CHILD_TABS.map((tab) => ({
      childIndex: tab.index,
      childName: childInfo[String(tab.index)].name,
      gender: tab.gender,
      age: childInfo[String(tab.index)].age,
      answers: answers[String(tab.index)],
    }));

    try {
      const res = await fetch(`/api/survey/${params.token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: payload }),
      });
      const data = await res.json();
      if (data.success) setSubmitted(true);
      else setValidationError(data.error || "제출에 실패했습니다.");
    } catch {
      setValidationError("제출 중 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">접근 불가</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  if (submitted || surveyInfo?.completed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-3">설문 완료</h2>
          <p className="text-gray-600 mb-2">
            {surveyInfo?.teacherName} 선생님, 소중한 응답 감사합니다.
          </p>
          <p className="text-sm text-gray-500">
            {surveyInfo?.school} {surveyInfo?.grade}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-indigo-600 text-white py-6 px-4 shadow">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold">유아 디지털 역량 설문조사</h1>
          <p className="text-indigo-200 text-sm mt-1">
            {surveyInfo?.school} {surveyInfo?.grade} · {surveyInfo?.teacherName} 선생님
          </p>
        </div>
      </div>

      {/* Instructions */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-6">
          <p className="font-semibold mb-1">※ 안내사항</p>
          <ul className="list-disc list-inside space-y-1">
            <li>학급 자유놀이시간에 관찰한 유아의 행동을 바탕으로 응답해 주십시오.</li>
            <li>학급 출석부의 앞, 중간, 뒷 부분에서 남아 2명, 여아 2명을 무작위로 선정해 주십시오.</li>
            <li>각 탭을 클릭하여 유아별로 설문을 완성해 주십시오.</li>
            <li>모든 탭의 응답을 완료한 후 하단의 제출 버튼을 눌러 주십시오.</li>
          </ul>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          <div className="flex border-b">
            {CHILD_TABS.map((tab) => {
              const progress = getTabProgress(tab.index);
              const done = progress === QUESTIONS.length && childInfo[String(tab.index)].name;
              return (
                <button
                  key={tab.index}
                  onClick={() => setActiveTab(tab.index)}
                  className={`flex-1 py-4 px-2 text-sm font-semibold transition-colors relative ${
                    activeTab === tab.index
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <span className={`inline-block w-6 h-6 rounded-full text-xs leading-6 mr-1 ${
                    tab.gender === "남"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-pink-100 text-pink-700"
                  } ${activeTab === tab.index ? "bg-indigo-400 text-white" : ""}`}>
                    {tab.gender}
                  </span>
                  {tab.label}
                  {done && <span className="ml-1 text-green-400">✓</span>}
                  <div className="text-xs font-normal mt-0.5 opacity-75">
                    {progress}/{QUESTIONS.length}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          {CHILD_TABS.map((tab) => (
            <div key={tab.index} className={activeTab === tab.index ? "block" : "hidden"}>
              {/* Child Info */}
              <div className={`p-6 border-b ${tab.gender === "남" ? "bg-blue-50" : "bg-pink-50"}`}>
                <h3 className="font-bold text-gray-800 mb-4">
                  {tab.label} 기본 정보
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      유아 이름 <span className="text-red-500">*</span>
                      <span className="text-xs text-gray-400 ml-1">(연구자가 코딩 후 폐기)</span>
                    </label>
                    <input
                      type="text"
                      value={childInfo[String(tab.index)].name}
                      onChange={(e) =>
                        setChildInfo((prev) => ({
                          ...prev,
                          [tab.index]: { ...prev[String(tab.index)], name: e.target.value },
                        }))
                      }
                      placeholder="이름 입력"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      성별
                    </label>
                    <input
                      type="text"
                      value={tab.gender === "남" ? "남아" : "여아"}
                      disabled
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      연령 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={childInfo[String(tab.index)].age}
                      onChange={(e) =>
                        setChildInfo((prev) => ({
                          ...prev,
                          [tab.index]: { ...prev[String(tab.index)], age: e.target.value },
                        }))
                      }
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    >
                      <option>만3세</option>
                      <option>만4세</option>
                      <option>만5세</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Questions */}
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-6">
                  ※ 다음 문항들은 유아의 디지털 역량을 알아보기 위한 것입니다. 가장 적합하다고 생각되는 칸에 선택해 주십시오.
                </p>
                <div className="space-y-6">
                  {QUESTIONS.map((q, qIdx) => {
                    const selected = answers[String(tab.index)]?.[qIdx];
                    return (
                      <div key={qIdx} className="border border-gray-100 rounded-lg p-4 hover:border-indigo-200 transition-colors">
                        <p className="text-sm font-medium text-gray-800 mb-3">
                          <span className="inline-block bg-indigo-100 text-indigo-700 rounded px-2 py-0.5 text-xs mr-2">
                            {qIdx + 1}
                          </span>
                          {q}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {SCALE_LABELS.map((scale) => (
                            <button
                              key={scale.value}
                              onClick={() => setAnswer(tab.index, qIdx, scale.value)}
                              className={`flex-1 min-w-[80px] py-2 px-2 rounded-lg text-xs font-medium border transition-all ${
                                selected === scale.value
                                  ? "bg-indigo-600 text-white border-indigo-600 shadow-sm"
                                  : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600"
                              }`}
                            >
                              <span className="block text-base font-bold">{scale.value}</span>
                              {scale.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Next Tab Button */}
                {activeTab < 3 && (
                  <button
                    onClick={() => setActiveTab(activeTab + 1)}
                    className="mt-6 w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                  >
                    다음: {CHILD_TABS[activeTab + 1].label} →
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="mt-6 pb-12">
          {validationError && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              {validationError}
            </div>
          )}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-xl font-bold text-lg shadow-lg transition-colors"
          >
            {submitting ? "제출 중..." : "설문 최종 제출"}
          </button>
          <p className="text-center text-xs text-gray-400 mt-3">
            제출 전 모든 탭의 응답을 완료해 주세요. (26문항 × 4명)
          </p>
        </div>
      </div>
    </div>
  );
}
