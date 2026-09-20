import React, { useState } from 'react'
import AdminLayout from '../components/AdminLayout'
import {
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Sliders,
  Settings,
  ShieldCheck,
  Building,
  UserCheck,
} from 'lucide-react'

interface RegistrationFieldConfig {
  id: string
  label: string
  field_key: string
  field_type: 'text' | 'email' | 'phone' | 'number' | 'dropdown' | 'radio' | 'checkbox' | 'date' | 'textarea'
  is_required: boolean
  options: string[] | null
}

export const OrganizationSettingsPage: React.FC = () => {
  const [orgName, setOrgName] = useState('Apex Mathematics Academy')
  const [contactEmail, setContactEmail] = useState('admissions@apexmath.edu')
  const [senderEmail, setSenderEmail] = useState('reports@assesshub.com')
  const [academicYear, setAcademicYear] = useState('2026 - 2027')
  const [defaultThreshold, setDefaultThreshold] = useState(70)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const [regFields, setRegFields] = useState<RegistrationFieldConfig[]>([
    {
      id: 'f-name',
      label: 'Student Full Name',
      field_key: 'full_name',
      field_type: 'text',
      is_required: true,
      options: null,
    },
    {
      id: 'f-email',
      label: 'Student Email Address',
      field_key: 'student_email',
      field_type: 'email',
      is_required: true,
      options: null,
    },
    {
      id: 'f-grade',
      label: 'Current Academic Grade',
      field_key: 'grade_level',
      field_type: 'dropdown',
      is_required: true,
      options: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12', 'Gap Year'],
    },
    {
      id: 'f-parent-email',
      label: 'Parent / Guardian Email',
      field_key: 'parent_email',
      field_type: 'email',
      is_required: false,
      options: null,
    },
    {
      id: 'f-phone',
      label: 'Contact Phone Number',
      field_key: 'phone_number',
      field_type: 'phone',
      is_required: false,
      options: null,
    },
  ])

  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldKey, setNewFieldKey] = useState('')
  const [newFieldType, setNewFieldType] = useState<RegistrationFieldConfig['field_type']>('text')
  const [newFieldRequired, setNewFieldRequired] = useState(true)

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newFieldLabel.trim()) return

    const key =
      newFieldKey.trim() ||
      newFieldLabel.trim().toLowerCase().replace(/[^a-z0-9]/g, '_')

    const newField: RegistrationFieldConfig = {
      id: `f-${Date.now()}`,
      label: newFieldLabel.trim(),
      field_key: key,
      field_type: newFieldType,
      is_required: newFieldRequired,
      options: newFieldType === 'dropdown' ? ['Option 1', 'Option 2'] : null,
    }

    setRegFields((prev) => [...prev, newField])
    setNewFieldLabel('')
    setNewFieldKey('')
    setIsFieldModalOpen(false)
  }

  const handleDeleteField = (id: string) => {
    if (id === 'f-name' || id === 'f-email') {
      alert('Student Full Name and Email are mandatory core platform fields.')
      return
    }
    setRegFields((prev) => prev.filter((f) => f.id !== id))
  }

  const handleSaveSettings = () => {
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <AdminLayout
      title="Platform Settings & Registration Fields"
      subtitle="Configure institutional branding, default evaluation rules, and student pre-test intake forms"
      actions={
        <button
          type="button"
          onClick={handleSaveSettings}
          style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition shadow-xs cursor-pointer"
        >
          <Save className="h-4 w-4" />
          <span>Save All Settings</span>
        </button>
      }
    >
      <div className="space-y-6 max-w-4xl">
        {savedSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span>Settings and registration fields saved successfully!</span>
          </div>
        )}

        {/* Institution Branding */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building className="h-4 w-4 text-blue-600" />
            <span>Institution Profile & Report Branding</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                School / Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Academic Year / Term
              </label>
              <input
                type="text"
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Administrative Contact Email
              </label>
              <input
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Automated Report Dispatch Email
              </label>
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Student Registration Fields */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-600" />
                <span>Student Intake Registration Fields ({regFields.length})</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                These fields are requested from students when they open a shared assessment link before testing begins.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsFieldModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Custom Field</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {regFields.map((field) => (
              <div
                key={field.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">{field.label}</span>
                    {field.is_required && (
                      <span className="text-[10px] font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded-sm">
                        Required
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span className="font-mono text-slate-500">key: {field.field_key}</span>
                    <span>•</span>
                    <span className="capitalize">{field.field_type}</span>
                    {field.options && <span>• {field.options.length} options</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteField(field.id)}
                    disabled={field.id === 'f-name' || field.id === 'f-email'}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 disabled:opacity-20 transition"
                    title="Remove Field"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add Field Modal */}
        {isFieldModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <form
              onSubmit={handleAddField}
              className="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl border border-slate-200 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900">Add Registration Field</h3>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Field Label</label>
                <input
                  type="text"
                  value={newFieldLabel}
                  onChange={(e) => setNewFieldLabel(e.target.value)}
                  placeholder="e.g. School Name or Section"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Field Key (API)</label>
                <input
                  type="text"
                  value={newFieldKey}
                  onChange={(e) => setNewFieldKey(e.target.value)}
                  placeholder="e.g. school_name (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Input Type</label>
                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Single Line Text</option>
                  <option value="email">Email</option>
                  <option value="phone">Phone Number</option>
                  <option value="number">Numeric</option>
                  <option value="dropdown">Dropdown Select</option>
                  <option value="textarea">Long Textarea</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="reqCheck"
                  checked={newFieldRequired}
                  onChange={(e) => setNewFieldRequired(e.target.checked)}
                  className="rounded-sm border-slate-300 text-blue-600"
                />
                <label htmlFor="reqCheck" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Mandatory field before starting test
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFieldModalOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
                >
                  Add Field
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}

export default OrganizationSettingsPage
