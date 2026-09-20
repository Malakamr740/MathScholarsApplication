import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  BarChart3,
  Users,
  Award,
  Clock,
  Search,
  Eye,
  ArrowUpRight,
  Filter,
  Download,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react'

export const AssessmentResultsPage: React.FC = () => {
  const { assessmentId } = useParams()
  const [searchTerm, setSearchTerm] = useState('')

  const cohortStats = {
    totalAttempts: 142,
    averageScore: 68.4,
    medianScore: 72.0,
    topScore: 96.0,
    averageDuration: '41m 15s',
  }

  const studentAttempts = [
    {
      id: 'attempt-sat-101',
      studentName: 'Ziad Mansour',
      email: 'ziad.mansour@student.edu',
      date: 'Today, 2:15 PM',
      score: 84,
      correctCount: 21,
      totalCount: 25,
      timeSpent: '38m 20s',
      classification: 'Mastery Level',
      color: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'sample-attempt',
      studentName: 'Farida Ahmed',
      email: 'farida.ahmed@student.edu',
      date: 'Today, 11:40 AM',
      score: 68,
      correctCount: 17,
      totalCount: 25,
      timeSpent: '42m 10s',
      classification: 'Moderate Growth',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'attempt-sat-103',
      studentName: 'Omar Tarek',
      email: 'omar.tarek@student.edu',
      date: 'Yesterday, 4:55 PM',
      score: 45,
      correctCount: 9,
      totalCount: 20,
      timeSpent: '40m 00s',
      classification: 'Needs Foundation',
      color: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'attempt-sat-104',
      studentName: 'Youssef El-Sayed',
      email: 'youssef.sayed@student.edu',
      date: 'Yesterday, 1:20 PM',
      score: 92,
      correctCount: 23,
      totalCount: 25,
      timeSpent: '36m 45s',
      classification: 'Top Tier (Near 800)',
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      id: 'attempt-sat-105',
      studentName: 'Nouran Mostafa',
      email: 'nouran.m@student.edu',
      date: 'Sep 18, 10:15 AM',
      score: 76,
      correctCount: 19,
      totalCount: 25,
      timeSpent: '44m 30s',
      classification: 'Proficient',
      color: 'bg-blue-50 text-blue-700 border-blue-200',
    },
  ]

  const filteredAttempts = studentAttempts.filter(
    (sa) =>
      sa.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sa.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <AdminLayout
      title="Cohort Results & Diagnostic Analytics"
      subtitle={`Assessment: ${assessmentId} • Submissions & Item Diagnostics`}
      showBackButton
      backButtonPath={`/admin/assessments/${assessmentId}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            to={`/admin/assessments/${assessmentId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <span>Configure Assessment</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Cohort Overview Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Total Submissions</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{cohortStats.totalAttempts}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Assessed Students</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Cohort Mean Score</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{cohortStats.averageScore}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Median: {cohortStats.medianScore}%</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Top Score Recorded</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{cohortStats.topScore}%</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Near-Perfect Mastery</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <p className="text-xs text-slate-500 font-medium">Average Pacing</p>
            <p className="text-2xl font-bold text-slate-800 mt-1">{cohortStats.averageDuration}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Target: 45m 00s</p>
          </div>
        </div>

        {/* Submissions Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Student Attempts</h3>
              <p className="text-xs text-slate-500">Individual test logs and score calibration</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search students or email..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold">
                  <th className="p-3.5 pl-5">Student</th>
                  <th className="p-3.5">Date & Time</th>
                  <th className="p-3.5">Score</th>
                  <th className="p-3.5">Accuracy</th>
                  <th className="p-3.5">Duration</th>
                  <th className="p-3.5">Diagnostic Tier</th>
                  <th className="p-3.5 pr-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAttempts.map((sa) => (
                  <tr key={sa.id} className="hover:bg-slate-50/70 transition">
                    <td className="p-3.5 pl-5">
                      <p className="font-semibold text-slate-900">{sa.studentName}</p>
                      <p className="text-[10px] text-slate-400">{sa.email}</p>
                    </td>
                    <td className="p-3.5 text-slate-600">{sa.date}</td>
                    <td className="p-3.5 font-bold text-slate-900 text-sm">{sa.score}%</td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {sa.correctCount}/{sa.totalCount}
                    </td>
                    <td className="p-3.5 text-slate-600 font-mono">{sa.timeSpent}</td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${sa.color}`}>
                        {sa.classification}
                      </span>
                    </td>
                    <td className="p-3.5 pr-5 text-right space-x-2">
                      <Link
                        to={`/report/${sa.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-medium transition"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Report</span>
                      </Link>
                      <Link
                        to={`/admin/attempts/${sa.id}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold transition"
                      >
                        <span>Audit</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AssessmentResultsPage
