import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Hero from '../components/Hero';
import RegistrationForm from '../components/RegistrationForm';
import VoterLookup from '../components/VoterLookup';
import LoginForm from '../components/LoginForm';
import { api } from '../lib/api';
import { Lock, UserPlus, LogIn } from "lucide-react";

export default function Landing({ onLogin, referrerId, inviteToken }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [referrerName, setReferrerName] = useState(null);
  const [referrerValid, setReferrerValid] = useState(null);
  const [inviteValid, setInviteValid] = useState(null);

  // Default to register/enrollment mode so visitors can register, with instant toggle to login
  const [authMode, setAuthMode] = useState('register');
  const [authStep, setAuthStep] = useState('lookup'); // 'lookup' | 'form'
  const [prefillData, setPrefillData] = useState(null);

  useEffect(() => {
    if (!referrerId) {
      setReferrerValid(false);
      return;
    }
    let cancelled = false;
    const fetchReferrerName = async () => {
      try {
        const { data } = await api.getMemberPublic(referrerId);
        if (!cancelled) {
          if (data) {
            setReferrerName(data.full_name);
            setReferrerValid(true);
          } else {
            setReferrerValid(false);
          }
        }
      } catch (err) {
        console.error("Referrer lookup error:", err);
        if (!cancelled) setReferrerValid(false);
      }
    };
    fetchReferrerName();
    return () => { cancelled = true; };
  }, [referrerId]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteValid(false);
      return;
    }
    let cancelled = false;
    const validateInvite = async () => {
      try {
        const { data } = await api.getInvite(inviteToken);
        if (!cancelled) {
          if (data && !data.is_used) {
            setInviteValid(true);
          } else {
            setInviteValid(false);
          }
        }
      } catch (err) {
        console.error("Invite validation error:", err);
        if (!cancelled) setInviteValid(false);
      }
    };
    validateInvite();
    return () => { cancelled = true; };
  }, [inviteToken]);

  return (
    <div className="flex flex-col items-center bg-white min-h-screen">
      <Hero />
      
      <main className="w-full max-w-7xl mx-auto px-2 sm:px-4 pb-6 pt-3 sm:pb-12 sm:pt-6">

        {/* Global Auth Mode Toggle Bar */}
        <div className="flex flex-col items-center gap-4 mb-6 sm:mb-8 relative z-40">
          {referrerName && (
            <div className="bg-white border-2 border-dcp-green px-6 py-2.5 rounded-2xl shadow-md flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-dcp-green animate-pulse shrink-0" />
              <p className="text-xs font-black text-slate-900 uppercase tracking-widest">
                Invited by: <span className="text-dcp-green italic">{referrerName}</span>
              </p>
            </div>
          )}
          {inviteValid && (
            <div className="bg-slate-900 border-2 border-amber-400 px-6 py-2.5 rounded-2xl shadow-xl flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse shrink-0" />
              <p className="text-xs font-black text-white uppercase tracking-widest">
                Official <span className="text-amber-400 italic">{t('land_invite')}</span> Accepted
              </p>
            </div>
          )}
          
          <div className="bg-slate-100 p-1.5 rounded-2xl shadow-inner border border-slate-200 inline-flex gap-1">
            <button
              onClick={() => { setAuthMode('register'); setAuthStep('lookup'); setPrefillData(null); }}
              className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${authMode === 'register' ? 'bg-dcp-green text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <UserPlus size={16} />
              Enroll New Member
            </button>
            <button
              onClick={() => setAuthMode('login')}
              className={`flex items-center gap-2 px-5 sm:px-7 py-2.5 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider transition-all ${authMode === 'login' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'}`}
            >
              <LogIn size={16} />
              Member Login
            </button>
          </div>
        </div>

        {authMode === 'register' ? (
          authStep === 'lookup' ? (
            <div className="max-w-xl mx-auto w-full bg-white rounded-[2rem] p-4 sm:p-6 shadow-xl border border-slate-100">
              <VoterLookup 
                onSelect={(formData) => {
                  setPrefillData(formData);
                  setAuthStep('form');
                }}
                onSkip={() => {
                  setPrefillData(null);
                  setAuthStep('form');
                }}
              />
            </div>
          ) : (
            <RegistrationForm
              referrerId={referrerValid ? referrerId : null}
              inviteToken={inviteValid ? inviteToken : null}
              initialData={prefillData}
              onSuccess={(res) => { onLogin(res.member.id, res.token); navigate("/dashboard"); }}
            />
          )
        ) : (
          <LoginForm onLogin={(id, token) => onLogin(id, token)} />
        )}

        <footer className="mt-6 text-center border-t border-slate-100 pt-4 pb-6 sm:mt-12 sm:pt-8 sm:pb-10">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-loose">
              © 2026 Democracy for Citizens Party (DCP) • Official Enrollment Portal
           </p>
           <p className="text-[9px] font-medium text-slate-400 uppercase tracking-[0.3em] mt-2">
              SKIZA WAKENYA - Empowering The Grassroots
           </p>
        </footer>
      </main>
    </div>
  );
}
