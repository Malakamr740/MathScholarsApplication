import React, { useState, useEffect, useMemo, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import StudentPostAssessmentSurveyModal from '../components/StudentPostAssessmentSurveyModal'
import AssessmentCalculatorDrawer from '../components/AssessmentCalculatorDrawer'
import {
  ArrowRight,
  ArrowLeft,
  Image as ImageIcon,
  Maximize2,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calculator,
  Flag,
  Layers,
  Coffee,
  Play,
  RotateCcw,
  Check,
} from 'lucide-react'
import {
  assessmentService,
  Assessment,
  AssessmentSection,
} from '../lib/assessmentService'
import { QuestionBankItem } from '../lib/questionBankService'

export const TakeAssessmentPage: React.FC = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()

  // Assessment & Student Intake Data
  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [studentInfo, setStudentInfo] = useState<any>(null)
  const [sections, setSections] = useState<AssessmentSection[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Test execution state
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0)
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<string, boolean>>({})

  // Section timing & modes
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1200)
  const [isSectionReviewing, setIsSectionReviewing] = useState(false)
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [breakSecondsLeft, setBreakSecondsLeft] = useState(0)

  // Tools & Modals
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false)
  const [isSurveyOpen, setIsSurveyOpen] = useState(false)
  const [previewZoomImage, setPreviewZoomImage] = useState<{ url: string; caption?: string } | null>(null)

  // Load intake & assessment
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      let intake: any = null
      try {
        const stored = localStorage.getItem(`student_intake_${attemptId}`)
        if (stored) {
          intake = JSON.parse(stored)
          if (isMounted) setStudentInfo(intake)
        }
      } catch (err) {
        console.warn('Could not read intake', err)
      }

      let all = assessmentService.getAllAssessments()
      if (all.length === 0) {
        all = await assessmentService.fetchAssessments()
      }

      if (!isMounted) return

      let found: Assessment | null = null
      if (intake?.assessmentId) {
        found = all.find((a) => a.id === intake.assessmentId) || null
      }
      if (!found && all.length > 0) {
        found = all[0]
      }

      if (found) {
        setAssessment(found)
        let secList = [...found.sections]
        if (found.settings.shuffleSections) {
          secList.sort(() => Math.random() - 0.5)
        }
        setSections(secList)

        // Initialize first section timer
        const firstSec = secList[0]
        if (firstSec && firstSec.settings.timingMode === 'timed') {
          setSecondsRemaining(firstSec.settings.timeLimitMinutes * 60)
        }
      }
      setIsLoading(false)
    }

    load()

    const unsub = assessmentService.subscribe(() => {
      if (isMounted) {
        const all = assessmentService.getAllAssessments()
        if (all.length > 0 && !assessment) {
          load()
        }
      }
    })

    return () => {
      isMounted = false
      unsub()
    }
  }, [attemptId])

  const currentSection = sections[currentSectionIdx]
  const currentQuestions = useMemo(() => {
    if (!currentSection) return []
    let qList = [...currentSection.questions]
    if (currentSection.settings.shuffleQuestions) {
      // Keep order deterministic per section session
      return qList
    }
    return qList
  }, [currentSection])

  const currentQuestion: QuestionBankItem | undefined = currentQuestions[currentQuestionIdx]

  // Section Timer effect
  useEffect(() => {
    if (!currentSection || isOnBreak || isSurveyOpen) return
    if (currentSection.settings.timingMode !== 'timed') return

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleSectionTimeExpired()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentSectionIdx, isOnBreak, isSurveyOpen, currentSection])

  // Break Timer effect
  useEffect(() => {
    if (!isOnBreak) return

    const timer = setInterval(() => {
      setBreakSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          handleEndBreak()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isOnBreak])

  const handleSectionTimeExpired = () => {
    if (currentSectionIdx < sections.length - 1) {
      proceedToNextSection()
    } else {
      finishAllSections()
    }
  }

  const handleSelectAnswer = (choiceIndex: number) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: choiceIndex,
    }))
  }

  const toggleFlag = () => {
    if (!currentQuestion) return
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id],
    }))
  }

  // Navigation within current section
  const canGoPrevious =
    currentQuestionIdx > 0 && currentSection?.settings.navigationMode !== 'forward_only'

  const handlePrevious = () => {
    if (canGoPrevious) {
      setCurrentQuestionIdx((prev) => prev - 1)
    }
  }

  const handleNext = () => {
    if (currentQuestionIdx < currentQuestions.length - 1) {
      setCurrentQuestionIdx((prev) => prev + 1)
    } else {
      // Reached end of current section
      if (currentSection.settings.allowReviewBeforeSubmit) {
        setIsSectionReviewing(true)
      } else {
        handleConfirmSubmitSection()
      }
    }
  }

  const handleJumpToQuestion = (idx: number) => {
    if (currentSection.settings.navigationMode === 'forward_only' && idx < currentQuestionIdx) {
      return // Disallow backward jumping in forward-only mode
    }
    setCurrentQuestionIdx(idx)
    setIsSectionReviewing(false)
  }

  const handleConfirmSubmitSection = () => {
    setIsSectionReviewing(false)
    const breakMinutes = currentSection.settings.breakAfterSectionMinutes || 0

    if (currentSectionIdx < sections.length - 1) {
      if (breakMinutes > 0) {
        setBreakSecondsLeft(breakMinutes * 60)
        setIsOnBreak(true)
      } else {
        proceedToNextSection()
      }
    } else {
      finishAllSections()
    }
  }

  const proceedToNextSection = () => {
    const nextSecIdx = currentSectionIdx + 1
    setCurrentSectionIdx(nextSecIdx)
    setCurrentQuestionIdx(0)
    setIsSectionReviewing(false)
    setIsOnBreak(false)

    const nextSec = sections[nextSecIdx]
    if (nextSec && nextSec.settings.timingMode === 'timed') {
      setSecondsRemaining(nextSec.settings.timeLimitMinutes * 60)
    }
  }

  const handleEndBreak = () => {
    setIsOnBreak(false)
    proceedToNextSection()
  }

  // Score computation and exam finalization
  const finishAllSections = () => {
    if (!assessment) return

    // Calculate score
    let totalQuestionsCount = 0
    let correctCount = 0
    const domainScores: Record<string, { total: number; correct: number }> = {}

    sections.forEach((sec) => {
      sec.questions.forEach((q) => {
        totalQuestionsCount++
        const studentChoiceIdx = answers[q.id]
        const correctChoiceIdx = q.choices.findIndex((c) => c.isCorrect)
        const isCorrect =
          studentChoiceIdx !== undefined &&
          correctChoiceIdx !== -1 &&
          studentChoiceIdx === correctChoiceIdx

        if (isCorrect) correctCount++

        const dom = q.domain || 'General Mathematics'
        if (!domainScores[dom]) domainScores[dom] = { total: 0, correct: 0 }
        domainScores[dom].total++
        if (isCorrect) domainScores[dom].correct++
      })
    })

    const scorePct =
      totalQuestionsCount > 0 ? Math.round((correctCount / totalQuestionsCount) * 100) : 0

    const resultRecord = {
      attemptId: attemptId || `attempt-${Date.now()}`,
      assessmentId: assessment.id,
      assessmentTitle: assessment.title,
      studentName: studentInfo?.fullName || 'Student Candidate',
      email: studentInfo?.email || '',
      gradeLevel: studentInfo?.gradeLevel || assessment.level,
      schoolName: studentInfo?.schoolName || '',
      completedAt: new Date().toISOString(),
      scorePct,
      correctCount,
      totalQuestions: totalQuestionsCount,
      answers,
      domainScores,
      passingScorePct: assessment.settings.passingScorePct,
      passed: scorePct >= assessment.settings.passingScorePct,
    }

    try {
      localStorage.setItem(`assessment_result_${attemptId}`, JSON.stringify(resultRecord))
      localStorage.setItem(`recent_attempt_${attemptId}`, JSON.stringify(resultRecord))
      // Record completed attempt in service
      assessmentService.recordAttempt(assessment.id)
    } catch (err) {
      console.warn('Could not save exam result', err)
    }

    if (assessment.settings.enablePostSurvey) {
      setIsSurveyOpen(true)
    } else {
      navigate(`/report/${attemptId || 'recent'}`)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-3">
          <Clock className="h-8 w-8 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-semibold">Initializing Assessment Session...</p>
        </div>
      </div>
    )
  }

  if (!assessment || !currentSection || !currentQuestion) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 text-center space-y-4">
          <AlertCircle className="h-10 w-10 text-amber-500 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900">Assessment Content Not Available</h3>
          <p className="text-xs text-slate-500">
            {!assessment
              ? 'No active assessment was found for this session.'
              : 'This assessment does not currently have any active questions in this section.'}
          </p>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition cursor-pointer"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    )
  }

  // Format timer
  const minutes = Math.floor(secondsRemaining / 60)
  const seconds = secondsRemaining % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  // Format break timer
  const breakMinutes = Math.floor(breakSecondsLeft / 60)
  const breakSeconds = breakSecondsLeft % 60
  const formattedBreakTime = `${String(breakMinutes).padStart(2, '0')}:${String(
    breakSeconds
  ).padStart(2, '0')}`

  // Calculator allowance
  const calcType = currentSection.settings.calculatorType
  const isCalcAllowed = calcType !== 'none'

  // Rest Break Screen
  if (isOnBreak) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-slate-800/90 rounded-3xl p-8 border border-slate-700 shadow-2xl space-y-6">
          <div className="h-16 w-16 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto">
            <Coffee className="h-8 w-8" />
          </div>

          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 bg-blue-900/50 px-3 py-0.5 rounded-full">
              Scheduled Intermission Break
            </span>
            <h2 className="text-2xl font-extrabold mt-2">Take a Breather</h2>
            <p className="text-xs text-slate-400 mt-1">
              You have completed {currentSection.title}. Relax your eyes and prepare for Section{' '}
              {currentSectionIdx + 2}.
            </p>
          </div>

          <div className="bg-slate-900/80 rounded-2xl p-6 border border-slate-700">
            <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Remaining Rest Time
            </span>
            <span className="text-4xl font-mono font-extrabold text-blue-400">
              {formattedBreakTime}
            </span>
          </div>

          <button
            type="button"
            onClick={handleEndBreak}
            style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-lg cursor-pointer"
          >
            <span>Resume & Begin Section {currentSectionIdx + 2}</span>
            <Play className="h-4 w-4 fill-white" />
          </button>
        </div>
      </div>
    )
  }

  // Section Review Screen (if student clicks review or reaches end)
  if (isSectionReviewing) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Section {currentSectionIdx + 1} Review
              </span>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{currentSection.title}</h2>
            </div>

            {currentSection.settings.timingMode === 'timed' && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-blue-50 text-blue-700 font-mono text-xs font-bold">
                <Clock className="h-3.5 w-3.5" />
                <span>{formattedTime} Remaining</span>
              </div>
            )}
          </div>

          <div>
            <p className="text-xs text-slate-600">
              Review your answers below before submitting this section. Click any question box to return and modify your selection. Once submitted, you cannot return to this section.
            </p>
          </div>

          {/* Question Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-2.5">
            {currentQuestions.map((q, idx) => {
              const isAnswered = answers[q.id] !== undefined
              const isFlagged = flaggedQuestions[q.id]

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => handleJumpToQuestion(idx)}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center relative transition cursor-pointer ${
                    isAnswered
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                  )}
                </button>
              )
            })}
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-blue-50 border border-blue-600" />
              <span>Answered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-md bg-white border border-slate-200" />
              <span>Unanswered</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-500" />
              <span>Flagged for Review</span>
            </span>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setIsSectionReviewing(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              Return to Question {currentQuestionIdx + 1}
            </button>

            <button
              type="button"
              onClick={handleConfirmSubmitSection}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="px-5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {currentSectionIdx < sections.length - 1
                  ? 'Submit Section & Proceed'
                  : 'Submit Final Section'}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 sm:p-6 font-sans">
      <div className="max-w-3xl w-full bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-sm space-y-6">
        {/* Top Header & Section Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-0.5 rounded-full">
              Section {currentSectionIdx + 1} of {sections.length}
            </span>
            <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
              {currentSection.title}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Calculator Button */}
            {isCalcAllowed ? (
              <button
                type="button"
                onClick={() => setIsCalculatorOpen((prev) => !prev)}
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition border cursor-pointer ${
                  isCalculatorOpen
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                }`}
                title="Toggle Calculator"
              >
                <Calculator className="h-3.5 w-3.5" />
                <span>
                  {calcType === 'desmos'
                    ? 'Desmos Tool'
                    : calcType === 'scientific'
                    ? 'Scientific Calc'
                    : 'Calculator'}
                </span>
              </button>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 text-slate-400 text-[11px] font-medium border border-slate-200 cursor-not-allowed"
                title="Calculator is strictly prohibited for this section"
              >
                <Calculator className="h-3 w-3 text-slate-300" />
                <span>No Calculator</span>
              </span>
            )}

            {/* Timer */}
            {currentSection.settings.timingMode === 'timed' && (
              <div
                className={`flex items-center gap-1 text-xs font-mono font-bold px-3 py-1 rounded-xl border ${
                  secondsRemaining < 180
                    ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>{formattedTime}</span>
              </div>
            )}
          </div>
        </div>

        {/* Section Questions Palette Strip (for free navigation) */}
        {currentSection.settings.navigationMode === 'free' && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {currentQuestions.map((q, idx) => {
              const isSelected = idx === currentQuestionIdx
              const isAnswered = answers[q.id] !== undefined
              const isFlagged = flaggedQuestions[q.id]

              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => setCurrentQuestionIdx(idx)}
                  className={`h-7 min-w-[28px] px-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center relative cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white ring-2 ring-blue-600 ring-offset-1'
                      : isAnswered
                      ? 'bg-blue-50 text-blue-800 border border-blue-200'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span>{idx + 1}</span>
                  {isFlagged && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500" />
                  )}
                </button>
              )
            })}
          </div>
        )}

        {/* Question Header & Prompt */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Question {currentQuestionIdx + 1} of {currentQuestions.length}
            </span>

            <button
              type="button"
              onClick={toggleFlag}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                flaggedQuestions[currentQuestion.id]
                  ? 'bg-amber-50 text-amber-800 border border-amber-300 font-semibold'
                  : 'text-slate-500 hover:bg-slate-50 border border-transparent'
              }`}
            >
              <Flag className="h-3.5 w-3.5" />
              <span>
                {flaggedQuestions[currentQuestion.id] ? 'Flagged for Review' : 'Flag Question'}
              </span>
            </button>
          </div>

          <h3 className="text-base font-semibold text-slate-900 leading-relaxed">
            {currentQuestion.prompt}
          </h3>
        </div>

        {/* Diagram formatted with high clarity */}
        {currentQuestion.imageUrl && (
          <div className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 p-3 sm:p-4 text-center space-y-2 overflow-hidden">
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium pb-1.5 border-b border-slate-200/70">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ImageIcon className="h-3.5 w-3.5 text-blue-600" />
                Problem Figure
              </span>
              <span className="text-[11px] text-slate-400">Diagnostic Asset</span>
            </div>
            <div className="relative group bg-white rounded-xl border border-slate-200/80 p-2 sm:p-3 overflow-hidden flex items-center justify-center">
              <img
                src={currentQuestion.imageUrl}
                alt={currentQuestion.imageCaption || 'Problem diagram'}
                className="w-full max-h-[460px] sm:max-h-[500px] object-contain mx-auto rounded-lg transition-transform duration-200 group-hover:scale-[1.01]"
              />
              <button
                type="button"
                onClick={() =>
                  setPreviewZoomImage({
                    url: currentQuestion.imageUrl!,
                    caption: currentQuestion.imageCaption,
                  })
                }
                className="absolute bottom-3 right-3 p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-700 border border-slate-200 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                title="Click to enlarge diagram"
              >
                <Maximize2 className="h-3.5 w-3.5 text-blue-600" />
                <span>Enlarge</span>
              </button>
            </div>
            {currentQuestion.imageCaption && (
              <p className="text-xs text-slate-600 font-medium italic pt-1">
                Figure: {currentQuestion.imageCaption}
              </p>
            )}
          </div>
        )}

        {/* Answer Choices */}
        <div className="space-y-2.5">
          {currentQuestion.choices?.map((choice, i) => {
            const isSelected = answers[currentQuestion.id] === i
            return (
              <button
                key={choice.id || i}
                type="button"
                onClick={() => handleSelectAnswer(i)}
                className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition cursor-pointer ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/60 text-blue-950 ring-1 ring-blue-600 font-semibold shadow-2xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <span className="inline-block w-6 font-bold text-slate-400">
                  {String.fromCharCode(65 + i)}.
                </span>
                <span>{choice.text}</span>
              </button>
            )
          })}
        </div>

        {/* Navigation Bar */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            {canGoPrevious && (
              <button
                type="button"
                onClick={handlePrevious}
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {currentSection.settings.allowReviewBeforeSubmit && (
              <button
                type="button"
                onClick={() => setIsSectionReviewing(true)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Review Section ({Object.keys(answers).length}/{currentQuestions.length})
              </button>
            )}

            <button
              type="button"
              onClick={handleNext}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
            >
              <span>
                {currentQuestionIdx < currentQuestions.length - 1
                  ? 'Next Question'
                  : currentSectionIdx < sections.length - 1
                  ? 'Complete Section'
                  : 'Submit Assessment'}
              </span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Calculator Drawer */}
      <AssessmentCalculatorDrawer
        type={calcType}
        isOpen={isCalculatorOpen && isCalcAllowed}
        onClose={() => setIsCalculatorOpen(false)}
      />

      {/* Post-Assessment Survey Modal */}
      <StudentPostAssessmentSurveyModal
        attemptId={attemptId || 'sample-attempt'}
        isOpen={isSurveyOpen}
        assessmentTitle={assessment.title}
        onComplete={() => navigate(`/report/${attemptId || 'sample-attempt'}`)}
        onSkip={() => navigate(`/report/${attemptId || 'sample-attempt'}`)}
      />

      {/* Diagram Lightbox Modal */}
      {previewZoomImage && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPreviewZoomImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-blue-600" />
                {previewZoomImage.caption || 'Problem Diagram'}
              </span>
              <button
                type="button"
                onClick={() => setPreviewZoomImage(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center p-2 bg-slate-50 rounded-xl border border-slate-100">
              <img
                src={previewZoomImage.url}
                alt={previewZoomImage.caption || 'Diagram enlarged'}
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-xs"
              />
            </div>
            {previewZoomImage.caption && (
              <p className="text-xs text-center text-slate-500 italic">
                {previewZoomImage.caption}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default TakeAssessmentPage
