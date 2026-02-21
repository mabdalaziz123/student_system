import React, { useState, useRef, useEffect } from 'react';
import { University, Program, User, UserRole } from '../types';
import {
  Plus, Globe, Sparkles, X, Image, Pencil, Trash2,
  BookOpen, Clock, DollarSign, Calendar, ChevronLeft,
  MapPin, ExternalLink, GraduationCap
} from 'lucide-react';
import { generateUniversityDescription } from '../services/geminiService';
import { useTranslation } from '../hooks/useTranslation';

interface UniversityManagerProps {
  universities: University[];
  programs: Program[];
  onAddUniversity: (uni: University) => void;
  onEditUniversity: (uni: University) => void;
  onDeleteUniversity: (id: string) => void;
  currentUser?: User | null;
}

const EMPTY_FORM: Partial<University> = {
  name: '', website: '', country: 'Turkey', description: '', logo: undefined
};

const DEGREE_COLORS: Record<string, string> = {
  Bachelor: 'bg-blue-50 text-blue-700',
  Master: 'bg-purple-50 text-purple-700',
  PhD: 'bg-pink-50 text-pink-700',
  Diploma: 'bg-yellow-50 text-yellow-700',
};

const LANG_COLORS: Record<string, string> = {
  English: 'bg-green-50 text-green-700',
  Turkish: 'bg-red-50 text-red-700',
  Arabic: 'bg-orange-50 text-orange-700',
};

export const UniversityManager: React.FC<UniversityManagerProps> = ({
  universities, programs,
  onAddUniversity, onEditUniversity, onDeleteUniversity, currentUser
}) => {
  const { t, translateDegree } = useTranslation();
  const isAdmin = currentUser?.role === UserRole.ADMIN;

  /* -------- Modals & View State -------- */
  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [detailUni, setDetailUni] = useState<University | null>(null); // details panel
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* -------- Form State -------- */
  const [formData, setFormData] = useState<Partial<University>>(EMPTY_FORM);
  const [loadingAi, setLoadingAi] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  /* -------- Logo helpers -------- */
  const logoInputRef = useRef<HTMLInputElement | null>(null);
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { alert('يرجى اختيار ملف صورة صالح'); return; }
    if (file.size > 2 * 1024 * 1024) { alert('حجم الصورة يجب أن يكون أقل من 2MB'); return; }
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setLogoPreview(b64); setLogoBase64(b64);
    };
    reader.readAsDataURL(file);
  };
  const handleRemoveLogo = () => {
    setLogoPreview(null); setLogoBase64(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  /* -------- Open / Close modal -------- */
  const openAdd = () => {
    setFormData(EMPTY_FORM); setLogoPreview(null); setLogoBase64(null);
    setEditingId(null); setModalMode('add');
  };
  const openEdit = (uni: University, e: React.MouseEvent) => {
    e.stopPropagation();
    setFormData({ ...uni }); setLogoPreview(uni.logo || null); setLogoBase64(uni.logo || null);
    setEditingId(uni.id); setModalMode('edit');
  };
  const closeModal = () => {
    setModalMode(null); setEditingId(null); setFormData(EMPTY_FORM);
    setLogoPreview(null); setLogoBase64(null);
    if (logoInputRef.current) logoInputRef.current.value = '';
  };

  /* -------- AI description -------- */
  const handleAiDescription = async () => {
    if (!formData.name || !formData.country) return;
    setLoadingAi(true);
    const desc = await generateUniversityDescription(formData.name, formData.country);
    setFormData(prev => ({ ...prev, description: desc }));
    setLoadingAi(false);
  };

  /* -------- Submit -------- */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.website || !formData.country || !formData.description) return;
    const uniData: University = {
      id: editingId || Date.now().toString(),
      name: formData.name, website: formData.website,
      country: formData.country as 'Turkey' | 'Cyprus',
      description: formData.description,
      logo: logoBase64 || undefined
    };
    if (modalMode === 'edit') {
      onEditUniversity(uniData);
      // update detail view if open
      if (detailUni?.id === uniData.id) setDetailUni(uniData);
    } else {
      onAddUniversity(uniData);
    }
    closeModal();
  };

  /* -------- Excel Import -------- */
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const form = new FormData(); form.append('file', file);
    try {
      const res = await fetch('/api/universities/import', { method: 'POST', body: form });
      const data = await res.json();
      if (res.ok) {
        if (data.added && Array.isArray(data.added)) {
          data.added.forEach((u: any) => onAddUniversity({
            id: u.id, name: u.name, website: u.website,
            country: u.country, description: u.description, logo: u.logo || undefined
          }));
          alert(`${t.successAdd}: ${data.added.length} ${t.universities}`);
        } else { alert(data.message || t.successAdd); }
      } else { alert(data.message || t.errorAdd); }
    } catch { alert(t.errorConnection); }
    finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  /* -------- Delete -------- */
  const handleDeleteConfirm = () => {
    if (!confirmDeleteId) return;
    onDeleteUniversity(confirmDeleteId);
    if (detailUni?.id === confirmDeleteId) setDetailUni(null);
    setConfirmDeleteId(null);
  };

  /* -------- Helpers -------- */
  /* -------- Body Scroll Lock -------- */
  useEffect(() => {
    if (detailUni || modalMode || confirmDeleteId) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => { document.body.style.overflow = 'auto'; };
  }, [detailUni, modalMode, confirmDeleteId]);

  const uniPrograms = (uniId: string) => programs.filter(p => p.universityId === uniId);

  const LogoBox = ({ uni, size = 'lg' }: { uni: University; size?: 'sm' | 'lg' }) => {
    const cls = size === 'lg'
      ? 'h-16 w-16 text-2xl rounded-xl'
      : 'h-12 w-12 text-lg rounded-lg';
    return (
      <div className={`${cls} overflow-hidden flex items-center justify-center bg-blue-50 text-blue-600 font-bold flex-shrink-0 border border-blue-100`}>
        {uni.logo
          ? <img src={uni.logo} alt={uni.name} className="h-full w-full object-contain p-1"
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; (e.target as HTMLImageElement).parentElement!.innerHTML = uni.name.substring(0, 2).toUpperCase(); }} />
          : uni.name.substring(0, 2).toUpperCase()}
      </div>
    );
  };

  /* ============================== RENDER ============================== */
  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{t.universitiesTitle}</h2>
          <p className="text-gray-500">{t.universities}</p>
        </div>
        {isAdmin && (
          <div className="flex items-center gap-2">
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileChange} style={{ display: 'none' }} />
            <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="flex items-center bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <span>{uploading ? t.loading : t.import}</span>
            </button>
            <button onClick={openAdd}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
              <Plus size={20} /><span>{t.addUniversity}</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="flex gap-6">

        {/* University Cards */}
        <div className="grid gap-5 flex-1 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {universities.map(uni => {
            const isSelected = detailUni?.id === uni.id;
            const progCount = uniPrograms(uni.id).length;
            return (
              <div
                key={uni.id}
                onClick={() => setDetailUni(isSelected ? null : uni)}
                className={`bg-white rounded-xl border p-5 flex flex-col h-full cursor-pointer transition-all duration-200 group
                  ${isSelected
                    ? 'border-blue-400 shadow-md ring-2 ring-blue-200'
                    : 'border-gray-100 shadow-sm hover:shadow-md hover:border-blue-200'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <LogoBox uni={uni} size="sm" />
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${uni.country === 'Turkey' ? 'bg-red-50 text-red-600' : 'bg-orange-50 text-orange-600'}`}>
                      {uni.country}
                    </span>
                    {/* Action buttons – visible on hover */}
                    {isAdmin && (
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                        <button onClick={e => openEdit(uni, e)} title={t.edit}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                          <Pencil size={13} />
                        </button>
                        <button onClick={e => { e.stopPropagation(); setConfirmDeleteId(uni.id); }} title={t.delete}
                          className="p-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <h3 className="text-base font-bold text-gray-800 mb-1">{uni.name}</h3>
                <p className="text-gray-500 text-xs mb-3 line-clamp-2 flex-1">{uni.description}</p>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <a href={uni.website} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}
                    className="flex items-center gap-1 text-xs text-blue-600 hover:underline truncate max-w-[65%]">
                    <Globe size={12} /><span className="truncate">{uni.website.replace(/^https?:\/\//, '')}</span>
                  </a>
                  <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                    {progCount} {t.programs}
                  </span>
                </div>
              </div>
            );
          })}
          {universities.length === 0 && (
            <div className="col-span-3 py-16 text-center text-gray-400">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
              <p>{t.noUniversities}</p>
            </div>
          )}
        </div>


      </div>

      {/* ══════════ Add / Edit Modal ══════════ */}
      {modalMode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4">
              {modalMode === 'edit' ? `${t.edit} الجامعة` : t.addUniversity}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t.universityName}</label>
                <input type="text" required
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.universityCountry}</label>
                  <select className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.country} onChange={e => setFormData({ ...formData, country: e.target.value as any })}>
                    <option value="Turkey">تركيا</option>
                    <option value="Cyprus">قبرص</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{t.universityWebsite}</label>
                  <input type="url" required
                    className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                    value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} />
                </div>
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  شعار الجامعة <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
                </label>
                <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoChange} style={{ display: 'none' }} />
                {!logoPreview ? (
                  <button type="button" onClick={() => logoInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 flex flex-col items-center text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors">
                    <Image size={28} className="mb-1" />
                    <span className="text-sm">انقر لرفع شعار الجامعة</span>
                    <span className="text-xs text-gray-300 mt-1">PNG, JPG, SVG (حد أقصى 2MB)</span>
                  </button>
                ) : (
                  <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3 bg-gray-50">
                    <img src={logoPreview} alt="معاينة" className="h-16 w-16 object-contain rounded-lg border border-gray-200 bg-white p-1" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-700">تم اختيار الشعار ✓</p>
                      <button type="button" onClick={() => logoInputRef.current?.click()} className="text-xs text-blue-600 hover:underline">تغيير</button>
                    </div>
                    <button type="button" onClick={handleRemoveLogo} className="p-1 text-gray-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-gray-700">{t.universityDescription}</label>
                  <button type="button" onClick={handleAiDescription} disabled={loadingAi || !formData.name}
                    className="text-xs flex items-center text-purple-600 hover:text-purple-800 disabled:opacity-50">
                    <Sparkles size={12} className="ml-1" />
                    {loadingAi ? t.loading : 'AI Generate'}
                  </button>
                </div>
                <textarea required rows={4}
                  className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={closeModal} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">{t.cancel}</button>
                <button type="submit"
                  className={`px-4 py-2 text-white rounded-lg ${modalMode === 'edit' ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  {t.save}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════ Delete Confirm ══════════ */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={20} className="text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800">{t.confirmDelete}</h3>
            </div>
            <p className="text-gray-500 text-sm mb-1">
              <span className="font-semibold text-gray-700">{universities.find(u => u.id === confirmDeleteId)?.name}</span>
            </p>
            <p className="text-gray-400 text-xs mb-6">سيتم حذف الجامعة وجميع البرامج المرتبطة بها نهائياً.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">{t.cancel}</button>
              <button onClick={handleDeleteConfirm} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">{t.delete}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Detail Full-Screen Modal ── */}
      {detailUni && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" onClick={() => setDetailUni(null)} />
          <div className="relative bg-white w-full h-full md:h-auto md:max-h-[85vh] md:max-w-4xl md:rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 duration-500">

            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <LogoBox uni={detailUni} size="sm" />
                <div>
                  <h3 className="font-black text-gray-900 leading-tight">{detailUni.name}</h3>
                  <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    <MapPin size={10} className="text-blue-500" />
                    <span>{detailUni.country === 'Turkey' ? 'TURKEY' : 'CYPRUS'}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setDetailUni(null)} className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-gray-900 hover:text-white transition-all active:scale-90">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain pb-20">
              <div className="h-48 md:h-64 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 relative group overflow-hidden">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/60 via-black/20 to-transparent">
                  <a href={detailUni.website} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-xl text-white border border-white/30 px-6 py-3 rounded-2xl text-sm font-black hover:bg-white hover:text-blue-600 transition-all shadow-2xl">
                    <Globe size={18} /> زيارة الموقع الرسمي
                  </a>
                </div>
              </div>

              <div className="p-6 md:p-10 space-y-12">
                <div className="relative">
                  <div className="absolute -left-4 top-0 bottom-0 w-1 bg-blue-600/20 rounded-full" />
                  <h4 className="font-black text-gray-900 text-2xl mb-4 tracking-tight flex items-center gap-2">
                    <Sparkles size={24} className="text-blue-500" /> نظرة عامة
                  </h4>
                  <p className="text-gray-600 leading-relaxed text-lg whitespace-pre-wrap">{detailUni.description}</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-8">
                    <h4 className="font-black text-gray-900 text-2xl tracking-tight flex items-center gap-3">
                      <GraduationCap size={28} className="text-purple-500" /> البرامج والرسوم
                    </h4>
                    <span className="bg-gray-100 text-gray-500 px-4 py-2 rounded-2xl text-xs font-black">
                      {uniPrograms(detailUni.id).length} تخصص متاح
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {uniPrograms(detailUni.id).map(prog => (
                      <div key={prog.id} className="bg-white border border-gray-100 rounded-[2rem] p-6 hover:shadow-2xl hover:shadow-blue-500/10 transition-all border-b-4 border-b-transparent hover:border-b-blue-500 group">
                        <div className="flex justify-between items-start mb-4">
                          <h5 className="font-black text-gray-800 group-hover:text-blue-600 transition-colors leading-tight">{prog.name}</h5>
                          <span className={`text-[9px] px-3 py-1 rounded-full font-black tracking-tighter ${DEGREE_COLORS[prog.degree] || 'bg-gray-50 text-gray-600'}`}>
                            {translateDegree(prog.degree)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex gap-3 text-[11px] font-bold text-gray-400">
                            <span className="flex items-center gap-1"><Clock size={12} /> {prog.years}y</span>
                            <span className="flex items-center gap-1"><Globe size={12} /> {prog.language}</span>
                          </div>
                          <div className="text-blue-600 font-black text-sm bg-blue-50 px-4 py-1.5 rounded-xl">
                            {prog.fee.toLocaleString()} {prog.currency || 'USD'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex flex-wrap gap-4 pt-10 border-t border-gray-100">
                    <button onClick={e => openEdit(detailUni, e)} className="flex-1 min-w-[140px] bg-gray-900 text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-blue-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                      <Pencil size={18} /> تعديل البيانات
                    </button>
                    <button onClick={() => setConfirmDeleteId(detailUni.id)} className="flex-1 min-w-[140px] bg-red-50 text-red-600 py-4 rounded-2xl font-black text-sm hover:bg-red-600 hover:text-white transition-all active:scale-95 flex items-center justify-center gap-2 text-center">
                      <Trash2 size={18} /> حذف السجل
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};