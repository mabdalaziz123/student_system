import React, { useState } from 'react';
import { Program, University, User, UserRole } from '../types';
import { Plus, BookOpen, Clock, DollarSign, Calendar, Trash2 } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

interface ProgramManagerProps {
  programs: Program[];
  universities: University[];
  onAddProgram: (prog: Program) => void;
  onDeleteProgram: (id: string) => void;
  currentUser?: User | null;
}

export const ProgramManager: React.FC<ProgramManagerProps> = ({
  programs,
  universities,
  onAddProgram,
  onDeleteProgram,
  currentUser
}) => {
  const { t, translateDegree } = useTranslation();
  const isAdmin = currentUser?.role === UserRole.ADMIN;
  const [isModalOpen, setModalOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<Program>>({
    name: '',
    universityId: '',
    degree: 'Bachelor',
    language: 'English',
    years: 4,
    fee: 0,
    currency: 'USD',
    deadline: '',
    description: ''
  });

  const getUniversityName = (id: string) => universities.find(u => u.id === id)?.name || t.noUniversities;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.universityId && formData.name) {
      onAddProgram({
        id: Date.now().toString(),
        universityId: formData.universityId,
        name: formData.name,
        degree: formData.degree as any,
        language: formData.language as any,
        years: formData.years || 4,
        fee: formData.fee || 0,
        currency: formData.currency || 'USD',
        deadline: formData.deadline || new Date().toISOString().split('T')[0],
        description: formData.description
      });
      setModalOpen(false);
      setFormData({
        name: '', universityId: '', degree: 'Bachelor', language: 'English',
        years: 4, fee: 0, currency: 'USD', deadline: '', description: ''
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (confirmDeleteId) {
      onDeleteProgram(confirmDeleteId);
      setConfirmDeleteId(null);
    }
  };

  const programToDelete = programs.find(p => p.id === confirmDeleteId);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.programsTitle}</h2>
          <p className="text-gray-500">{t.programsTitle}</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            <span>{t.addProgram}</span>
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-medium">{t.programName}</th>
                <th className="px-6 py-4 font-medium">{t.universities}</th>
                <th className="px-6 py-4 font-medium">{t.programDegree}</th>
                <th className="px-6 py-4 font-medium">{t.programLanguage}</th>
                <th className="px-6 py-4 font-medium">{t.programFee}</th>
                <th className="px-6 py-4 font-medium">{t.programDeadline}</th>
                {isAdmin && <th className="px-6 py-4 font-medium text-center">{t.delete}</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {programs.map((program) => (
                <tr key={program.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 font-medium text-gray-900">{program.name}</td>
                  <td className="px-6 py-4 text-blue-600">{getUniversityName(program.universityId)}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-purple-50 text-purple-700 rounded text-xs">
                      {translateDegree(program.degree)}
                    </span>
                  </td>
                  <td className="px-6 py-4">{program.language}</td>
                  <td className="px-6 py-4 font-bold text-gray-700">
                    {program.currency ? `${program.currency} ${program.fee.toLocaleString()}` : `$${program.fee.toLocaleString()}`}
                  </td>
                  <td className="px-6 py-4 text-red-500 text-xs">{program.deadline}</td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setConfirmDeleteId(program.id)}
                        title={t.delete}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-700 transition-colors opacity-60 group-hover:opacity-100"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {programs.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="px-6 py-8 text-center text-gray-400">{t.noPrograms}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">{t.addProgram}</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.universities}</label>
                  <select
                    required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.universityId}
                    onChange={e => setFormData({ ...formData, universityId: e.target.value })}
                  >
                    <option value="">{t.selectUniversity}</option>
                    {universities.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programName}</label>
                  <input
                    type="text" required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programDegree}</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.degree}
                    onChange={e => setFormData({ ...formData, degree: e.target.value as any })}
                  >
                    <option value="Bachelor">{t.bachelor}</option>
                    <option value="Master">{t.master}</option>
                    <option value="PhD">{t.phd}</option>
                    <option value="Diploma">Diploma</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programLanguage}</label>
                  <select
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.language}
                    onChange={e => setFormData({ ...formData, language: e.target.value as any })}
                  >
                    <option value="English">English</option>
                    <option value="Turkish">Turkish</option>
                    <option value="Arabic">Arabic</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programYears}</label>
                  <input
                    type="number" min="1"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.years}
                    onChange={e => setFormData({ ...formData, years: parseInt(e.target.value) })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programFee}</label>
                  <input
                    type="number"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.fee}
                    onChange={e => setFormData({ ...formData, fee: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programCurrency}</label>
                  <select
                    value={formData.currency}
                    onChange={e => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="USD">USD</option>
                    <option value="EUR">EUR</option>
                    <option value="TRY">TRY</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.programDeadline}</label>
                  <input
                    type="date"
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.deadline}
                    onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.programDescription}</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t.confirmDelete}</h3>
            </div>
            <p className="text-gray-700 text-sm font-medium mb-1">
              {programToDelete?.name}
            </p>
            <p className="text-gray-400 text-xs mb-6">
              {getUniversityName(programToDelete?.universityId || '')} — {programToDelete && translateDegree(programToDelete.degree)}
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};