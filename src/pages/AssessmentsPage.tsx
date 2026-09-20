import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  Plus,
  FileText,
  ChevronRight,
  Clock,
  Users,
  Layers,
  Copy,
  Trash2,
  Sliders,
  CheckCircle2,
} from 'lucide-react'
import { assessmentService, Assessment } from '../lib/assessmentService'

export const AssessmentsPage: React.FC = () => {
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [notification, setNotification] = useState<string | null>(null)

  const reload = () => {
    setAssessments(assessmentService.getAllAssessments())
  }

  useEffect(() => {
    reload()
  }, [])

  const handleDuplicate = (id: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const copy = assessmentService.duplicateAssessment(id)
    if (copy) {
      setNotification(`Assessment duplicated as "${copy.title}"`)
      reload()
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleDelete = (id: string, title: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (window.confirm(`Are you sure you want to delete assessment "${title}"?`)) {
      assessmentService.deleteAssessment(id)
      setNotification(`Assessment "${title}" removed.`)
      reload()
      setTimeout(() => setNotification(null), 3000)
    }
  }

  return (
    <AdminLayout
      title="Assessments"
      subtitle="Manage diagnostic assessments, multi-section structures, and custom test settings"
      actions={
        <Link
          to="/admin/assessments/new"
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
        >
          <Plus className="h-4 w-4" />
          <span>New Assessment</span>
        </Link>
      }
    >
      {notification && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {assessments.map((a) => {
          const totalQuestions = assessmentService.getTotalQuestions(a)
          const totalDuration = assessmentService.getTotalDurationMinutes(a)

          return (
            <div
              key={a.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex flex-col justify-between shadow-2xs"
            >
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      {a.level}
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                      {a.targetExam}
                    </span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {totalDuration} mins
                  </span>
                </div>

                <h3 className="mt-2.5 text-sm font-bold text-slate-900 leading-snug">
                  {a.title}
                </h3>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {a.description}
                </p>

                {/* Section breakdown tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {a.sections.map((sec, idx) => (
                    <span
                      key={sec.id}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-medium truncate max-w-[200px]"
                      title={`${sec.title} (${sec.questions.length} questions, ${sec.settings.timeLimitMinutes} min)`}
                    >
                      S{idx + 1}: {sec.questions.length}q ({sec.settings.calculatorType === 'none' ? 'No Calc' : 'Calc'})
                    </span>
                  ))}
                </div>

                <div className="mt-3 flex items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3.5 w-3.5 text-blue-600" />
                    <span className="font-semibold text-slate-700">{a.sections.length}</span>{' '}
                    {a.sections.length === 1 ? 'Section' : 'Sections'}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-700">{totalQuestions}</span> Items
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    {a.attemptsCount || 0} completed
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/assessment/${a.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                    title="Experience this diagnostic test from the student viewpoint"
                  >
                    <span>Student Preview</span>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDuplicate(a.id, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                    title="Duplicate Assessment"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={(e) => handleDelete(a.id, a.title, e)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Assessment"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to={`/admin/assessments/${a.id}/results`}
                    className="text-xs text-slate-500 hover:text-blue-600 transition"
                  >
                    Analytics
                  </Link>
                  <Link
                    to={`/admin/assessments/${a.id}`}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    Configure <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </AdminLayout>
  )
}

export default AssessmentsPage
