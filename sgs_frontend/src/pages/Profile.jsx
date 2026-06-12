import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { User, Camera, Save, Loader2, Mail, Phone, MapPin, Calendar, Briefcase, GraduationCap, IdCard, FileText, Globe, Lock, Eye, EyeOff } from "lucide-react";
import { pushToast } from "../components/Notifications";

export default function Profile({ api, user, setUser }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    api.get('/users/profile')
      .then(r => setProfile(r.data))
      .catch(() => pushToast("error", t('profile.loadError')))
      .finally(() => setLoading(false));
  }, [api, t]);

  const handleChange = (field, value) => setProfile(p => ({ ...p, [field]: value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/users/profile', profile);
      setProfile(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setUser(res.data);
      pushToast("success", t('profile.savedSuccess'));
    } catch (err) {
      pushToast("error", err.response?.data?.error || t('profile.saveError'));
    } finally { setSaving(false); }
  };

  const handlePhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return pushToast("error", t('profile.photoTooLarge'));
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);
      const res = await api.post('/users/profile/photo', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      handleChange('photo', res.data.photo);
      const updated = { ...profile, photo: res.data.photo };
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      pushToast("success", t('profile.photoUpdated'));
    } catch { pushToast("error", t('profile.photoError')); }
    finally { setUploading(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-full">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );

  const Input = ({ label, icon: Icon, field, type = "text", required, className }) => (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">{label}</label>
      <div className="relative">
        {Icon && <Icon size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />}
        {type === "textarea" ? (
          <textarea value={profile?.[field] || ''} onChange={e => handleChange(field, e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all resize-none" rows={3} />
        ) : type === "select" ? (
          <select value={profile?.[field] || ''} onChange={e => handleChange(field, e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all bg-white">
            <option value="">{t('profile.notSpecified')}</option>
            <option value="homme">{t('profile.homme')}</option>
            <option value="femme">{t('profile.femme')}</option>
          </select>
        ) : (
          <input type={type} value={profile?.[field] || ''} onChange={e => handleChange(field, e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 outline-none transition-all" required={required} />
        )}
      </div>
    </div>
  );

  const photoUrl = profile?.photo ? `http://localhost:5000${profile.photo}` : null;

  return (
    <div className="min-h-full bg-gray-50 animate-fade-in">
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 px-4 lg:px-6 py-6 lg:py-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500 rounded-full opacity-5 blur-3xl translate-y-1/2 -translate-x-1/4" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="relative group flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white/10 flex items-center justify-center shadow-lg border-2 border-white/20">
              {photoUrl ? (
                <img src={photoUrl} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={36} className="text-white/60" />
              )}
            </div>
            <button onClick={() => fileRef.current?.click()} disabled={uploading}
              className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-700 transition border-2 border-white">
              {uploading ? <Loader2 size={14} className="animate-spin text-white" /> : <Camera size={14} className="text-white" />}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handlePhoto} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">{profile?.prenom} {profile?.nom}</h1>
            <p className="text-blue-200 text-sm capitalize">{profile?.role?.replace(/_/g, ' ')}</p>
            <p className="text-blue-300 text-xs mt-0.5">{profile?.poste || profile?.email}</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6 -mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><User size={18} className="text-blue-600" /> {t('profile.personalInfo')}</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('profile.prenom')} icon={User} field="prenom" />
                <Input label={t('profile.nom')} icon={User} field="nom" required />
              </div>
              <Input label={t('profile.email')} icon={Mail} field="email" type="email" required />
              <Input label={t('profile.telephone')} icon={Phone} field="telephone" type="tel" />
              <Input label={t('profile.adresse')} icon={MapPin} field="adresse" type="textarea" />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('profile.dateNaissance')} icon={Calendar} field="date_naissance" type="date" />
                <Input label={t('profile.lieuNaissance')} icon={Globe} field="lieu_naissance" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('profile.sexe')} icon={User} field="sexe" type="select" />
                <Input label={t('profile.cin')} icon={IdCard} field="cin" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Briefcase size={18} className="text-blue-600" /> {t('profile.professionalInfo')}</h2>
            <div className="space-y-4">
              <Input label={t('profile.poste')} icon={Briefcase} field="poste" />
              <Input label={t('profile.matricule')} icon={IdCard} field="matricule" />
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('profile.diplome')} icon={GraduationCap} field="diplome" />
                <Input label={t('profile.specialite')} icon={FileText} field="specialite" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label={t('profile.cnss')} icon={IdCard} field="cnss" />
                <Input label={t('profile.dateEmbauche')} icon={Calendar} field="date_embauche" type="date" />
              </div>
              <Input label={t('profile.soldeConge')} icon={Calendar} field="solde_conge" type="number" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button onClick={() => navigate('/dashboard')} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition">
            {t('common.cancel')}
          </button>
          <button onClick={handleSave} disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-sm font-semibold hover:from-blue-700 hover:to-indigo-700 transition disabled:opacity-50 flex items-center gap-2 shadow-sm">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {t('profile.save')}
          </button>
        </div>
      </div>
    </div>
  );
}
