import { questionBankService, QuestionBankItem } from './questionBankService'
import { supabase, isSupabaseConfigured } from './supabaseClient'

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

const STORAGE_KEY = 'math_diag_assessments_cache_v4'

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
  enablePostSurvey: false,
  shuffleSections: false,
}

class AssessmentService {
  private assessments: Assessment[] | null = null
  private listeners: (() => void)[] = []
  private isSyncing = false

  constructor() {
    // Initial async sync from database
    setTimeout(() => {
      this.syncWithSupabase()
    }, 0)
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener)
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((l) => {
      try {
        l()
      } catch (e) {
        console.error('Error in assessmentService listener:', e)
      }
    })
  }

  async syncWithSupabase(): Promise<Assessment[]> {
    if (!isSupabaseConfigured) {
      this.assessments = []
      return []
    }

    if (this.isSyncing) return this.assessments || []
    this.isSyncing = true

    try {
      const { data: dbAssessments, error: aError } = await supabase
        .from('assessments')
        .select('*')
        .order('created_at', { ascending: false })

      if (aError || !dbAssessments) {
        console.warn('Could not fetch assessments from Supabase:', aError?.message)
        this.isSyncing = false
        return this.assessments || []
      }

      // Fetch modules
      const { data: dbModules } = await supabase
        .from('modules')
        .select('*')
        .order('display_order', { ascending: true })

      // Fetch attempts count per assessment
      const { data: dbAttempts } = await supabase
        .from('attempts')
        .select('assessment_id')

      const attemptsCountMap = new Map<string, number>()
      dbAttempts?.forEach((att) => {
        if (att.assessment_id) {
          attemptsCountMap.set(att.assessment_id, (attemptsCountMap.get(att.assessment_id) || 0) + 1)
        }
      })

      const modulesByAssessment = new Map<string, any[]>()
      dbModules?.forEach((m) => {
        if (m.assessment_id) {
          const existing = modulesByAssessment.get(m.assessment_id) || []
          existing.push(m)
          modulesByAssessment.set(m.assessment_id, existing)
        }
      })

      const bank = questionBankService.getStoredQuestions()
      const bankMap = new Map<string, QuestionBankItem>()
      bank.forEach((q) => bankMap.set(q.id, q))

      const result: Assessment[] = dbAssessments.map((a) => {
        const rawModules = modulesByAssessment.get(a.id) || []
        const sections: AssessmentSection[] = rawModules.map((m, idx) => ({
          id: m.id,
          title: m.name || `Section ${idx + 1}`,
          description: m.description || '',
          orderIndex: m.display_order ?? idx,
          settings: {
            timingMode: m.timing_enabled ? 'timed' : 'untimed',
            timeLimitMinutes: m.time_limit_minutes || 25,
            calculatorType: 'desmos',
            navigationMode: 'free',
            shuffleQuestions: Boolean(m.shuffle_questions),
            allowReviewBeforeSubmit: true,
            breakAfterSectionMinutes: 0,
          },
          questions: [],
        }))

        return {
          id: a.id,
          title: a.name,
          code: `ASSESS-${a.id.slice(0, 6).toUpperCase()}`,
          description: a.description || '',
          level: 'EST 1 / High School',
          targetExam: 'EST 1 Math',
          status: a.status === 'published' ? 'active' : 'draft',
          attemptsCount: attemptsCountMap.get(a.id) || 0,
          settings: {
            ...DEFAULT_ASSESSMENT_SETTINGS,
            instructions: a.instructions || DEFAULT_ASSESSMENT_SETTINGS.instructions,
          },
          sections:
            sections.length > 0
              ? sections
              : [
                  {
                    id: `sec-${a.id}-m1`,
                    title: 'Section 1',
                    description: '',
                    orderIndex: 0,
                    settings: { ...DEFAULT_SECTION_SETTINGS },
                    questions: [],
                  },
                ],
          createdAt: a.created_at,
          updatedAt: a.updated_at,
        }
      })

      this.assessments = result
      this.persist(result)
      this.isSyncing = false
      this.notifyListeners()
      return result
    } catch (err) {
      console.error('Error syncing assessments with Supabase:', err)
      this.isSyncing = false
      return this.assessments || []
    }
  }

  private load(): Assessment[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Array.isArray(parsed)) {
          return parsed
        }
      }
    } catch (err) {
      console.warn('Could not load assessments from cache', err)
    }

    // Trigger sync immediately and return empty array - NEVER return fake data!
    setTimeout(() => {
      this.syncWithSupabase()
    }, 0)
    return []
  }

  private persist(assessments: Assessment[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(assessments))
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

  async fetchAssessments(): Promise<Assessment[]> {
    return this.syncWithSupabase()
  }

  getAssessmentById(id: string): Assessment | null {
    const list = this.getAllAssessments()
    return list.find((a) => a.id === id) || null
  }

  async fetchAssessmentById(id: string): Promise<Assessment | null> {
    const list = await this.syncWithSupabase()
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
    this.notifyListeners()

    // Persist to Supabase in background
    if (isSupabaseConfigured) {
      ;(async () => {
        try {
          await supabase.from('assessments').upsert({
            id: assessment.id,
            name: assessment.title,
            description: assessment.description,
            instructions: assessment.settings.instructions,
            status: assessment.status === 'active' ? 'published' : 'draft',
            updated_at: new Date().toISOString(),
          })

          for (const sec of assessment.sections) {
            await supabase.from('modules').upsert({
              id: sec.id,
              assessment_id: assessment.id,
              name: sec.title,
              description: sec.description,
              display_order: sec.orderIndex,
              timing_enabled: sec.settings.timingMode === 'timed',
              time_limit_minutes: sec.settings.timeLimitMinutes,
              shuffle_questions: sec.settings.shuffleQuestions,
              updated_at: new Date().toISOString(),
            })
          }
        } catch (e) {
          console.warn('Supabase assessment update error:', e)
        }
      })()
    }

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
          questions: [],
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
      this.notifyListeners()

      if (isSupabaseConfigured) {
        supabase.from('modules').delete().eq('assessment_id', id).then(() => {
          supabase.from('assessments').delete().eq('id', id).then(() => {})
        })
      }
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
      this.notifyListeners()
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
        : [],
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
