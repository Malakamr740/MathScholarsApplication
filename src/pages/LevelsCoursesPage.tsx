import React, { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Target,
  Layers,
  CheckCircle2,
  Sliders,
  ChevronRight,
} from 'lucide-react'

interface AcademicLevel {
  id: string
  name: string
  code: string
  description: string
  targetCohort: string
  activeAssessmentsCount: number
}

interface CourseItem {
  id: string
  title: string
  code: string
  levelId: string
  domainsCovered: string[]
  questionCount: number
}

export const LevelsCoursesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'levels' | 'courses'>('levels')

  const [levels, setLevels] = useState<AcademicLevel[]>([
    {
      id: 'lvl-g9',
      name: 'Grade 9 (Freshman High School)',
      code: 'G9',
      description: 'Foundational algebra, linear relations, and basic Euclidean geometry principles.',
      targetCohort: 'Students transitioning into high school mathematics',
      activeAssessmentsCount: 2,
    },
    {
      id: 'lvl-g10',
      name: 'Grade 10 (Sophomore High School)',
      code: 'G10',
      description: 'Coordinate geometry, quadratic factoring, systems, and intermediate functions.',
      targetCohort: 'Core benchmark cohort for early diagnostic evaluation',
      activeAssessmentsCount: 3,
    },
    {
      id: 'lvl-g11',
      name: 'Grade 11 (Junior High School)',
      code: 'G11',
      description: 'Advanced polynomial algebra, exponential models, and trigonometric ratios.',
      targetCohort: 'High-stakes test preparation cohort',
      activeAssessmentsCount: 4,
    },
    {
      id: 'lvl-est1',
      name: 'EST 1 / SAT Mathematics Intensive',
      code: 'EST1',
      description: 'Standardized examination diagnostic covering all 4 College Board / EST curriculum domains.',
      targetCohort: 'Grade 11-12 standardized test-takers',
      activeAssessmentsCount: 6,
    },
  ])

  const [courses, setCourses] = useState<CourseItem[]>([
    {
      id: 'crs-alg1',
      title: 'Integrated Algebra I & Functions',
      code: 'MATH-101',
      levelId: 'lvl-g9',
      domainsCovered: ['Heart of Algebra', 'Problem Solving & Data Analysis'],
      questionCount: 48,
    },
    {
      id: 'crs-geom',
      title: 'Geometric Proofs, Angles & Solid Volume',
      code: 'MATH-201',
      levelId: 'lvl-g10',
      domainsCovered: ['Additional Topics in Math (Geometry)'],
      questionCount: 36,
    },
    {
      id: 'crs-alg2',
      title: 'Algebra II & Non-Linear Functions',
      code: 'MATH-301',
      levelId: 'lvl-g11',
      domainsCovered: ['Passport to Advanced Math', 'Complex Numbers'],
      questionCount: 52,
    },
    {
      id: 'crs-est1',
      title: 'EST 1 Standardized Math Diagnostic Master',
      code: 'EST-PREP',
      levelId: 'lvl-est1',
      domainsCovered: ['All 4 Official Domains', 'Calculator & Non-Calculator'],
      questionCount: 75,
    },
  ])

  // Modals
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false)
  const [newLevelName, setNewLevelName] = useState('')
  const [newLevelCode, setNewLevelCode] = useState('')
  const [newLevelDesc, setNewLevelDesc] = useState('')

  const [isCourseModalOpen, setIsCourseModalOpen] = useState(false)
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseCode, setNewCourseCode] = useState('')
  const [newCourseLevel, setNewCourseLevel] = useState('lvl-g10')

  const handleAddLevel = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newLevelName.trim()) return
    const newLvl: AcademicLevel = {
      id: `lvl-${Date.now()}`,
      name: newLevelName.trim(),
      code: newLevelCode.trim().toUpperCase() || 'LVL',
      description: newLevelDesc.trim(),
      targetCohort: 'Custom academic cohort',
      activeAssessmentsCount: 0,
    }
    setLevels((prev) => [...prev, newLvl])
    setNewLevelName('')
    setNewLevelCode('')
    setNewLevelDesc('')
    setIsLevelModalOpen(false)
  }

  const handleDeleteLevel = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this level?')) return
    setLevels((prev) => prev.filter((l) => l.id !== id))
  }

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newCourseTitle.trim()) return
    const newCrs: CourseItem = {
      id: `crs-${Date.now()}`,
      title: newCourseTitle.trim(),
      code: newCourseCode.trim().toUpperCase() || 'CRS',
      levelId: newCourseLevel,
      domainsCovered: ['Algebra & Functions'],
      questionCount: 0,
    }
    setCourses((prev) => [...prev, newCrs])
    setNewCourseTitle('')
    setNewCourseCode('')
    setIsCourseModalOpen(false)
  }

  const handleDeleteCourse = (id: string) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return
    setCourses((prev) => prev.filter((c) => c.id !== id))
  }

  return (
    <AdminLayout
      title="Academic Levels & Courses"
      subtitle="Organize grade tiers, academic tracks, and curriculum course mappings"
      actions={
        <button
          type="button"
          onClick={() => (activeTab === 'levels' ? setIsLevelModalOpen(true) : setIsCourseModalOpen(true))}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>{activeTab === 'levels' ? 'Add Academic Level' : 'Add Course'}</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('levels')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'levels'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Target className="h-4 w-4" />
            <span>Academic Levels ({levels.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'courses'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Curriculum Courses ({courses.length})</span>
          </button>
        </div>

        {/* Levels Tab */}
        {activeTab === 'levels' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {levels.map((lvl) => (
              <div
                key={lvl.id}
                className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                      {lvl.code}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {lvl.activeAssessmentsCount} Assessments Active
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 mt-2.5">{lvl.name}</h3>
                  <p className="text-xs text-slate-600 mt-1">{lvl.description}</p>
                  <p className="text-[11px] text-slate-400 mt-2 italic">Target: {lvl.targetCohort}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">
                    Courses: {courses.filter((c) => c.levelId === lvl.id).length} mapped
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDeleteLevel(lvl.id)}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                    title="Delete Level"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((crs) => {
              const matchedLevel = levels.find((l) => l.id === crs.levelId)
              return (
                <div
                  key={crs.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                        {crs.code}
                      </span>
                      <span className="text-[11px] font-medium text-slate-500">
                        {matchedLevel?.name || 'General Level'}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 mt-2.5">{crs.title}</h3>

                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {crs.domainsCovered.map((dom, di) => (
                        <span
                          key={di}
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700"
                        >
                          {dom}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500">{crs.questionCount} Associated Items</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCourse(crs.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Delete Course"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add Level Modal */}
        {isLevelModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddLevel}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900">Add Academic Level</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Level Name</label>
                <input
                  type="text"
                  value={newLevelName}
                  onChange={(e) => setNewLevelName(e.target.value)}
                  placeholder="e.g. Grade 12 Advanced Pre-Calculus"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Level Code</label>
                <input
                  type="text"
                  value={newLevelCode}
                  onChange={(e) => setNewLevelCode(e.target.value)}
                  placeholder="e.g. G12-ADV"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  value={newLevelDesc}
                  onChange={(e) => setNewLevelDesc(e.target.value)}
                  placeholder="Scope and expectations..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsLevelModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Create Level
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Add Course Modal */}
        {isCourseModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddCourse}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900">Add Curriculum Course</h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Title</label>
                <input
                  type="text"
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder="e.g. Advanced Trigonometry & Complex Numbers"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Course Code</label>
                <input
                  type="text"
                  value={newCourseCode}
                  onChange={(e) => setNewCourseCode(e.target.value)}
                  placeholder="e.g. MATH-401"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Level</label>
                <select
                  value={newCourseLevel}
                  onChange={(e) => setNewCourseLevel(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  {levels.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCourseModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Create Course
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default LevelsCoursesPage
