import { supabase, isSupabaseConfigured } from './supabaseClient'

export interface QuestionChoice {
  id: string
  text: string
  isCorrect: boolean
  rationale?: string
}

export interface QuestionBankItem {
  id: string
  collection?: string
  domain: string
  chapter: string
  lesson: string
  difficulty: 'easy' | 'medium' | 'hard'
  questionType: 'multiple_choice' | 'multi_select' | 'grid_in'
  calculatorAllowed: boolean
  estimatedSeconds: number
  targetExam?: string
  prompt: string
  imageUrl?: string
  imageCaption?: string
  choices: QuestionChoice[]
  numericAnswer?: string
  numericTolerance?: string
  explanation: string
  commonMisconception?: string
  createdAt?: string
  updatedAt?: string
}

export interface QuestionCollection {
  id?: string
  name: string
  description?: string
  targetExam?: string
  colorTag?: string
  questionCount: number
  createdAt?: string
  updatedAt?: string
}

// Taxonomy Schema: Domain (Unit) -> Chapter -> Lesson
export interface TaxonomyLesson {
  name: string
  code?: string
  description?: string
}

export interface TaxonomyChapter {
  name: string
  code?: string
  lessons: (string | TaxonomyLesson)[]
}

export interface TaxonomyDomain {
  name: string
  unitLabel?: string // e.g. "Unit 1", "Unit 2"
  code?: string
  chapters: TaxonomyChapter[]
}

export type TaxonomyRegistry = Record<string, {
  unitLabel?: string
  code?: string
  chapters: {
    name: string
    code?: string
    lessons: string[]
  }[]
}>

const TAXONOMY_STORAGE_KEY = 'math_diag_custom_taxonomy_v3'
const TAXONOMY_INITIALIZED_FLAG = 'math_diag_taxonomy_initialized_v2'

// 3-Level Categorization Map: Domain(Unit) -> Chapter -> Lesson
export const CURRICULUM_TAXONOMY: TaxonomyRegistry = {}

const STORAGE_KEY = 'math_diag_question_bank'
const COLLECTIONS_STORAGE_KEY = 'math_diag_custom_collections'
const QB_INITIALIZED_FLAG = 'math_diag_qb_initialized_v2'
const COLLECTIONS_INITIALIZED_FLAG = 'math_diag_cols_initialized_v2'

export const INITIAL_COLLECTIONS: QuestionCollection[] = []

// Initial Seed Questions (organized into collections)
export const SAMPLE_SECTOR_DIAGRAM_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 360" width="100%" height="100%" style="background-color:%23f8fafc;font-family:system-ui,-apple-system,sans-serif;">
  <defs>
    <linearGradient id="sectorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="%233b82f6" stop-opacity="0.28" />
      <stop offset="100%" stop-color="%2360a5fa" stop-opacity="0.12" />
    </linearGradient>
  </defs>
  <!-- Full circle dashed outline -->
  <circle cx="230" cy="190" r="140" fill="none" stroke="%23cbd5e1" stroke-width="2" stroke-dasharray="5,5" />
  <!-- Shaded 60 degree sector OAB -->
  <path d="M 230 190 L 370 190 A 140 140 0 0 0 300 68.8 Z" fill="url(%23sectorGrad)" stroke="%232563eb" stroke-width="3" stroke-linejoin="round" />
  <!-- Radii segments -->
  <line x1="230" y1="190" x2="370" y2="190" stroke="%232563eb" stroke-width="2.5" />
  <line x1="230" y1="190" x2="300" y2="68.8" stroke="%232563eb" stroke-width="2.5" />
  <!-- Angle arc indicator at center -->
  <path d="M 270 190 A 40 40 0 0 0 250 155.3" fill="none" stroke="%23d97706" stroke-width="2.5" />
  <text x="272" y="166" font-size="14" font-weight="bold" fill="%23b45309">60°</text>
  <!-- Center point O -->
  <circle cx="230" cy="190" r="4.5" fill="%231e293b" />
  <text x="208" y="202" font-size="16" font-weight="bold" fill="%230f172a">O</text>
  <!-- Vertex A -->
  <circle cx="370" cy="190" r="4" fill="%232563eb" />
  <text x="382" y="195" font-size="16" font-weight="bold" fill="%231d4ed8">A</text>
  <!-- Vertex B -->
  <circle cx="300" cy="68.8" r="4" fill="%232563eb" />
  <text x="306" y="58" font-size="16" font-weight="bold" fill="%231d4ed8">B</text>
  <!-- Radius label r = 6 cm on OA -->
  <rect x="275" y="200" width="76" height="24" rx="6" fill="%23ffffff" stroke="%23e2e8f0" />
  <text x="313" y="216" font-size="13" font-weight="600" fill="%23334155" text-anchor="middle">r = 6 cm</text>
  <!-- Radius label on OB -->
  <rect x="228" y="105" width="76" height="24" rx="6" fill="%23ffffff" stroke="%23e2e8f0" />
  <text x="266" y="121" font-size="13" font-weight="600" fill="%23334155" text-anchor="middle">r = 6 cm</text>
  <!-- Arc AB note -->
  <text x="360" y="125" font-size="13" font-style="italic" fill="%2364748b">Arc AB</text>
</svg>`

export const INITIAL_SEED_QUESTIONS: QuestionBankItem[] = []

let qbListeners: (() => void)[] = []

// Service Helpers
export const questionBankService = {
  subscribe(listener: () => void): () => void {
    qbListeners.push(listener)
    return () => {
      qbListeners = qbListeners.filter((l) => l !== listener)
    }
  },

  notify(): void {
    qbListeners.forEach((cb) => {
      try {
        cb()
      } catch (err) {
        console.error('Error in questionBankService listener:', err)
      }
    })
  },

  async syncWithSupabase(): Promise<{ questions: QuestionBankItem[]; collections: QuestionCollection[]; taxonomy: TaxonomyRegistry }> {
    if (!isSupabaseConfigured) {
      return {
        questions: this.getStoredQuestions(),
        collections: this.getStoredCollections(),
        taxonomy: this.getTaxonomy(),
      }
    }

    try {
      // 1. Fetch questions from Supabase
      const { data: qData, error: qErr } = await supabase
        .from('questions')
        .select('*, question_choices(*), question_correct_answers(*)')
        .order('created_at', { ascending: false })

      if (qErr) {
        console.warn('Could not fetch questions from Supabase:', qErr.message)
      } else if (Array.isArray(qData)) {
        const mappedQuestions: QuestionBankItem[] = qData.map((q: any) => {
          const choices: QuestionChoice[] = (q.question_choices || [])
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((c: any) => ({
              id: c.id,
              text: c.text || '',
              isCorrect: Boolean(c.is_correct),
              rationale: c.rationale || undefined,
            }))

          const correctAns = (q.question_correct_answers || [])[0]?.correct_answer || ''

          return {
            id: q.id,
            collection: q.collection || 'General Question Bank',
            domain: q.domain || 'General Mathematics',
            chapter: q.chapter || '',
            lesson: q.lesson || '',
            difficulty: q.difficulty || 'medium',
            questionType: q.type === 'free_response' ? 'grid_in' : 'multiple_choice',
            calculatorAllowed: q.calculator_allowed ?? true,
            estimatedSeconds: q.estimated_seconds || 90,
            targetExam: q.target_exam || 'EST 1 / SAT Math',
            prompt: q.stem || q.prompt || '',
            imageUrl: q.image_url || undefined,
            imageCaption: q.image_caption || undefined,
            choices,
            numericAnswer: correctAns,
            explanation: q.explanation || '',
            commonMisconception: q.common_misconception || '',
            createdAt: q.created_at,
            updatedAt: q.updated_at,
          }
        })
        this.saveQuestions(mappedQuestions)
      }

      // 2. Fetch question_sets as collections
      const { data: colData } = await supabase
        .from('question_sets')
        .select('*')
        .order('created_at', { ascending: true })

      if (Array.isArray(colData)) {
        const mappedCols: QuestionCollection[] = colData.map((c: any) => ({
          id: c.id,
          name: c.name || '',
          description: c.description || '',
          targetExam: c.target_exam || 'EST 1 / SAT Math',
          colorTag: c.color_tag || 'blue',
          questionCount: c.question_count || 0,
          createdAt: c.created_at,
          updatedAt: c.updated_at,
        }))
        this.saveStoredCollections(mappedCols)
      }

      // 3. Fetch chapters and lessons for taxonomy
      const { data: chapData } = await supabase
        .from('chapters')
        .select('*, lessons(*)')
        .order('display_order', { ascending: true })

      if (Array.isArray(chapData)) {
        const tax: TaxonomyRegistry = {}
        chapData.forEach((ch: any) => {
          const dom = ch.domain || 'General Mathematics'
          if (!tax[dom]) {
            tax[dom] = {
              unitLabel: ch.unit_label || `Unit: ${dom}`,
              code: ch.domain_code || dom.slice(0, 4).toUpperCase(),
              chapters: [],
            }
          }
          const lessonNames: string[] = (ch.lessons || [])
            .sort((a: any, b: any) => (a.display_order ?? 0) - (b.display_order ?? 0))
            .map((l: any) => l.name || l.title || '')
            .filter(Boolean)

          tax[dom].chapters.push({
            name: ch.name || '',
            code: ch.code || undefined,
            lessons: lessonNames,
          })
        })
        this.saveTaxonomy(tax)
      }

      this.notify()
    } catch (e) {
      console.error('Error during questionBank syncWithSupabase:', e)
    }

    return {
      questions: this.getStoredQuestions(),
      collections: this.getStoredCollections(),
      taxonomy: this.getTaxonomy(),
    }
  },

  getStoredQuestions(): QuestionBankItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) {
        return []
      }
      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Failed to read questions from localStorage:', e)
      return []
    }
  },

  saveQuestions(questions: QuestionBankItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(questions))
      this.notify()
    } catch (e) {
      console.error('Failed to save questions to localStorage:', e)
    }
  },

  getQuestionById(id: string): QuestionBankItem | undefined {
    const list = this.getStoredQuestions()
    const targetId = String(id).trim()
    return list.find((q) => String(q.id).trim() === targetId)
  },

  addQuestion(question: QuestionBankItem): void {
    const list = this.getStoredQuestions()
    const targetId = String(question.id).trim()
    const updated = [question, ...list.filter((q) => String(q.id).trim() !== targetId)]
    this.saveQuestions(updated)
  },

  updateQuestion(id: string, updates: Partial<QuestionBankItem>): void {
    const list = this.getStoredQuestions()
    const targetId = String(id).trim()
    const updated = list.map((q) =>
      String(q.id).trim() === targetId ? { ...q, ...updates, updatedAt: new Date().toISOString() } : q
    )
    this.saveQuestions(updated)
  },

  deleteQuestion(id: string): void {
    const list = this.getStoredQuestions()
    const targetId = String(id).trim()
    const updated = list.filter((q) => String(q.id).trim() !== targetId)
    this.saveQuestions(updated)
  },

  deleteQuestions(ids: string[]): void {
    const list = this.getStoredQuestions()
    const idSet = new Set(ids.map((id) => String(id).trim()))
    const updated = list.filter((q) => !idSet.has(String(q.id).trim()))
    this.saveQuestions(updated)
  },

  clearAllQuestions(): void {
    this.saveQuestions([])
  },

  restoreDefaultSeedQuestions(): QuestionBankItem[] {
    this.saveQuestions(INITIAL_SEED_QUESTIONS)
    return INITIAL_SEED_QUESTIONS
  },

  deleteCollection(collectionName: string, deleteQuestions: boolean = false): void {
    const trimmed = collectionName.trim().toLowerCase()
    const currentCols = this.getStoredCollections()
    this.saveStoredCollections(currentCols.filter((c) => c.name.trim().toLowerCase() !== trimmed))

    const currentQuestions = this.getStoredQuestions()
    if (deleteQuestions) {
      this.saveQuestions(
        currentQuestions.filter((q) => (q.collection || '').trim().toLowerCase() !== trimmed)
      )
    } else {
      const updated = currentQuestions.map((q) => {
        if ((q.collection || '').trim().toLowerCase() === trimmed) {
          return { ...q, collection: 'General Question Bank' }
        }
        return q
      })
      this.saveQuestions(updated)
    }
  },

  // Dynamic Taxonomy Management (Domain (Unit) -> Chapter -> Lesson)
  getTaxonomy(): TaxonomyRegistry {
    try {
      const raw = localStorage.getItem(TAXONOMY_STORAGE_KEY)
      if (!raw) {
        return {}
      }

      const parsed = JSON.parse(raw)
      return typeof parsed === 'object' && parsed !== null ? parsed : {}
    } catch (e) {
      console.error('Failed to read taxonomy from localStorage:', e)
      return {}
    }
  },

  saveTaxonomy(taxonomy: TaxonomyRegistry): void {
    try {
      localStorage.setItem(TAXONOMY_STORAGE_KEY, JSON.stringify(taxonomy))
      this.notify()
    } catch (e) {
      console.error('Failed to save taxonomy to localStorage:', e)
    }
  },

  restoreDefaultTaxonomy(): TaxonomyRegistry {
    this.saveTaxonomy({})
    return {}
  },

  clearAllTaxonomy(): void {
    this.saveTaxonomy({})
  },

  addDomain(domainName: string, unitLabel?: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (tax[domainName]) return
    tax[domainName] = {
      unitLabel: unitLabel || `Unit: ${domainName}`,
      code: code || domainName.slice(0, 4).toUpperCase(),
      chapters: [],
    }
    this.saveTaxonomy(tax)
  },

  updateDomain(oldDomainName: string, newDomainName: string, unitLabel?: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[oldDomainName]) return
    const existingData = tax[oldDomainName]
    delete tax[oldDomainName]
    tax[newDomainName] = {
      ...existingData,
      unitLabel: unitLabel ?? existingData.unitLabel,
      code: code ?? existingData.code,
    }
    this.saveTaxonomy(tax)

    // Update questions mapped to the old domain name
    if (oldDomainName !== newDomainName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === oldDomainName ? { ...q, domain: newDomainName } : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteDomain(domainName: string, deleteLinkedQuestions: boolean = false): void {
    const tax = this.getTaxonomy()
    const trimmed = domainName.trim()
    const matchKey = Object.keys(tax).find((k) => k.trim().toLowerCase() === trimmed.toLowerCase()) || trimmed
    if (!tax[matchKey]) return
    delete tax[matchKey]
    this.saveTaxonomy(tax)

    if (deleteLinkedQuestions) {
      const questions = this.getStoredQuestions()
      this.saveQuestions(questions.filter((q) => q.domain.trim().toLowerCase() !== trimmed.toLowerCase()))
    }
  },

  addChapter(domainName: string, chapterName: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const exists = tax[domainName].chapters.some((c) => c.name === chapterName)
    if (exists) return
    tax[domainName].chapters.push({
      name: chapterName,
      code: code || `${tax[domainName].code || 'U'}.${tax[domainName].chapters.length + 1}`,
      lessons: [],
    })
    this.saveTaxonomy(tax)
  },

  updateChapter(domainName: string, oldChapterName: string, newChapterName: string, code?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const target = tax[domainName].chapters.find((c) => c.name === oldChapterName)
    if (!target) return
    target.name = newChapterName
    if (code) target.code = code
    this.saveTaxonomy(tax)

    if (oldChapterName !== newChapterName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === domainName && q.chapter === oldChapterName ? { ...q, chapter: newChapterName } : q
      )
      this.saveQuestions(updated)
    }
  },

  deleteChapter(domainName: string, chapterName: string, deleteLinkedQuestions: boolean = false): void {
    const tax = this.getTaxonomy()
    const dTrim = domainName.trim().toLowerCase()
    const cTrim = chapterName.trim().toLowerCase()
    const dKey = Object.keys(tax).find((k) => k.trim().toLowerCase() === dTrim) || domainName
    if (!tax[dKey]) return
    tax[dKey].chapters = tax[dKey].chapters.filter((c) => c.name.trim().toLowerCase() !== cTrim)
    this.saveTaxonomy(tax)

    if (deleteLinkedQuestions) {
      const questions = this.getStoredQuestions()
      this.saveQuestions(
        questions.filter(
          (q) => !(q.domain.trim().toLowerCase() === dTrim && q.chapter.trim().toLowerCase() === cTrim)
        )
      )
    }
  },

  addLesson(domainName: string, chapterName: string, lessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    if (chapter.lessons.includes(lessonName)) return
    chapter.lessons.push(lessonName)
    this.saveTaxonomy(tax)
  },

  updateLesson(domainName: string, chapterName: string, oldLessonName: string, newLessonName: string): void {
    const tax = this.getTaxonomy()
    if (!tax[domainName]) return
    const chapter = tax[domainName].chapters.find((c) => c.name === chapterName)
    if (!chapter) return
    const idx = chapter.lessons.indexOf(oldLessonName)
    if (idx === -1) return
    chapter.lessons[idx] = newLessonName
    this.saveTaxonomy(tax)

    if (oldLessonName !== newLessonName) {
      const questions = this.getStoredQuestions()
      const updated = questions.map((q) =>
        q.domain === domainName && q.chapter === chapterName && q.lesson === oldLessonName
          ? { ...q, lesson: newLessonName }
          : q
      )
      this.saveQuestions(updated)
    }
  },

  moveChapter(fromDomain: string, toDomain: string, chapterName: string, newChapterName?: string, newCode?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[fromDomain] || !tax[toDomain]) return
    const chapterIdx = tax[fromDomain].chapters.findIndex((c) => c.name === chapterName)
    if (chapterIdx === -1) return
    const [chapterObj] = tax[fromDomain].chapters.splice(chapterIdx, 1)
    if (newChapterName) chapterObj.name = newChapterName
    if (newCode) chapterObj.code = newCode
    tax[toDomain].chapters.push(chapterObj)
    this.saveTaxonomy(tax)

    const finalName = newChapterName || chapterName
    const questions = this.getStoredQuestions()
    const updated = questions.map((q) =>
      q.domain === fromDomain && q.chapter === chapterName
        ? { ...q, domain: toDomain, chapter: finalName }
        : q
    )
    this.saveQuestions(updated)
  },

  moveLesson(fromDomain: string, fromChapter: string, toDomain: string, toChapter: string, oldLessonName: string, newLessonName?: string): void {
    const tax = this.getTaxonomy()
    if (!tax[fromDomain] || !tax[toDomain]) return
    const srcChapter = tax[fromDomain].chapters.find((c) => c.name === fromChapter)
    const dstChapter = tax[toDomain].chapters.find((c) => c.name === toChapter)
    if (!srcChapter || !dstChapter) return
    const lessonIdx = srcChapter.lessons.indexOf(oldLessonName)
    if (lessonIdx === -1) return
    srcChapter.lessons.splice(lessonIdx, 1)
    const finalLesson = newLessonName || oldLessonName
    if (!dstChapter.lessons.includes(finalLesson)) {
      dstChapter.lessons.push(finalLesson)
    }
    this.saveTaxonomy(tax)

    const questions = this.getStoredQuestions()
    const updated = questions.map((q) =>
      q.domain === fromDomain && q.chapter === fromChapter && q.lesson === oldLessonName
        ? { ...q, domain: toDomain, chapter: toChapter, lesson: finalLesson }
        : q
    )
    this.saveQuestions(updated)
  },

  deleteLesson(domainName: string, chapterName: string, lessonName: string, deleteLinkedQuestions: boolean = false): void {
    const tax = this.getTaxonomy()
    const dTrim = domainName.trim().toLowerCase()
    const cTrim = chapterName.trim().toLowerCase()
    const lTrim = lessonName.trim().toLowerCase()
    const dKey = Object.keys(tax).find((k) => k.trim().toLowerCase() === dTrim) || domainName
    if (!tax[dKey]) return
    const chapter = tax[dKey].chapters.find((c) => c.name.trim().toLowerCase() === cTrim)
    if (!chapter) return
    chapter.lessons = chapter.lessons.filter((l) => l.trim().toLowerCase() !== lTrim)
    this.saveTaxonomy(tax)

    if (deleteLinkedQuestions) {
      const questions = this.getStoredQuestions()
      this.saveQuestions(
        questions.filter(
          (q) =>
            !(
              q.domain.trim().toLowerCase() === dTrim &&
              q.chapter.trim().toLowerCase() === cTrim &&
              q.lesson.trim().toLowerCase() === lTrim
            )
        )
      )
    }
  },

  // Returns questions filtered by domain, chapter, or lesson
  getQuestionsForTaxonomy(domain?: string, chapter?: string, lesson?: string): QuestionBankItem[] {
    const questions = this.getStoredQuestions()
    return questions.filter((q) => {
      if (domain && q.domain !== domain) return false
      if (chapter && q.chapter !== chapter) return false
      if (lesson && q.lesson !== lesson) return false
      return true
    })
  },

  getStoredCollections(): QuestionCollection[] {
    try {
      const raw = localStorage.getItem(COLLECTIONS_STORAGE_KEY)
      if (!raw) {
        return []
      }

      const parsed = JSON.parse(raw)
      return Array.isArray(parsed) ? parsed : []
    } catch (e) {
      console.error('Failed to read collections from localStorage:', e)
      return []
    }
  },

  saveStoredCollections(collections: QuestionCollection[]): void {
    try {
      localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections))
      this.notify()
    } catch (e) {
      console.error('Failed to save collections to localStorage:', e)
    }
  },

  getCollectionsList(): QuestionCollection[] {
    const questions = this.getStoredQuestions()
    const storedCols = this.getStoredCollections()

    // Calculate live question count per collection
    const counts = new Map<string, number>()
    questions.forEach((q) => {
      const name = q.collection?.trim() || 'General Question Bank'
      counts.set(name, (counts.get(name) || 0) + 1)
    })

    const map = new Map<string, QuestionCollection>()
    // Add stored collections first (even empty ones)
    storedCols.forEach((col) => {
      map.set(col.name, {
        ...col,
        questionCount: counts.get(col.name) || 0,
      })
    })

    // Also include any collection names found in stored questions that weren't explicitly registered
    counts.forEach((count, name) => {
      if (!map.has(name)) {
        map.set(name, {
          id: `col-auto-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
          name,
          description: '',
          targetExam: 'EST 1 / SAT Math',
          colorTag: 'blue',
          questionCount: count,
          createdAt: new Date().toISOString(),
        })
      }
    })

    return Array.from(map.values())
  },

  createCollection(
    name: string,
    description: string = '',
    targetExam: string = 'EST 1 / SAT Math',
    colorTag: string = 'blue'
  ): { success: boolean; error?: string; collection?: QuestionCollection } {
    const trimmed = name.trim()
    if (!trimmed) {
      return { success: false, error: 'Collection name cannot be empty.' }
    }

    const currentList = this.getStoredCollections()
    const existing = currentList.find((c) => c.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      return { success: false, error: `A collection named "${trimmed}" already exists.` }
    }

    const newCollection: QuestionCollection = {
      id: `col-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: trimmed,
      description: description.trim(),
      targetExam,
      colorTag,
      questionCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const updated = [...currentList, newCollection]
    this.saveStoredCollections(updated)

    return {
      success: true,
      collection: newCollection,
    }
  },

  updateCollection(
    oldName: string,
    updatedData: { name: string; description?: string; targetExam?: string; colorTag?: string }
  ): { success: boolean; error?: string } {
    const newName = updatedData.name.trim()
    if (!newName) {
      return { success: false, error: 'Collection name cannot be empty.' }
    }

    const currentCols = this.getStoredCollections()
    if (newName.toLowerCase() !== oldName.toLowerCase()) {
      const collision = currentCols.find((c) => c.name.toLowerCase() === newName.toLowerCase())
      if (collision) {
        return { success: false, error: `A collection named "${newName}" already exists.` }
      }
    }

    const updatedCols = currentCols.map((c) => {
      if (c.name === oldName) {
        return {
          ...c,
          name: newName,
          description: updatedData.description !== undefined ? updatedData.description : c.description,
          targetExam: updatedData.targetExam !== undefined ? updatedData.targetExam : c.targetExam,
          colorTag: updatedData.colorTag !== undefined ? updatedData.colorTag : c.colorTag,
          updatedAt: new Date().toISOString(),
        }
      }
      return c
    })
    this.saveStoredCollections(updatedCols)

    // Update questions referencing the old name
    if (newName !== oldName) {
      const questions = this.getStoredQuestions()
      const updatedQuestions = questions.map((q) => {
        if (q.collection === oldName) {
          return { ...q, collection: newName }
        }
        return q
      })
      this.saveQuestions(updatedQuestions)
    }

    return { success: true }
  },

  assignQuestionsToCollection(questionIds: string[], targetCollection: string): void {
    const idsSet = new Set(questionIds)
    const current = this.getStoredQuestions()
    const updated = current.map((q) => {
      if (idsSet.has(q.id)) {
        return { ...q, collection: targetCollection }
      }
      return q
    })
    this.saveQuestions(updated)
  },

  /**
   * Imports a JSON object or array into the question bank as a collection.
   * Gracefully supports:
   * - { collection_name: "...", description: "...", questions: [...] }
   * - { collectionName: "...", questions: [...] }
   * - { questions: [...] }
   * - Raw array of questions: [ { ... }, { ... } ]
   */
  importQuestionCollection(
    rawJson: any,
    fallbackCollectionName?: string
  ): { success: boolean; count: number; collectionName: string; errors?: string[] } {
    const errors: string[] = []
    let targetCollection =
      fallbackCollectionName?.trim() ||
      rawJson.collection_name ||
      rawJson.collectionName ||
      rawJson.collection ||
      'Imported Collection'

    let rawQuestionsList: any[] = []

    if (Array.isArray(rawJson)) {
      rawQuestionsList = rawJson
    } else if (rawJson && typeof rawJson === 'object') {
      if (Array.isArray(rawJson.questions)) {
        rawQuestionsList = rawJson.questions
      } else if (Array.isArray(rawJson.items)) {
        rawQuestionsList = rawJson.items
      } else {
        // Single question object
        rawQuestionsList = [rawJson]
      }
    } else {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: ['Invalid JSON format: Expected a collection object or an array of questions.'],
      }
    }

    if (rawQuestionsList.length === 0) {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: ['No questions found in the imported file.'],
      }
    }

    const importedQuestions: QuestionBankItem[] = []
    const now = new Date().toISOString()

    rawQuestionsList.forEach((item: any, idx: number) => {
      if (!item || typeof item !== 'object') {
        errors.push(`Item #${idx + 1} is not a valid question object.`)
        return
      }

      const prompt =
        item.prompt ||
        item.stem ||
        item.question ||
        item.text ||
        item.title ||
        `Imported Question #${idx + 1}`

      const domain = item.domain || 'Algebra & Functions'
      const chapter = item.chapter || item.cluster || item.unit || 'Linear Equations & Systems'
      const lesson = item.lesson || item.standard || item.competency || 'Single-Variable Linear Equations'
      const difficulty = ['easy', 'medium', 'hard'].includes(item.difficulty?.toLowerCase())
        ? (item.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard')
        : 'medium'

      const questionType = ['multiple_choice', 'multi_select', 'grid_in'].includes(item.questionType || item.type)
        ? (item.questionType || item.type)
        : 'multiple_choice'

      // Normalize choices
      let choices: QuestionChoice[] = []
      if (Array.isArray(item.choices)) {
        choices = item.choices.map((c: any, cIdx: number) => ({
          id: c.id || `c-${idx}-${cIdx}-${Date.now()}`,
          text: typeof c === 'string' ? c : c.text || c.label || `Option ${cIdx + 1}`,
          isCorrect: Boolean(c.isCorrect || c.correct || c.is_correct),
          rationale: c.rationale || c.explanation || '',
        }))
      } else if (Array.isArray(item.options)) {
        choices = item.options.map((opt: any, cIdx: number) => {
          const isCorrect =
            item.correct === cIdx ||
            item.correctIndex === cIdx ||
            item.correctAnswer === opt ||
            (typeof opt === 'object' && Boolean(opt.isCorrect))

          return {
            id: `c-${idx}-${cIdx}-${Date.now()}`,
            text: typeof opt === 'string' ? opt : opt.text || opt.label || `Option ${cIdx + 1}`,
            isCorrect,
            rationale: typeof opt === 'object' ? opt.rationale : '',
          }
        })
      }

      // If multiple choice but no choice marked correct, default first choice
      if (questionType !== 'grid_in' && choices.length > 0 && !choices.some((c) => c.isCorrect)) {
        choices[0].isCorrect = true
      }

      const questionItem: QuestionBankItem = {
        id: item.id ? String(item.id) : `qb-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
        collection: item.collection || targetCollection,
        domain,
        chapter,
        lesson,
        difficulty,
        questionType,
        calculatorAllowed: Boolean(item.calculatorAllowed ?? item.calculator),
        estimatedSeconds: Number(item.estimatedSeconds || item.timeLimit || 90),
        targetExam: item.targetExam || item.exam || 'EST 1 / SAT Math',
        prompt,
        imageUrl: item.imageUrl || item.image || item.diagram || '',
        imageCaption: item.imageCaption || item.caption || '',
        choices,
        numericAnswer: String(item.numericAnswer || item.correct_answer || item.answer || ''),
        numericTolerance: String(item.numericTolerance || '0'),
        explanation: item.explanation || item.solution || item.derivation || '',
        commonMisconception: item.commonMisconception || item.trap || item.misconception || '',
        createdAt: item.createdAt || now,
        updatedAt: now,
      }

      importedQuestions.push(questionItem)
    })

    if (importedQuestions.length === 0) {
      return {
        success: false,
        count: 0,
        collectionName: targetCollection,
        errors: errors.length > 0 ? errors : ['Failed to extract any valid questions.'],
      }
    }

    // Merge into general question bank repository
    const existing = this.getStoredQuestions()
    // Append or replace matching IDs
    const existingIds = new Set(importedQuestions.map((q) => q.id))
    const merged = [...importedQuestions, ...existing.filter((q) => !existingIds.has(q.id))]
    this.saveQuestions(merged)

    // Ensure collection is registered in stored collections
    const storedCols = this.getStoredCollections()
    if (!storedCols.some((c) => c.name.toLowerCase() === targetCollection.toLowerCase())) {
      this.saveStoredCollections([
        ...storedCols,
        {
          id: `col-import-${Date.now()}`,
          name: targetCollection,
          description: rawJson.description || 'Imported collection',
          targetExam: 'EST 1 / SAT Math',
          colorTag: 'blue',
          questionCount: importedQuestions.length,
          createdAt: new Date().toISOString(),
        },
      ])
    }

    return {
      success: true,
      count: importedQuestions.length,
      collectionName: targetCollection,
      errors: errors.length > 0 ? errors : undefined,
    }
  },

  exportCollectionAsJson(collectionName?: string): string {
    const questions = this.getStoredQuestions()
    const exportList = collectionName
      ? questions.filter((q) => (q.collection || 'General Question Bank') === collectionName)
      : questions

    const output = {
      collection_name: collectionName || 'All Math Diagnostic Question Bank',
      exported_at: new Date().toISOString(),
      version: '2.0',
      question_count: exportList.length,
      questions: exportList,
    }

    return JSON.stringify(output, null, 2)
  },

  getSampleCollectionTemplate(): object {
    return {
      collection_name: 'EST 1 Math Diagnostic - Specimen Collection',
      description: 'Curriculum-aligned questions with domains, chapters, lessons and KaTeX support',
      version: '2.0',
      questions: [
        {
          id: 'specimen-01',
          domain: 'Algebra & Functions',
          chapter: 'Quadratic & Polynomial Equations',
          lesson: 'Quadratic Formula & Discriminant Analysis',
          difficulty: 'medium',
          questionType: 'multiple_choice',
          calculatorAllowed: false,
          estimatedSeconds: 90,
          targetExam: 'EST 1 / SAT Math',
          prompt:
            'For the quadratic equation $2x^2 - 4x + k = 0$, what value of $k$ gives exactly one real distinct root?',
          imageUrl: '',
          imageCaption: '',
          choices: [
            {
              id: 'c1',
              text: '$k = 2$',
              isCorrect: true,
              rationale: 'Discriminant 16 - 8k = 0 implies k = 2.',
            },
            {
              id: 'c2',
              text: '$k = 4$',
              isCorrect: false,
              rationale: 'Yields negative discriminant and complex roots.',
            },
            {
              id: 'c3',
              text: '$k = -2$',
              isCorrect: false,
              rationale: 'Sign error on -4ac.',
            },
            {
              id: 'c4',
              text: '$k = 0$',
              isCorrect: false,
              rationale: 'Yields two distinct roots: 0 and 2.',
            },
          ],
          explanation:
            'For exactly one distinct real root, the discriminant must be zero: $\\Delta = b^2 - 4ac = 0$. Here $(-4)^2 - 4(2)(k) = 0 \\implies 16 - 8k = 0 \\implies k = 2$.',
          commonMisconception:
            'Students frequently confuse the condition for two roots ($\\Delta > 0$) with one root ($\\Delta = 0$).',
        },
        {
          id: 'specimen-02',
          domain: 'Geometry & Measurement',
          chapter: 'Circles & Coordinate Geometry',
          lesson: 'Arc Length & Sector Area Calculations',
          difficulty: 'easy',
          questionType: 'grid_in',
          calculatorAllowed: true,
          estimatedSeconds: 60,
          targetExam: 'EST 1 / SAT Math',
          prompt:
            'A circle has a radius of $10$. What is the area of a $90^\\circ$ sector divided by $\\pi$?',
          imageUrl: '',
          imageCaption: '',
          choices: [],
          numericAnswer: '25',
          numericTolerance: '0',
          explanation:
            'The area of the circle is $\\pi r^2 = 100\\pi$. A $90^\\circ$ sector is $90/360 = 1/4$ of the circle, so the area is $25\\pi$. Dividing by $\\pi$ gives $25$.',
          commonMisconception:
            'Dividing by diameter rather than squaring radius.',
        },
      ],
    }
  },
}
