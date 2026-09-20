import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  Save,
  Clock,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  AlertCircle,
  Calculator,
  Compass,
  Shuffle,
  ChevronDown,
  ChevronUp,
  FileText,
  Copy,
  ShieldAlert,
} from 'lucide-react'
import {
  assessmentService,
  Assessment,
  AssessmentSection,
  SectionSettings,
  DEFAULT_SECTION_SETTINGS,
  DEFAULT_ASSESSMENT_SETTINGS,
} from '../lib/assessmentService'
import { questionBankService, QuestionBankItem } from '../lib/questionBankService'

interface DraftSection extends AssessmentSection {
  isExpanded?: boolean
}

export const CreateAssessmentPage: React.FC = () => {
  const navigate = useNavigate()
  const storedBank = questionBankService.getStoredQuestions()

  // Assessment Info
  const [title, setTitle] = useState('')
  const [code, setCode] = useState(`ASSESS-${Math.floor(1000 + Math.random() * 9000)}`)
  const [level, setLevel] = useState('Grade 10')
  const [targetExam, setTargetExam] = useState('EST 1 / SAT Math')
  const [description, setDescription] = useState('')

  // Assessment Settings
  const [passingScorePct, setPassingScorePct] = useState(65)
  const [instructions, setInstructions] = useState(DEFAULT_ASSESSMENT_SETTINGS.instructions)
  const [requireHonorCode, setRequireHonorCode] = useState(true)
  const [requireSchool, setRequireSchool] = useState(false)
  const [requirePhone, setRequirePhone] = useState(false)
  const [requireStudentId, setRequireStudentId] = useState(false)
  const [showResultsImmediately, setShowResultsImmediately] = useState(true)
  const [enablePostSurvey, setEnablePostSurvey] = useState(true)
  const [shuffleSections, setShuffleSections] = useState(false)
  const [accessPassword, setAccessPassword] = useState('')

  // Generic Sections (each with its own settings and minimum 1 question)
  const [sections, setSections] = useState<DraftSection[]>([
    {
      id: `sec-${Date.now()}-1`,
      title: 'Section 1: Non-Calculator Foundations',
      description: 'Single-variable equations, linear systems, and algebraic inequalities without calculator.',
      orderIndex: 0,
      settings: {
        ...DEFAULT_SECTION_SETTINGS,
        timeLimitMinutes: 20,
        calculatorType: 'none',
        breakAfterSectionMinutes: 5,
      },
      questions: storedBank.slice(0, 5),
      isExpanded: true,
    },
    {
      id: `sec-${Date.now()}-2`,
      title: 'Section 2: Calculator Active Modeling & Functions',
      description: 'Quadratics, radicals, exponential growth, and geometry with embedded Desmos graphing calculator.',
      orderIndex: 1,
      settings: {
        ...DEFAULT_SECTION_SETTINGS,
        timeLimitMinutes: 25,
        calculatorType: 'desmos',
        breakAfterSectionMinutes: 0,
      },
      questions: storedBank.slice(5, 12),
      isExpanded: false,
    },
  ])

  const [activeTab, setActiveTab] = useState<'sections' | 'settings'>('sections')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAddSection = () => {
    const nextIdx = sections.length + 1
    const newSec: DraftSection = {
      id: `sec-${Date.now()}-${nextIdx}`,
      title: `Section ${nextIdx}: Diagnostic Module`,
      description: 'Section specific focus area and curriculum items.',
      orderIndex: sections.length,
      settings: {
        ...DEFAULT_SECTION_SETTINGS,
        timeLimitMinutes: 20,
      },
      questions: storedBank.slice(0, 4), // Minimum of 1 question seeded
      isExpanded: true,
    }
    setSections((prev) => [...prev, newSec])
    setError(null)
  }

  const handleRemoveSection = (secId: string) => {
    if (sections.length <= 1) {
      setError('An assessment must have at least 1 section.')
      return
    }
    setSections((prev) => prev.filter((s) => s.id !== secId).map((s, idx) => ({ ...s, orderIndex: idx })))
    setError(null)
  }

  const handleDuplicateSection = (secId: string) => {
    const target = sections.find((s) => s.id === secId)
    if (!target) return
    const newSec: DraftSection = {
      ...target,
      id: `sec-${Date.now()}-${sections.length + 1}`,
      title: `${target.title} (Copy)`,
      orderIndex: sections.length,
      questions: [...target.questions],
      isExpanded: true,
    }
    setSections((prev) => [...prev, newSec])
  }

  const handleMoveSection = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= sections.length) return
    const updated = [...sections]
    const temp = updated[idx]
    updated[idx] = updated[targetIdx]
    updated[targetIdx] = temp
    setSections(updated.map((s, i) => ({ ...s, orderIndex: i })))
  }

  const updateSectionField = (secId: string, field: keyof AssessmentSection, value: any) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, [field]: value } : s))
    )
  }

  const updateSectionSetting = (
    secId: string,
    settingKey: keyof SectionSettings,
    value: any
  ) => {
    setSections((prev) =>
      prev.map((s) =>
        s.id === secId
          ? {
              ...s,
              settings: {
                ...s.settings,
                [settingKey]: value,
              },
            }
          : s
      )
    )
  }

  const toggleExpand = (secId: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, isExpanded: !s.isExpanded } : s))
    )
  }

  // Quick adjust question count for draft section
  const handleAdjustQuestionCount = (secId: string, count: number) => {
    const targetCount = Math.max(1, count)
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s
        if (targetCount === s.questions.length) return s
        if (targetCount > s.questions.length) {
          const needed = targetCount - s.questions.length
          const additional = storedBank.slice(0, needed)
          return { ...s, questions: [...s.questions, ...additional] }
        } else {
          return { ...s, questions: s.questions.slice(0, targetCount) }
        }
      })
    )
  }

  const totalQuestions = sections.reduce((sum, s) => sum + s.questions.length, 0)
  const totalDuration = sections.reduce((sum, s) => {
    const base = s.settings.timingMode === 'timed' ? s.settings.timeLimitMinutes : 0
    return sum + base + (s.settings.breakAfterSectionMinutes || 0)
  }, 0)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Please provide an assessment title.')
      return
    }

    if (sections.length < 1) {
      setError('Assessment must have at least one section.')
      return
    }

    // Verify minimum 1 question per section constraint
    for (let i = 0; i < sections.length; i++) {
      const sec = sections[i]
      if (!sec.title.trim()) {
        setError(`Section ${i + 1} must have a title.`)
        return
      }
      if (!sec.questions || sec.questions.length < 1) {
        setError(
          `Section "${sec.title || i + 1}" must have at least 1 question (minimum of 1 required).`
        )
        return
      }
    }

    setIsSaving(true)

    const cleanSections: AssessmentSection[] = sections.map((s, idx) => ({
      id: s.id,
      title: s.title.trim(),
      description: s.description.trim(),
      orderIndex: idx,
      settings: s.settings,
      questions: s.questions,
    }))

    const newAssessment: Partial<Assessment> = {
      title: title.trim(),
      code: code.trim() || undefined,
      description: description.trim(),
      level,
      targetExam,
      status: 'active',
      settings: {
        passingScorePct,
        instructions: instructions.trim(),
        requireHonorCode,
        requireSchool,
        requirePhone,
        requireStudentId,
        showResultsImmediately,
        enablePostSurvey,
        shuffleSections,
        accessPassword: accessPassword.trim() || undefined,
      },
      sections: cleanSections,
    }

    try {
      const created = assessmentService.createAssessment(newAssessment)
      setTimeout(() => {
        setIsSaving(false)
        navigate(`/admin/assessments/${created.id}`)
      }, 400)
    } catch (err: any) {
      setIsSaving(false)
      setError(err?.message || 'Failed to create assessment.')
    }
  }

  return (
    <AdminLayout
      title="Create New Assessment"
      subtitle="Generic assessment builder with independent section settings and custom policies"
      showBackButton
      backButtonPath="/admin/assessments"
      actions={
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition shadow-xs cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>{isSaving ? 'Saving...' : 'Create Assessment'}</span>
        </button>
      }
    >
      <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Overview Information */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="h-4 w-4 text-blue-600" />
              <span>Assessment Overview</span>
            </h2>
            <div className="text-xs text-slate-500 font-medium flex items-center gap-3">
              <span>{sections.length} Sections</span>
              <span>•</span>
              <span>{totalQuestions} Questions</span>
              <span>•</span>
              <span>~{totalDuration} Minutes</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assessment Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. High School Mathematics Diagnostic & Benchmark 2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Assessment Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="e.g. EST-MATH-M1"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Academic Level
                </label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 9-10">Grade 9-10</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 11-12">Grade 11-12</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Accelerated Math">Accelerated Math</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Target Curriculum / Exam
                </label>
                <select
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="EST 1 / SAT Math">EST 1 / SAT Math</option>
                  <option value="EST 2 Math Level 1">EST 2 Math Level 1</option>
                  <option value="EST 2 Math Level 2">EST 2 Math Level 2</option>
                  <option value="ACT Math">ACT Math</option>
                  <option value="Standard Common Core">Standard Common Core</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Mastery Passing Threshold (%)
                </label>
                <input
                  type="number"
                  min={20}
                  max={100}
                  value={passingScorePct}
                  onChange={(e) => setPassingScorePct(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Assessment Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Explain the scope and purpose of this diagnostic assessment..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            type="button"
            onClick={() => setActiveTab('sections')}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'sections'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>Sections & Section Settings ({sections.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`pb-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="h-4 w-4" />
            <span>Assessment Policies & Intake Settings</span>
          </button>
        </div>

        {/* Tab 1: Generic Sections & Section Settings */}
        {activeTab === 'sections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
              <div>
                <h3 className="text-xs font-bold text-blue-900">
                  Modular Section Architecture
                </h3>
                <p className="text-[11px] text-blue-700 mt-0.5">
                  Each section runs with its own independent timing, calculator access, and navigation rules. Minimum 1 question per section.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddSection}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add Section</span>
              </button>
            </div>

            <div className="space-y-4">
              {sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden transition"
                >
                  {/* Section Bar Header */}
                  <div className="p-4 sm:p-5 bg-slate-50/60 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col items-center">
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveSection(idx, 'up')}
                          className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20"
                          title="Move section up"
                        >
                          <ChevronUp className="h-3.5 w-3.5" />
                        </button>
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded-full">
                          #{idx + 1}
                        </span>
                        <button
                          type="button"
                          disabled={idx === sections.length - 1}
                          onClick={() => handleMoveSection(idx, 'down')}
                          className="p-0.5 text-slate-400 hover:text-blue-600 disabled:opacity-20"
                          title="Move section down"
                        >
                          <ChevronDown className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex-1">
                        <input
                          type="text"
                          value={sec.title}
                          onChange={(e) => updateSectionField(sec.id, 'title', e.target.value)}
                          placeholder="Section Title..."
                          className="font-bold text-sm text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-hidden px-1 w-full"
                        />
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1 font-medium text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            <Clock className="h-3 w-3 text-slate-400" />
                            {sec.settings.timingMode === 'timed'
                              ? `${sec.settings.timeLimitMinutes} mins`
                              : sec.settings.timingMode === 'untimed'
                              ? 'Untimed'
                              : 'Per Question'}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            <Calculator className="h-3 w-3 text-slate-400" />
                            {sec.settings.calculatorType === 'none'
                              ? 'No Calculator'
                              : sec.settings.calculatorType === 'desmos'
                              ? 'Desmos Graphing'
                              : sec.settings.calculatorType === 'scientific'
                              ? 'Scientific'
                              : 'Basic Calculator'}
                          </span>
                          <span className="flex items-center gap-1 font-medium text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            <FileText className="h-3 w-3 text-slate-400" />
                            {sec.questions.length} Questions
                          </span>
                          {sec.settings.breakAfterSectionMinutes > 0 && (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              +{sec.settings.breakAfterSectionMinutes}m break
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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
                        onClick={() => handleRemoveSection(sec.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Remove Section"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => toggleExpand(sec.id)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition flex items-center gap-1"
                      >
                        <span>{sec.isExpanded ? 'Hide Settings' : 'Edit Settings'}</span>
                        {sec.isExpanded ? (
                          <ChevronUp className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronDown className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Section Settings & Questions Configuration */}
                  {sec.isExpanded && (
                    <div className="p-5 space-y-5">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Section Description / Student Directions
                        </label>
                        <textarea
                          value={sec.description}
                          onChange={(e) => updateSectionField(sec.id, 'description', e.target.value)}
                          rows={2}
                          placeholder="Instructions specific to this section (e.g. Reference sheet, formula usage)..."
                          className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Section Specific Settings Grid */}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
                        <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <Sliders className="h-3.5 w-3.5 text-blue-600" />
                          <span>Section Settings</span>
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Timing Mode */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Timing Mode
                            </label>
                            <select
                              value={sec.settings.timingMode}
                              onChange={(e) =>
                                updateSectionSetting(sec.id, 'timingMode', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            >
                              <option value="timed">Timed Section</option>
                              <option value="untimed">Untimed</option>
                              <option value="per_question">Per Question</option>
                            </select>
                          </div>

                          {/* Time Limit */}
                          {sec.settings.timingMode === 'timed' && (
                            <div>
                              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                Section Time (Mins)
                              </label>
                              <input
                                type="number"
                                min={1}
                                max={180}
                                value={sec.settings.timeLimitMinutes}
                                onChange={(e) =>
                                  updateSectionSetting(
                                    sec.id,
                                    'timeLimitMinutes',
                                    Math.max(1, parseInt(e.target.value) || 1)
                                  )
                                }
                                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                              />
                            </div>
                          )}

                          {/* Calculator Type */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Calculator Permission
                            </label>
                            <select
                              value={sec.settings.calculatorType}
                              onChange={(e) =>
                                updateSectionSetting(sec.id, 'calculatorType', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            >
                              <option value="none">No Calculator (Prohibited)</option>
                              <option value="desmos">Desmos Graphing Calculator</option>
                              <option value="scientific">Scientific Calculator</option>
                              <option value="basic">Basic Four-Function</option>
                            </select>
                          </div>

                          {/* Navigation Mode */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Question Navigation
                            </label>
                            <select
                              value={sec.settings.navigationMode}
                              onChange={(e) =>
                                updateSectionSetting(sec.id, 'navigationMode', e.target.value)
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            >
                              <option value="free">Free (Back & Forth)</option>
                              <option value="forward_only">Forward-Only / Linear</option>
                            </select>
                          </div>

                          {/* Break After Section */}
                          <div>
                            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                              Break After Section
                            </label>
                            <select
                              value={sec.settings.breakAfterSectionMinutes}
                              onChange={(e) =>
                                updateSectionSetting(
                                  sec.id,
                                  'breakAfterSectionMinutes',
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs bg-white"
                            >
                              <option value={0}>No Break</option>
                              <option value={5}>5-Minute Rest Break</option>
                              <option value={10}>10-Minute Rest Break</option>
                              <option value={15}>15-Minute Rest Break</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 pt-2 border-t border-slate-200/60">
                          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sec.settings.shuffleQuestions}
                              onChange={(e) =>
                                updateSectionSetting(sec.id, 'shuffleQuestions', e.target.checked)
                              }
                              className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Randomize Question Order in Section</span>
                          </label>

                          <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={sec.settings.allowReviewBeforeSubmit}
                              onChange={(e) =>
                                updateSectionSetting(
                                  sec.id,
                                  'allowReviewBeforeSubmit',
                                  e.target.checked
                                )
                              }
                              className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span>Show Review Screen Before Submitting Section</span>
                          </label>
                        </div>
                      </div>

                      {/* Question Allocation: Minimum 1 Question */}
                      <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white">
                        <div>
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <FileText className="h-4 w-4 text-blue-600" />
                            <span>Allocated Questions ({sec.questions.length})</span>
                            <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                              Minimum 1 Enforced
                            </span>
                          </span>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            You can further reorder, inspect, and choose specific bank questions in the full Section Questions Editor.
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="text-[11px] font-medium text-slate-500">Items:</label>
                          <input
                            type="number"
                            min={1}
                            max={60}
                            value={sec.questions.length}
                            onChange={(e) =>
                              handleAdjustQuestionCount(sec.id, parseInt(e.target.value) || 1)
                            }
                            className="w-16 px-2 py-1 text-xs text-center font-bold rounded-lg border border-slate-200 bg-slate-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Assessment Policies & Intake Settings */}
        {activeTab === 'settings' && (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Assessment-Level Intake & Examination Policies</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure student registration requirements, honor code verification, and score reporting behavior.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  General Student Directions & Instructions
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Optional Access Password
                  </label>
                  <input
                    type="password"
                    value={accessPassword}
                    onChange={(e) => setAccessPassword(e.target.value)}
                    placeholder="Leave blank for public access"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    If set, students must enter this password to start the exam.
                  </p>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Intake Requirements
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireHonorCode}
                      onChange={(e) => setRequireHonorCode(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Academic Integrity / Honor Code Confirmation</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireSchool}
                      onChange={(e) => setRequireSchool(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require School / Institution Name</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requirePhone}
                      onChange={(e) => setRequirePhone(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Student Phone Number</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireStudentId}
                      onChange={(e) => setRequireStudentId(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Require Student ID / Candidate Number</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Examination & Feedback
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={showResultsImmediately}
                      onChange={(e) => setShowResultsImmediately(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show Personalized Growth Report Immediately After Exam</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={enablePostSurvey}
                      onChange={(e) => setEnablePostSurvey(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Trigger Post-Assessment Diagnostic Survey & Action Plan</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={shuffleSections}
                      onChange={(e) => setShuffleSections(e.target.checked)}
                      className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Randomize Section Order for Each Student</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </AdminLayout>
  )
}

export default CreateAssessmentPage
