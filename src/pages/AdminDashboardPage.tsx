import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  FileText,
  HelpCircle,
  Users,
  Award,
  Clock,
  ArrowUpRight,
  Plus,
  BarChart3,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Sliders,
  Eye,
} from 'lucide-react'
import { questionBankService } from '../lib/questionBankService'

export const AdminDashboardPage: React.FC = () => {
  const [questionsCount] = useState(() => {
    try {
      return questionBankService.getStoredQuestions().length || 54
    } catch {
      return 54
    }
  })

  const stats = [
    {
      label: 'Active Assessments',
      value: '3',
      subtext: 'EST 1 & SAT Diagnostics',
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      label: 'Question Bank Items',
      value: questionsCount.toString(),
      subtext: '4 Major Domains Categorized',
      icon: HelpCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Diagnostic Submissions',
      value: '287',
      subtext: 'From Grade 9 - 12 Cohorts',
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      label: 'Cohort Average Score',
      value: '67.4%',
      subtext: 'Scaled Benchmark: 540 / 800',
      icon: Award,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
  ]

  const recentAttempts = [
    {
      id: 'attempt-sat-101',
      studentName: 'Ziad Mansour',
      assessment: 'High School Algebra I Benchmark Diagnostic',
      date: 'Today, 2:15 PM',
      score: 84,
      totalQuestions: 25,
      correctCount: 21,
      duration: '38m 20s',
      status: 'Mastery Level',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
    },
    {
      id: 'sample-attempt',
      studentName: 'Farida Ahmed',
      assessment: 'High School Algebra I Benchmark Diagnostic',
      date: 'Today, 11:40 AM',
      score: 68,
      totalQuestions: 25,
      correctCount: 17,
      duration: '42m 10s',
      status: 'Moderate Growth',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'attempt-sat-103',
      studentName: 'Omar Tarek',
      assessment: 'Geometric Proofs and Congruence Diagnostic',
      date: 'Yesterday, 4:55 PM',
      score: 45,
      totalQuestions: 20,
      correctCount: 9,
      duration: '40m 00s',
      status: 'Needs Foundation',
      statusColor: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'attempt-sat-104',
      studentName: 'Youssef El-Sayed',
      assessment: 'Pre-Calculus & Functions Readiness Evaluation',
      date: 'Yesterday, 1:20 PM',
      score: 92,
      totalQuestions: 30,
      correctCount: 28,
      duration: '52m 15s',
      status: 'Top Tier (Near 800)',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
  ]

  const domainsMastery = [
    { domain: 'Heart of Algebra', mastery: 74, status: 'Strong', count: 48 },
    { domain: 'Passport to Advanced Math', mastery: 61, status: 'Moderate', count: 52 },
    { domain: 'Problem Solving & Data Analysis', mastery: 69, status: 'Moderate', count: 36 },
    { domain: 'Additional Topics in Math (Geometry & Trig)', mastery: 52, status: 'Foundation Needed', count: 28 },
  ]

  return (
    <AdminLayout
      title="Diagnostic Intelligence Dashboard"
      subtitle="Comprehensive overview of mathematics diagnostics, student cohorts, and taxonomy coverage"
      actions={
        <div className="flex items-center gap-2">
          <Link
            to="/admin/questions/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Question</span>
          </Link>
          <Link
            to="/admin/assessments/new"
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Assessment</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => {
            const Icon = stat.icon
            return (
              <div
                key={i}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-slate-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{stat.subtext}</p>
                </div>
                <div className={`p-3 rounded-2xl ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            )
          })}
        </div>

        {/* Action Hub Quick Links */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <h2 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
            <Sliders className="h-4 w-4 text-blue-600" />
            <span>Platform Modules & Management</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              to="/admin/assessments"
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">📝</div>
              <p className="text-xs font-bold text-slate-800">Assessments</p>
              <p className="text-[10px] text-slate-500">Configure tests</p>
            </Link>

            <Link
              to="/admin/questions"
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">📚</div>
              <p className="text-xs font-bold text-slate-800">Question Bank</p>
              <p className="text-[10px] text-slate-500">Curated problems</p>
            </Link>

            <Link
              to="/admin/taxonomy"
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">🏷️</div>
              <p className="text-xs font-bold text-slate-800">Taxonomy Tree</p>
              <p className="text-[10px] text-slate-500">Domains & Lessons</p>
            </Link>

            <Link
              to="/admin/levels"
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">🎯</div>
              <p className="text-xs font-bold text-slate-800">Levels & Grades</p>
              <p className="text-[10px] text-slate-500">Curriculums</p>
            </Link>

            <Link
              to="/admin/survey-action-plans"
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">✨</div>
              <p className="text-xs font-bold text-slate-800">Survey & Plans</p>
              <p className="text-[10px] text-slate-500">Action roadmaps</p>
            </Link>

            <Link
              to="/admin/settings"
              className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-blue-50/50 hover:border-blue-200 transition text-center group"
            >
              <div className="text-xl mb-1 group-hover:scale-110 transition-transform">⚙️</div>
              <p className="text-xs font-bold text-slate-800">Settings</p>
              <p className="text-[10px] text-slate-500">Fields & Branding</p>
            </Link>
          </div>
        </div>

        {/* Two-Column Grid: Recent Attempts & Curriculum Domain Mastery */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Attempts */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden flex flex-col">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Recent Student Diagnostic Attempts</h3>
                <p className="text-xs text-slate-500">Latest completed tests with immediate diagnostic generation</p>
              </div>
              <Link
                to="/admin/assessments"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                <span>View All Assessments</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100 overflow-x-auto">
              {recentAttempts.map((attempt) => (
                <div
                  key={attempt.id}
                  className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{attempt.studentName}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${attempt.statusColor}`}>
                        {attempt.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5 truncate">{attempt.assessment}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>{attempt.date}</span>
                      <span>•</span>
                      <span>{attempt.duration}</span>
                      <span>•</span>
                      <span>{attempt.correctCount}/{attempt.totalQuestions} Correct</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-base font-bold text-slate-900">{attempt.score}%</p>
                      <p className="text-[10px] text-slate-400">Mastery</p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Link
                        to={`/report/${attempt.id}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 text-slate-600 hover:text-blue-700 transition"
                        title="View Student Report"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/admin/attempts/${attempt.id}`}
                        className="p-2 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-100 text-slate-700 transition"
                        title="Admin Detail View"
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Domain Mastery Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Domain Performance</h3>
                <span className="text-[11px] text-slate-400">Aggregate cohort</span>
              </div>

              <div className="mt-4 space-y-4">
                {domainsMastery.map((dm, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 line-clamp-1">{dm.domain}</span>
                      <span className="font-mono font-bold text-slate-900">{dm.mastery}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          dm.mastery >= 75
                            ? 'bg-emerald-500'
                            : dm.mastery >= 55
                            ? 'bg-blue-500'
                            : 'bg-amber-500'
                        }`}
                        style={{ width: `${dm.mastery}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400">
                      <span>{dm.status}</span>
                      <span>{dm.count} Questions Tested</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100">
              <Link
                to="/admin/taxonomy"
                className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition border border-slate-200"
              >
                <span>Explore Full Taxonomy Analysis</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}

export default AdminDashboardPage
