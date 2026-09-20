import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  FileText,
  Clock,
  Users,
  Settings,
  Share2,
  Eye,
  BarChart3,
  Layers,
  ChevronRight,
  Save,
  CheckCircle2,
  Copy,
  Plus,
  Trash2,
  Sliders,
  Calculator,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  ShieldCheck,
  Edit3,
  X,
} from 'lucide-react'
import {
  assessmentService,
  Assessment,
  AssessmentSection,
  SectionSettings,
  DEFAULT_SECTION_SETTINGS,
} from '../lib/assessmentService'
import { questionBankService } from '../lib/questionBankService'

export const AssessmentDetailPage: React.FC = () => {
  const { assessmentId } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [activeTab, setActiveTab] = useState<'sections' | 'settings'>('sections')
  const [copied, setCopied] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Section modal state
  const [editingSection, setEditingSection] = useState<AssessmentSection | null>(null)
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false)
  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [newSectionDesc, setNewSectionDesc] = useState('')
  const [newSectionSettings, setNewSectionSettings] = useState<SectionSettings>({
    ...DEFAULT_SECTION_SETTINGS,
  })

  const loadAssessment = () => {
    if (!assessmentId) return
    const found = assessmentService.getAssessmentById(assessmentId)
    if (found) {
      setAssessment(JSON.parse(JSON.stringify(found)))
    } else {
      setError(`Assessment "${assessmentId}" not found.`)
    }
  }

  useEffect(() => {
    loadAssessment()
  }, [assessmentId])

  if (!assessment) {
    return (
      <AdminLayout title="Assessment Details" showBackButton backButtonPath="/admin/assessments">
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Assessment Not Found</h3>
          <p className="text-xs text-slate-500">{error || 'Could not load assessment.'}</p>
          <Link
            to="/admin/assessments"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Back to Assessments
          </Link>
        </div>
      </AdminLayout>
    )
  }

  const shareUrl = `${window.location.origin}/assessment/${assessment.id}`

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Save overall assessment updates
  const handleSaveAssessment = () => {
    if (!assessment) return
    setError(null)

    const validation = assessmentService.validateAssessment(assessment)
    if (!validation.valid) {
      setError(validation.errors[0])
      return
    }

    const saved = assessmentService.saveAssessment(assessment)
    setAssessment(JSON.parse(JSON.stringify(saved)))
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  // Section operations
  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    if (!assessment) return
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= assessment.sections.length) return

    const newSections = [...assessment.sections]
    const temp = newSections[idx]
    newSections[idx] = newSections[targetIdx]
    newSections[targetIdx] = temp

    const updated = {
      ...assessment,
      sections: newSections.map((s, i) => ({ ...s, orderIndex: i })),
    }
    setAssessment(updated)
    assessmentService.saveAssessment(updated)
  }

  const handleDeleteSection = (secId: string) => {
    if (!assessment) return
    if (assessment.sections.length <= 1) {
      setError('An assessment must have at least one section.')
      return
    }
    if (window.confirm('Are you sure you want to delete this section?')) {
      const res = assessmentService.deleteSection(assessment.id, secId)
      if (res.success && res.assessment) {
        setAssessment(JSON.parse(JSON.stringify(res.assessment)))
      } else if (res.error) {
        setError(res.error)
      }
    }
  }

  const handleDuplicateSection = (secId: string) => {
    if (!assessment) return
    const target = assessment.sections.find((s) => s.id === secId)
    if (!target) return

    const newSec: AssessmentSection = {
      ...target,
      id: `sec-${Date.now()}-${assessment.sections.length + 1}`,
      title: `${target.title} (Copy)`,
      orderIndex: assessment.sections.length,
      questions: [...target.questions],
    }

    const updated = {
      ...assessment,
      sections: [...assessment.sections, newSec],
    }
    setAssessment(updated)
    assessmentService.saveAssessment(updated)
  }

  const handleOpenAddSectionModal = () => {
    setNewSectionTitle(`Section ${assessment.sections.length + 1}: Diagnostic Module`)
    setNewSectionDesc('Curriculum diagnostic module instructions and pacing.')
    setNewSectionSettings({ ...DEFAULT_SECTION_SETTINGS, timeLimitMinutes: 20 })
    setIsAddSectionModalOpen(true)
  }

  const handleConfirmAddSection = () => {
    if (!assessment) return
    if (!newSectionTitle.trim()) {
      setError('Section title is required.')
      return
    }

    const bank = questionBankService.getStoredQuestions()
    const seededQuestions = bank.slice(0, 5)

    const res = assessmentService.addSection(assessment.id, {
      title: newSectionTitle.trim(),
      description: newSectionDesc.trim(),
      settings: newSectionSettings,
      questions: seededQuestions,
    })

    if (res) {
      setAssessment(JSON.parse(JSON.stringify(res)))
      setIsAddSectionModalOpen(false)
      setError(null)
    }
  }

  const handleSaveEditedSectionSettings = () => {
    if (!assessment || !editingSection) return
    const res = assessmentService.updateSection(assessment.id, editingSection.id, {
      title: editingSection.title,
      description: editingSection.description,
      settings: editingSection.settings,
    })
    if (res) {
      setAssessment(JSON.parse(JSON.stringify(res)))
      setEditingSection(null)
    }
  }

  const totalQuestions = assessmentService.getTotalQuestions(assessment)
  const totalDuration = assessmentService.getTotalDurationMinutes(assessment)

  return (
    <AdminLayout
      title={assessment.title}
      subtitle={`Code: ${assessment.code || assessment.id} • ${assessment.level} • ${assessment.targetExam}`}
      showBackButton
      backButtonPath="/admin/assessments"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Share2 className="h-3.5 w-3.5" />
            )}
            <span>{copied ? 'Link Copied!' : 'Share Student Link'}</span>
          </button>

          <Link
            to={`/admin/assessments/${assessment.id}/results`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            <BarChart3 className="h-3.5 w-3.5 text-indigo-600" />
            <span>Analytics</span>
          </Link>

          <Link
            to={`/assessment/${assessment.id}`}
            style={{ backgroundColor: '#10b981', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition shadow-xs"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>Student Preview</span>
          </Link>

          <button
            type="button"
            onClick={handleSaveAssessment}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save All</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6 max-w-5xl">
        {savedSuccess && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Assessment configurations saved successfully!</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Quick KPI Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Sections Count
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">
                {assessment.sections.length}
              </span>
              <span className="text-xs text-slate-500 font-medium">Modular Sections</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Questions
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-blue-600">{totalQuestions}</span>
              <span className="text-xs text-slate-500 font-medium">Assigned Items</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Total Duration
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-slate-900">{totalDuration}</span>
              <span className="text-xs text-slate-500 font-medium">Minutes Pacing</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              Mastery Target
            </span>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-xl font-extrabold text-emerald-600">
                {assessment.settings.passingScorePct}%
              </span>
              <span className="text-xs text-slate-500 font-medium">Threshold</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'sections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Generic Sections ({assessment.sections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Assessment Settings & Intake Policies</span>
          </button>
        </div>

        {/* Tab Content 1: Sections Manager */}
        {activeTab === 'sections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Layers className="h-4 w-4 text-blue-600" />
                  <span>Assessment Sections & Independent Settings</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Every section maintains its own independent calculator toolbar, timing mode, and navigation rules. Minimum 1 question per section.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddSectionModal}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-3">
              {assessment.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-200 transition space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Reorder arrows */}
                      <div className="flex flex-col items-center shrink-0">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                          title="Move Up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === assessment.sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                          title="Move Down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{sec.title}</h4>
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            {sec.questions.length} {sec.questions.length === 1 ? 'Item' : 'Items'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">{sec.description}</p>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingSection(JSON.parse(JSON.stringify(sec)))}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition cursor-pointer"
                        title="Edit Section Settings"
                      >
                        <Sliders className="h-3.5 w-3.5 text-blue-600" />
                        <span>Section Settings</span>
                      </button>

                      <Link
                        to={`/admin/assessments/${assessment.id}/modules/${sec.id}`}
                        style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs"
                      >
                        <FileText className="h-3.5 w-3.5" />
                        <span>Manage Questions ({sec.questions.length})</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDuplicateSection(sec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                        title="Duplicate Section"
                      >
                        <Copy className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSection(sec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Section Settings Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                    <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {sec.settings.timingMode === 'timed'
                        ? `${sec.settings.timeLimitMinutes} Mins`
                        : sec.settings.timingMode === 'untimed'
                        ? 'Untimed'
                        : 'Per Question'}
                    </span>

                    <span
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border ${
                        sec.settings.calculatorType === 'none'
                          ? 'bg-rose-50 border-rose-200 text-rose-800'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      }`}
                    >
                      <Calculator className="h-3 w-3" />
                      {sec.settings.calculatorType === 'none'
                        ? 'No Calculator'
                        : sec.settings.calculatorType === 'desmos'
                        ? 'Desmos Graphing'
                        : sec.settings.calculatorType === 'scientific'
                        ? 'Scientific'
                        : 'Basic'}
                    </span>

                    <span className="bg-slate-50 border border-slate-200 text-slate-600 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                      Navigation: {sec.settings.navigationMode === 'free' ? 'Free (Back & Forth)' : 'Forward Only'}
                    </span>

                    {sec.settings.shuffleQuestions && (
                      <span className="bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                        Shuffled Questions
                      </span>
                    )}

                    {sec.settings.breakAfterSectionMinutes > 0 && (
                      <span className="bg-amber-50 border border-amber-200 text-amber-800 px-2.5 py-1 rounded-lg text-[11px] font-medium">
                        +{sec.settings.breakAfterSectionMinutes}m Rest Break After
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Content 2: Assessment Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-600" />
                <span>Assessment Configurations & Policy Parameters</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Each assessment possesses its own unique settings, intake fields, and examination rules.
              </p>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assessment Name
                  </label>
                  <input
                    type="text"
                    value={assessment.title}
                    onChange={(e) => setAssessment({ ...assessment, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Assessment Identifier / Code
                  </label>
                  <input
                    type="text"
                    value={assessment.code || ''}
                    onChange={(e) => setAssessment({ ...assessment, code: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Grade / Academic Cohort
                  </label>
                  <input
                    type="text"
                    value={assessment.level}
                    onChange={(e) => setAssessment({ ...assessment, level: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Exam / Curriculum
                  </label>
                  <input
                    type="text"
                    value={assessment.targetExam}
                    onChange={(e) => setAssessment({ ...assessment, targetExam: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Target Mastery Threshold (%)
                  </label>
                  <input
                    type="number"
                    min={20}
                    max={100}
                    value={assessment.settings.passingScorePct}
                    onChange={(e) =>
                      setAssessment({
                        ...assessment,
                        settings: {
                          ...assessment.settings,
                          passingScorePct: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  General Directions / Student Instructions
                </label>
                <textarea
                  value={assessment.settings.instructions}
                  onChange={(e) =>
                    setAssessment({
                      ...assessment,
                      settings: {
                        ...assessment.settings,
                        instructions: e.target.value,
                      },
                    })
                  }
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Student Intake Requirements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.requireHonorCode}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            requireHonorCode: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Academic Integrity / Honor Code Confirmation</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.requireSchool}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            requireSchool: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require School / Institution Name</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.requirePhone}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            requirePhone: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Student Phone Number</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.requireStudentId}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            requireStudentId: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Student ID / Candidate Number</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Examination & Post-Test Feedback
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.showResultsImmediately}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            showResultsImmediately: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show Personalized Growth Report Immediately After Exam</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.enablePostSurvey}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            enablePostSurvey: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Trigger Post-Assessment Diagnostic Survey & Action Plan</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={assessment.settings.shuffleSections}
                      onChange={(e) =>
                        setAssessment({
                          ...assessment,
                          settings: {
                            ...assessment.settings,
                            shuffleSections: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Randomize Section Order for Each Student</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveAssessment}
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>Save Assessment Settings</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add New Section */}
      {isAddSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600" />
                <span>Add Section to Assessment</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddSectionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={newSectionTitle}
                  onChange={(e) => setNewSectionTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newSectionDesc}
                  onChange={(e) => setNewSectionDesc(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Calculator Mode</label>
                  <select
                    value={newSectionSettings.calculatorType}
                    onChange={(e) =>
                      setNewSectionSettings({
                        ...newSectionSettings,
                        calculatorType: e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value="none">No Calculator (None)</option>
                    <option value="desmos">Desmos Graphing</option>
                    <option value="scientific">Scientific</option>
                    <option value="basic">Basic Four-Function</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Limit (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={newSectionSettings.timeLimitMinutes}
                    onChange={(e) =>
                      setNewSectionSettings({
                        ...newSectionSettings,
                        timeLimitMinutes: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Navigation</label>
                  <select
                    value={newSectionSettings.navigationMode}
                    onChange={(e) =>
                      setNewSectionSettings({
                        ...newSectionSettings,
                        navigationMode: e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value="free">Free (Back & Forth)</option>
                    <option value="forward_only">Forward Only</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Break After</label>
                  <select
                    value={newSectionSettings.breakAfterSectionMinutes}
                    onChange={(e) =>
                      setNewSectionSettings({
                        ...newSectionSettings,
                        breakAfterSectionMinutes: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value={0}>No Break</option>
                    <option value={5}>5-Min Break</option>
                    <option value={10}>10-Min Break</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsAddSectionModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmAddSection}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Add Section
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit Section Settings */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Configure Settings for: {editingSection.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Section Title</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Section Directions / Description
                </label>
                <textarea
                  value={editingSection.description}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, description: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Timing Mode</label>
                  <select
                    value={editingSection.settings.timingMode}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        settings: {
                          ...editingSection.settings,
                          timingMode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value="timed">Timed Section</option>
                    <option value="untimed">Untimed</option>
                    <option value="per_question">Per Question</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Time Limit (Mins)</label>
                  <input
                    type="number"
                    min={1}
                    max={180}
                    value={editingSection.settings.timeLimitMinutes}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        settings: {
                          ...editingSection.settings,
                          timeLimitMinutes: Math.max(1, parseInt(e.target.value) || 1),
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Calculator Tool</label>
                  <select
                    value={editingSection.settings.calculatorType}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        settings: {
                          ...editingSection.settings,
                          calculatorType: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value="none">No Calculator (Prohibited)</option>
                    <option value="desmos">Desmos Graphing</option>
                    <option value="scientific">Scientific</option>
                    <option value="basic">Basic Four-Function</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Navigation Rules</label>
                  <select
                    value={editingSection.settings.navigationMode}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        settings: {
                          ...editingSection.settings,
                          navigationMode: e.target.value as any,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value="free">Free (Back & Forth)</option>
                    <option value="forward_only">Forward-Only / Linear</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Break After Section</label>
                  <select
                    value={editingSection.settings.breakAfterSectionMinutes}
                    onChange={(e) =>
                      setEditingSection({
                        ...editingSection,
                        settings: {
                          ...editingSection.settings,
                          breakAfterSectionMinutes: parseInt(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value={0}>No Break</option>
                    <option value={5}>5 Minutes</option>
                    <option value={10}>10 Minutes</option>
                    <option value={15}>15 Minutes</option>
                  </select>
                </div>

                <div className="flex flex-col justify-end space-y-2 pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.settings.shuffleQuestions}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            shuffleQuestions: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Shuffle Questions</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingSection.settings.allowReviewBeforeSubmit}
                      onChange={(e) =>
                        setEditingSection({
                          ...editingSection,
                          settings: {
                            ...editingSection.settings,
                            allowReviewBeforeSubmit: e.target.checked,
                          },
                        })
                      }
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Review Screen Before Submit</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingSection(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedSectionSettings}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
              >
                Update Section Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default AssessmentDetailPage
