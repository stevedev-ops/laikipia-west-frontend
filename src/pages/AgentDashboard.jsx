import { cleanCentreName } from "../lib/constants";
import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Clock, 
  Utensils, 
  Coffee, 
  Sandwich,
  AlertTriangle, 
  FileText, 
  Camera, 
  Scale, 
  Users, 
  Send,
  HelpCircle,
  ExternalLink,
  PhoneCall,
  Check
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function AgentDashboard({ memberId }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [agentData, setAgentData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quick Turnout State
  const [turnoutCount, setTurnoutCount] = useState("");
  const [submittingTurnout, setSubmittingTurnout] = useState(false);

  // Incident Modal
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [incidentCategory, setIncidentCategory] = useState("kiems");
  const [incidentNotes, setIncidentNotes] = useState("");
  const [submittingIncident, setSubmittingIncident] = useState(false);

  const loadAgentProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.getMe();
      if (data) {
        setMember(data);
        if (data.agent_assignment) {
          setAgentData(data.agent_assignment);
        } else {
          // If not directly embedded, fetch from agents list
          const { data: agents } = await api.getAgents();
          const list = agents?.results || agents || [];
          const myAgent = list.find(a => a.member_id === data.id);
          if (myAgent) setAgentData(myAgent);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAgentProfile();
  }, [loadAgentProfile]);

  const handleStationCheckIn = async () => {
    if (!agentData?.id) return;
    try {
      const { data, error } = await api.checkInAgent(agentData.id, { action: 'checkin' });
      if (error) throw new Error(error);
      setAgentData(prev => ({
        ...prev,
        checked_in: data.checked_in,
        check_in_time: data.check_in_time
      }));
      toast.success(data.checked_in ? "✅ Verified inside Polling Station!" : "Station check-in undone.");
    } catch (err) {
      toast.error(err.message || "Failed to update check-in.");
    }
  };

  const handleMealToggle = async (mealType) => {
    if (!agentData?.id) return;
    try {
      const { data, error } = await api.checkInAgent(agentData.id, { action: mealType });
      if (error) throw new Error(error);
      setAgentData(prev => ({
        ...prev,
        breakfast_received: data.breakfast_received,
        lunch_received: data.lunch_received
      }));
      const isReceived = mealType === 'breakfast' ? data.breakfast_received : data.lunch_received;
      toast.success(isReceived ? `✅ ${mealType.toUpperCase()} marked as RECEIVED!` : `Marked ${mealType} as pending.`);
    } catch (err) {
      toast.error(err.message || "Failed to update meal status.");
    }
  };

  const handleSendTurnout = async (e) => {
    e.preventDefault();
    if (!turnoutCount) return;
    setSubmittingTurnout(true);
    // Simulate turnout pulse submission
    setTimeout(() => {
      toast.success(`🗳️ Stream turnout pulse recorded: ${turnoutCount} voters`);
      setTurnoutCount("");
      setSubmittingTurnout(false);
    }, 600);
  };

  const handleSubmitIncident = async (e) => {
    e.preventDefault();
    if (!incidentNotes) {
      toast.error("Please provide brief incident details.");
      return;
    }
    setSubmittingIncident(true);
    try {
      const { error } = await api.createIncident({
        category: incidentCategory,
        description: incidentNotes,
        ward: agentData?.ward || member?.ward || "General",
        polling_station: agentData?.polling_station || "Main Station",
      });
      if (error) throw new Error(error);
      toast.success("🚨 Urgent Incident escalated directly to Governor War Room!");
      setShowIncidentModal(false);
      setIncidentNotes("");
    } catch (err) {
      toast.error(err.message || "Failed to submit incident.");
    } finally {
      setSubmittingIncident(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t('loading_agent_cockpit')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5 px-2 sm:px-4 pb-20 selection:bg-emerald-500/20">
      
      {/* ── Official Agent Accreditation Header ── */}
      <div className="relative overflow-hidden bg-slate-900 text-white rounded-3xl p-5 sm:p-7 border border-slate-800 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20 shrink-0">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[9px] font-black uppercase tracking-widest">
                  {t('accredited_agent')}
                </span>
                <span className="text-[10px] font-bold text-slate-400">· DCP 2026</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white mt-0.5">
                {member?.full_name || "Official Agent"}
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {t('national_id')}: <span className="text-slate-200">{member?.national_id}</span>
              </p>
            </div>
          </div>

          <button
            onClick={() => window.open('tel:0790821091')}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-slate-700 transition self-stretch sm:self-auto justify-center"
          >
            <PhoneCall size={14} /> {t('war_room_hotline')}
          </button>
        </div>

        {/* Station Deployment Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <MapPin className="text-emerald-400 shrink-0 mt-0.5" size={18} />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('assigned_station')}</p>
              <p className="text-sm sm:text-base font-black text-white">
                {cleanCentreName(agentData?.polling_station || member?.polling_station) || "Nanyuki Primary School"}
              </p>
              <p className="text-[11px] font-bold text-emerald-400 uppercase">
                {agentData?.ward || member?.ward || "Nanyuki Ward"} · {t('laikipia_county')}
              </p>
            </div>
          </div>

          {/* Station Check-In Button */}
          <button
            onClick={handleStationCheckIn}
            className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-md ${
              agentData?.checked_in
                ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                : 'bg-amber-400 text-slate-950 hover:bg-amber-300 animate-pulse'
            }`}
          >
            {agentData?.checked_in ? (
              <>
                <CheckCircle2 size={15} /> Inside Station ✓
              </>
            ) : (
              <>
                <Clock size={15} /> {t('agent_checkin_btn')}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Election Day 5-Phase Execution Checklist ── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase tracking-tight text-slate-900">
              Election Day Operations Checklist
            </h2>
            <p className="text-xs text-slate-500 font-medium">Follow each step sequentially from opening to vote tallying.</p>
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-slate-100 text-slate-700">
            D-Day Mode
          </span>
        </div>

        <div className="space-y-3">
          
          {/* Phase 1: Station Arrival */}
          <div className={`p-4 rounded-2xl border transition ${
            agentData?.checked_in ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                  agentData?.checked_in ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  1
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900">06:00 AM — Polling Station Arrival</p>
                  <p className="text-[11px] text-slate-500 font-medium">Witness ballot box sealing and official KIEMS biometric setup.</p>
                </div>
              </div>
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-lg ${
                agentData?.checked_in ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
              }`}>
                {agentData?.checked_in ? "Completed ✓" : "Pending"}
              </span>
            </div>
          </div>

          {/* Phase 2: Morning Breakfast Confirmation */}
          <div className={`p-4 rounded-2xl border transition ${
            agentData?.breakfast_received ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                  agentData?.breakfast_received ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  2
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900">08:00 AM — Morning Breakfast</p>
                  <p className="text-[11px] text-slate-500 font-medium">Confirm morning refreshments delivered by campaign catering.</p>
                </div>
              </div>
              <button
                onClick={() => handleMealToggle('breakfast')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                  agentData?.breakfast_received
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Coffee size={13} />
                {agentData?.breakfast_received ? "Breakfast Confirmed ✓" : "Confirm Breakfast Received"}
              </button>
            </div>
          </div>

          {/* Phase 3: Afternoon Lunch Confirmation */}
          <div className={`p-4 rounded-2xl border transition ${
            agentData?.lunch_received ? 'bg-emerald-50/50 border-emerald-200' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black ${
                  agentData?.lunch_received ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  3
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900">01:00 PM — Afternoon Lunch</p>
                  <p className="text-[11px] text-slate-500 font-medium">Confirm lunchbox delivered so you remain in counting room.</p>
                </div>
              </div>
              <button
                onClick={() => handleMealToggle('lunch')}
                className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
                  agentData?.lunch_received
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                }`}
              >
                <Sandwich size={13} />
                {agentData?.lunch_received ? "Lunch Confirmed ✓" : "Confirm Lunch Received"}
              </button>
            </div>
          </div>

          {/* Phase 4: Hourly Turnout Tracker */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center text-xs font-black">
                  4
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-tight text-slate-900">{t('agent_turnout_title')}</p>
                  <p className="text-[11px] text-slate-500 font-medium">Send estimated total voters who have cast ballots at your station.</p>
                </div>
              </div>
              <form onSubmit={handleSendTurnout} className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Voter Count"
                  value={turnoutCount}
                  inputMode="numeric" onChange={e => setTurnoutCount(e.target.value)}
                  className="w-28 px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  disabled={submittingTurnout || !turnoutCount}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition flex items-center gap-1 disabled:opacity-50"
                >
                  <Send size={12} /> {t('send')}
                </button>
              </form>
            </div>
          </div>

          {/* Phase 5: {t('agent_pvt_title')} (PRIMARY OBJECTIVE) */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950 to-slate-900 text-white border border-emerald-500/30 shadow-lg space-y-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center text-sm font-black shrink-0">
                  5
                </div>
                <div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">{t('agent_pvt_sub')}</span>
                  <h3 className="text-sm sm:text-base font-black uppercase text-white">05:00 PM — Form 34A PVT Vote Transmission</h3>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                {t('agent_pvt_crucial')}
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              When counting completes, take a clear photo of the signed official <strong>Form 34A</strong> and enter the vote counts for Mwalimu Peter Kuria.
            </p>

            <button
              onClick={() => navigate('/tally')}
              className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
            >
              <Camera size={16} /> {t('agent_pvt_btn')}
            </button>
          </div>

        </div>
      </div>

      {/* ── Fast Action Emergency Button & Legal Toolkit ── */}
      <div className="grid sm:grid-cols-2 gap-4">
        
        {/* Incident Escalation */}
        <div className="p-5 rounded-3xl bg-white border border-red-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-red-600">
            <AlertTriangle size={20} />
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">{t('station_irregularity')}</h3>
          </div>
          <p className="text-xs text-slate-500">
            {t('station_irregularity_desc')}
          </p>
          <button
            onClick={() => setShowIncidentModal(true)}
            className="w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest transition shadow-md shadow-red-500/20 flex items-center justify-center gap-2"
          >
            <AlertTriangle size={14} /> {t('report_urgent')}
          </button>
        </div>

        {/* Legal Rights Reference */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-slate-900">
            <Scale size={20} className="text-emerald-600" />
            <h3 className="text-sm font-black uppercase tracking-tight text-slate-900">{t('agent_legal_title')}</h3>
          </div>
          <p className="text-xs text-slate-500">
            {t('agent_legal_btn_sub')}
          </p>
          <button
            onClick={() => navigate('/training')}
            className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest transition flex items-center justify-center gap-2"
          >
            <FileText size={14} /> {t('open_cheat_sheet')}
          </button>
        </div>

      </div>

      {/* ── Incident Report Modal ── */}
      <AnimatePresence>
        {showIncidentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertTriangle size={20} />
                  <h3 className="text-base font-black uppercase text-slate-900">{t('report_incident_title')}</h3>
                </div>
                <button onClick={() => setShowIncidentModal(false)} className="text-slate-400 hover:text-slate-600 text-sm font-black">
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmitIncident} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('incident_category')}
                  </label>
                  <select
                    value={incidentCategory}
                    onChange={e => setIncidentCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <option value="kiems">{t('incident_kiems')}</option>
                    <option value="tampering">{t('incident_tampering')}</option>
                    <option value="intimidation">{t('incident_intimidation')}</option>
                    <option value="shortage">{t('incident_shortage')}</option>
                    <option value="late_opening">Station Opened Late (&gt; 1 Hour)</option>
                    <option value="other">{t('incident_other')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    {t('incident_details')}
                  </label>
                  <textarea
                    rows={4}
                    value={incidentNotes}
                    onChange={e => setIncidentNotes(e.target.value)}
                    placeholder="{t('incident_placeholder')}"
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-500 resize-none"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={submittingIncident}
                    className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest rounded-xl transition shadow-lg shadow-red-500/20 disabled:opacity-50"
                  >
                    {submittingIncident ? t('escalating') : t('transmit_hq')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowIncidentModal(false)}
                    className="px-4 py-3 bg-slate-100 text-slate-600 font-black text-xs uppercase tracking-widest rounded-xl hover:bg-slate-200 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
