import { useMemo, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
void motion;
import { User, Phone, CreditCard, MapPin, ShieldCheck, Mail, WifiOff, Star, MessageSquare, AlertCircle, ArrowRight, UserPlus, CheckCircle2 } from "lucide-react";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useSync } from "../contexts/SyncContext";
import LanguageToggle from "./LanguageToggle";



const schema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  secondName: z.string().min(2, "Second name"),
  lastName: z.string().optional(),
  phone: z.string().regex(/^\+254\d{9}$/, "Use format +2547XXXXXXXX"),
  nationalId: z.string().min(7, "Valid ID number is required"),
  yob: z.string().regex(/^(19|20)\d{2}$/, "Enter a valid 4-digit year").refine((year) => {
    const age = new Date().getFullYear() - parseInt(year);
    return age >= 18;
  }, "You must be 18+ to join"),
  ward: z.string().min(3, "Ward is required"),
  pollingCenter: z.string().min(3, "Polling center is required"),
  consent: z.boolean().refine((val) => val === true, "You must consent to join"),
});

export default function RegistrationForm({ referrerId, inviteToken, onSuccess, isAdmin, initialData, selectedVoter }) {
  const { wardsWithCenters } = useLocationData();
  const { t } = useLanguage();
  const { enqueueOffline, isOnline } = useSync();
  const [claimCandidate, setClaimCandidate] = useState(null);
  const [isClaiming, setIsClaiming] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      phone: "+254",
      consent: false,
      ...initialData,
    }
  });

  const consentChecked = watch("consent");
  const selectedWard = watch("ward");

  // Pre-fill form fields when initialData changes (voter lookup selection)
  useEffect(() => {
    if (!initialData) return;
    Object.entries(initialData).forEach(([key, val]) => {
      if (val) setValue(key, val, { shouldValidate: false });
    });
  }, [initialData, setValue]);

  const currentCenters = useMemo(() => {
    const matched = wardsWithCenters.find((ward) => ward.name === selectedWard);
    return matched ? matched.centers : [];
  }, [selectedWard]);



  const handleClaimCandidate = async () => {
    if (!claimCandidate) return;
    setIsClaiming(true);
    try {
      const claimRes = await api.claimSocialRecruit({
        national_id: claimCandidate.nationalId,
        phone: claimCandidate.phone,
      });

      if (claimRes.error) {
        throw new Error(claimRes.error.error || claimRes.error.message || "Failed to switch supporter.");
      }

      toast.success(`🎉 ${claimCandidate.name} has been switched into your team!`);
      const dataToReturn = claimRes.data;
      setClaimCandidate(null);
      if (onSuccess) {
        onSuccess(dataToReturn);
      }
    } catch (err) {
      toast.error(err.message || "Failed to switch supporter to your team.");
    } finally {
      setIsClaiming(false);
    }
  };

  const onSubmit = async (data) => {
    // ─── Validation against Voter Register ──────────────────────────────────
    if (selectedVoter) {
      // 1. ID Validation
      if (selectedVoter.id_number) {
        const enteredId = data.nationalId.trim();
        const maskedId = selectedVoter.id_number.trim();
        
        if (enteredId.length >= 2 && maskedId.length >= 2) {
          if (enteredId[0] !== maskedId[0] || enteredId[enteredId.length - 1] !== maskedId[maskedId.length - 1]) {
            toast.error("Re-check your information, you made an error.");
            return;
          }
        }
      }

      // 2. Year of Birth Validation
      if (selectedVoter.dob) {
         const enteredYob = data.yob.trim();
         // If the DOB string doesn't contain the entered year anywhere, it's wrong
         if (!selectedVoter.dob.includes(enteredYob)) {
            toast.error("Re-check your information, you made an error.");
            return;
         }
      }
    }

    try {
      const fullName = [data.firstName, data.secondName, data.lastName]
        .filter(Boolean)
        .join(" ");

      const memberPayload = {
        full_name: fullName,
        phone: data.phone,
        national_id: data.nationalId,
        yob: parseInt(data.yob),
        ward: data.ward,
        polling_station: data.pollingCenter,
        referred_by: referrerId || null
      };

      const res = await api.register(memberPayload, inviteToken);

      if (res.status === 409 || res.errorData?.already_registered) {
        const info = res.errorData || {};
        if (!info.has_referrer) {
          // Unassigned online recruit!
          setClaimCandidate({
            name: info.member_name || fullName,
            nationalId: data.nationalId,
            phone: data.phone,
            source: info.source || "online",
          });
          toast.info(`Found online recruit: ${info.member_name || fullName}`);
          return;
        } else {
          setClaimCandidate(null);
          toast.error(`Already registered under mobilizer: ${info.referrer_name || "another mobilizer"}`);
          return;
        }
      }

      if (res.error) {
        throw new Error(res.error.error || res.error.message || "Registration failed.");
      }

      const resData = res.data;

      // ─── Offline: save to queue, notify user ──────────────────────────────
      if (resData?.offline) {
        enqueueOffline({ ...memberPayload, invite_token: inviteToken });
        toast.success(
          `📶 Saved Offline — ${fullName} will sync when internet returns!`,
          { duration: 5000 }
        );
        // Still call onSuccess with a synthetic member object so the UI advances
        onSuccess({ member: memberPayload, token: null, offline: true });
        return;
      }

      toast.success("Registration Successful!");
      onSuccess(resData);
    } catch (error) {
      toast.error(error.message || "Registration failed. Please try again.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.8 }}
      className="max-w-xl mx-auto relative z-30"
    >
      <div className="card-official p-8 md:p-10 border-t-8 border-t-dcp-green shadow-xl">
        <header className="flex flex-col items-center mb-10 text-center relative">
          <div className="absolute top-0 right-0">
            <LanguageToggle />
          </div>
          <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-dcp-green mb-4">
             <ShieldCheck size={32} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">{t('reg_enrollment')}</h2>
          <p className="text-slate-500 font-medium text-sm">{t('reg_enrollment_desc')}</p>
          {!isOnline && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl">
              <WifiOff className="w-4 h-4 text-amber-500 shrink-0" />
              <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">
                {t('reg_offline')}
              </p>
            </div>
          )}
          {initialData && (
            <div className="mt-3 flex items-center gap-2 px-4 py-2 bg-dcp-green/10 border border-dcp-green/20 rounded-xl">
              <ShieldCheck className="w-4 h-4 text-dcp-green shrink-0" />
              <p className="text-[10px] font-black text-dcp-green uppercase tracking-widest">
                {t('reg_prefilled')}
              </p>
            </div>
          )}
        </header>

        {claimCandidate && (
          <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-500/30 shadow-md">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <UserPlus size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-600/10 text-emerald-700 px-2 py-0.5 rounded-full">
                    Online Supporter Found
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase">
                    via {claimCandidate.source}
                  </span>
                </div>
                <h4 className="text-base font-black text-slate-900 leading-tight">
                  {claimCandidate.name}
                </h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This person joined online and is not yet assigned to any mobilizer's team. Since you are meeting in person with their matching National ID & Phone, you can switch them into your downline team!
                </p>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handleClaimCandidate}
                    disabled={isClaiming}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs transition shadow-md disabled:opacity-50"
                  >
                    {isClaiming ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Switching...</span>
                      </>
                    ) : (
                      <>
                        <span>🤝 Switch to My Team</span>
                        <ArrowRight size={14} />
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setClaimCandidate(null)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold px-3 py-2"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Anti-Bot Decoy Honeypot Trap */}
          <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px', height: 0, width: 0, pointerEvents: 'none' }} aria-hidden="true">
            <input 
              type="text" 
              {...register("website_url_trap")} 
              tabIndex={-1} 
              autoComplete="off" 
            />
          </div>
          <section className="space-y-4">
            <h3 className="label-official border-b border-slate-100 pb-2 mb-4">{t('reg_identity')}</h3>
            
              <div className="grid md:grid-cols-3 gap-4">
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("firstName")}
                    className={`input-official pl-12 ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : ''}`}
                    placeholder={t('first_name')}
                    readOnly={!!selectedVoter}
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.firstName.message}</p>}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("secondName")}
                    className={`input-official pl-12 ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : ''}`}
                    placeholder={t('second_name')}
                    readOnly={!!selectedVoter}
                  />
                  {errors.secondName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.secondName.message}</p>}
                </div>

                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                  <input
                    {...register("lastName")}
                    className="input-official pl-12"
                    placeholder={t('last_name')}
                  />
                </div>
              </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("phone")}
                  className="input-official pl-12"
                  placeholder={t('phone')}
                />
                {errors.phone && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.phone.message}</p>}
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("nationalId")}
                  className="input-official pl-12"
                  placeholder={t('national_id')}
                />
                {errors.nationalId && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.nationalId.message}</p>}
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("yob")}
                  className="input-official pl-12"
                  placeholder={t('yob')}
                />
                {errors.yob && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.yob.message}</p>}
              </div>
            </div>
          </section>

          <section className="space-y-4 pt-2">
            <h3 className="label-official border-b border-slate-100 pb-2 mb-4">{t('reg_location')}</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <select
                  {...register("ward")}
                  className={`input-official pl-12 appearance-none ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : 'bg-transparent'}`}
                  defaultValue=""
                  tabIndex={selectedVoter ? -1 : 0}
                >
                  <option value="" disabled>
                    {t('select_ward')}
                  </option>
                  {wardsWithCenters.map((ward) => (
                    <option key={ward.id} value={ward.name}>
                      {ward.label}
                    </option>
                  ))}
                </select>
                {errors.ward && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.ward.message}</p>}
              </div>

              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <select
                  {...register("pollingCenter")}
                  className={`input-official pl-12 appearance-none ${selectedVoter ? 'opacity-60 pointer-events-none bg-slate-50' : 'bg-transparent'}`}
                  disabled={!currentCenters.length}
                  defaultValue=""
                  tabIndex={selectedVoter ? -1 : 0}
                >
                  <option value="" disabled>
                    {currentCenters.length ? t('select_center') : t('select_ward_first')}
                  </option>
                  {currentCenters.map((center) => (
                    <option key={center} value={center}>
                      {center}
                    </option>
                  ))}
                </select>
                {errors.pollingCenter && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.pollingCenter.message}</p>}
              </div>
            </div>
          </section>



          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl mt-6">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                {...register("consent")}
                id="consent"
                className="mt-0.5 w-5 h-5 accent-dcp-green cursor-pointer shrink-0"
              />
              <div className="text-[11px] leading-relaxed text-slate-600 select-none">
                <span>{t('consent_text') || 'I confirm that the information provided is accurate and agree to the'} </span>
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}
                  className="text-emerald-700 font-bold underline hover:text-emerald-800 transition inline-block cursor-pointer"
                >
                  Terms & Conditions and Privacy Policy
                </button>
                <span className="block text-[10px] text-slate-400 mt-1">
                  (Tap the link to view party terms or tick this box to proceed)
                </span>
              </div>
            </div>
          </div>
          {errors.consent && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.consent.message}</p>}

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-3 active:bg-dcp-green-dark"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                {t('verifying')}
              </span>
            ) : t('btn_register')}
          </motion.button>
        </form>
      </div>
      {/* Terms & Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto border border-slate-200 text-left"
            >
              <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center border border-emerald-200">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Supporter Terms & Privacy
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                      DCP Party · Laikipia County
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600 leading-relaxed">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-[11px] font-medium">
                  ⚖️ In compliance with the <strong>Kenya Data Protection Act (2019)</strong>.
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">1. Voluntary Supporter Enrollment</h4>
                  <p className="text-slate-500">
                    By registering, you voluntarily join as a civic supporter of the Democratic Congress Party (DCP) in Laikipia County. Enrollment is free, voluntary, and without commercial obligations.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">2. Strict Data Privacy & Protection</h4>
                  <p className="text-slate-500">
                    Your personal information (Full Name, Phone Number, National ID, and Ward) is stored securely with encryption. It is used exclusively by authorized party leadership for internal mobilization and verification. Your data will never be sold, rented, or shared with commercial marketers.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">3. Communications & Updates</h4>
                  <p className="text-slate-500">
                    You consent to receive campaign updates, rally notifications, and official announcements via SMS broadcasts and verified WhatsApp community groups. You can opt-out of messages at any time.
                  </p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-xs mb-1">4. Single Official Registration</h4>
                  <p className="text-slate-500">
                    To safeguard electoral integrity and prevent duplicate records, each supporter is registered once under their verified National ID.
                  </p>
                </div>

                <div className="p-3 bg-slate-100 rounded-xl space-y-2 border border-slate-200 text-[11px]">
                  <h4 className="font-black text-slate-900 uppercase tracking-wider text-[10px]">
                    🏛️ Statutory Data Controller & DPO Notice (DPA 2019)
                  </h4>
                  <p className="text-slate-600">
                    <strong>Data Controller:</strong> Democratic Congress Party (DCP) — Laikipia County Secretariat, Nanyuki, Kenya.<br />
                    <strong>Designated DPO:</strong> <a href="mailto:dpo@dcplaikipia.or.ke" className="text-emerald-700 underline font-bold">dpo@dcplaikipia.or.ke</a>
                  </p>
                  <p className="text-slate-600">
                    <strong>Your Statutory Rights (Sections 26, 34 & 40):</strong> You retain the right to inspect, correct, or request deletion (Right to Erasure) of your personal data. You may opt-out ("STOP") from SMS broadcasts at any time.
                  </p>
                  <p className="text-slate-600">
                    <strong>CA Kenya SMS Hours:</strong> Outgoing broadcasts occur strictly between 07:00 AM – 07:00 PM EAT per Communications Authority bulk messaging standards.
                  </p>
                  <p className="text-slate-500">
                    <strong>Regulator Oversight:</strong> You have the right to lodge inquiries or complaints directly with the <em>Office of the Data Protection Commissioner (ODPC)</em> via <a href="mailto:complaints@odpc.go.ke" className="text-emerald-700 underline">complaints@odpc.go.ke</a>.
                  </p>
                </div>
              </div>

              <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setValue("consent", true, { shouldValidate: true });
                    setShowTermsModal(false);
                    toast.success("✅ Terms & Conditions Accepted!");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-md"
                >
                  ✓ Accept Terms & Check Box
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
