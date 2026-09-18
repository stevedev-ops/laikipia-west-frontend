import { useLanguage } from '../contexts/LanguageContext';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Printer, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp,
  BookOpen, 
  Gavel,
  PhoneCall,
  Download,
  Flame
} from "lucide-react";

export default function CheatSheets() {
  const { t } = useLanguage();
  // Option 2: Expandable Accordion Handbook (Default with section 1 open)
  const [openSections, setOpenSections] = useState({
    reg79: true,
    counting: false,
    offences: false,
    checklist: false,
  });

  const toggleSection = (key) => {
    setOpenSections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAll = () => {
    setOpenSections({
      reg79: true,
      counting: true,
      offences: true,
      checklist: true,
    });
  };

  const collapseAll = () => {
    setOpenSections({
      reg79: false,
      counting: false,
      offences: false,
      checklist: false,
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-2 sm:px-4 pb-20 selection:bg-emerald-500/20">
      
      {/* ── Top Header ── */}
      <div className="print:hidden relative overflow-hidden bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Scale className="text-emerald-400" size={16} />
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400">
                Official Electoral Law & Protocols
              </p>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black uppercase italic text-white">
              {t('cs_title')}
            </h1>
            <p className="text-slate-300 text-xs mt-1">
              Elections Act 2011 & IEBC Regulations 2012 (Regulation 79). Tap any section to view legal clauses.
            </p>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg"
            >
              <Printer size={14} /> {t('cs_print')}
            </button>
          </div>
        </div>

        {/* Expand / Collapse Quick Controls */}
        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] font-bold text-slate-400">
          <span>Official Legal Handbook Chapters</span>
          <div className="flex items-center gap-3">
            <button onClick={expandAll} className="hover:text-emerald-400 transition underline underline-offset-2">
              {t('cs_expand_all')}
            </button>
            <span>·</span>
            <button onClick={collapseAll} className="hover:text-slate-200 transition underline underline-offset-2">
              {t('cs_collapse_all')}
            </button>
          </div>
        </div>
      </div>

      {/* ── Accordion Chapter 1: IEBC Regulation 79 Statutory Rights ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("reg79")}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              openSections.reg79 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-100 text-slate-600'
            }`}>
              <Scale size={18} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 block">Chapter 1</span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                {t('cs_ch1_title')}
              </h2>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {openSections.reg79 ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {openSections.reg79 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-100 p-4 sm:p-6 space-y-4 bg-slate-50/50"
            >
              {/* Clause 1 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <p className="text-xs font-black uppercase text-slate-900">
                  1. Right to Physical Presence Inside Polling Station (Reg 79(1))
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  You have the unconditional statutory right to be physically present inside the polling room from <strong>06:00 AM opening</strong> through voting, sealing of ballot boxes, sorting, counting, and final result declaration. The Presiding Officer (PO) <strong>cannot lock you outside</strong>.
                </p>
              </div>

              {/* Clause 2 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <p className="text-xs font-black uppercase text-slate-900">
                  2. Right to Inspect Empty Ballot Boxes at 06:00 AM (Reg 67)
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Before voting commences, the PO <strong>must show you that all ballot boxes are completely empty</strong>. You have the right to record the exact serial numbers of all plastic security seal tags placed on the boxes.
                </p>
              </div>

              {/* Clause 3 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <p className="text-xs font-black uppercase text-slate-900">
                  3. Right to Witness Assisted Voters (Reg 73)
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If a voter requests assistance due to disability or illiteracy, the PO must assist the voter <strong>in the physical presence of accredited candidate agents</strong> to guarantee the voter's true intent.
                </p>
              </div>

              {/* Clause 4 */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <p className="text-xs font-black uppercase text-slate-900">
                  4. Right to Inspect Every Ballot & Object (Reg 79(2))
                </p>
                <p className="text-xs text-slate-600 leading-relaxed">
                  During counting, you have the right to see every individual ballot paper. If a ballot is disputed or marked ambiguously, you have the right to demand the PO mark it as <em>"Disputed Ballot"</em>.
                </p>
              </div>

              {/* Clause 5 */}
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
                <p className="text-xs font-black uppercase text-emerald-950">
                  5. Mandatory Right to Form 34A Copy & Photograph (Reg 79(3))
                </p>
                <p className="text-xs text-emerald-900 leading-relaxed">
                  The PO <strong>MUST provide you with an official signed physical copy of Form 34A</strong> immediately after tallying. You also have the absolute legal right to <strong>take a clear photograph</strong> with your mobile device before the PO leaves the stream.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Accordion Chapter 2: Vote Counting & Mandatory Recount Rules ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("counting")}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              openSections.counting ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'
            }`}>
              <Gavel size={18} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-amber-600 block">Chapter 2</span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                {t('cs_ch2_title')}
              </h2>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {openSections.counting ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {openSections.counting && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-100 p-4 sm:p-6 space-y-4 bg-slate-50/50"
            >
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                <p className="text-xs font-black uppercase text-amber-950">
                  The Mandatory Recount Right (Regulation 83(1))
                </p>
                <p className="text-xs text-amber-900 leading-relaxed">
                  If the vote count difference is close, or if you notice arithmetic discrepancies, you have the <strong>statutory right to demand ONE MANDATORY RECOUNT</strong> of all votes before the ballot box is sealed. The Presiding Officer <strong>must grant this recount by law</strong>.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <p className="text-xs font-black uppercase text-slate-900">Grounds for Rejecting a Ballot Paper:</p>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                  <li>Does not bear the official <strong>IEBC security stamp/mark</strong> on the back.</li>
                  <li>Voter marked more than one candidate for Governor.</li>
                  <li>Any writing or mark identifying the voter.</li>
                  <li>Unmarked or completely blank ballot paper.</li>
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Accordion Chapter 3: Electoral Offences & Penalties ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("offences")}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              openSections.offences ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <AlertTriangle size={18} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-red-600 block">Chapter 3</span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                {t('cs_ch3_title')}
              </h2>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {openSections.offences ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {openSections.offences && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-100 p-4 sm:p-6 space-y-3 bg-slate-50/50"
            >
              {[
                {
                  title: "Denying Agent Entry or Copy of Form 34A",
                  section: "Section 6(i)",
                  penalty: "Fine up to KES 1,000,000 or up to 5 years imprisonment.",
                  action: "Demand PO record objection in Polling Diary (Form 32A)."
                },
                {
                  title: "Ballot Stuffing or Forged Ballot Papers",
                  section: "Section 3(a)",
                  penalty: "Imprisonment up to 6 years without option of fine.",
                  action: "Challenge serial numbers against official counterfoil."
                },
                {
                  title: "Voter Bribery within 400m of Polling Station",
                  section: "Section 9",
                  penalty: "Fine up to KES 2,000,000 or up to 6 years imprisonment.",
                  action: "Take timestamped note and alert Police Officer on duty."
                },
                {
                  title: "Tampering with KIEMS Biometric Kits",
                  section: "Section 13",
                  penalty: "Imprisonment up to 10 years.",
                  action: "Record time KIEMS went down and demand manual register procedure."
                }
              ].map((item, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black uppercase text-slate-900">{item.title}</p>
                    <span className="text-[9px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                      {item.section}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600"><strong>Penalty:</strong> {item.penalty}</p>
                  <p className="text-[11px] text-emerald-700"><strong>Your Action:</strong> {item.action}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Accordion Chapter 4: Step-by-Step 06:00 AM – 05:00 PM Protocol ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all">
        <button
          onClick={() => toggleSection("checklist")}
          className="w-full p-4 sm:p-5 flex items-center justify-between gap-3 text-left hover:bg-slate-50 transition"
        >
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
              openSections.checklist ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              <Clock size={18} />
            </div>
            <div>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block">Chapter 4</span>
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-slate-900">
                {t('cs_ch4_title')}
              </h2>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
            {openSections.checklist ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {openSections.checklist && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="border-t border-slate-100 p-4 sm:p-6 space-y-2.5 bg-slate-50/50"
            >
              {[
                { time: "05:30 AM", title: "Arrive & Present Accreditation", desc: "Show official IEBC badge and tap '1-Tap Station Check-in' on your app." },
                { time: "06:00 AM", title: "Witness Ballot Box Sealing", desc: "Inspect empty ballot boxes and record seal serial numbers." },
                { time: "08:00 AM", title: "Morning Breakfast Check", desc: "Receive breakfast and tap 'Confirm Breakfast' in app." },
                { time: "Hourly", title: "Voter Turnout Pulse", desc: "Send hourly turnout counts via the Turnout Tracker." },
                { time: "01:00 PM", title: "Afternoon Lunch Check", desc: "Receive lunch and confirm in app. Never leave the counting room unattended." },
                { time: "05:00 PM", title: "Station Close & Queue Check", desc: "Ensure all voters in line by 5:00 PM are allowed to vote." },
                { time: "Counting", title: "Ballot Count & Disputed Tallies", desc: "Witness every ballot; exercise right to 1 recount if needed." },
                { time: "Final", title: "Form 34A Photo & Transmission", desc: "Photograph signed Form 34A and upload directly into PVT Portal." },
              ].map((step, i) => (
                <div key={i} className="flex gap-3 items-start p-3 rounded-xl bg-white border border-slate-200">
                  <span className="px-2 py-0.5 rounded-lg bg-slate-900 text-white text-[9px] font-black uppercase tracking-wider shrink-0 mt-0.5">
                    {step.time}
                  </span>
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900">{step.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── War Room Legal Hotline ── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 text-white border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shrink-0">
            <PhoneCall size={18} />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase text-white">{t('cs_hotline_title')}</h4>
            <p className="text-[11px] text-emerald-300">Direct hotline to Governor Peter Kuria's Advocate on Election Day</p>
          </div>
        </div>

        <button
          onClick={() => window.open('tel:0790821091')}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl transition shadow-md self-stretch sm:self-auto text-center"
        >
          {t('cs_hotline_btn')}
        </button>
      </div>

    </div>
  );
}
