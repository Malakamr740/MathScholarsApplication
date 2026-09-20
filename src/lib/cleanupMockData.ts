/**
 * Cleans up any legacy mock / seeded data from localStorage so that
 * the application loads exclusively data present in the database.
 */
export function purgeMockDataFromStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return

  const mockKeysToPurge = [
    'math_diag_assessments_v3',
    'math_diag_assessments_seeded_v3',
    'math_diag_question_bank',
    'math_diag_qb_initialized_v2',
    'math_diag_custom_collections',
    'math_diag_cols_initialized_v2',
    'math_diag_custom_taxonomy',
    'math_diag_taxonomy_initialized_v2',
    'math_diag_survey_questions',
    'math_diag_action_plans',
    'student_intake_sample-attempt',
    'assessment_result_sample-attempt',
    'recent_attempt_sample-attempt',
    'student_intake_attempt-sat-101',
    'student_intake_attempt-sat-103',
    'student_intake_attempt-sat-104',
    'student_intake_attempt-sat-105',
  ]

  mockKeysToPurge.forEach((key) => {
    try {
      localStorage.removeItem(key)
    } catch {
      // ignore
    }
  })
}
