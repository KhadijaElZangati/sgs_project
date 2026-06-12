import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../components/LanguageSwitcher";
import { Mail, Lock, AlertCircle, Loader2, Eye, EyeOff, School, ArrowRight, MapPin } from "lucide-react";

const DEMO_ACCOUNTS = (t) => [
  { email: "admin@college.ma", password: "password123", label: t('login.admin') },
  { email: "direction@college.ma", password: "password123", label: t('login.direction') },
  { email: "h.benali@college.ma", password: "password123", label: t('login.employee') },
  { email: "surveillant@college.ma", password: "password123", label: t('login.supervisor') },
  { email: "ezzahraelzangati@gmail.com", password: "987654321", label: t('login.finance') },
];

export default function Login({ onLogin }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await onLogin(email, password);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError(result.message || t('login.invalidCredentials'));
      }
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
  };

  const isRtl = i18n.language === 'ar';

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        .login-page{display:flex;min-height:100vh;font-family:inherit;}
        .login-left{flex:1.15;background:linear-gradient(160deg,#1a1a6e 0%,#2d3dd6 40%,#4f8ef7 80%,#38c9f5 100%);padding:2.5rem 2rem;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;}
        .login-right{flex:1;background:#fff;padding:2.5rem 2rem;display:flex;flex-direction:column;justify-content:center;}
        .login-label{font-size:12.5px;font-weight:500;color:#2d3dd6;margin-bottom:5px;}
        .login-inp{width:100%;padding:11px 14px;border:1.5px solid #dde3ff;border-radius:12px;font-size:14px;background:#f7f9ff;color:#1a1a6e;outline:none;transition:border-color .2s,box-shadow .2s;font-family:inherit;}
        .login-inp:focus{border-color:#2d3dd6;box-shadow:0 0 0 3px rgba(45,61,214,0.12);}
        .login-inp::placeholder{color:#a0aacf;}
        .login-roles{display:flex;gap:8px;margin-bottom:1.25rem;}
        .login-role-btn{flex:1;padding:9px 4px;border:1.5px solid #dde3ff;border-radius:10px;font-size:12.5px;color:#2d3dd6;background:#f0f3ff;cursor:pointer;font-family:inherit;transition:all .15s;text-align:center;}
        .login-role-btn.active,.login-role-btn:hover{background:linear-gradient(135deg,#2d3dd6,#4f8ef7);border-color:#2d3dd6;color:#fff;}
        .login-btn-main{width:100%;padding:13px;background:linear-gradient(90deg,#1a1a6e,#2d3dd6 55%,#4f8ef7);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;display:flex;align-items:center;justify-content:center;gap:8px;transition:box-shadow .2s,transform .1s,margin-top .2s;margin-top:1.25rem;}
        .login-btn-main:hover{box-shadow:0 6px 24px rgba(45,61,214,0.38);transform:translateY(-1px);}
        .login-btn-main:disabled{opacity:0.6;cursor:not-allowed;transform:none;box-shadow:none;}
        .login-pw-wrap{position:relative;}
        .login-pw-wrap .login-inp{padding-right:40px;}
        .login-pw-eye{position:absolute;right:12px;top:50%;transform:translateY(-50%);font-size:17px;color:#4f8ef7;cursor:pointer;background:none;border:none;padding:0;display:flex;}
        .login-badge{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:4px 12px;font-size:11.5px;color:rgba(255,255,255,0.9);}
        .login-demo-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:6px;font-size:12px;color:#a0aacf;cursor:pointer;background:none;border:none;padding:8px;font-family:inherit;transition:color .2s;}
        .login-demo-btn:hover{color:#2d3dd6;}
        .login-demo-item{width:100%;display:flex;align-items:center;justify-content:space-between;padding:8px 10px;border-radius:8px;font-size:12px;background:none;border:none;cursor:pointer;font-family:inherit;transition:background .15s;color:#6b7bb5;}
        .login-demo-item:hover{background:#f0f3ff;}
        .login-error{display:flex;align-items:flex-start;gap:10px;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;margin-bottom:1rem;animation:loginSlideUp .3s ease;}
        .login-error p{font-size:13px;color:#991b1b;font-weight:500;}
        @keyframes loginSlideUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}

        @media (max-width: 768px) {
          .login-page{flex-direction:column;min-height:100vh;}
          .login-left{flex:none;padding:1.5rem 1.25rem;min-height:280px;justify-content:center;gap:0.5rem;}
          .login-left svg[width="240"]{width:160px !important;height:auto !important;}
          .login-right{padding:1.75rem 1.25rem;flex:1;}
          .login-roles{flex-wrap:wrap;}
          .login-role-btn{flex:1 0 calc(50% - 4px);font-size:11px;}
        }
        @media (max-width: 400px) {
          .login-left{padding:1rem;min-height:220px;}
          .login-left svg[width="240"]{width:130px !important;}
          .login-right{padding:1.25rem 1rem;}
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-[#e8edf5] to-[#d6e0f0] flex">
        <div className="login-page w-full">
          {/* ===== LEFT COLUMN ===== */}
          <div className="login-left" style={{ direction: 'ltr' }}>
            <svg style={{ position: 'absolute', top: -60, right: -60, opacity: 0.15 }} width="280" height="280" viewBox="0 0 280 280">
              <circle cx="140" cy="140" r="130" fill="none" stroke="#fff" strokeWidth="2" />
              <circle cx="140" cy="140" r="90" fill="none" stroke="#fff" strokeWidth="1.5" />
              <circle cx="140" cy="140" r="50" fill="none" stroke="#fff" strokeWidth="1" />
            </svg>
            <svg style={{ position: 'absolute', bottom: -40, left: -40, opacity: 0.1 }} width="200" height="200" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="95" fill="none" stroke="#fff" strokeWidth="2" />
              <circle cx="100" cy="100" r="60" fill="#fff" />
            </svg>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', position: 'relative', zIndex: 1 }}>
              <img src="https://deroua24.ma/wp-content/uploads/2024/08/IMG-20240822-WA0209.jpg"
                   alt="Logo Ministère" width="40" height="40"
                   style={{ borderRadius: '8px', objectFit: 'contain', border: '2px solid rgba(255,255,255,0.4)' }} />
              <div>
                <p style={{ color: '#fff', fontSize: '14px', fontWeight: 600, lineHeight: 1.2 }}>{t('app.title')}</p>
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '10.5px', textTransform: 'uppercase', letterSpacing: '1px' }}>{t('app.schoolSubtitle')}</span>
              </div>
            </div>

            <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
              <svg width="240" height="210" viewBox="0 0 240 210" xmlns="http://www.w3.org/2000/svg">
                <rect x="30" y="160" width="180" height="12" rx="4" fill="rgba(255,255,255,0.25)" />
                <rect x="50" y="172" width="8" height="30" rx="3" fill="rgba(255,255,255,0.18)" />
                <rect x="182" y="172" width="8" height="30" rx="3" fill="rgba(255,255,255,0.18)" />
                <rect x="60" y="135" width="52" height="38" rx="4" fill="rgba(255,255,255,0.9)" />
                <rect x="60" y="135" width="26" height="38" rx="4" fill="rgba(255,255,255,1)" />
                <line x1="86" y1="137" x2="86" y2="171" stroke="#dde3ff" strokeWidth="1.5" />
                <line x1="66" y1="145" x2="83" y2="145" stroke="#4f8ef7" strokeWidth="1.2" />
                <line x1="66" y1="150" x2="83" y2="150" stroke="#4f8ef7" strokeWidth="1.2" />
                <line x1="66" y1="155" x2="80" y2="155" stroke="#4f8ef7" strokeWidth="1.2" />
                <line x1="89" y1="145" x2="106" y2="145" stroke="#a0aacf" strokeWidth="1.2" />
                <line x1="89" y1="150" x2="106" y2="150" stroke="#a0aacf" strokeWidth="1.2" />
                <line x1="89" y1="155" x2="103" y2="155" stroke="#a0aacf" strokeWidth="1.2" />
                <rect x="122" y="120" width="8" height="48" rx="2" fill="#fbbf7a" transform="rotate(-15 126 144)" />
                <polygon points="122,164 130,164 126,175" fill="#f97316" transform="rotate(-15 126 144)" />
                <rect x="122" y="120" width="8" height="8" rx="1" fill="#f87171" transform="rotate(-15 126 144)" />
                <rect x="148" y="118" width="58" height="44" rx="6" fill="rgba(255,255,255,0.9)" />
                <rect x="152" y="122" width="50" height="34" rx="3" fill="#e8edff" />
                <rect x="155" y="126" width="28" height="4" rx="2" fill="#2d3dd6" />
                <rect x="155" y="132" width="20" height="3" rx="1.5" fill="#a0aacf" />
                <rect x="155" y="137" width="24" height="3" rx="1.5" fill="#a0aacf" />
                <rect x="155" y="142" width="18" height="3" rx="1.5" fill="#a0aacf" />
                <rect x="186" y="128" width="12" height="12" rx="2" fill="#4f8ef7" opacity="0.7" />
                <polyline points="188,136 190,132 193,134 196,130 198,133" fill="none" stroke="#fff" strokeWidth="1.2" />
                <rect x="92" y="90" width="26" height="40" rx="6" fill="#fde68a" />
                <rect x="88" y="94" width="10" height="22" rx="4" fill="#4f8ef7" />
                <rect x="89" y="97" width="8" height="5" rx="2" fill="#2d3dd6" />
                <circle cx="105" cy="76" r="16" fill="#fde68a" />
                <circle cx="100" cy="74" r="2" fill="#1a1a6e" />
                <circle cx="110" cy="74" r="2" fill="#1a1a6e" />
                <path d="M100 80 Q105 84 110 80" fill="none" stroke="#1a1a6e" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M90 72 Q92 60 105 59 Q118 60 120 72 Q116 64 105 63 Q94 64 90 72Z" fill="#1a1a6e" />
                <rect x="118" y="100" width="20" height="7" rx="3.5" fill="#fde68a" transform="rotate(20 118 103)" />
                <text x="20" y="55" fontSize="18" fill="rgba(255,255,255,0.7)">★</text>
                <text x="195" y="45" fontSize="14" fill="rgba(255,255,255,0.5)">★</text>
                <text x="215" y="100" fontSize="10" fill="rgba(255,255,255,0.4)">★</text>
                <text x="10" y="120" fontSize="10" fill="rgba(255,255,255,0.35)">★</text>
                <circle cx="25" cy="80" r="8" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
                <circle cx="220" cy="130" r="6" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
                <circle cx="200" cy="75" r="10" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
              </svg>
            </div>

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="login-badge" style={{ marginBottom: '10px' }}>
                <MapPin size={12} />
                Marrakech · Borj Azzaitoune
              </div>
              <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6, maxWidth: 260 }}>
                {t('app.description')}
              </p>
            </div>
          </div>

          {/* ===== RIGHT COLUMN ===== */}
          <div className="login-right" style={{ direction: isRtl ? 'rtl' : 'ltr', position: 'relative' }}>
            <div style={{ position: 'absolute', top: '16px', right: isRtl ? 'auto' : '16px', left: isRtl ? '16px' : 'auto', zIndex: 10 }}>
              <LanguageSwitcher />
            </div>

            <div style={{ marginBottom: '1.75rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#4f8ef7', letterSpacing: '2px', textTransform: 'uppercase' }}>{t('login.title')}</span>
              <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1a1a6e', margin: '4px 0' }}>{t('login.welcomeBack')} 👋</h1>
              <p style={{ fontSize: '13.5px', color: '#6b7bb5' }}>{t('login.loginSubtitle')}</p>
            </div>

            <form onSubmit={handleSubmit}>
              {error && (
                <div className="login-error">
                  <AlertCircle size={18} className="text-red-500 flex-shrink-0" style={{ marginTop: '1px' }} />
                  <p>{error}</p>
                </div>
              )}

              <div style={{ marginBottom: '1rem' }}>
                <p className="login-label">{t('login.email')}</p>
                <input className="login-inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('login.emailPlaceholder')} required disabled={loading} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                  <p className="login-label" style={{ margin: 0 }}>{t('login.password')}</p>
                  <button type="button" style={{ fontSize: '12px', color: '#4f8ef7', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                    {t('login.forgotPassword')}
                  </button>
                </div>
                <div className="login-pw-wrap">
                  <input className="login-inp" type={showPassword ? 'text' : 'password'} value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder={t('login.passwordPlaceholder')}
                    required disabled={loading} />
                  <button type="button" className="login-pw-eye" onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}>
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={loading} className="login-btn-main">
                {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                {loading ? t('login.loggingIn') : t('login.login')}
                {!loading && <ArrowRight size={17} />}
              </button>
            </form>

            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #eef2ff', paddingTop: '1rem' }}>
              <button type="button" className="login-demo-btn" onClick={() => setShowDemo(!showDemo)}>
                <School size={14} />
                {showDemo ? t('login.hideDemo') : t('login.showDemo')}
              </button>
              {showDemo && (
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px', animation: 'loginSlideUp .3s ease' }}>
                  {DEMO_ACCOUNTS(t).map((acc) => (
                    <button key={acc.email} type="button" className="login-demo-item" onClick={() => fillDemo(acc)}>
                      <span style={{ fontWeight: 500, color: '#1a1a6e' }}>{acc.label}</span>
                      <span style={{ color: '#a0aacf', fontSize: '11px' }}>{acc.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <p style={{ fontSize: '12px', color: '#a0aacf', textAlign: 'center', marginTop: '1rem', lineHeight: 1.5 }}>
              {t('login.noAccount')}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
