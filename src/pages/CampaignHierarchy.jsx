import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, Shield, Phone, MessageSquare, Plus, Search, Filter, 
  MapPin, CheckCircle2, AlertTriangle, ChevronRight, ChevronDown, 
  Crown, Award, UserCheck, Star, Activity, Sparkles, Building, School, 
  UserPlus, RefreshCw, Layers, ArrowRight, ShieldCheck, Check, Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { toast } from "sonner";
import { useLocationData } from "../contexts/LocationContext";

const ROLE_DISPLAY = {
  governor: { label: "Governor Aspirant", tier: "Tier 1", color: "from-amber-500 to-yellow-600", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Crown },
  county_manager: { label: "County Campaigns Manager", tier: "Tier 2", color: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: ShieldCheck },
  sub_county_coordinator: { label: "Sub-County Coordinator", tier: "Tier 3", color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Building },
  ward_coordinator: { label: "Ward Coordinator", tier: "Tier 4", color: "from-cyan-500 to-teal-600", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: MapPin },
  polling_centre_coordinator: { label: "Polling Centre Coordinator", tier: "Tier 5", color: "from-purple-500 to-violet-600", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: School },
  pillar: { label: "Campaign Pillar (3/Centre)", tier: "Tier 6", color: "from-rose-500 to-pink-600", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", icon: Award },
  station_mobilizer: { label: "Station Mobilizer (25/Station)", tier: "Tier 7", color: "from-slate-400 to-slate-600", bg: "bg-slate-500/10 text-slate-300 border-slate-500/30", icon: Users },
};

const PILLAR_CATEGORIES = [
  { id: "youth", label: "Youth Pillar" },
  { id: "women", label: "Women Pillar" },
  { id: "elders_business", label: "Elders & Business Pillar" },
  { id: "special_interest", label: "Special Interest Pillar" },
];

export default function CampaignHierarchy({ currentUser }) {
  const [activeTab, setActiveTab] = useState("tree"); // tree, directory, my_team
  const [stats, setStats] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [directoryData, setDirectoryData] = useState([]);
  const [myTeamData, setMyTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { wardStationMap } = useLocationData ? useLocationData() : {};

  // User Authority Context
  const isSuperAdmin = currentUser?.is_admin || currentUser?.is_staff || currentUser?.campaign_role === "governor" || currentUser?.campaign_role === "county_manager";
  const userRole = currentUser?.campaign_role || (currentUser?.is_admin ? "county_manager" : "station_mobilizer");

  // Determine allowed roles this specific user can appoint
  const allowedRolesToAppoint = useMemo(() => {
    if (isSuperAdmin) {
      return Object.keys(ROLE_DISPLAY);
    }
    if (userRole === "sub_county_coordinator") {
      return ["ward_coordinator", "polling_centre_coordinator"];
    }
    if (userRole === "ward_coordinator") {
      return ["polling_centre_coordinator", "pillar", "station_mobilizer"];
    }
    if (userRole === "polling_centre_coordinator") {
      return ["pillar", "station_mobilizer"];
    }
    return [];
  }, [isSuperAdmin, userRole]);

  // Filters
  const [selectedWard, setSelectedWard] = useState("");
  const [dirSearch, setDirSearch] = useState("");
  const [dirRole, setDirRole] = useState("");
  const [expandedWards, setExpandedWards] = useState({});
  const [expandedStations, setExpandedStations] = useState({});

  // Role Assignment Modal
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    member_id: "",
    campaign_role: "station_mobilizer",
    assigned_sub_county: currentUser?.assigned_sub_county || "Ol Kalou",
    assigned_ward: currentUser?.assigned_ward || currentUser?.ward || "",
    assigned_polling_centre: currentUser?.assigned_polling_centre || currentUser?.polling_station || "",
    pillar_category: "youth",
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.getHierarchyStats();
      if (res) setStats(res);
    } catch (e) {
      console.error("Failed to load hierarchy stats", e);
    }
  }, []);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getHierarchyTree({ ward: selectedWard });
      if (res) {
        setTreeData(res);
        if (res.wards && res.wards.length > 0) {
          setExpandedWards(prev => ({ ...prev, [res.wards[0].ward]: true }));
        }
      }
    } catch (e) {
      toast.error("Failed to load hierarchy structure");
    } finally {
      setLoading(false);
    }
  }, [selectedWard]);

  const fetchDirectory = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getHierarchyDirectory({
        role: dirRole,
        ward: selectedWard,
        search: dirSearch,
      });
      if (res) setDirectoryData(res);
    } catch (e) {
      toast.error("Failed to load campaign directory");
    } finally {
      setLoading(false);
    }
  }, [dirRole, selectedWard, dirSearch]);

  const fetchMyTeam = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMyTeam();
      if (res) setMyTeamData(res);
    } catch (e) {
      toast.error("Failed to load team management");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === "tree") fetchTree();
    else if (activeTab === "directory") fetchDirectory();
    else if (activeTab === "my_team") fetchMyTeam();
  }, [activeTab, fetchTree, fetchDirectory, fetchMyTeam]);

  // Member search for role elevation
  useEffect(() => {
    if (!memberSearchQuery.trim() || memberSearchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await api.getHierarchyDirectory({ search: memberSearchQuery });
        if (res) setSearchResults(res);
      } catch (e) {
        console.error(e);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  const openAppointModal = (presetRole, presetWard = "", presetStation = "") => {
    const defaultRole = presetRole && allowedRolesToAppoint.includes(presetRole)
      ? presetRole
      : allowedRolesToAppoint[0] || "station_mobilizer";

    setAssignForm({
      member_id: "",
      campaign_role: defaultRole,
      assigned_sub_county: currentUser?.assigned_sub_county || "Ol Kalou",
      assigned_ward: presetWard || currentUser?.assigned_ward || currentUser?.ward || "",
      assigned_polling_centre: presetStation || currentUser?.assigned_polling_centre || currentUser?.polling_station || "",
      pillar_category: "youth",
    });
    setSelectedMember(null);
    setMemberSearchQuery("");
    setShowAssignModal(true);
  };

  const handleAssignRole = async (e) => {
    e.preventDefault();
    if (!assignForm.member_id) {
      toast.error("Please search and select a member.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.assignCampaignRole(assignForm);
      if (res && res.status === "success") {
        toast.success(res.message || "Role assigned successfully!");
        setShowAssignModal(false);
        setSelectedMember(null);
        setMemberSearchQuery("");
        fetchStats();
        if (activeTab === "tree") fetchTree();
        if (activeTab === "directory") fetchDirectory();
        if (activeTab === "my_team") fetchMyTeam();
      }
    } catch (err) {
      toast.error(err?.error || err?.message || "Failed to assign role");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleWard = (w) => {
    setExpandedWards(p => ({ ...p, [w]: !p[w] }));
  };

  const toggleStation = (s) => {
    setExpandedStations(p => ({ ...p, [s]: !p[s] }));
  };

  const formatDial = (phone) => {
    if (!phone) return "#";
    let p = phone.replace(/[^0-9+]/g, '');
    if (p.startsWith('0')) p = '+254' + p.slice(1);
    return `tel:${p}`;
  };

  const formatWhatsApp = (phone, name = "") => {
    if (!phone) return "#";
    let p = phone.replace(/[^0-9]/g, '');
    if (p.startsWith('0')) p = '254' + p.slice(1);
    const msg = encodeURIComponent(`Hello ${name}, this is from DCP Campaign HQ regarding field operations.`);
    return `https://wa.me/${p}?text=${msg}`;
  };

  return (
    <div className="space-y-6 pb-16 text-slate-100 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 md:p-8 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Cascading Command Chain
              </span>
              <span className="text-xs text-slate-400 font-medium">
                Your Role: <span className="text-white font-bold">{ROLE_DISPLAY[userRole]?.label || userRole}</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              Campaign Hierarchy & Command
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Strict command chain: Governor ➔ County Manager ➔ Sub-County ➔ Ward ➔ Polling Centre ➔ [3 Pillars + 25 Mobilizers].
            </p>
          </div>

          {allowedRolesToAppoint.length > 0 && (
            <button
              onClick={() => openAppointModal()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              Appoint Subordinate
            </button>
          )}
        </div>

        {/* 7-Tier Stats Badges */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-6 pt-6 border-t border-white/10">
            {Object.entries(ROLE_DISPLAY).map(([k, r]) => {
              const count = stats.role_counts?.[k] || 0;
              const Icon = r.icon;
              return (
                <div key={k} className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/20 transition">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{r.tier}</span>
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="text-xl font-black text-white">{count}</div>
                  <div className="text-[10px] text-slate-400 font-medium truncate">{r.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto">
        {[
          { id: "tree", label: "🏛️ Hierarchy & Station Quotas", icon: Layers },
          { id: "directory", label: "📞 Top-Down Campaign Phonebook", icon: Phone },
          { id: "my_team", label: "👥 My Direct Team", icon: Users },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-xs uppercase tracking-wider transition whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                  : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: TREE & QUOTAS ─────────────────────────────────────────── */}
      {activeTab === "tree" && (
        <div className="space-y-6">
          {/* Top Leadership Strip */}
          {treeData?.leadership && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Governor */}
              <div className="bg-gradient-to-br from-amber-500/10 to-slate-900 p-5 rounded-3xl border border-amber-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 bg-amber-500/20 px-2.5 py-1 rounded-full">
                      Tier 1 • Supreme Command
                    </span>
                    <Crown className="w-5 h-5 text-amber-400" />
                  </div>
                  {treeData.leadership.governors?.length > 0 ? (
                    treeData.leadership.governors.map(g => (
                      <div key={g.id} className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-lg text-white">{g.full_name}</h3>
                          <p className="text-xs text-slate-400 font-mono">{g.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={formatDial(g.phone)} className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition" title="Call">
                            <Phone className="w-4 h-4" />
                          </a>
                          <a href={formatWhatsApp(g.phone, g.full_name)} target="_blank" rel="noreferrer" className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition" title="WhatsApp">
                            <MessageSquare className="w-4 h-4" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 italic">Governor Aspirant not set</p>
                      {isSuperAdmin && (
                        <button onClick={() => openAppointModal("governor")} className="text-xs text-amber-400 font-bold hover:underline">
                          + Appoint
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* County Manager */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-slate-900 p-5 rounded-3xl border border-emerald-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-2.5 py-1 rounded-full">
                      Tier 2 • County Operations
                    </span>
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  {treeData.leadership.county_managers?.length > 0 ? (
                    treeData.leadership.county_managers.map(cm => (
                      <div key={cm.id} className="flex items-center justify-between mb-2 last:mb-0">
                        <div>
                          <h3 className="font-black text-base text-white">{cm.full_name}</h3>
                          <p className="text-xs text-slate-400 font-mono">{cm.phone}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={formatDial(cm.phone)} className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition" title="Call">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a href={formatWhatsApp(cm.phone, cm.full_name)} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 transition" title="WhatsApp">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">County Manager not assigned</p>
                  )}
                </div>
              </div>

              {/* Sub-County Coordinators */}
              <div className="bg-gradient-to-br from-blue-500/10 to-slate-900 p-5 rounded-3xl border border-blue-500/30 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded-full">
                      Tier 3 • Sub-County Command
                    </span>
                    <Building className="w-5 h-5 text-blue-400" />
                  </div>
                  {treeData.leadership.sub_county_coordinators?.length > 0 ? (
                    treeData.leadership.sub_county_coordinators.map(sc => (
                      <div key={sc.id} className="flex items-center justify-between mb-2 last:mb-0">
                        <div>
                          <h3 className="font-bold text-sm text-white">{sc.full_name}</h3>
                          <p className="text-[11px] text-slate-400">{sc.assigned_sub_county || "Sub-County"} • {sc.phone}</p>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <a href={formatDial(sc.phone)} className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition" title="Call">
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                          <a href={formatWhatsApp(sc.phone, sc.full_name)} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 transition" title="WhatsApp">
                            <MessageSquare className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-400 italic">Sub-County Coordinators pending</p>
                      {isSuperAdmin && (
                        <button onClick={() => openAppointModal("sub_county_coordinator")} className="text-xs text-blue-400 font-bold hover:underline">
                          + Appoint
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Wards & Polling Station Drilldown */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-400" />
                Ward & Polling Station Command Structure
              </h2>
              <span className="text-xs text-slate-400">
                Target: 1 Coordinator + 3 Pillars + 25 Mobilizers per Centre
              </span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <span>Loading hierarchy structure...</span>
              </div>
            ) : (
              treeData?.wards?.map(w => {
                const isWardOpen = !!expandedWards[w.ward];
                const canAppointInWard = isSuperAdmin || (userRole === "ward_coordinator" && (currentUser?.assigned_ward?.toLowerCase() === w.ward?.toLowerCase() || currentUser?.ward?.toLowerCase() === w.ward?.toLowerCase()));

                return (
                  <div key={w.ward} className="bg-slate-900/80 rounded-3xl border border-white/10 overflow-hidden shadow-xl">
                    {/* Ward Header */}
                    <div 
                      onClick={() => toggleWard(w.ward)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <button className="p-2 rounded-xl bg-white/5 text-slate-300">
                          {isWardOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                              Tier 4 • Ward
                            </span>
                            <h3 className="text-lg font-black text-white">{w.ward} Ward</h3>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {w.total_stations} Polling Stations • Coordinator:{" "}
                            {w.coordinator ? (
                              <span className="text-emerald-400 font-bold">{w.coordinator.full_name} ({w.coordinator.phone})</span>
                            ) : (
                              <span className="text-rose-400 italic">Not Appointed</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {w.coordinator ? (
                          <>
                            <a href={formatDial(w.coordinator.phone)} className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition">
                              <Phone className="w-3.5 h-3.5" />
                              Call Coordinator
                            </a>
                            <a href={formatWhatsApp(w.coordinator.phone, w.coordinator.full_name)} target="_blank" rel="noreferrer" className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5 transition">
                              <MessageSquare className="w-3.5 h-3.5" />
                              WhatsApp
                            </a>
                          </>
                        ) : (
                          (isSuperAdmin || userRole === "sub_county_coordinator") && (
                            <button
                              onClick={() => openAppointModal("ward_coordinator", w.ward)}
                              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-bold flex items-center gap-1.5 transition"
                            >
                              + Appoint Ward Coordinator
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Polling Stations List */}
                    <AnimatePresence>
                      {isWardOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="px-5 pb-5 space-y-3 border-t border-white/5 pt-4 bg-slate-950/40"
                        >
                          {w.polling_stations?.map(st => {
                            const isStOpen = !!expandedStations[st.polling_station];
                            const canAppointInStation = isSuperAdmin || (userRole === "ward_coordinator" && canAppointInWard) || (userRole === "polling_centre_coordinator" && (currentUser?.assigned_polling_centre?.toLowerCase() === st.polling_station?.toLowerCase()));

                            return (
                              <div key={st.polling_station} className="bg-slate-900/90 rounded-2xl border border-white/10 p-4">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 cursor-pointer" onClick={() => toggleStation(st.polling_station)}>
                                    <button className="p-1.5 rounded-lg bg-white/5 text-slate-400">
                                      {isStOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                    </button>
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                                          Station
                                        </span>
                                        <h4 className="font-black text-sm text-white">{st.polling_station}</h4>
                                      </div>
                                      <p className="text-[11px] text-slate-400 mt-0.5">
                                        Coordinator: {st.coordinator ? st.coordinator.full_name : <span className="text-amber-400 italic">Unassigned</span>}
                                      </p>
                                    </div>
                                  </div>

                                  {/* Quotas */}
                                  <div className="flex items-center gap-3">
                                    <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                                      st.pillars_count >= 3
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                        : "bg-rose-500/20 text-rose-400 border-rose-500/40"
                                    }`}>
                                      <Award className="w-3.5 h-3.5" />
                                      Pillars: {st.pillars_count}/3
                                    </div>

                                    <div className={`px-3 py-1 rounded-xl text-xs font-bold border flex items-center gap-1.5 ${
                                      st.mobilizers_count >= 25
                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                                        : "bg-amber-500/20 text-amber-400 border-amber-500/40"
                                    }`}>
                                      <Users className="w-3.5 h-3.5" />
                                      Mobilizers: {st.mobilizers_count}/25
                                    </div>
                                  </div>
                                </div>

                                {/* Expanded Station Personnel Details */}
                                {isStOpen && (
                                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                                    {/* Centre Coordinator */}
                                    {st.coordinator ? (
                                      <div className="bg-purple-500/10 p-3 rounded-xl border border-purple-500/30 flex items-center justify-between">
                                        <div>
                                          <span className="text-[9px] font-black uppercase text-purple-400 tracking-widest">
                                            Tier 5 • Polling Centre Coordinator
                                          </span>
                                          <h5 className="font-bold text-white text-sm">{st.coordinator.full_name}</h5>
                                          <p className="text-xs text-slate-400">{st.coordinator.phone}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <a href={formatDial(st.coordinator.phone)} className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300">
                                            <Phone className="w-4 h-4" />
                                          </a>
                                          <a href={formatWhatsApp(st.coordinator.phone, st.coordinator.full_name)} target="_blank" rel="noreferrer" className="p-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300">
                                            <MessageSquare className="w-4 h-4" />
                                          </a>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="p-3 bg-white/5 rounded-xl border border-dashed border-white/10 text-xs text-slate-400 flex items-center justify-between">
                                        <span>No Polling Centre Coordinator appointed.</span>
                                        {canAppointInStation && (
                                          <button 
                                            onClick={() => openAppointModal("polling_centre_coordinator", w.ward, st.polling_station)}
                                            className="text-emerald-400 font-bold hover:underline"
                                          >
                                            + Appoint Coordinator
                                          </button>
                                        )}
                                      </div>
                                    )}

                                    {/* 3 Pillars Section */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                                          <Award className="w-3.5 h-3.5" />
                                          The 3 Station Pillars (Youth, Women, Elders) • [{st.pillars_count}/3]
                                        </h5>
                                        {canAppointInStation && st.pillars_count < 3 && (
                                          <button 
                                            onClick={() => openAppointModal("pillar", w.ward, st.polling_station)}
                                            className="text-[11px] text-rose-400 font-bold hover:underline"
                                          >
                                            + Add Pillar ({3 - st.pillars_count} slots remaining)
                                          </button>
                                        )}
                                      </div>

                                      {st.pillars?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          {st.pillars.map(p => (
                                            <div key={p.id} className="bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20 flex items-center justify-between">
                                              <div>
                                                <span className="text-[8px] font-black uppercase text-rose-400 tracking-wider">
                                                  {p.pillar_category?.replace('_', ' ') || 'Pillar'}
                                                </span>
                                                <p className="font-bold text-xs text-white truncate">{p.full_name}</p>
                                                <p className="text-[10px] text-slate-400">{p.phone}</p>
                                              </div>
                                              <div className="flex items-center gap-1">
                                                <a href={formatDial(p.phone)} className="p-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300">
                                                  <Phone className="w-3.5 h-3.5" />
                                                </a>
                                                <a href={formatWhatsApp(p.phone, p.full_name)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300">
                                                  <MessageSquare className="w-3.5 h-3.5" />
                                                </a>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-500 italic">No pillars appointed for this station yet.</p>
                                      )}
                                    </div>

                                    {/* 25 Mobilizers Section */}
                                    <div>
                                      <div className="flex items-center justify-between mb-2">
                                        <h5 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                                          <Users className="w-3.5 h-3.5 text-slate-400" />
                                          Frontline Mobilizers (Target: 25) • [{st.mobilizers_count}/25]
                                        </h5>
                                        {canAppointInStation && st.mobilizers_count < 25 && (
                                          <button 
                                            onClick={() => openAppointModal("station_mobilizer", w.ward, st.polling_station)}
                                            className="text-[11px] text-emerald-400 font-bold hover:underline"
                                          >
                                            + Assign Mobilizer ({25 - st.mobilizers_count} slots left)
                                          </button>
                                        )}
                                      </div>

                                      {st.mobilizers?.length > 0 ? (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-56 overflow-y-auto pr-1">
                                          {st.mobilizers.map(m => (
                                            <div key={m.id} className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center justify-between hover:border-white/20 transition">
                                              <div className="min-w-0">
                                                <p className="font-bold text-xs text-white truncate">{m.full_name}</p>
                                                <p className="text-[10px] text-slate-400">{m.phone} • {m.recruits_count || 0} recruits</p>
                                              </div>
                                              <div className="flex items-center gap-1 shrink-0">
                                                <a href={formatDial(m.phone)} className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300">
                                                  <Phone className="w-3 h-3" />
                                                </a>
                                                <a href={formatWhatsApp(m.phone, m.full_name)} target="_blank" rel="noreferrer" className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300">
                                                  <MessageSquare className="w-3 h-3" />
                                                </a>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      ) : (
                                        <p className="text-xs text-slate-500 italic">No mobilizers registered at this station yet.</p>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: DIRECTORY / PHONEBOOK ─────────────────────────────────── */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-slate-900/80 p-4 rounded-3xl border border-white/10 flex flex-col md:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search personnel by name, phone, or ID number..."
                value={dirSearch}
                onChange={e => setDirSearch(e.target.value)}
                className="w-full bg-slate-950 border border-white/10 rounded-2xl pl-11 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={dirRole}
                onChange={e => setDirRole(e.target.value)}
                className="bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All 7 Roles</option>
                {Object.entries(ROLE_DISPLAY).map(([k, r]) => (
                  <option key={k} value={k}>{r.tier}: {r.label}</option>
                ))}
              </select>

              <button
                onClick={fetchDirectory}
                className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition shrink-0"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Refresh
              </button>
            </div>
          </div>

          {/* Directory Personnel Cards */}
          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading campaign phonebook...</div>
          ) : directoryData.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-white/10 text-slate-400">
              No campaign personnel match your search filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {directoryData.map(person => {
                const roleInfo = ROLE_DISPLAY[person.campaign_role] || ROLE_DISPLAY.station_mobilizer;
                const Icon = roleInfo.icon;
                return (
                  <div key={person.id} className="bg-slate-900/90 rounded-2xl border border-white/10 p-4 hover:border-emerald-500/40 transition shadow-lg flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${roleInfo.bg}`}>
                          {roleInfo.tier} • {roleInfo.label}
                        </span>
                        <Icon className="w-4 h-4 text-slate-400" />
                      </div>

                      <h4 className="font-black text-white text-base leading-snug">{person.full_name}</h4>
                      <p className="text-xs text-emerald-400 font-mono font-bold mt-0.5">{person.phone}</p>
                      
                      <div className="text-[11px] text-slate-400 mt-2 space-y-0.5">
                        {person.assigned_ward && <div>📍 Ward: <span className="text-slate-300 font-semibold">{person.assigned_ward}</span></div>}
                        {person.assigned_polling_centre && <div>🏫 Station: <span className="text-slate-300 font-semibold">{person.assigned_polling_centre}</span></div>}
                        {person.pillar_category && person.pillar_category !== 'none' && (
                          <div>🎯 Category: <span className="text-rose-400 font-semibold uppercase">{person.pillar_category.replace('_', ' ')}</span></div>
                        )}
                        <div>👥 Direct Recruits: <span className="text-white font-bold">{person.recruits_count || 0}</span></div>
                      </div>
                    </div>

                    {/* 1-Click Call & WhatsApp Action Buttons */}
                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                      <a
                        href={formatDial(person.phone)}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl font-bold text-xs transition"
                      >
                        <Phone className="w-3.5 h-3.5" />
                        Call
                      </a>
                      <a
                        href={formatWhatsApp(person.phone, person.full_name)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-xl font-bold text-xs transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: MY DIRECT TEAM ────────────────────────────────────────── */}
      {activeTab === "my_team" && (
        <div className="space-y-4">
          <div className="bg-slate-900/80 p-6 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Direct Downline
                </span>
              </div>
              <h2 className="text-2xl font-black text-white">{myTeamData?.team_title || "My Team"}</h2>
              <p className="text-xs text-slate-400 mt-1">
                Total Subordinates Managed: <span className="text-emerald-400 font-bold">{myTeamData?.team_count || 0}</span>
              </p>
            </div>

            {allowedRolesToAppoint.length > 0 && (
              <button
                onClick={() => openAppointModal()}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shrink-0"
              >
                + Appoint Subordinate
              </button>
            )}
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400">Loading your team roster...</div>
          ) : !myTeamData?.members || myTeamData.members.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/60 rounded-3xl border border-white/10 text-slate-400">
              No direct subordinates assigned under you yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {myTeamData.members.map(member => (
                <div key={member.id} className="bg-slate-900/90 rounded-2xl border border-white/10 p-4 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        {ROLE_DISPLAY[member.campaign_role]?.label || member.campaign_role}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${member.is_active ? 'bg-emerald-400' : 'bg-rose-400'}`} />
                    </div>

                    <h4 className="font-bold text-white text-base">{member.full_name}</h4>
                    <p className="text-xs text-slate-400">{member.phone}</p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {member.assigned_polling_centre || member.assigned_ward || member.ward || "Laikipia"}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/5">
                    <a href={formatDial(member.phone)} className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> Call
                    </a>
                    <a href={formatWhatsApp(member.phone, member.full_name)} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── ROLE ASSIGNMENT MODAL ────────────────────────────────────────── */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">
                    Chain of Command Authority
                  </span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-400" />
                    Appoint / Assign Subordinate
                  </h3>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAssignRole} className="space-y-4">
                {/* Search & Select Member */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    1. Select Candidate Member
                  </label>
                  {selectedMember ? (
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-white text-sm">{selectedMember.full_name}</p>
                        <p className="text-xs text-slate-400">{selectedMember.phone} • {selectedMember.national_id}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setSelectedMember(null); setAssignForm(f => ({ ...f, member_id: "" })); }}
                        className="text-xs text-rose-400 font-bold hover:underline"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        placeholder="Search member by Name or Phone..."
                        value={memberSearchQuery}
                        onChange={e => setMemberSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      />
                      {searchResults.length > 0 && (
                        <div className="mt-2 bg-slate-950 border border-white/10 rounded-2xl max-h-40 overflow-y-auto divide-y divide-white/5">
                          {searchResults.map(sr => (
                            <div
                              key={sr.id}
                              onClick={() => {
                                setSelectedMember(sr);
                                setAssignForm(f => ({
                                  ...f,
                                  member_id: sr.id,
                                  assigned_ward: f.assigned_ward || sr.assigned_ward || sr.ward || "",
                                  assigned_polling_centre: f.assigned_polling_centre || sr.assigned_polling_centre || sr.polling_station || "",
                                }));
                                setSearchResults([]);
                              }}
                              className="p-2.5 hover:bg-slate-800 cursor-pointer flex items-center justify-between text-xs"
                            >
                              <span className="font-bold text-white">{sr.full_name}</span>
                              <span className="text-slate-400">{sr.phone}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Target Role (Filtered strictly by who is logged in) */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    2. Role to Appoint (Allowed for your Tier)
                  </label>
                  <select
                    value={assignForm.campaign_role}
                    onChange={e => setAssignForm(f => ({ ...f, campaign_role: e.target.value }))}
                    className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    {allowedRolesToAppoint.map(k => {
                      const r = ROLE_DISPLAY[k];
                      if (!r) return null;
                      return <option key={k} value={k}>{r.tier}: {r.label}</option>;
                    })}
                  </select>
                </div>

                {/* Pillar Category (If Pillar selected) */}
                {assignForm.campaign_role === "pillar" && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-rose-400 mb-1.5">
                      Pillar Category (Max 3/Centre)
                    </label>
                    <select
                      value={assignForm.pillar_category}
                      onChange={e => setAssignForm(f => ({ ...f, pillar_category: e.target.value }))}
                      className="w-full bg-slate-950 border border-rose-500/30 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                    >
                      {PILLAR_CATEGORIES.map(c => (
                        <option key={c.id} value={c.id}>{c.label}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Geographic Assignments with Smart Locking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Assigned Ward
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Mirangine, Karau"
                      value={assignForm.assigned_ward}
                      readOnly={!isSuperAdmin && userRole === "ward_coordinator"}
                      onChange={e => setAssignForm(f => ({ ...f, assigned_ward: e.target.value }))}
                      className={`w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 ${
                        !isSuperAdmin && userRole === "ward_coordinator" ? "opacity-75 cursor-not-allowed bg-slate-900 text-emerald-400 font-bold" : ""
                      }`}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Assigned Polling Centre
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Githima Primary School"
                      value={assignForm.assigned_polling_centre}
                      readOnly={!isSuperAdmin && userRole === "polling_centre_coordinator"}
                      onChange={e => setAssignForm(f => ({ ...f, assigned_polling_centre: e.target.value }))}
                      className={`w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 ${
                        !isSuperAdmin && userRole === "polling_centre_coordinator" ? "opacity-75 cursor-not-allowed bg-slate-900 text-emerald-400 font-bold" : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end gap-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAssignModal(false)}
                    className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 text-xs font-bold uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !assignForm.member_id}
                    className="px-6 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-emerald-500/20"
                  >
                    {isSubmitting ? "Assigning..." : "Confirm Appointment"}
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
