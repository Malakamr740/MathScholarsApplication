import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Clock,
  FileText,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  Sparkles,
  Layers,
  Calculator,
  Compass,
} from 'lucide-react'
import { assessmentService, Assessment } from '../lib/assessmentService'

export const StudentAssessmentPage: React.FC = () => {
  const { assessmentId } = useParams()
  const navigate = useNavigate()

  const [assessment, setAssessment] = useState<Assessment | null>(null)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [gradeLevel, setGradeLevel] = useState('Grade 10')
  const [schoolName, setSchoolName] = useState('')
  const [phone, setPhone] = useState('')
  const [studentIdInput, setStudentIdInput] = useState('')
  const [accessPasswordInput, setAccessPasswordInput] = useState('')
  const [agreeHonor, setAgreeHonor] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    if (!assessmentId) return
    const found = assessmentService.getAssessmentById(assessmentId)
    if (found) {
      setAssessment(found)
      setGradeLevel(found.level || 'Grade 10')
      setAgreeHonor(found.settings.requireHonorCode ?? true)
    } else {
      setError(`Assessment "${assessmentId}" not found.`)
    }
  }, [assessmentId])

  if (!assessment) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl p-6 border border-slate-200 text-center space-y-3">
          <AlertCircle className="h-10 w-10 text-rose-500 mx-auto" />
          <h2 className="text-base font-bold text-slate-900">Assessment Not Found</h2>
          <p className="text-xs text-slate-500">
            {error || 'This diagnostic test link may be invalid or inactive.'}
          </p>
          <Link
            to="/admin/assessments"
            className="inline-block px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold"
          >
            Go to Assessments
          </Link>
        </div>
      </div>
    )
  }

  const totalQuestions = assessmentService.getTotalQuestions(assessment)
  const totalDuration = assessmentService.getTotalDurationMinutes(assessment)
  const settings = assessment.settings

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim()) {
      setError('Please enter your full name.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.')
      return
    }
    if (settings.requireSchool && !schoolName.trim()) {
      setError('Please provide your school or academy name.')
      return
    }
    if (settings.requirePhone && !phone.trim()) {
      setError('Please provide your phone number.')
      return
    }
    if (settings.requireStudentId && !studentIdInput.trim()) {
      setError('Please provide your student ID / candidate number.')
      return
    }
    if (settings.requireHonorCode && !agreeHonor) {
      setError('Please confirm the academic honesty honor code.')
      return
    }
    if (settings.accessPassword && accessPasswordInput.trim() !== settings.accessPassword) {
      setError('Incorrect assessment access password.')
      return
    }

    setIsStarting(true)
    const attemptId = `attempt-${Date.now()}`

    // Store student intake for report and assessment player
    try {
      localStorage.setItem(
        `student_intake_${attemptId}`,
        JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          gradeLevel,
          schoolName: schoolName.trim(),
          phone: phone.trim(),
          studentId: studentIdInput.trim(),
          assessmentTitle: assessment.title,
          assessmentId: assessment.id,
          startedAt: Date.now(),
        })
      )
    } catch (err) {
      console.warn('Could not save intake to localStorage', err)
    }

    setTimeout(() => {
      navigate(`/take/${attemptId}`)
    }, 400)
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 sm:p-6 font-sans">
      <header className="max-w-4xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-bold text-base shadow-sm">
            ∑
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 tracking-tight">
              Diagnostic Assessment Portal
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">Standardized Evaluation</p>
          </div>
        </div>

        <Link
          to="/admin/assessments"
          className="text-xs font-semibold text-slate-600 hover:text-blue-600 transition"
        >
          Teacher / Admin Portal →
        </Link>
      </header>

      <main className="max-w-4xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Test Overview */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200 px-3 py-0.5 rounded-full">
                {assessment.level}
              </span>
              <span className="text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-0.5 rounded-full">
                {assessment.targetExam}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight">
              {assessment.title}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed">
              {assessment.description ||
                'Comprehensive diagnostic evaluation. Upon completion, you will receive an instantaneous personalized diagnostic growth report with actionable roadmaps.'}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <Clock className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900">{totalDuration} Mins</p>
              <p className="text-[10px] text-slate-500">Total Duration</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <FileText className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900">{totalQuestions} Questions</p>
              <p className="text-[10px] text-slate-500">{assessment.sections.length} Sections</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-center">
              <Sparkles className="h-5 w-5 text-amber-500 mx-auto mb-1" />
              <p className="text-xs font-bold text-slate-900">Instant</p>
              <p className="text-[10px] text-slate-500">Skill Growth Map</p>
            </div>
          </div>

          {/* Section-by-Section Breakdown */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>Assessment Sections Breakdown</span>
            </h3>
            <div className="space-y-2">
              {assessment.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="h-5 w-5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <div>
                      <span className="font-semibold text-slate-900 block">{sec.title}</span>
                      <span className="text-[10px] text-slate-500">{sec.questions.length} Items</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-[10px] font-medium">
                    <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 text-slate-700">
                      {sec.settings.timingMode === 'timed'
                        ? `${sec.settings.timeLimitMinutes} min`
                        : 'Untimed'}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md border ${
                        sec.settings.calculatorType === 'none'
                          ? 'bg-rose-50 border-rose-200 text-rose-700'
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      {sec.settings.calculatorType === 'none'
                        ? 'No Calculator'
                        : sec.settings.calculatorType === 'desmos'
                        ? 'Desmos Graphing'
                        : 'Calculator Allowed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {settings.instructions && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 space-y-2 text-xs text-blue-900">
              <h3 className="font-bold flex items-center gap-1.5 text-blue-900">
                <ShieldCheck className="h-4 w-4 text-blue-600" />
                Testing Instructions:
              </h3>
              <p className="text-blue-800 text-[11px] leading-relaxed whitespace-pre-line">
                {settings.instructions}
              </p>
            </div>
          )}
        </div>

        {/* Right Column: Student Intake Form */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Student Registration</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter your details so we can configure your testing session.
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleStart} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Farida Ahmed"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Grade</label>
                <select
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11</option>
                  <option value="Grade 12">Grade 12</option>
                  <option value="Accelerated">Accelerated</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  School {settings.requireSchool && <span className="text-rose-500">*</span>}
                </label>
                <input
                  type="text"
                  value={schoolName}
                  onChange={(e) => setSchoolName(e.target.value)}
                  placeholder={settings.requireSchool ? 'Required' : 'Optional'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required={settings.requireSchool}
                />
              </div>
            </div>

            {settings.requirePhone && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {settings.requireStudentId && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Student ID / Candidate No. <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={studentIdInput}
                  onChange={(e) => setStudentIdInput(e.target.value)}
                  placeholder="e.g. STU-94821"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 font-mono"
                  required
                />
              </div>
            )}

            {settings.accessPassword && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assessment Access Password <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  value={accessPasswordInput}
                  onChange={(e) => setAccessPasswordInput(e.target.value)}
                  placeholder="Enter exam password"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            )}

            {settings.requireHonorCode && (
              <div className="pt-1">
                <label className="flex items-start gap-2 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreeHonor}
                    onChange={(e) => setAgreeHonor(e.target.checked)}
                    className="mt-0.5 rounded-sm border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-[11px] leading-tight">
                    I confirm that I will take this diagnostic assessment independently without unauthorized aids to reflect my true mathematical baseline.
                  </span>
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isStarting}
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
            >
              <span>{isStarting ? 'Preparing Assessment...' : 'Begin Diagnostic Assessment'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>
      </main>

      <footer className="max-w-4xl w-full mx-auto py-4 text-center text-xs text-slate-400">
        © 2026 Mathematics Diagnostic Platform • All Rights Reserved
      </footer>
    </div>
  )
}

export default StudentAssessmentPage
