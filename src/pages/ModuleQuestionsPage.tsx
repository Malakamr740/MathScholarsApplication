import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import AdminLayout from '../components/AdminLayout'
import {
  Plus,
  Trash2,
  MoveUp,
  MoveDown,
  HelpCircle,
  Clock,
  Layers,
  Search,
  CheckCircle2,
  AlertCircle,
  Eye,
  Calculator,
  Sliders,
  X,
  Image as ImageIcon,
  Check,
  ChevronRight,
  Filter,
} from 'lucide-react'
import {
  assessmentService,
  Assessment,
  AssessmentSection,
  SectionSettings,
} from '../lib/assessmentService'
import { questionBankService, QuestionBankItem, QuestionChoice } from '../lib/questionBankService'

export const ModuleQuestionsPage: React.FC = () => {
  const { assessmentId, moduleId } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [section, setSection] = useState<AssessmentSection | null>(null)
  const [questions, setQuestions] = useState<QuestionBankItem[]>([])
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  // Bank modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [bankSearch, setBankSearch] = useState('')
  const [selectedDomain, setSelectedDomain] = useState<string>('all')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all')
  const [selectedBankIds, setSelectedBankIds] = useState<string[]>([])

  // Preview question modal
  const [previewQuestion, setPreviewQuestion] = useState<QuestionBankItem | null>(null)

  // Section settings quick modal
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false)
  const [tempSettings, setTempSettings] = useState<SectionSettings | null>(null)

  const loadData = () => {
    if (!assessmentId || !moduleId) return
    const a = assessmentService.getAssessmentById(assessmentId)
    if (!a) {
      setError(`Assessment "${assessmentId}" not found.`)
      return
    }
    setAssessment(a)
    const sec = a.sections.find((s) => s.id === moduleId)
    if (!sec) {
      setError(`Section "${moduleId}" not found in assessment.`)
      return
    }
    setSection(sec)
    setQuestions([...sec.questions])
    setTempSettings({ ...sec.settings })
  }

  useEffect(() => {
    loadData()
  }, [assessmentId, moduleId])

  const notify = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(null), 3000)
  }

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (!assessmentId || !moduleId) return
    const target = direction === 'up' ? index - 1 : index + 1
    if (target < 0 || target >= questions.length) return

    const updated = [...questions]
    const temp = updated[index]
    updated[index] = updated[target]
    updated[target] = temp

    setQuestions(updated)
    assessmentService.updateSectionQuestions(assessmentId, moduleId, updated)
    notify('Question order updated.')
  }

  const handleRemove = (id: string) => {
    if (!assessmentId || !moduleId) return
    if (questions.length <= 1) {
      setError('Each section must have at least 1 question (minimum of 1 required).')
      setTimeout(() => setError(null), 4000)
      return
    }

    const res = assessmentService.removeQuestionFromSection(assessmentId, moduleId, id)
    if (res.success && res.assessment) {
      const updatedSec = res.assessment.sections.find((s) => s.id === moduleId)
      if (updatedSec) {
        setQuestions([...updatedSec.questions])
        notify('Question removed from section.')
      }
    } else if (res.error) {
      setError(res.error)
      setTimeout(() => setError(null), 4000)
    }
  }

  const handleAddSelectedFromBank = () => {
    if (!assessmentId || !moduleId || selectedBankIds.length === 0) return
    const bank = questionBankService.getStoredQuestions()
    const toAdd = bank.filter((b) => selectedBankIds.includes(b.id))

    const res = assessmentService.addQuestionsToSection(assessmentId, moduleId, toAdd)
    if (res.success && res.assessment) {
      const updatedSec = res.assessment.sections.find((s) => s.id === moduleId)
      if (updatedSec) {
        setQuestions([...updatedSec.questions])
        notify(`Added ${toAdd.length} question(s) to this section.`)
      }
      setSelectedBankIds([])
      setIsAddModalOpen(false)
    }
  }

  const handleSaveSectionSettings = () => {
    if (!assessmentId || !moduleId || !tempSettings || !section) return
    const res = assessmentService.updateSection(assessmentId, moduleId, {
      settings: tempSettings,
    })
    if (res) {
      setAssessment(res)
      const updatedSec = res.sections.find((s) => s.id === moduleId)
      if (updatedSec) {
        setSection(updatedSec)
      }
      setIsSettingsModalOpen(false)
      notify('Section settings updated.')
    }
  }

  if (!assessment || !section) {
    return (
      <AdminLayout
        title="Module Questions"
        showBackButton
        backButtonPath={`/admin/assessments/${assessmentId || ''}`}
      >
        <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">Section Not Found</h3>
          <p className="text-xs text-slate-500">{error || 'Could not load section data.'}</p>
          <Link
            to={`/admin/assessments/${assessmentId || ''}`}
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Back to Assessment
          </Link>
        </div>
      </AdminLayout>
    )
  }

  // Filter bank questions
  const bankQuestions = questionBankService.getStoredQuestions()
  const existingIds = new Set(questions.map((q) => q.id))

  const filteredBank = bankQuestions.filter((bq) => {
    if (existingIds.has(bq.id)) return false
    const matchSearch =
      bq.prompt.toLowerCase().includes(bankSearch.toLowerCase()) ||
      bq.domain.toLowerCase().includes(bankSearch.toLowerCase()) ||
      bq.chapter?.toLowerCase().includes(bankSearch.toLowerCase())
    const matchDomain = selectedDomain === 'all' || bq.domain === selectedDomain
    const matchDiff = selectedDifficulty === 'all' || bq.difficulty === selectedDifficulty
    return matchSearch && matchDomain && matchDiff
  })

  return (
    <AdminLayout
      title={section.title}
      subtitle={`Assessment: ${assessment.title} • ${questions.length} Active Questions`}
      showBackButton
      backButtonPath={`/admin/assessments/${assessmentId}`}
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsSettingsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            <Sliders className="h-3.5 w-3.5 text-blue-600" />
            <span>Section Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSelectedBankIds([])
              setIsAddModalOpen(true)
            }}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Add from Question Bank</span>
          </button>
        </div>
      }
    >
      <div className="space-y-5 max-w-5xl">
        {successMsg && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section Specification Banner */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Independent Section Rules
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{section.title}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{section.description}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                <Clock className="h-3.5 w-3.5 text-slate-400" />
                {section.settings.timingMode === 'timed'
                  ? `${section.settings.timeLimitMinutes} Mins`
                  : 'Untimed'}
              </span>

              <span
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                  section.settings.calculatorType === 'none'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                <Calculator className="h-3.5 w-3.5" />
                {section.settings.calculatorType === 'none'
                  ? 'No Calculator'
                  : section.settings.calculatorType === 'desmos'
                  ? 'Desmos Graphing'
                  : section.settings.calculatorType === 'scientific'
                  ? 'Scientific'
                  : 'Basic Calculator'}
              </span>

              <span className="bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                {section.settings.navigationMode === 'free' ? 'Free Navigation' : 'Forward Only'}
              </span>

              <span className="bg-blue-50 border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg text-xs font-bold">
                {questions.length} Items (Min 1 Required)
              </span>
            </div>
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-3">
          {questions.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 space-y-3">
              <HelpCircle className="h-10 w-10 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-800">No Questions Assigned Yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Every section must contain a minimum of 1 question. Select questions from your Question Bank.
              </p>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Browse Question Bank</span>
              </button>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-200 transition space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    {/* Index & reorder */}
                    <div className="flex flex-col items-center shrink-0 pt-0.5">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMove(idx, 'up')}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                        title="Move Up"
                      >
                        <MoveUp className="h-3.5 w-3.5" />
                      </button>
                      <span className="h-6 w-6 rounded-full bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <button
                        type="button"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMove(idx, 'down')}
                        className="p-1 text-slate-400 hover:text-blue-600 disabled:opacity-20 cursor-pointer"
                        title="Move Down"
                      >
                        <MoveDown className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                          {q.domain}
                        </span>
                        {q.chapter && (
                          <span className="text-[10px] text-slate-500 font-medium truncate max-w-[180px]">
                            {q.chapter}
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            q.difficulty === 'easy'
                              ? 'bg-emerald-50 text-emerald-700'
                              : q.difficulty === 'medium'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                          }`}
                        >
                          {q.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {q.id}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-900 line-clamp-3 leading-relaxed">
                        {q.prompt}
                      </p>

                      {/* Image preview badge if present */}
                      {q.imageUrl && (
                        <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100 w-fit">
                          <ImageIcon className="h-3.5 w-3.5" />
                          <span>Includes Diagram Figure</span>
                        </div>
                      )}

                      {/* Choices preview */}
                      {q.choices && q.choices.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-100 text-[11px]">
                          {q.choices.map((choice, oi) => (
                            <div
                              key={choice.id || oi}
                              className={`p-1.5 rounded-lg border text-center truncate ${
                                choice.isCorrect
                                  ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold'
                                  : 'border-slate-100 bg-slate-50 text-slate-600'
                              }`}
                            >
                              <span className="font-bold mr-1">
                                {String.fromCharCode(65 + oi)}:
                              </span>
                              {choice.text}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPreviewQuestion(q)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition cursor-pointer"
                      title="Inspect Full Question"
                    >
                      <Eye className="h-4 w-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleRemove(q.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove from Section"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal: Add from Question Bank */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-3xl w-full border border-slate-200 shadow-xl space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="h-4 w-4 text-blue-600" />
                  <span>Add Questions to {section.title}</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Select questions from the centralized repository to add to this section.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search questions or keywords..."
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <select
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="all">All Domains</option>
                  <option value="Algebra & Functions">Algebra & Functions</option>
                  <option value="Geometry & Measurement">Geometry & Measurement</option>
                  <option value="Trigonometry">Trigonometry</option>
                  <option value="Statistics & Probability">Statistics & Probability</option>
                </select>
              </div>

              <div>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            {/* Questions Bank List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[300px]">
              {filteredBank.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">
                  No matching questions found in the Question Bank.
                </div>
              ) : (
                filteredBank.map((bq) => {
                  const isChecked = selectedBankIds.includes(bq.id)
                  return (
                    <div
                      key={bq.id}
                      onClick={() => {
                        setSelectedBankIds((prev) =>
                          isChecked ? prev.filter((id) => id !== bq.id) : [...prev, bq.id]
                        )
                      }}
                      className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                        isChecked
                          ? 'border-blue-500 bg-blue-50/40 shadow-xs'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-[10px]">
                          <span className="font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {bq.domain}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span
                            className={`font-semibold ${
                              bq.difficulty === 'easy'
                                ? 'text-emerald-700'
                                : bq.difficulty === 'medium'
                                ? 'text-amber-700'
                                : 'text-rose-700'
                            }`}
                          >
                            {bq.difficulty}
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500">
                            {bq.calculatorAllowed ? 'Calc Allowed' : 'No Calc'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-800 mt-1 line-clamp-2">{bq.prompt}</p>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">
                {selectedBankIds.length} question(s) selected
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddSelectedFromBank}
                  disabled={selectedBankIds.length === 0}
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
                >
                  Add Selected Questions ({selectedBankIds.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Inspect Question Details */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-xl w-full border border-slate-200 shadow-xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                  {previewQuestion.domain}
                </span>
                <h3 className="text-xs font-mono text-slate-400 mt-1">ID: {previewQuestion.id}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-900">{previewQuestion.prompt}</p>

              {previewQuestion.imageUrl && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                  <img
                    src={previewQuestion.imageUrl}
                    alt={previewQuestion.imageCaption || 'Diagram'}
                    className="max-h-56 mx-auto object-contain rounded-lg"
                  />
                  {previewQuestion.imageCaption && (
                    <p className="text-[11px] text-slate-500 italic mt-1.5">
                      Figure: {previewQuestion.imageCaption}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Answer Choices
                </h4>
                {previewQuestion.choices?.map((choice, i) => (
                  <div
                    key={choice.id || i}
                    className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                      choice.isCorrect
                        ? 'border-emerald-300 bg-emerald-50/70 text-emerald-900 font-semibold'
                        : 'border-slate-200 text-slate-700'
                    }`}
                  >
                    <span className="w-5 font-bold">{String.fromCharCode(65 + i)}.</span>
                    <span className="flex-1">{choice.text}</span>
                    {choice.isCorrect && (
                      <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                        Correct
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {previewQuestion.explanation && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                  <span className="font-bold text-slate-800 block">Explanation & Rationale:</span>
                  <p>{previewQuestion.explanation}</p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Section Settings */}
      {isSettingsModalOpen && tempSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>Configure Settings for {section.title}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Timing Mode</label>
                  <select
                    value={tempSettings.timingMode}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, timingMode: e.target.value as any })
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
                    value={tempSettings.timeLimitMinutes}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        timeLimitMinutes: Math.max(1, parseInt(e.target.value) || 1),
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
                    value={tempSettings.calculatorType}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, calculatorType: e.target.value as any })
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
                  <label className="block font-semibold text-slate-700 mb-1">Navigation</label>
                  <select
                    value={tempSettings.navigationMode}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, navigationMode: e.target.value as any })
                    }
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    <option value="free">Free (Back & Forth)</option>
                    <option value="forward_only">Forward Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Break After Section</label>
                <select
                  value={tempSettings.breakAfterSectionMinutes}
                  onChange={(e) =>
                    setTempSettings({
                      ...tempSettings,
                      breakAfterSectionMinutes: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200"
                >
                  <option value={0}>No Break</option>
                  <option value={5}>5-Minute Rest Break</option>
                  <option value={10}>10-Minute Rest Break</option>
                </select>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSettings.shuffleQuestions}
                    onChange={(e) =>
                      setTempSettings({ ...tempSettings, shuffleQuestions: e.target.checked })
                    }
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Shuffle Question Order in This Section</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempSettings.allowReviewBeforeSubmit}
                    onChange={(e) =>
                      setTempSettings({
                        ...tempSettings,
                        allowReviewBeforeSubmit: e.target.checked,
                      })
                    }
                    className="rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow Review Screen Before Section Submission</span>
                </label>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSectionSettings}
                style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 cursor-pointer"
              >
                Save Settings
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  )
}

export default ModuleQuestionsPage
