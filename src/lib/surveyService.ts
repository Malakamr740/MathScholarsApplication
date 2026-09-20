export interface SurveyQuestionOption {
  id: string
  label: string
  value: string
}

export interface SurveyQuestion {
  id: string
  prompt: string
  description?: string
  type: 'single_choice' | 'multi_choice' | 'text' | 'rating' | 'slider' | 'multiple_choice' | 'scale'
  required: boolean
  order_index: number
  category?: 'timeline' | 'study_habits' | 'challenges' | 'test_taking' | 'general' | string
  options?: SurveyQuestionOption[]
}

export interface ActionPlanMilestone {
  title: string
  timeframe: string
  description: string
  tasks: string[]
}

export interface WeeklyRoutineItem {
  day_group: string
  focus: string
  suggested_hours: string
}

export interface ActionPlan {
  id: string
  title: string
  tagline: string
  summary: string
  target_audience: string
  badge_color: 'blue' | 'emerald' | 'amber' | 'purple' | 'indigo' | 'rose'
  min_score: number
  max_score: number
  milestones: ActionPlanMilestone[]
  weekly_routine: WeeklyRoutineItem[]
  prescriptive_advice: string[]
  recommended_resources: string[]
}

export interface StudentSurveyResponse {
  attemptId: string
  answers: Record<string, any>
  scorePct?: number
  matched_plan_id?: string
  timestamp: number
}

const STORAGE_KEYS = {
  QUESTIONS: 'math_diag_survey_questions',
  PLANS: 'math_diag_action_plans',
  RESPONSES: 'math_diag_survey_responses',
}

export const DEFAULT_SURVEY_QUESTIONS: SurveyQuestion[] = [
  {
    id: 'q_target_exam_date',
    prompt: 'When do you plan to take your official exam (EST 1 or SAT Math)?',
    description: 'This helps calibrate the urgency and phase duration of your growth roadmap.',
    type: 'single_choice',
    required: true,
    order_index: 0,
    category: 'timeline',
    options: [
      { id: 'opt_t1', label: 'Within the next 4 weeks (Immediate Sprint)', value: 'next_4_weeks' },
      { id: 'opt_t2', label: 'In 2 to 3 months (Standard Prep Cycle)', value: '2_to_3_months' },
      { id: 'opt_t3', label: 'In 4 to 6 months (Comprehensive Mastery)', value: '4_to_6_months' },
      { id: 'opt_t4', label: 'Just benchmarking / Exploratory Diagnostic', value: 'benchmarking' },
    ],
  },
  {
    id: 'q_weekly_study_hours',
    prompt: 'How many dedicated hours per week can you allocate to math prep?',
    description: 'Be realistic so your weekly schedule reflects sustainable habit building.',
    type: 'single_choice',
    required: true,
    order_index: 1,
    category: 'study_habits',
    options: [
      { id: 'opt_h1', label: '1 - 3 hours / week (Light)', value: '1_to_3' },
      { id: 'opt_h2', label: '4 - 7 hours / week (Balanced Routine)', value: '4_to_7' },
      { id: 'opt_h3', label: '8 - 12 hours / week (Intensive)', value: '8_to_12' },
      { id: 'opt_h4', label: '12+ hours / week (Full Immersion)', value: '12_plus' },
    ],
  },
  {
    id: 'q_primary_challenge',
    prompt: 'What was your single biggest struggle during this assessment?',
    description: 'Helps us tailor your specific error correction and psychological pacing advice.',
    type: 'single_choice',
    required: true,
    order_index: 2,
    category: 'challenges',
    options: [
      { id: 'opt_c1', label: 'Time Management (Rushed through the last 5-10 questions)', value: 'time_pacing' },
      { id: 'opt_c2', label: 'Forgotten Concepts & Formulas (Unsure of theorem or formula)', value: 'forgotten_concepts' },
      { id: 'opt_c3', label: 'Careless & Calculation Errors (Knew how to solve but made slips)', value: 'careless_errors' },
      { id: 'opt_c4', label: 'Word Problems & Long Stems (Hard to extract algebraic equations)', value: 'word_problems' },
    ],
  },
  {
    id: 'q_calculator_confidence',
    prompt: 'How confident are you using digital calculators and graphing tools (e.g., Desmos)?',
    description: 'Graphing shortcuts can save 8-10 minutes per module on EST 1 and digital SAT.',
    type: 'single_choice',
    required: false,
    order_index: 3,
    category: 'test_taking',
    options: [
      { id: 'opt_calc1', label: 'Expert: I use regression, sliders, and graph intersections seamlessly', value: 'expert' },
      { id: 'opt_calc2', label: 'Moderate: I use it for basic arithmetic and simple graphing', value: 'moderate' },
      { id: 'opt_calc3', label: 'Beginner: I mostly solve by hand and rarely use graphing features', value: 'beginner' },
    ],
  },
]

export const DEFAULT_ACTION_PLANS: ActionPlan[] = [
  {
    id: 'plan_foundation_builder',
    title: 'Core Foundations & Conceptual Reset',
    tagline: 'Focus on rebuilding core algebra and arithmetic mastery without time anxiety',
    summary:
      'Your diagnostic indicates opportunities to lock in high-frequency foundational questions (Linear equations, ratios, and basic quadratic models) before tackling multi-step questions.',
    target_audience: 'Scoring below 50% (Diagnostic Score 200 - 480 range)',
    badge_color: 'amber',
    min_score: 0,
    max_score: 49,
    milestones: [
      {
        title: 'Phase 1: Arithmetic & Linear Precision',
        timeframe: 'Weeks 1-2',
        description: 'Eliminate calculation slips and master single-variable equations & system substitution.',
        tasks: [
          'Work through 50 Heart of Algebra linear equation drills without time pressure',
          'Create an active handwritten Math Formula & Theorem Cheatsheet',
          'Review every incorrect question on this diagnostic and rewrite step-by-step solutions',
        ],
      },
      {
        title: 'Phase 2: Ratios, Percentages & Data Interpretation',
        timeframe: 'Weeks 3-4',
        description: 'Master 2-way tables, unit conversions, and scatterplot trend lines.',
        tasks: [
          'Practice 30 Problem Solving & Data Analysis questions',
          'Master Desmos table entry to compute lines of best fit',
          'Complete 2 untimed 20-question checkpoint mini-modules',
        ],
      },
      {
        title: 'Phase 3: Timed Sections & Pacing Calibration',
        timeframe: 'Weeks 5-6',
        description: 'Introduce gradual time constraints with a target pace of 85 seconds per question.',
        tasks: [
          'Take 3 full-length timed diagnostic modules',
          'Track error classifications: Concept Gap vs. Careless Slip vs. Time Panic',
        ],
      },
    ],
    weekly_routine: [
      { day_group: 'Monday & Wednesday', focus: 'Algebraic Foundations & Drill Sets', suggested_hours: '1.5 Hours' },
      { day_group: 'Tuesday & Thursday', focus: 'Data Analysis & Formula Flashcards', suggested_hours: '1 Hour' },
      { day_group: 'Saturday', focus: 'Error Log Deep Dive & Re-testing', suggested_hours: '2 Hours' },
    ],
    prescriptive_advice: [
      'Stop rushing into algebraic manipulations; take 10 seconds to underline the exact variable requested.',
      'Maintain an organized "Black Book" error journal with each missed problem, the trap you fell into, and the takeaway rule.',
      'Check if back-solving with answer choices (plugging in values) is faster than factoring complex polynomials.',
    ],
    recommended_resources: [
      'Curriculum Question Bank - Foundations Domain Filter',
      'Desmos Digital SAT/EST 1 Graphing Calculator Guide',
      'Diagnostic Section 1 & 2 Question Step-by-Step Solutions',
    ],
  },
  {
    id: 'plan_score_accelerator',
    title: 'Precision Pacing & Intermediate Acceleration',
    tagline: 'Transform consistent knowledge into high-speed execution and eliminate trap answers',
    summary:
      'You have solid fundamental math intuition, but test pacing and multi-step trap structures are capping your score. This plan hones your speed and systematic question triage.',
    target_audience: 'Scoring 50% to 74% (Diagnostic Score 500 - 640 range)',
    badge_color: 'blue',
    min_score: 50,
    max_score: 74,
    milestones: [
      {
        title: 'Phase 1: Trap Recognition & Question Triage',
        timeframe: 'Weeks 1-2',
        description: 'Learn the "two-pass" testing technique: solve immediate green questions first, flag yellow traps.',
        tasks: [
          'Practice categorizing questions in 5 seconds into Instant vs. Multi-Step vs. Flag for Later',
          'Deep dive into quadratic vertex form vs standard form vs factored form translations',
          'Drill 40 Passport to Advanced Math non-linear function questions',
        ],
      },
      {
        title: 'Phase 2: Geometry & Trigonometry Sprint',
        timeframe: 'Weeks 3-4',
        description: 'Secure points on circle equations, similarity, right-triangle trigonometry, and volume formulas.',
        tasks: [
          'Review arc length and sector area formulas in radians and degrees',
          'Solve 25 3D geometry and similar triangle questions',
          'Practice Desmos slider techniques for intersecting system of equations',
        ],
      },
      {
        title: 'Phase 3: High-Speed Module Simulation',
        timeframe: 'Weeks 5-6',
        description: 'Complete full tests under strict time conditions with 5 minutes reserved for review.',
        tasks: [
          'Simulate 4 full EST 1 / SAT math diagnostic exams',
          'Ensure average time on first 10 questions is under 60 seconds each',
          'Audit all flagged items before final submission',
        ],
      },
    ],
    weekly_routine: [
      { day_group: 'Monday & Wednesday', focus: 'Advanced Algebra & Function Transformations', suggested_hours: '2 Hours' },
      { day_group: 'Tuesday & Thursday', focus: 'Geometry, Trig & Desmos Automation', suggested_hours: '2 Hours' },
      { day_group: 'Saturday', focus: 'Full Timed Module & Pacing Analysis', suggested_hours: '2.5 Hours' },
    ],
    prescriptive_advice: [
      'If a problem looks like it will take more than 4 algebraic steps, there is almost certainly a visual symmetry or Desmos graphing shortcut.',
      'Always sketch diagrams on scratch paper if none is provided in the prompt.',
      'Watch out for hidden domain constraints, like denominators equal to zero or negative values under square roots.',
    ],
    recommended_resources: [
      'Advanced Question Bank Filter: Difficulty Level Medium & Hard',
      'Pacing Stopwatch & Diagnostic Time Breakdown Analytics',
      'Desmos Advanced Shortcuts & Systems of Equations Playbook',
    ],
  },
  {
    id: 'plan_mastery_perfection',
    title: 'Near-Perfect Mastery & Hard Question Protocol',
    tagline: 'Master the top 5% difficulty problems and execute under high pressure without slips',
    summary:
      'You are performing at an advanced level. Your growth path is focused on eliminating 1-2 careless errors and mastering the most challenging multi-step questions (complex polynomials, circle theorems, and statistical margins of error).',
    target_audience: 'Scoring 75% to 100% (Diagnostic Score 650 - 800 range)',
    badge_color: 'purple',
    min_score: 75,
    max_score: 100,
    milestones: [
      {
        title: 'Phase 1: Hard Item Analysis & Extreme Edge Cases',
        timeframe: 'Weeks 1-2',
        description: 'Exclusively practice high-difficulty questions: discriminants with unknown constants, circle tangents, and statistical inference.',
        tasks: [
          'Isolate all difficulty-5 and difficulty-4 questions in the Question Bank',
          'Practice finding algebraic solutions AND Desmos confirmation for each problem',
          'Master margin of error and randomized experiment confidence statements',
        ],
      },
      {
        title: 'Phase 2: Stress-Testing & Speed Optimization',
        timeframe: 'Weeks 3-4',
        description: 'Complete test modules in 80% of allotted time to build a 7-minute buffer for auditing.',
        tasks: [
          'Run 3 sprint modules with a 30-minute timer instead of 35 minutes',
          'Establish a systematic reverse-checking checklist for the final 5 minutes',
          'Verify every sign flip, exponent rule, and negative root calculation',
        ],
      },
      {
        title: 'Phase 3: Peak Performance Simulation',
        timeframe: 'Weeks 5-6',
        description: 'Full official test conditions with morning stamina simulation.',
        tasks: [
          'Take 2 full-length diagnostic exams at 8:30 AM with official breaks',
          'Target zero unforced calculation errors',
          'Achieve consecutive 780+ scaled score targets',
        ],
      },
    ],
    weekly_routine: [
      { day_group: 'Monday & Wednesday', focus: 'Difficulty 5 Hard Item Sets & Edge Cases', suggested_hours: '2 Hours' },
      { day_group: 'Tuesday & Thursday', focus: 'Speed Modules & Reverse Verification Drill', suggested_hours: '1.5 Hours' },
      { day_group: 'Saturday', focus: 'Full Official Benchmark Assessment', suggested_hours: '3 Hours' },
    ],
    prescriptive_advice: [
      'Do not rely on one method alone: for high-stakes hard questions, solve with algebra and re-verify with graphic visualization.',
      'Check the boundary values and sign restrictions: is x an integer? Can x be negative or zero?',
      'When you finish early, do not passively review; re-solve the 4 most complex questions from scratch on fresh scratch paper.',
    ],
    recommended_resources: [
      'Top Tier Question Bank Hard-Item Collection',
      'EST 1 / SAT Math 800 Club Master Problem Sets',
      'Diagnostic Behavioral Pacing & Three-State Classification Dashboard',
    ],
  },
]

class SurveyService {
  private questions: SurveyQuestion[] | null = null
  private actionPlans: ActionPlan[] | null = null
  private responses: Record<string, StudentSurveyResponse> | null = null

  private loadQuestions(): SurveyQuestion[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.QUESTIONS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to read survey questions from localStorage', e)
    }
    return []
  }

  private loadActionPlans(): ActionPlan[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PLANS)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to read action plans from localStorage', e)
    }
    return []
  }

  private loadResponses(): Record<string, StudentSurveyResponse> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.RESPONSES)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.warn('Failed to read survey responses from localStorage', e)
    }
    return {}
  }

  getQuestions(): SurveyQuestion[] {
    if (!this.questions) {
      this.questions = this.loadQuestions()
    }
    return [...this.questions].sort((a, b) => a.order_index - b.order_index)
  }

  saveQuestions(questions: SurveyQuestion[]): void {
    const sorted = [...questions].map((q, idx) => ({ ...q, order_index: idx }))
    this.questions = sorted
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(sorted))
    } catch (e) {
      console.warn('Failed to persist survey questions', e)
    }
  }

  resetQuestions(): SurveyQuestion[] {
    this.questions = DEFAULT_SURVEY_QUESTIONS
    try {
      localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(DEFAULT_SURVEY_QUESTIONS))
    } catch (e) {
      console.warn('Failed to reset survey questions', e)
    }
    return [...DEFAULT_SURVEY_QUESTIONS]
  }

  getActionPlans(): ActionPlan[] {
    if (!this.actionPlans) {
      this.actionPlans = this.loadActionPlans()
    }
    return [...this.actionPlans].sort((a, b) => a.min_score - b.min_score)
  }

  saveActionPlans(plans: ActionPlan[]): void {
    const sorted = [...plans].sort((a, b) => a.min_score - b.min_score)
    this.actionPlans = sorted
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(sorted))
    } catch (e) {
      console.warn('Failed to persist action plans', e)
    }
  }

  resetActionPlans(): ActionPlan[] {
    this.actionPlans = DEFAULT_ACTION_PLANS
    try {
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(DEFAULT_ACTION_PLANS))
    } catch (e) {
      console.warn('Failed to reset action plans', e)
    }
    return [...DEFAULT_ACTION_PLANS]
  }

  saveStudentResponse(attemptId: string, answers: Record<string, any>, scorePct: number = 50): ActionPlan {
    if (!this.responses) {
      this.responses = this.loadResponses()
    }
    const matched = this.matchActionPlan(answers, scorePct)
    const response: StudentSurveyResponse = {
      attemptId,
      answers,
      scorePct,
      matched_plan_id: matched.id,
      timestamp: Date.now(),
    }
    this.responses[attemptId] = response
    try {
      localStorage.setItem(STORAGE_KEYS.RESPONSES, JSON.stringify(this.responses))
    } catch (e) {
      console.warn('Failed to persist survey response', e)
    }
    return matched
  }

  getResponse(attemptId: string): StudentSurveyResponse | null {
    if (!this.responses) {
      this.responses = this.loadResponses()
    }
    return this.responses[attemptId] || null
  }

  matchActionPlan(answers: Record<string, any>, scorePct: number = 50, plans?: ActionPlan[]): ActionPlan {
    const availablePlans = (plans && plans.length > 0 ? plans : this.getActionPlans()).sort(
      (a, b) => a.min_score - b.min_score
    )

    // Match based on score percentage bounds
    let matched = availablePlans.find(
      (plan) => scorePct >= plan.min_score && scorePct <= plan.max_score
    )

    // Fallback if score is out of configured ranges
    if (!matched) {
      if (scorePct < (availablePlans[0]?.min_score ?? 50)) {
        matched = availablePlans[0]
      } else {
        matched = availablePlans[availablePlans.length - 1]
      }
    }

    // Default emergency fallback
    if (!matched) {
      matched = DEFAULT_ACTION_PLANS[1]
    }

    return matched
  }
}

export const surveyService = new SurveyService()
