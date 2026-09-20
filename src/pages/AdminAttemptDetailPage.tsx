import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Eye,
  ArrowLeft,
  Calendar,
  Layers,
  HelpCircle,
  Zap,
} from 'lucide-react'

export const AdminAttemptDetailPage: React.FC = () => {
  const { attemptId } = useParams()

  const attemptData = {
    id: attemptId || 'sample-attempt',
    studentName: 'Farida Ahmed',
    email: 'farida.ahmed@student.edu',
    assessmentTitle: 'High School Algebra I Benchmark Diagnostic',
    date: 'Sep 20, 2026, 11:40 AM',
    scorePct: 68,
    correctCount: 17,
    totalQuestions: 25,
    totalDuration: '42m 10s',
    avgTimePerQuestion: '1m 41s',
    pacingStatus: 'Balanced Pacing',
  }

  const questionLogs = [
    {
      num: 1,
      stem: 'If 3x + 7 = 22, what is the value of 6x - 5?',
      userAnswer: '25',
      correctAnswer: '25',
      isCorrect: true,
      timeSpent: '45s',
      domain: 'Heart of Algebra',
      behavior: 'Fast & Accurate',
    },
    {
      num: 2,
      stem: 'For which value of c does the quadratic equation 2x^2 - 8x + c = 0 have exactly one real solution?',
      userAnswer: '8',
      correctAnswer: '8',
      isCorrect: true,
      timeSpent: '1m 15s',
      domain: 'Passport to Advanced Math',
      behavior: 'Optimal Pace',
    },
    {
      num: 3,
      stem: 'A line in the xy-plane passes through (2, 5) and (6, 13). What is the y-intercept of the line?',
      userAnswer: '-1',
      correctAnswer: '1',
      isCorrect: false,
      timeSpent: '2m 10s',
      domain: 'Heart of Algebra',
      behavior: 'Time Sink / Error',
    },
    {
      num: 4,
      stem: 'The population of a bacterial culture triples every 4 hours. If there are initially 50 bacteria, which function models population P(t) after t hours?',
      userAnswer: 'P(t) = 50(3)^(t/4)',
      correctAnswer: 'P(t) = 50(3)^(t/4)',
      isCorrect: true,
      timeSpent: '1m 05s',
      domain: 'Passport to Advanced Math',
      behavior: 'Optimal Pace',
    },
    {
      num: 5,
      stem: 'In a right triangle, sin(θ) = 5/13. What is the value of cos(θ)?',
      userAnswer: '12/13',
      correctAnswer: '12/13',
      isCorrect: true,
      timeSpent: '35s',
      domain: 'Additional Topics (Trig)',
      behavior: 'Fast & Accurate',
    },
    {
      num: 6,
      stem: 'If |2x - 3| < 7, what is the range of possible integer values for x?',
      userAnswer: '-2 < x < 5',
      correctAnswer: '-2 < x < 5',
      isCorrect: true,
      timeSpent: '1m 30s',
      domain: 'Heart of Algebra',
      behavior: 'Optimal Pace',
    },
    {
      num: 7,
      stem: 'Which of the following is equivalent to (x^2 - 9)/(x^2 + 6x + 9) for all x ≠ -3?',
      userAnswer: '(x - 3)/(x + 3)',
      correctAnswer: '(x - 3)/(x + 3)',
      isCorrect: true,
      timeSpent: '50s',
      domain: 'Passport to Advanced Math',
      behavior: 'Fast & Accurate',
    },
    {
      num: 8,
      stem: 'A store offers a 20% discount on an item, followed by an additional 15% off the sale price. What is the total percent discount from the original price?',
      userAnswer: '35%',
      correctAnswer: '32%',
      isCorrect: false,
      timeSpent: '1m 55s',
      domain: 'Problem Solving & Data Analysis',
      behavior: 'Trap Choice Selected',
    },
  ]

  return (
    <AdminLayout
      title={`Attempt Audit: ${attemptData.studentName}`}
      subtitle={`Attempt ID: ${attemptData.id} • ${attemptData.assessmentTitle}`}
      showBackButton
      backButtonPath="/admin"
      actions={
        <Link
          to={`/report/${attemptData.id}`}
          target="_blank"
          rel="noreferrer"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
        >
          <Eye className="h-3.5 w-3.5" />
          <span>View Student Report</span>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Attempt Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Diagnostic Score</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{attemptData.scorePct}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {attemptData.correctCount} of {attemptData.totalQuestions} Correct
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Total Duration</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{attemptData.totalDuration}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Avg: {attemptData.avgTimePerQuestion} / item</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Pacing Profile</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">Normal</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{attemptData.pacingStatus}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Exam Date</p>
            <p className="text-sm font-bold text-slate-800 mt-1 truncate">{attemptData.date}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">{attemptData.email}</p>
          </div>
        </div>

        {/* Item-by-item breakdown */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Question-by-Question Response Log</h3>
              <p className="text-xs text-slate-500">Detailed verification of answers, timestamps, and behavioral tags</p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {questionLogs.map((q) => (
              <div
                key={q.num}
                className="p-4 hover:bg-slate-50/70 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl font-bold text-xs ${
                      q.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {q.num}
                  </div>

                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 line-clamp-2">{q.stem}</p>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                      <span className="font-medium text-slate-700">Domain: {q.domain}</span>
                      <span>•</span>
                      <span>
                        Student Answer:{' '}
                        <strong className={q.isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                          {q.userAnswer}
                        </strong>
                      </span>
                      {!q.isCorrect && (
                        <>
                          <span>•</span>
                          <span className="text-slate-600">
                            Correct: <strong className="text-emerald-700">{q.correctAnswer}</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="flex items-center justify-end gap-1 text-xs font-mono font-medium text-slate-600">
                      <Clock className="h-3 w-3 text-slate-400" />
                      <span>{q.timeSpent}</span>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full mt-1 inline-block ${
                        q.isCorrect
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {q.behavior}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminAttemptDetailPage
