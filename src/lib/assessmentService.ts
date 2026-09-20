import { questionBankService, QuestionBankItem } from './questionBankService'

export type TimingMode = 'timed' | 'untimed' | 'per_question'
export type CalculatorType = 'none' | 'desmos' | 'scientific' | 'basic'
export type NavigationMode = 'free' | 'forward_only'

export interface SectionSettings {
  timingMode: TimingMode
  timeLimitMinutes: number
  perQuestionSeconds?: number
  calculatorType: CalculatorType
  navigationMode: NavigationMode
  shuffleQuestions: boolean
  allowReviewBeforeSubmit: boolean
  breakAfterSectionMinutes: number // 0 for no break
}

export interface AssessmentSection {
  id: string
  title: string
  description: string
  orderIndex: number
  settings: SectionSettings
  questions: QuestionBankItem[]
}

export interface AssessmentSettings {
  passingScorePct: number
  instructions: string
  requireHonorCode: boolean
  requireSchool: boolean
  requirePhone: boolean
  requireStudentId: boolean
  showResultsImmediately: boolean
  enablePostSurvey: boolean
  shuffleSections: boolean
  accessPassword?: string
}

export interface Assessment {
  id: string
  title: string
  code?: string
  description: string
  level: string
  targetExam: string
  status: 'active' | 'draft' | 'archived'
  settings: AssessmentSettings
  sections: AssessmentSection[]
  createdAt: string
  updatedAt: string
  attemptsCount?: number
}

const STORAGE_KEY = 'math_diag_assessments_v3'
const SEEDED_FLAG = 'math_diag_assessments_seeded_v3'

export const DEFAULT_SECTION_SETTINGS: SectionSettings = {
  timingMode: 'timed',
  timeLimitMinutes: 25,
  calculatorType: 'desmos',
  navigationMode: 'free',
  shuffleQuestions: false,
  allowReviewBeforeSubmit: true,
  breakAfterSectionMinutes: 0,
}

export const DEFAULT_ASSESSMENT_SETTINGS: AssessmentSettings = {
  passingScorePct: 65,
  instructions:
    'Read each question carefully. Select the best answer for multiple choice questions, or write out exact simplified answers. You can flag items for later review within this section.',
  requireHonorCode: true,
  requireSchool: false,
  requirePhone: false,
  requireStudentId: false,
  showResultsImmediately: true,
  enablePostSurvey: true,
  shuffleSections: false,
}

class AssessmentService {
  private assessments: Assessment[] | null = null

  private getInitialAssessments(): Assessment[] {
    const bank = questionBankService.getStoredQuestions()
    const now = new Date().toISOString()

    const qSet1 = bank.slice(0, 12)
    const qSet2 = bank.slice(12, 25)
    const qSet3 = bank.slice(25, 35)
    const qSet4 = bank.slice(35, 45)
    const qSet5 = bank.slice(45, 55)

    const algebra1: Assessment = {
      id: 'diagnostic-algebra-1',
      title: 'High School Algebra I Benchmark Diagnostic',
      code: 'ALG1-BENCH-2026',
      description:
        'Official benchmark assessing linear equations, inequalities, polynomial operations, systems, and quadratic functions in accordance with standardized college readiness benchmarks.',
      level: 'Grade 9-10',
      targetExam: 'EST 1 / SAT Math',
      status: 'active',
      attemptsCount: 142,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...DEFAULT_ASSESSMENT_SETTINGS,
        passingScorePct: 70,
      },
      sections: [
        {
          id: 'sec-alg1-m1',
          title: 'Section 1: Linear Systems & Foundations (No Calculator)',
          description:
            'Heart of Algebra, single-variable inequalities, slope equations, and system substitution. Calculators are strictly prohibited for this section.',
          orderIndex: 0,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 20,
            calculatorType: 'none',
            navigationMode: 'free',
            shuffleQuestions: false,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 5,
          },
          questions: qSet1.length > 0 ? qSet1 : bank.slice(0, 5),
        },
        {
          id: 'sec-alg1-m2',
          title: 'Section 2: Quadratics, Radicals & Applied Modeling (Calculator Active)',
          description:
            'Factoring, vertex form transformations, discriminant testing, and quadratic models. Desmos graphing calculator toolbar is available.',
          orderIndex: 1,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 25,
            calculatorType: 'desmos',
            navigationMode: 'free',
            shuffleQuestions: false,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 0,
          },
          questions: qSet2.length > 0 ? qSet2 : bank.slice(5, 12),
        },
      ],
    }

    const precalc: Assessment = {
      id: 'pre-calculus-readiness',
      title: 'Pre-Calculus & Functions Readiness Evaluation',
      code: 'PREC-EVAL-2026',
      description:
        'Comprehensive multi-section diagnostic testing mastery of trigonometric identities, logarithms, exponential transformations, and rational functions.',
      level: 'Grade 11-12',
      targetExam: 'EST 2 Math Level 1',
      status: 'active',
      attemptsCount: 89,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...DEFAULT_ASSESSMENT_SETTINGS,
        passingScorePct: 75,
      },
      sections: [
        {
          id: 'sec-prec-m1',
          title: 'Section 1: Trigonometric Formulations & Unit Circle',
          description:
            'Radian measures, unit circle evaluation, exact trigonometric ratios, and trigonometric equations.',
          orderIndex: 0,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 20,
            calculatorType: 'none',
            navigationMode: 'free',
            shuffleQuestions: false,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 5,
          },
          questions: qSet3.length > 0 ? qSet3 : bank.slice(0, 6),
        },
        {
          id: 'sec-prec-m2',
          title: 'Section 2: Logarithms & Exponential Models',
          description:
            'Properties of logs, compound growth, exponential decay, and change of base transformations.',
          orderIndex: 1,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 20,
            calculatorType: 'desmos',
            navigationMode: 'free',
            shuffleQuestions: false,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 0,
          },
          questions: qSet4.length > 0 ? qSet4 : bank.slice(6, 12),
        },
        {
          id: 'sec-prec-m3',
          title: 'Section 3: Rational Functions & Domain Constraints',
          description:
            'Vertical asymptotes, holes, horizontal asymptotes, and rational equation solving.',
          orderIndex: 2,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 20,
            calculatorType: 'scientific',
            navigationMode: 'free',
            shuffleQuestions: true,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 0,
          },
          questions: qSet5.length > 0 ? qSet5 : bank.slice(12, 18),
        },
      ],
    }

    const geometry: Assessment = {
      id: 'geometry-mid-year',
      title: 'Geometric Proofs and Congruence Diagnostic',
      code: 'GEO-MID-2026',
      description:
        'Diagnostic assessment measuring spatial reasoning, coordinate proofs, arc sectors, and three-dimensional volume formulas.',
      level: 'Grade 10',
      targetExam: 'Standard Common Core',
      status: 'active',
      attemptsCount: 56,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...DEFAULT_ASSESSMENT_SETTINGS,
        passingScorePct: 65,
      },
      sections: [
        {
          id: 'sec-geo-m1',
          title: 'Section 1: Geometric Proofs, Similarity & Angles',
          description:
            'Triangle congruence criteria, parallel transversal angles, and polygonal deductions without calculator.',
          orderIndex: 0,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 20,
            calculatorType: 'none',
            navigationMode: 'free',
            shuffleQuestions: false,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 5,
          },
          questions: bank.slice(10, 20),
        },
        {
          id: 'sec-geo-m2',
          title: 'Section 2: Circles, Coordinate Geometry & Volumes',
          description:
            'Standard circle equation, arc length, sector areas, and composite solids with Desmos calculator enabled.',
          orderIndex: 1,
          settings: {
            timingMode: 'timed',
            timeLimitMinutes: 25,
            calculatorType: 'desmos',
            navigationMode: 'free',
            shuffleQuestions: false,
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 0,
          },
          questions: bank.slice(20, 30),
        },
      ],
    }

    return [algebra1, precalc, geometry]
  }

  private load(): Assessment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (err) {
      console.warn('Could not load assessments from storage', err)
    }

    const seeded = this.getInitialAssessments()
    this.persist(seeded)
    return seeded
  }

  private persist(assessments: Assessment[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments))
      localStorage.setItem(SEEDED_FLAG, 'true')
    } catch (err) {
      console.warn('Could not persist assessments to storage', err)
    }
  }

  getAllAssessments(): Assessment[] {
    if (!this.assessments) {
      this.assessments = this.load()
    }
    return [...this.assessments]
  }

  getAssessmentById(id: string): Assessment | null {
    const list = this.getAllAssessments()
    return list.find((a) => a.id === id) || null
  }

  saveAssessment(assessment: Assessment): Assessment {
    const list = this.getAllAssessments()
    const index = list.findIndex((a) => a.id === assessment.id)
    const updated = {
      ...assessment,
      updatedAt: new Date().toISOString(),
    }

    if (index >= 0) {
      list[index] = updated
    } else {
      list.push(updated)
    }

    this.assessments = list
    this.persist(list)
    return updated
  }

  createAssessment(data: Partial<Assessment>): Assessment {
    const now = new Date().toISOString()
    const newId = data.id || `assessment-${Date.now()}`

    const newAssessment: Assessment = {
      id: newId,
      title: data.title || 'Untitled Assessment',
      code: data.code || `ASSESS-${Math.floor(1000 + Math.random() * 9000)}`,
      description: data.description || '',
      level: data.level || 'Grade 10',
      targetExam: data.targetExam || 'EST 1 / SAT Math',
      status: data.status || 'active',
      attemptsCount: 0,
      createdAt: now,
      updatedAt: now,
      settings: {
        ...DEFAULT_ASSESSMENT_SETTINGS,
        ...(data.settings || {}),
      },
      sections: data.sections || [
        {
          id: `sec-${Date.now()}-1`,
          title: 'Section 1: General Mathematics Diagnostic',
          description: 'Core problem solving and diagnostic evaluation.',
          orderIndex: 0,
          settings: { ...DEFAULT_SECTION_SETTINGS },
          questions: questionBankService.getStoredQuestions().slice(0, 5),
        },
      ],
    }

    return this.saveAssessment(newAssessment)
  }

  deleteAssessment(id: string): boolean {
    const list = this.getAllAssessments()
    const filtered = list.filter((a) => a.id !== id)
    if (filtered.length !== list.length) {
      this.assessments = filtered
      this.persist(filtered)
      return true
    }
    return false
  }

  recordAttempt(id: string): void {
    const list = this.getAllAssessments()
    const idx = list.findIndex((a) => a.id === id)
    if (idx !== -1) {
      list[idx].attemptsCount = (list[idx].attemptsCount || 0) + 1
      list[idx].updatedAt = new Date().toISOString()
      this.assessments = list
      this.persist(list)
    }
  }

  duplicateAssessment(id: string): Assessment | null {
    const original = this.getAssessmentById(id)
    if (!original) return null

    const duplicated: Assessment = {
      ...original,
      id: `assessment-${Date.now()}`,
      title: `${original.title} (Copy)`,
      code: `${original.code || 'COPY'}-COPY`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      attemptsCount: 0,
      sections: original.sections.map((sec, idx) => ({
        ...sec,
        id: `sec-${Date.now()}-${idx + 1}`,
        questions: [...sec.questions],
      })),
    }

    return this.saveAssessment(duplicated)
  }

  // Section-specific operations
  addSection(assessmentId: string, sectionData?: Partial<AssessmentSection>): Assessment | null {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return null

    const nextIndex = assessment.sections.length
    const newSection: AssessmentSection = {
      id: `sec-${Date.now()}-${nextIndex + 1}`,
      title: sectionData?.title || `Section ${nextIndex + 1}: Diagnostic Module`,
      description: sectionData?.description || 'Section instructions and specific focus area.',
      orderIndex: nextIndex,
      settings: {
        ...DEFAULT_SECTION_SETTINGS,
        ...(sectionData?.settings || {}),
      },
      questions: sectionData?.questions && sectionData.questions.length > 0
        ? sectionData.questions
        : questionBankService.getStoredQuestions().slice(0, 3),
    }

    assessment.sections.push(newSection)
    return this.saveAssessment(assessment)
  }

  updateSection(
    assessmentId: string,
    sectionId: string,
    updates: Partial<AssessmentSection>
  ): Assessment | null {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return null

    const secIndex = assessment.sections.findIndex((s) => s.id === sectionId)
    if (secIndex === -1) return null

    const currentSec = assessment.sections[secIndex]
    assessment.sections[secIndex] = {
      ...currentSec,
      ...updates,
      settings: {
        ...currentSec.settings,
        ...(updates.settings || {}),
      },
    }

    return this.saveAssessment(assessment)
  }

  deleteSection(assessmentId: string, sectionId: string): { success: boolean; error?: string; assessment?: Assessment } {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return { success: false, error: 'Assessment not found' }

    if (assessment.sections.length <= 1) {
      return {
        success: false,
        error: 'An assessment must have at least one section. You cannot delete the only section.',
      }
    }

    assessment.sections = assessment.sections
      .filter((s) => s.id !== sectionId)
      .map((s, idx) => ({ ...s, orderIndex: idx }))

    const saved = this.saveAssessment(assessment)
    return { success: true, assessment: saved }
  }

  reorderSections(assessmentId: string, sectionIds: string[]): Assessment | null {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return null

    const sectionMap = new Map(assessment.sections.map((s) => [s.id, s]))
    const newSections: AssessmentSection[] = []

    sectionIds.forEach((id, idx) => {
      const sec = sectionMap.get(id)
      if (sec) {
        newSections.push({ ...sec, orderIndex: idx })
      }
    })

    // Include any missing sections at the end
    assessment.sections.forEach((sec) => {
      if (!sectionIds.includes(sec.id)) {
        newSections.push({ ...sec, orderIndex: newSections.length })
      }
    })

    assessment.sections = newSections
    return this.saveAssessment(assessment)
  }

  // Question operations inside a specific section
  getSectionQuestions(assessmentId: string, sectionId: string): QuestionBankItem[] {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return []
    const sec = assessment.sections.find((s) => s.id === sectionId)
    return sec ? sec.questions : []
  }

  updateSectionQuestions(
    assessmentId: string,
    sectionId: string,
    questions: QuestionBankItem[]
  ): { success: boolean; error?: string; assessment?: Assessment } {
    if (!questions || questions.length === 0) {
      return {
        success: false,
        error: 'Each section must have at least 1 question (minimum of 1 required).',
      }
    }

    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return { success: false, error: 'Assessment not found' }

    const sec = assessment.sections.find((s) => s.id === sectionId)
    if (!sec) return { success: false, error: 'Section not found' }

    sec.questions = questions
    const saved = this.saveAssessment(assessment)
    return { success: true, assessment: saved }
  }

  addQuestionsToSection(
    assessmentId: string,
    sectionId: string,
    newQuestions: QuestionBankItem[]
  ): { success: boolean; assessment?: Assessment } {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return { success: false }

    const sec = assessment.sections.find((s) => s.id === sectionId)
    if (!sec) return { success: false }

    const existingIds = new Set(sec.questions.map((q) => q.id))
    const toAdd = newQuestions.filter((q) => !existingIds.has(q.id))

    sec.questions = [...sec.questions, ...toAdd]
    const saved = this.saveAssessment(assessment)
    return { success: true, assessment: saved }
  }

  removeQuestionFromSection(
    assessmentId: string,
    sectionId: string,
    questionId: string
  ): { success: boolean; error?: string; assessment?: Assessment } {
    const assessment = this.getAssessmentById(assessmentId)
    if (!assessment) return { success: false, error: 'Assessment not found' }

    const sec = assessment.sections.find((s) => s.id === sectionId)
    if (!sec) return { success: false, error: 'Section not found' }

    if (sec.questions.length <= 1) {
      return {
        success: false,
        error: 'Each section must retain a minimum of 1 question. Add another question before removing this one.',
      }
    }

    sec.questions = sec.questions.filter((q) => q.id !== questionId)
    const saved = this.saveAssessment(assessment)
    return { success: true, assessment: saved }
  }

  // Utilities
  getTotalQuestions(assessment: Assessment): number {
    return assessment.sections.reduce((sum, s) => sum + (s.questions?.length || 0), 0)
  }

  getTotalDurationMinutes(assessment: Assessment): number {
    return assessment.sections.reduce((sum, s) => {
      const timing = s.settings.timingMode
      const sectionMinutes = timing === 'timed' ? s.settings.timeLimitMinutes : 0
      const breakMinutes = s.settings.breakAfterSectionMinutes || 0
      return sum + sectionMinutes + breakMinutes
    }, 0)
  }

  validateAssessment(assessment: Assessment): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!assessment.title?.trim()) {
      errors.push('Assessment title is required.')
    }

    if (!assessment.sections || assessment.sections.length === 0) {
      errors.push('Assessment must contain at least one section.')
    } else {
      assessment.sections.forEach((sec, idx) => {
        if (!sec.title?.trim()) {
          errors.push(`Section ${idx + 1} must have a title.`)
        }
        if (!sec.questions || sec.questions.length < 1) {
          errors.push(
            `Section "${sec.title || idx + 1}" must contain at least 1 question (minimum 1 required).`
          )
        }
        if (sec.settings.timingMode === 'timed' && (!sec.settings.timeLimitMinutes || sec.settings.timeLimitMinutes < 1)) {
          errors.push(`Section "${sec.title || idx + 1}" timed limit must be at least 1 minute.`)
        }
      })
    }

    return {
      valid: errors.length === 0,
      errors,
    }
  }
}

export const assessmentService = new AssessmentService()
