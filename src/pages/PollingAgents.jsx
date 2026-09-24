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
  Plus, 
  AlertTriangle, 
  UserPlus, 
  Utensils, 
  Coffee, 
  Sandwich,
  Filter,
  Flame
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

function AgentCard({ agent, onCheckIn, onMealConfirm }) {
  const { t } = useLanguage();
  const [loadingCheckIn, setLoadingCheckIn] = useState(false);
  const [loadingBreakfast, setLoadingBreakfast] = useState(false);
  const [loadingLunch, setLoadingLunch] = useState(false);

  const handleCheckIn = async () => {
    setLoadingCheckIn(true);
    await onCheckIn(agent.id, 'checkin');
    setLoadingCheckIn(false);
  };

  const handleBreakfast = async () => {
    setLoadingBreakfast(true);
    await onMealConfirm(agent.id, 'breakfast');
    setLoadingBreakfast(false);
  };

  const handleLunch = async () => {
    setLoadingLunch(true);
    await onMealConfirm(agent.id, 'lunch');
    setLoadingLunch(false);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white border rounded-2xl p-4 sm:p-5 space-y-4 transition-all shadow-sm ${
        agent.checked_in ? 'border-emerald-200' : 'border-slate-200'
      }`}>
      
      {/* Agent Identity & Station Check-in Status */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            agent.checked_in ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-400'
          }`}>
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className={`font-black uppercase tracking-tight text-sm truncate ${agent.checked_in ? 'text-slate-900' : 'text-slate-700'}`}>
              {agent.member_name}
            </p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
              <Phone className="w-3 h-3" />{agent.phone}
            </p>
          </div>
        </div>
        
        {agent.checked_in ? (
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1 shrink-0">
            <CheckCircle2 className="w-3 h-3" /> {t('pa_station_in')}
          </span>
        ) : (
          <span className="px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-lg border bg-amber-50 text-amber-700 border-amber-200 shrink-0">
            Awaiting Check-in
          </span>
        )}
      </div>

      {/* Assigned Polling info */}
      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
        <div className="min-w-0">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('pa_assigned_center')}</p>
          <p className="font-bold text-slate-800 text-xs sm:text-sm truncate">{cleanCentreName(agent.polling_station)}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">{agent.ward}</p>
        </div>
      </div>

      {/* ── Option 1: Digital Meal Welfare Vouchers ({t("breakfast")} & {t("lunch")}) ── */}
      <div className="p-3 bg-slate-900 text-white rounded-xl space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
            <Utensils size={12} /> Election Day Meals
          </span>
          <span className="text-[9px] text-slate-400 font-bold">1-Tap Receipt</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {/* {t("breakfast")} Toggle */}
          <button
            onClick={handleBreakfast}
            disabled={loadingBreakfast}
            className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              agent.breakfast_received
                ? 'bg-emerald-500 text-slate-950 font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Coffee size={12} />
            {loadingBreakfast ? "..." : agent.breakfast_received ? `🥐 ${t("breakfast")} In ✓` : `🥐 Get ${t("breakfast")}`}
          </button>

          {/* {t("lunch")} Toggle */}
          <button
            onClick={handleLunch}
            disabled={loadingLunch}
            className={`p-2 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition ${
              agent.lunch_received
                ? 'bg-blue-500 text-white font-black'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
            }`}
          >
            <Sandwich size={12} />
            {loadingLunch ? "..." : agent.lunch_received ? `🍱 ${t("lunch")} In ✓` : `🍱 Get ${t("lunch")}`}
          </button>
        </div>
      </div>

      {agent.notes && <p className="text-xs text-slate-500 italic px-2 border-l-2 border-slate-200">{agent.notes}</p>}

      {/* Mark Present at Station Toggle */}
      <button 
        onClick={handleCheckIn} 
        disabled={loadingCheckIn}
        className={`w-full py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2 ${
          agent.checked_in
            ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
            : "bg-slate-900 text-white hover:bg-slate-800 shadow-md"
        }`}>
        {loadingCheckIn ? <Clock className="w-4 h-4 animate-spin" /> : agent.checked_in ? "Undo Station Check-in" : "Mark Present at Station"}
      </button>
    </motion.div>
  );
}

export default function PollingAgents() {
  const { t } = useLanguage();
  const { wardsWithCenters } = useLocationData();
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [wardFilter, setWardFilter] = useState("");
  const [welfareFilter, setWelfareFilter] = useState("all");
  const [showAssign, setShowAssign] = useState(false);
  
  const [form, setForm] = useState({ member_id: "", ward: "", polling_station: "", notes: "" });
  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await api.getAgents();
    setAgents(data?.results || data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAssign = async () => {
    if (!form.member_id || !form.polling_station) { toast.error("Member ID and Station are required."); return; }
    const { error } = await api.assignAgent(form);
    if (error) { toast.error("Failed to assign agent."); return; }
    toast.success("Agent assigned successfully!");
    setShowAssign(false);
    setForm({ member_id: "", ward: "", polling_station: "", notes: "" });
    load();
  };

  const handleCheckIn = async (id, action = 'checkin') => {
    const { data } = await api.checkInAgent(id, { action });
    if (data) {
      setAgents(prev => prev.map(a => a.id === id ? { 
        ...a, 
        checked_in: data.checked_in, 
        check_in_time: data.check_in_time,
        breakfast_received: data.breakfast_received,
        lunch_received: data.lunch_received
      } : a));
      toast.success("Station check-in updated!");
    }
  };

  const handleMealConfirm = async (id, mealType) => {
    const { data, error } = await api.checkInAgent(id, { action: mealType });
    if (error) { toast.error("Failed to update meal status"); return; }
    if (data) {
      setAgents(prev => prev.map(a => a.id === id ? { 
        ...a, 
        breakfast_received: data.breakfast_received,
        lunch_received: data.lunch_received
      } : a));
      const isReceived = mealType === 'breakfast' ? data.breakfast_received : data.lunch_received;
      toast.success(isReceived ? `✅ ${mealType.toUpperCase()} marked as RECEIVED!` : `Marked ${mealType} as pending.`);
    }
  };

  // Filtering Logic
  const filtered = agents.filter(a => {
    const matchWard = !wardFilter || a.ward === wardFilter;
    if (!matchWard) return false;

    if (welfareFilter === 'missing_breakfast') return !a.breakfast_received;
    if (welfareFilter === 'missing_lunch') return !a.lunch_received;
    if (welfareFilter === 'fed') return a.breakfast_received && a.lunch_received;
    return true;
  });

  const totalAgents = agents.length;
  const deployedCount = agents.filter(a => a.checked_in).length;
  const breakfastCount = agents.filter(a => a.breakfast_received).length;
  const lunchCount = agents.filter(a => a.lunch_received).length;

  const deployPct = totalAgents > 0 ? Math.round((deployedCount / totalAgents) * 100) : 0;
  const breakfastPct = totalAgents > 0 ? Math.round((breakfastCount / totalAgents) * 100) : 0;
  const lunchPct = totalAgents > 0 ? Math.round((lunchCount / totalAgents) * 100) : 0;

  return (
    <div className="selection:bg-dcp-green/30 space-y-6 max-w-7xl mx-auto px-2 sm:px-4 pb-16">
      {/* ── Top Header & War Room Meal Tracker ── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.35em] text-emerald-400 mb-1">HQ War Room · Election Day</p>
            <h1 className="text-2xl sm:text-3xl font-black italic uppercase">{t("agent_welfare_title")}</h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1">{t("agent_welfare_desc")}</p>
          </div>

          {/* Welfare Progress Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="bg-white/10 border border-white/10 rounded-2xl p-3 text-center">
              <p className="text-xl sm:text-2xl font-black text-white">{deployPct}%</p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{t('pa_station_in')}</p>
            </div>
            <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-2xl p-3 text-center">
              <p className="text-xl sm:text-2xl font-black text-emerald-300">{breakfastCount}/{totalAgents}</p>
              <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">🥐 {t("breakfast")}</p>
            </div>
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-2xl p-3 text-center">
              <p className="text-xl sm:text-2xl font-black text-blue-300">{lunchCount}/{totalAgents}</p>
              <p className="text-[9px] font-black text-blue-200 uppercase tracking-widest">🍱 {t("lunch")}</p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <button onClick={() => setShowAssign(v => !v)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition shadow-lg">
            <UserPlus className="w-4 h-4" /> Assign New Agent
          </button>

          {/* Quick Alert Warning */}
          {totalAgents > lunchCount && (
            <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1.5 bg-amber-500/20 px-3 py-1.5 rounded-xl border border-amber-400/30">
              <Flame size={14} className="animate-pulse text-amber-400" /> {totalAgents - lunchCount} Agents Awaiting {t("lunch")}
            </span>
          )}
        </div>
      </div>

      {/* ── Assign Agent Modal ── */}
      <AnimatePresence>
        {showAssign && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 border-b border-slate-100 pb-3">{t('pa_new_deployment')}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">{t('pa_agent_id')}</label>
                <input value={form.member_id} onChange={e => setForm(f => ({ ...f, member_id: e.target.value }))}
                  placeholder="Enter member ID"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition" />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
                <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, polling_station: "" }))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition">
                  <option value="">— Select Ward —</option>
                  {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
                <select value={form.polling_station} onChange={e => setForm(f => ({ ...f, polling_station: e.target.value }))} disabled={!form.ward}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition disabled:opacity-50">
                  <option value="">— Select Station —</option>
                  {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleAssign}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition">
                Confirm Deployment
              </button>
              <button onClick={() => setShowAssign(false)}
                className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filters: Ward & Meal Welfare Filter ── */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        {/* Welfare Quick Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Utensils size={12} /> Welfare Filter:
          </span>
          {[
            { id: 'all', label: 'All Agents' },
            { id: 'missing_lunch', label: '🚨 Awaiting {t("lunch")}' },
            { id: 'missing_breakfast', label: '🥐 Awaiting {t("breakfast")}' },
            { id: 'fed', label: '✅ Fully Fed' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setWelfareFilter(f.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                welfareFilter === f.id
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Ward Filter Dropdown (Zero horizontal scroll on mobile) */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 shrink-0">
            Ward Filter:
          </span>
          <select
            value={wardFilter}
            onChange={(e) => setWardFilter(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
          >
            <option value="">🏛️ All Wards (Whole County)</option>
            {wardsWithCenters.map(w => (
              <option key={w.id} value={w.name}>
                📍 {w.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Agents Cards Grid ── */}
      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-44 bg-slate-200 animate-pulse rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center">
          <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="font-black text-slate-500 uppercase tracking-tight text-base">No Agents Matching Filter</p>
          <p className="text-slate-400 text-xs mt-1">Deploy agents or adjust your ward / meal welfare filters above.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {filtered.map(a => (
            <AgentCard 
              key={a.id} 
              agent={a} 
              onCheckIn={handleCheckIn} 
              onMealConfirm={handleMealConfirm} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
