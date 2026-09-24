import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  Users, Shield, Phone, MessageSquare, Plus, Search, Filter, 
  MapPin, CheckCircle2, AlertTriangle, ChevronRight, ChevronDown, 
  Crown, Award, UserCheck, Star, Activity, Sparkles, Building, School, 
  UserPlus, RefreshCw, Layers, ArrowRight, ShieldCheck, Check, Lock, Globe
, Download } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { exportToCSV, formatKenyanPhone } from "../lib/exportUtils";
import { toast } from "sonner";
import VoterLookup from "../components/VoterLookup";
import RegistrationForm from "../components/RegistrationForm";
import { useLocationData } from "../contexts/LocationContext";
import { useLanguage } from "../contexts/LanguageContext";

import { CONSTITUENCIES, ALL_LAIKIPIA_WARDS, ROLE_DISPLAY, PILLAR_CATEGORIES, MOBILIZER_SQUADS, cleanCentreName } from "../lib/constants";

export default function CampaignHierarchy({ currentUser }) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState("tree"); // tree, directory, my_team
  const [stats, setStats] = useState(null);
  const [treeData, setTreeData] = useState(null);
  const [directoryData, setDirectoryData] = useState([]);
  const [myTeamData, setMyTeamData] = useState(null);
  const [loading, setLoading] = useState(true);

  // User Authority Context - strict SuperAdmin check
  const isSuperAdmin = Boolean(
    currentUser?.is_admin || 
    currentUser?.is_staff || 
    currentUser?.is_superuser || 
    currentUser?.campaign_role === "governor" || 
    currentUser?.campaign_role === "county_manager"
  );

  const userRole = isSuperAdmin
    ? (currentUser?.campaign_role === "governor" ? "governor" : "county_manager")
    : (currentUser?.campaign_role || "station_mobilizer");

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

  // Jurisdiction & Filters
  const userSc = currentUser?.assigned_sub_county || "";
  const userWard = currentUser?.assigned_ward || currentUser?.ward || "";
  const userStation = currentUser?.assigned_polling_centre || currentUser?.polling_station || "";

  // SuperAdmin Constituency Switcher State (defaults to all)
  const [selectedConstituency, setSelectedConstituency] = useState(
    !isSuperAdmin && userRole === "sub_county_coordinator" ? (userSc || "Laikipia West") : ""
  );

  // Available Constituency Wards based on selected constituency or coordinator jurisdiction
  const constituencyWards = useMemo(() => {
    if (isSuperAdmin) {
      if (selectedConstituency && CONSTITUENCIES[selectedConstituency]) {
        return CONSTITUENCIES[selectedConstituency];
      }
      return ALL_LAIKIPIA_WARDS;
    }
    if (userRole === "sub_county_coordinator") {
      const sc = userSc.trim().toLowerCase();
      for (const [k, v] of Object.entries(CONSTITUENCIES)) {
        if (k.toLowerCase().includes(sc) || sc.includes(k.toLowerCase())) return v;
      }
      return CONSTITUENCIES["Laikipia West"];
    }
    if (userRole === "ward_coordinator" && userWard) {
      return [userWard];
    }
    return [];
  }, [isSuperAdmin, selectedConstituency, userRole, userSc, userWard]);

  // Selected ward & station filters
  const [selectedWard, setSelectedWard] = useState(
    isSuperAdmin || userRole === "sub_county_coordinator" ? "" : (userWard || "")
  );
  const [selectedStation, setSelectedStation] = useState(
    userRole === "polling_centre_coordinator" ? userStation : ""
  );

  const { wardStationMap = {} } = useLocationData();

  // Polling stations available for the currently selected or locked ward
  const availableStations = useMemo(() => {
    const activeWardName = selectedWard || (userRole === "ward_coordinator" ? userWard : "");
    if (!activeWardName) return [];
    
    // Lookup with case-insensitive matching
    const matchKey = Object.keys(wardStationMap).find(
      k => k.toLowerCase() === activeWardName.toLowerCase()
    );
    return matchKey ? wardStationMap[matchKey] : [];
  }, [selectedWard, userRole, userWard, wardStationMap]);

  const [dirSearch, setDirSearch] = useState("");
  const [dirRole, setDirRole] = useState("");
  const [expandedWards, setExpandedWards] = useState({});
  const [expandedStations, setExpandedStations] = useState({});

  // Role Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    member_id: "",
    campaign_role: "station_mobilizer",
    assigned_sub_county: currentUser?.assigned_sub_county || "Laikipia West",
    assigned_ward: currentUser?.assigned_ward || currentUser?.ward || "",
    assigned_polling_centre: currentUser?.assigned_polling_centre || currentUser?.polling_station || "",
    pillar_category: "youth",
  });
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedMember, setSelectedMember] = useState(null);
  const [assignModalMode, setAssignModalMode] = useState("new_voter");
  const [assignModalStep, setAssignModalStep] = useState("lookup");
  const [assignModalPrefill, setAssignModalPrefill] = useState(null);
  const [assignModalVoter, setAssignModalVoter] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const queryParams = {};
      if (selectedConstituency) queryParams.sub_county = selectedConstituency;
      if (selectedWard) queryParams.ward = selectedWard;
      if (selectedStation) queryParams.station = selectedStation;
      const res = await api.getHierarchyStats(queryParams);
      const data = res?.data || res;
      if (data) setStats(data);
    } catch (e) {
      console.error("Failed to load hierarchy stats", e);
    }
  }, [selectedConstituency, selectedWard, selectedStation]);

  const fetchTree = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = {};
      if (selectedConstituency) queryParams.sub_county = selectedConstituency;
      if (selectedWard) queryParams.ward = selectedWard;
      if (selectedStation) queryParams.station = selectedStation;
      const res = await api.getHierarchyTree(queryParams);
      const data = res?.data || res;
      if (data) {
        setTreeData(data);
        if (data.wards && data.wards.length > 0) {
          const defaultWard = userWard && data.wards.find(w => w.ward?.toLowerCase() === userWard?.toLowerCase()) 
            ? userWard 
            : data.wards[0].ward;
          setExpandedWards(prev => ({ ...prev, [defaultWard]: true }));
          if (userStation) {
            setExpandedStations(prev => ({ ...prev, [userStation]: true }));
          }
        }
      }
    } catch (e) {
      toast.error("Failed to load hierarchy structure");
    } finally {
      setLoading(false);
    }
  }, [selectedConstituency, selectedWard, selectedStation, userWard, userStation]);

  const fetchDirectory = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = { role: dirRole, search: dirSearch };
      if (selectedConstituency) queryParams.sub_county = selectedConstituency;
      if (selectedWard) queryParams.ward = selectedWard;
      if (selectedStation) queryParams.station = selectedStation;
      const res = await api.getHierarchyDirectory(queryParams);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []);
      setDirectoryData(data);
    } catch (e) {
      toast.error("Failed to load campaign directory");
      setDirectoryData([]);
    } finally {
      setLoading(false);
    }
  }, [dirRole, selectedConstituency, selectedWard, selectedStation, dirSearch]);

  const fetchMyTeam = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getMyTeam();
      const data = res?.data || res;
      if (data) setMyTeamData(data);
    } catch (e) {
      toast.error("Failed to load team management");
    } finally {
      setLoading(false);
    }
  }, []);


  // ─── EXPORT CAPABILITIES (FILTER-AWARE & FORMATTED PHONE NUMBERS) ─────────
  const getConstituencyForWard = (wardName) => {
    if (!wardName) return "";
    for (const [sc, wards] of Object.entries(CONSTITUENCIES)) {
      if (wards.some(w => w.toLowerCase() === wardName.toLowerCase())) return sc;
    }
    return "";
  };

  const handleDownloadHierarchy = () => {
    if (!isSuperAdmin) {
      toast.error("Access restricted: Only Admin / County Operations Command can download hierarchy data.");
      return;
    }
    try {
      if (!displayWards || displayWards.length === 0) {
        toast.error("No hierarchy records match the active filters.");
        return;
      }

      const rows = [];
      displayWards.forEach((w) => {
        const wardName = w.ward || "";
        const scName = selectedConstituency || getConstituencyForWard(wardName) || "Laikipia County";
        const wardCoordName = w.coordinator?.full_name || "Unassigned";
        const wardCoordPhone = formatKenyanPhone(w.coordinator?.phone);

        if (w.polling_stations && w.polling_stations.length > 0) {
          w.polling_stations.forEach((st) => {
            const stCoordName = st.coordinator?.full_name || "Unassigned";
            const stCoordPhone = formatKenyanPhone(st.coordinator?.phone);
            const pCount = st.pillars_count ?? (st.pillars?.length || 0);
            const pTarget = st.pillars_target || 3;
            const pillarsList = (st.pillars || []).map(p => `${p.full_name} (${p.pillar_category || 'Pillar'}: ${formatKenyanPhone(p.phone)})`).join("; ") || "None";
            const mCount = st.mobilizers_count ?? (st.mobilizers?.length || 0);
            const mTarget = st.mobilizers_target || 25;
            const mobilizersList = (st.mobilizers || []).map(m => `${m.full_name} (${formatKenyanPhone(m.phone)})`).join("; ") || "None";
            const totalAssigned = (st.coordinator ? 1 : 0) + pCount + mCount;
            const quotaStatus = (pCount >= 3 && mCount >= 25 && st.coordinator) 
              ? "Fully Staffed (100%)" 
              : `${Math.round((totalAssigned / 29) * 100)}% Staffed`;

            rows.push({
              "Constituency / Sub-County": scName,
              "Ward": wardName,
              "Polling Centre": cleanCentreName(st.name || st.polling_station),
              "Ward Coordinator": wardCoordName,
              "Ward Coord Phone": wardCoordPhone,
              "Station Coordinator": stCoordName,
              "Station Coord Phone": stCoordPhone,
              "Pillars Ratio": `${pCount} / ${pTarget}`,
              "Pillars Appointed (Name, Category, Phone)": pillarsList,
              "Mobilizers Ratio": `${mCount} / ${mTarget}`,
              "Mobilizers Appointed (Name & Phone)": mobilizersList,
              "Total Station Personnel": totalAssigned,
              "Station Quota Status": quotaStatus
            });
          });
        } else {
          rows.push({
            "Constituency / Sub-County": scName,
            "Ward": wardName,
            "Polling Centre": "No Stations Designated",
            "Ward Coordinator": wardCoordName,
            "Ward Coord Phone": wardCoordPhone,
            "Station Coordinator": "Unassigned",
            "Station Coord Phone": "",
            "Pillars Ratio": "0 / 3",
            "Pillars Appointed (Name, Category, Phone)": "None",
            "Mobilizers Ratio": "0 / 25",
            "Mobilizers Appointed (Name & Phone)": "None",
            "Total Station Personnel": w.coordinator ? 1 : 0,
            "Station Quota Status": "Incomplete"
          });
        }
      });

      const parts = ["Hierarchy_Structure"];
      if (selectedConstituency) parts.push(selectedConstituency.replace(/\s+/g, '_'));
      if (selectedWard) parts.push(selectedWard.replace(/\s+/g, '_'));
      if (selectedStation) parts.push(cleanCentreName(selectedStation).replace(/\s+/g, '_'));
      parts.push(new Date().toISOString().slice(0, 10));

      exportToCSV(rows, `Laikipia_${parts.join('_')}`);
      toast.success(`Successfully exported ${rows.length} hierarchy records to CSV!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export hierarchy structure.");
    }
  };

  const handleDownloadDirectory = async () => {
    if (!isSuperAdmin) {
      toast.error("Access restricted: Only Admin / County Operations Command can download command directory.");
      return;
    }
    try {
      toast.info("Exporting filtered command directory...");
      const queryParams = { role: dirRole, search: dirSearch, export: "true" };
      if (selectedConstituency) queryParams.sub_county = selectedConstituency;
      if (selectedWard) queryParams.ward = selectedWard;
      if (selectedStation) queryParams.station = selectedStation;
      
      const res = await api.getHierarchyDirectory(queryParams);
      const data = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : safeDirectory);
      
      if (!data || data.length === 0) {
        toast.error("No directory records found matching active filters.");
        return;
      }

      const rows = data.map((m) => {
        const roleMeta = ROLE_DISPLAY[m.campaign_role] || {};
        const wardName = m.assigned_ward || m.ward || "";
        const scName = m.assigned_sub_county || getConstituencyForWard(wardName) || "";
        return {
          "Full Name": m.full_name || "",
          "Phone Number": formatKenyanPhone(m.phone),
          "National ID": m.national_id ? `ID: ${m.national_id}` : "",
          "Hierarchy Tier": roleMeta.tier || "Tier 7",
          "Campaign Role": roleMeta.label || m.campaign_role || "",
          "Pillar Category": m.pillar_category || "",
          "Assigned Constituency": scName,
          "Assigned Ward": wardName,
          "Assigned Polling Centre": cleanCentreName(m.assigned_polling_centre || m.polling_station || ""),
          "Supervisor / Leader": m.supervisor_name || "",
          "Direct Recruits Count": m.recruits_count || 0,
          "Status": m.is_active ? "Active" : "Inactive",
          "Appointment Date": m.created_at ? new Date(m.created_at).toLocaleDateString() : ""
        };
      });

      const parts = ["Command_Directory"];
      if (selectedConstituency) parts.push(selectedConstituency.replace(/\s+/g, '_'));
      if (selectedWard) parts.push(selectedWard.replace(/\s+/g, '_'));
      if (dirRole) parts.push(dirRole.replace(/\s+/g, '_'));
      parts.push(new Date().toISOString().slice(0, 10));

      exportToCSV(rows, `Laikipia_${parts.join('_')}`);
      toast.success(`Exported ${rows.length} directory leaders to CSV!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export command directory.");
    }
  };

  const handleDownloadMyTeam = () => {
    if (!isSuperAdmin) {
      toast.error("Access restricted: Only Admin / County Operations Command can export team data.");
      return;
    }
    try {
      const subs = myTeamData?.subordinates || [];
      if (subs.length === 0) {
        toast.error("No team members in your direct command line to export.");
        return;
      }

      const rows = subs.map((m) => {
        const roleMeta = ROLE_DISPLAY[m.campaign_role] || {};
        const wardName = m.assigned_ward || m.ward || "";
        return {
          "Full Name": m.full_name || "",
          "Phone Number": formatKenyanPhone(m.phone),
          "National ID": m.national_id ? `ID: ${m.national_id}` : "",
          "Hierarchy Tier": roleMeta.tier || "Subordinate",
          "Role": roleMeta.label || m.campaign_role || "",
          "Pillar Category": m.pillar_category || "",
          "Constituency": m.assigned_sub_county || getConstituencyForWard(wardName) || "",
          "Ward": wardName,
          "Polling Centre": cleanCentreName(m.assigned_polling_centre || m.polling_station || ""),
          "Direct Recruits": m.recruits_count || 0,
          "Status": m.is_active ? "Active" : "Inactive"
        };
      });

      const dateStr = new Date().toISOString().slice(0, 10);
      exportToCSV(rows, `My_Direct_Command_Team_${dateStr}`);
      toast.success(`Exported ${rows.length} team members to CSV!`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to export direct team.");
    }
  };

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
        const res = await api.getMembers({ search: memberSearchQuery.trim() });
        const list = Array.isArray(res?.data?.results) 
          ? res.data.results 
          : (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        setSearchResults(list.slice(0, 8));
      } catch (e) {
        console.error(e);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [memberSearchQuery]);

  const openAppointModal = (presetRole, presetWard = "", presetStation = "") => {
    const defaultRole = presetRole && allowedRolesToAppoint.includes(presetRole)
      ? presetRole
      : allowedRolesToAppoint[0] || "station_mobilizer";

    setAssignForm({
      member_id: "",
      campaign_role: defaultRole,
      assigned_sub_county: currentUser?.assigned_sub_county || (selectedConstituency || "Laikipia West"),
      assigned_ward: presetWard || currentUser?.assigned_ward || currentUser?.ward || (constituencyWards[0] || ""),
      assigned_polling_centre: presetStation || currentUser?.assigned_polling_centre || currentUser?.polling_station || "",
      pillar_category: "youth",
    });
    setSelectedMember(null);
    setMemberSearchQuery("");
    setAssignModalMode("new_voter");
    setAssignModalStep("lookup");
    setAssignModalPrefill(null);
    setAssignModalVoter(null);
    setShowAssignModal(true);
  };

  const handleAssignRole = async (e) => {
    if (e) e.preventDefault();
    if (!assignForm.member_id) {
      toast.error("Please select a voter or member to appoint.");
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.assignCampaignRole(assignForm);
      if (res?.error) {
        toast.error(res.error || "Failed to assign role");
        return;
      }
      const data = res?.data || res;
      if (data && (data.status === "success" || data.message || data.member)) {
        toast.success(data.message || "Role assigned successfully!");
        setShowAssignModal(false);
        setSelectedMember(null);
        setMemberSearchQuery("");
        fetchStats();
        if (activeTab === "tree") fetchTree();
        if (activeTab === "directory") fetchDirectory();
        if (activeTab === "my_team") fetchMyTeam();
      } else {
        toast.error("Failed to assign role.");
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

  // Safe data accessors & Cascading Scoped Filters across all tabs
  const rawDirectory = Array.isArray(directoryData) ? directoryData : [];
  const safeWards = Array.isArray(treeData?.wards) ? treeData.wards : [];
  const rawTeamMembers = Array.isArray(myTeamData?.members) ? myTeamData.members : [];

  const safeDirectory = useMemo(() => {
    let list = rawDirectory;
    if (selectedConstituency) {
      const allowedWards = (CONSTITUENCIES[selectedConstituency] || []).map(w => w.toLowerCase());
      list = list.filter(m => {
        const sc = (m.assigned_sub_county || "").toLowerCase();
        const mw = (m.assigned_ward || m.official_ward || m.ward || "").toLowerCase();
        return sc.includes(selectedConstituency.toLowerCase()) || allowedWards.includes(mw);
      });
    }
    const activeWard = selectedWard || (userRole === "ward_coordinator" ? userWard : "");
    if (activeWard) {
      const normW = activeWard.toLowerCase();
      list = list.filter(m => (m.assigned_ward || m.official_ward || m.ward || "").toLowerCase().includes(normW));
    }
    const activeStation = selectedStation || (userRole === "polling_centre_coordinator" ? userStation : "");
    if (activeStation) {
      const normSt = activeStation.toLowerCase();
      list = list.filter(m => (m.assigned_polling_centre || m.official_polling_station || m.polling_station || "").toLowerCase().includes(normSt));
    }
    return list;
  }, [rawDirectory, selectedConstituency, selectedWard, selectedStation, userRole, userWard, userStation]);

  const safeTeamMembers = useMemo(() => {
    let list = rawTeamMembers;
    const activeWard = selectedWard || (userRole === "ward_coordinator" ? userWard : "");
    if (activeWard) {
      const normW = activeWard.toLowerCase();
      list = list.filter(m => (m.assigned_ward || m.official_ward || m.ward || "").toLowerCase().includes(normW));
    }
    const activeStation = selectedStation || (userRole === "polling_centre_coordinator" ? userStation : "");
    if (activeStation) {
      const normSt = activeStation.toLowerCase();
      list = list.filter(m => (m.assigned_polling_centre || m.official_polling_station || m.polling_station || "").toLowerCase().includes(normSt));
    }
    return list;
  }, [rawTeamMembers, selectedWard, selectedStation, userRole, userWard, userStation]);

  // Filtered wards in tree based on cascading hierarchy authority & active filters
  const displayWards = useMemo(() => {
    if (!safeWards.length) return [];
    let list = safeWards;

    // 1. Constituency constraint
    if (selectedConstituency) {
      const allowed = (CONSTITUENCIES[selectedConstituency] || []).map(a => a.toLowerCase().replace(/mukogodo/g, "mugogodo"));
      list = list.filter(w => {
        const normW = (w.ward || "").toLowerCase().replace(/mukogodo/g, "mugogodo");
        return allowed.includes(normW);
      });
    } else if (userRole === "sub_county_coordinator" && userSc) {
      const allowed = (CONSTITUENCIES[userSc] || []).map(a => a.toLowerCase().replace(/mukogodo/g, "mugogodo"));
      list = list.filter(w => {
        const normW = (w.ward || "").toLowerCase().replace(/mukogodo/g, "mugogodo");
        return allowed.includes(normW);
      });
    }

    // 2. Ward constraint
    const activeWard = selectedWard || (userRole === "ward_coordinator" ? userWard : "");
    if (activeWard) {
      const normSel = activeWard.toLowerCase().replace(/mukogodo/g, "mugogodo");
      list = list.filter(w => (w.ward || "").toLowerCase().replace(/mukogodo/g, "mugogodo") === normSel);
    }

    // 3. Station constraint (if a single station is chosen or locked)
    const activeStation = selectedStation || (userRole === "polling_centre_coordinator" ? userStation : "");
    if (activeStation) {
      const normSt = cleanCentreName(activeStation).toLowerCase().trim();
      list = list.map(w => ({
        ...w,
        polling_stations: (w.polling_stations || []).filter(
          st => cleanCentreName(st.polling_station || st.name).toLowerCase().trim() === normSt
        )
      })).filter(w => (w.polling_stations || []).length > 0);
    }

    return list;
  }, [safeWards, selectedWard, selectedConstituency, selectedStation, isSuperAdmin, userRole, userSc, userWard, userStation]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-950 p-6 md:p-8 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Cascading Command Chain
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Your Role: <span className="text-white font-bold">{isSuperAdmin ? "County Operations Command (Admin)" : (ROLE_DISPLAY[userRole]?.label || userRole)}</span>
                {!isSuperAdmin && userRole === "sub_county_coordinator" && (
                  <span className="ml-2 text-blue-400 font-bold">({userSc || "Laikipia West Constituency"})</span>
                )}
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white flex items-center gap-3">
              <Shield className="w-8 h-8 text-emerald-400" />
              {t("campaign_hierarchy_title")}
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              {t("campaign_hierarchy_subtitle")}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Download Export Buttons strictly for Admin / County Operations */}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  if (activeTab === "tree") handleDownloadHierarchy();
                  else if (activeTab === "directory") handleDownloadDirectory();
                  else if (activeTab === "my_team") handleDownloadMyTeam();
                }}
                className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs uppercase tracking-wider transition border border-white/20 active:scale-95 shrink-0 shadow-sm"
                title="Download current view data as CSV spreadsheet"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>
                  {activeTab === "tree" && "Download Hierarchy CSV"}
                  {activeTab === "directory" && "Download Directory CSV"}
                  {activeTab === "my_team" && "Download Team CSV"}
                </span>
              </button>
            )}

            {allowedRolesToAppoint.length > 0 && (
            <button
              onClick={() => openAppointModal()}
              className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-wider transition shadow-lg shadow-emerald-500/20 active:scale-95 shrink-0"
            >
              <UserPlus className="w-4 h-4" />
              {t("appoint_subordinate")}
            </button>
          )}
          </div>
        </div>

        {/* 7-Tier Stats Badges */}
        {stats && (
          <div className="space-y-3 mt-6 pt-6 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span className="text-xs font-bold text-slate-300">
                Scope Breakdown: <span className="text-emerald-400 font-black uppercase tracking-wider">{stats.scope_description || "All County"}</span>
              </span>
              {stats.targets?.total_centres > 0 && (
                <span className="text-[11px] text-slate-400 font-medium">
                  {stats.targets.total_centres} Polling Centres In Scope
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              {Object.entries(ROLE_DISPLAY).map(([k, r]) => {
                const count = stats.role_counts?.[k] || 0;
                const Icon = r.icon;
                let targetText = null;
                if (k === 'pillar' && stats.targets?.pillars_target) {
                  targetText = `Target: ${stats.targets.pillars_target}`;
                } else if (k === 'station_mobilizer') {
                  const mCount = count;
                  const bronzeFilled = Math.min(5, mCount);
                  targetText = `🥉 Bronze: ${bronzeFilled}/5 (25 in 5×5)`;
                }

                return (
                  <div key={k} className="bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-white/20 transition flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">{r.tier}</span>
                        <Icon className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <div className="text-xl font-black text-white">{count}</div>
                    </div>
                    <div className="mt-1">
                      <div className="text-[10px] text-slate-400 font-medium truncate">{r.label}</div>
                      {targetText && (
                        <div className="text-[9px] text-emerald-400 font-bold">{targetText}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── CASCADING JURISDICTION MANDATE & ACTIVE FILTERS (APPLIES TO ALL 3 TABS) ─── */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-3xl p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-200/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                {isSuperAdmin
                  ? "County-Wide Command Mandate"
                  : userRole === "sub_county_coordinator"
                  ? `${userSc || "Laikipia West"} Sub-County Jurisdiction`
                  : userRole === "ward_coordinator"
                  ? `${userWard} Ward Jurisdiction`
                  : `${userStation || userWard || "Station"} Polling Centre Mandate`}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {isSuperAdmin
                  ? "Filter hierarchy tree, directory phonebook, and squad rosters across all 3 constituencies and 15 wards."
                  : userRole === "sub_county_coordinator"
                  ? `Viewing all ${constituencyWards.length} wards and polling centres under your sub-county command.`
                  : userRole === "ward_coordinator"
                  ? `Viewing all polling centres and team units inside ${userWard} Ward.`
                  : "Locked to your designated polling station headquarters."}
              </p>
            </div>
          </div>

          {(selectedConstituency || selectedWard || selectedStation) && (
            <button
              type="button"
              onClick={() => {
                if (isSuperAdmin) setSelectedConstituency("");
                if (isSuperAdmin || userRole === "sub_county_coordinator") setSelectedWard("");
                setSelectedStation("");
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 text-xs font-bold transition flex items-center gap-1.5 shrink-0"
            >
              <span>{t("clear_filter")}</span>
            </button>
          )}
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 1. Constituency Control */}
          {isSuperAdmin ? (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{t("constituency_mandate")}</span>
              </label>
              <div className="relative">
                <select
                  value={selectedConstituency}
                  onChange={(e) => {
                    setSelectedConstituency(e.target.value);
                    setSelectedWard("");
                    setSelectedStation("");
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-emerald-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none transition shadow-sm cursor-pointer pr-9"
                >
                  <option value="">{t("all_county")}</option>
                  {Object.keys(CONSTITUENCIES).map(scName => (
                    <option key={scName} value={scName}>
                      {scName} ({CONSTITUENCIES[scName].length} Wards)
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{t("assigned_constituency")}</span>
              </label>
              <div className="px-3.5 py-2.5 bg-blue-50 border border-blue-200 text-blue-950 rounded-xl text-xs font-bold flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <span className="truncate">{userSc || "Laikipia West"} Sub-County</span>
              </div>
            </div>
          )}

          {/* 2. Ward Control (Available to Admin and Sub-County Coordinators; Fixed for Ward/Station) */}
          {isSuperAdmin || userRole === "sub_county_coordinator" ? (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                <Filter className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>
                  {selectedConstituency
                    ? `${selectedConstituency} ${t("all_wards")}:`
                    : userRole === "sub_county_coordinator"
                    ? `${userSc || "Sub-County"} Wards:`
                    : t("filter_ward")}
                </span>
              </label>
              <div className="relative">
                <select
                  value={selectedWard}
                  onChange={(e) => {
                    setSelectedWard(e.target.value);
                    setSelectedStation("");
                  }}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-cyan-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none transition shadow-sm cursor-pointer pr-9"
                >
                  <option value="">
                    {selectedConstituency
                      ? `All ${selectedConstituency} Wards (${constituencyWards.length})`
                      : userRole === "sub_county_coordinator"
                      ? `All ${userSc || "Sub-County"} Wards (${constituencyWards.length})`
                      : `All Wards (${constituencyWards.length})`}
                  </option>
                  {constituencyWards.map(wName => (
                    <option key={wName} value={wName}>
                      {wName} Ward
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                <Filter className="w-3.5 h-3.5 text-cyan-600 shrink-0" />
                <span>Assigned Ward</span>
              </label>
              <div className="px-3.5 py-2.5 bg-cyan-50 border border-cyan-200 text-cyan-950 rounded-xl text-xs font-bold flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                <span className="truncate">{userWard || "Ward Division"}</span>
              </div>
            </div>
          )}

          {/* 3. Polling Centre Control (Available if a ward is active, or for Ward Coordinator) */}
          {userRole === "polling_centre_coordinator" || userRole === "pillar" || userRole === "station_mobilizer" ? (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Designated Station HQ</span>
              </label>
              <div className="px-3.5 py-2.5 bg-purple-50 border border-purple-200 text-purple-950 rounded-xl text-xs font-bold flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <span className="truncate">{userStation || "Station HQ"}</span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-700">
                <Building className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>Polling Centre Scope:</span>
              </label>
              <div className="relative">
                <select
                  value={selectedStation}
                  onChange={(e) => setSelectedStation(e.target.value)}
                  disabled={!selectedWard && userRole !== "ward_coordinator"}
                  className="w-full appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 focus:border-purple-500 focus:bg-white rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 focus:outline-none transition shadow-sm cursor-pointer pr-9 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {!selectedWard && userRole !== "ward_coordinator"
                      ? "— Select a Ward first —"
                      : `All Polling Centres (${availableStations.length})`}
                  </option>
                  {availableStations.map(stName => (
                    <option key={stName} value={stName}>
                      {stName}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {[
          { id: "tree", labelKey: "hierarchy_structure", defaultLabel: "🏛️ Hierarchy & Station Quotas", icon: Layers },
          { id: "directory", labelKey: "command_directory", defaultLabel: "📞 Top-Down Campaign Phonebook", icon: Phone },
          { id: "my_team", labelKey: "my_command_line", defaultLabel: "👥 My Direct Team", icon: Users },
        ].map(tabItem => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.id}
              onClick={() => setActiveTab(tabItem.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition whitespace-nowrap ${
                activeTab === tabItem.id
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                  : "bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100 shadow-sm"
              }`}
            >
              <Icon className="w-4 h-4 text-emerald-500" />
              {t(tabItem.labelKey) || tabItem.defaultLabel}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: TREE & QUOTAS ─────────────────────────────────────────── */}
      {activeTab === "tree" && (
        <div className="space-y-6">

          {/* Wards & Polling Station Drilldown Header */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                  <MapPin className="w-5 h-5" />
                </div>
                {t("ward_polling_command")}
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={handleDownloadHierarchy}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Download Structure CSV</span>
                  </button>
                )}
                <span className="text-xs text-slate-600 font-bold bg-slate-200/80 px-3.5 py-1.5 rounded-full w-fit">
                  {t("target_ratio_desc")}
                </span>
              </div>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold">Loading hierarchy structure...</span>
              </div>
            ) : displayWards.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-sm text-slate-500 font-medium">
                No ward data available for the selected view.
              </div>
            ) : (
              displayWards.map(w => {
                const isWardOpen = !!expandedWards[w.ward];
                const canAppointInWard = isSuperAdmin || 
                  userRole === "sub_county_coordinator" || 
                  (userRole === "ward_coordinator" && (currentUser?.assigned_ward?.toLowerCase() === w.ward?.toLowerCase() || currentUser?.ward?.toLowerCase() === w.ward?.toLowerCase()));

                return (
                  <div key={w.ward} className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xl text-white">
                    {/* Ward Header */}
                    <div 
                      onClick={() => toggleWard(w.ward)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/60 transition"
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
                            {w.total_stations} Polling Centres • Coordinator:{" "}
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
                              {t("call_coordinator")}
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
                              {t("appoint_ward_coord")}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    {/* Polling Stations List */}
                    {isWardOpen && (
                      <div className="p-5 border-t border-white/5 space-y-4 bg-slate-950/50">
                        {w.polling_stations?.map(st => {
                          const isStationOpen = !!expandedStations[st.polling_station];
                          const canAppointInStation = canAppointInWard || (userRole === "polling_centre_coordinator" && (currentUser?.assigned_polling_centre?.toLowerCase() === st.polling_station?.toLowerCase() || currentUser?.polling_station?.toLowerCase() === st.polling_station?.toLowerCase()));

                          return (
                            <div key={st.polling_station} className="bg-slate-900 rounded-2xl border border-white/5 overflow-hidden shadow-md">
                              {/* Polling Centre Header */}
                              <div 
                                onClick={() => toggleStation(st.polling_station)}
                                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-800/50 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <button className="p-1.5 rounded-lg bg-white/5 text-slate-300">
                                    {isStationOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                  </button>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        Tier 5 • Polling Centre
                                      </span>
                                      <h4 className="font-bold text-sm text-white">{st.polling_station}</h4>
                                    </div>
                                    <p className="text-[11px] text-slate-400 mt-0.5">
                                      Coordinator:{" "}
                                      {st.coordinator ? (
                                        <span className="text-purple-400 font-bold">{st.coordinator.full_name} ({st.coordinator.phone})</span>
                                      ) : (
                                        <span className="text-rose-400 italic">Not Appointed</span>
                                      )}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  {/* Progress quota */}
                                  <div className="flex items-center gap-3 mr-2">
                                    <span className="text-[10px] font-bold text-slate-400">
                                      Pillars: <span className={st.pillars_count >= 3 ? "text-emerald-400 font-black" : "text-amber-400"}>{st.pillars_count}/3</span>
                                    </span>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      Mobilizers: <span className={st.mobilizers_count >= 25 ? "text-emerald-400 font-black" : "text-amber-400"}>{st.mobilizers_count}/25</span>
                                    </span>
                                  </div>

                                  {st.coordinator ? (
                                    isSuperAdmin && st.coordinator.phone ? (
                                      <>
                                        <a href={formatDial(st.coordinator.phone)} className="p-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 transition" title={t("call_coordinator")}>
                                          <Phone className="w-3.5 h-3.5" />
                                        </a>
                                        <a href={formatWhatsApp(st.coordinator.phone, st.coordinator.full_name)} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 transition" title="WhatsApp Coordinator">
                                          <MessageSquare className="w-3.5 h-3.5" />
                                        </a>
                                      </>
                                    ) : null
                                  ) : (
                                    canAppointInWard && (
                                      <button
                                        onClick={() => openAppointModal("polling_centre_coordinator", w.ward, st.polling_station)}
                                        className="px-3 py-1 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition"
                                      >
                                        {t("appoint_centre_head")}
                                      </button>
                                    )
                                  )}
                                </div>
                              </div>

                              {/* Nested Pillars & Mobilizers */}
                              {isStationOpen && (
                                <div className="p-4 border-t border-white/5 bg-black/30 space-y-4">
                                  {/* 3 Pillars */}
                                  <div>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-[10px] font-black uppercase tracking-widest text-rose-400 flex items-center gap-1.5">
                                        <Award className="w-3.5 h-3.5" /> Tier 6 • 3 Campaign Pillars (Demographic Outreach)
                                      </span>
                                      {canAppointInStation && st.pillars_count < 3 && (
                                        <button
                                          onClick={() => openAppointModal("pillar", w.ward, st.polling_station)}
                                          className="text-[10px] font-bold text-rose-400 hover:text-rose-300 underline"
                                        >
                                          {t("add_pillar")}
                                        </button>
                                      )}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                      {st.pillars?.map(p => (
                                        <div key={p.id} className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between">
                                          <div>
                                            <p className="text-xs font-bold text-white">{p.full_name}</p>
                                            <p className="text-[10px] text-rose-400 font-medium capitalize">
                                              {p.pillar_category?.replace('_', ' ') || 'General Pillar'}
                                              {isSuperAdmin && p.phone && ` • ${formatKenyanPhone(p.phone)}`}
                                            </p>
                                          </div>
                                          {isSuperAdmin && p.phone && (
                                            <div className="flex items-center gap-1">
                                              <a href={formatDial(p.phone)} className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300">
                                                <Phone className="w-3 h-3" />
                                              </a>
                                              <a href={formatWhatsApp(p.phone, p.full_name)} target="_blank" rel="noreferrer" className="p-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300">
                                                <MessageSquare className="w-3 h-3" />
                                              </a>
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                      {Array.from({ length: Math.max(0, 3 - (st.pillars_count || 0)) }).map((_, i) => (
                                        <div key={i} className="p-2.5 rounded-xl border border-dashed border-white/10 flex items-center justify-center text-[10px] text-slate-500 italic">
                                          Pillar Slot { (st.pillars_count || 0) + i + 1 } Open
                                        </div>
                                      ))}
                                    </div>
                                  </div>

                                  {/* 25 Mobilizers (5 × 5 Squads: Bronze, Silver, Gold, Platinum, Diamond) */}
                                  <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-300 flex items-center gap-1.5">
                                          <Users className="w-3.5 h-3.5 text-emerald-400" /> Tier 7 • 25 Station Mobilizers (5 × 5 Groups)
                                        </span>
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                          {st.mobilizers_count || 0} / 25 Total
                                        </span>
                                      </div>
                                      {canAppointInStation && (st.mobilizers_count || 0) < 25 && (
                                        <button
                                          onClick={() => openAppointModal("station_mobilizer", w.ward, st.polling_station)}
                                          className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline"
                                        >
                                          + {t("add_mobilizer")}
                                        </button>
                                      )}
                                    </div>

                                    {/* 5 × 5 Squads Grid: Bronze (0/5), Silver (0/5), Gold (0/5), Platinum (0/5), Diamond (0/5) */}
                                    <div className="grid grid-cols-1 md:grid-cols-5 gap-2.5">
                                      {MOBILIZER_SQUADS.map((squad, sqIdx) => {
                                        const squadMembers = (st.mobilizers || []).slice(sqIdx * 5, sqIdx * 5 + 5);
                                        const squadCount = squadMembers.length;
                                        const openSlots = Math.max(0, 5 - squadCount);

                                        return (
                                          <div key={squad.id} className={`p-2.5 rounded-2xl border ${squad.bg} ${squad.border} flex flex-col justify-between space-y-2`}>
                                            <div className="flex items-center justify-between border-b border-white/5 pb-1.5">
                                              <span className={`text-[11px] font-black tracking-wide ${squad.color} flex items-center gap-1`}>
                                                {squad.tierLabel}
                                              </span>
                                              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black font-mono ${squad.badgeBg}`}>
                                                {squadCount} / 5
                                              </span>
                                            </div>

                                            <div className="space-y-1.5 min-h-[60px]">
                                              {squadMembers.map((m, mIdx) => (
                                                <div key={m.id || mIdx} className="p-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between text-xs">
                                                  <div className="truncate pr-1">
                                                    <p className="font-bold text-white text-[11px] truncate leading-tight">
                                                      <span className="text-slate-400 text-[10px] font-mono mr-1">#{sqIdx * 5 + mIdx + 1}</span>
                                                      {m.full_name}
                                                    </p>
                                                    {isSuperAdmin && m.phone ? (
                                                      <p className="text-[10px] font-black text-emerald-400 font-mono truncate">{formatKenyanPhone(m.phone)}</p>
                                                    ) : (
                                                      <p className="text-[9px] text-slate-400 truncate">{cleanCentreName(st.name || st.polling_station)}</p>
                                                    )}
                                                  </div>
                                                  {isSuperAdmin && m.phone && (
                                                    <div className="flex items-center gap-1 shrink-0">
                                                      <a href={formatDial(m.phone)} className="p-1 rounded bg-white/10 hover:bg-white/20 text-slate-300">
                                                        <Phone className="w-2.5 h-2.5" />
                                                      </a>
                                                      <a href={formatWhatsApp(m.phone, m.full_name)} target="_blank" rel="noreferrer" className="p-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300">
                                                        <MessageSquare className="w-2.5 h-2.5" />
                                                      </a>
                                                    </div>
                                                  )}
                                                </div>
                                              ))}

                                              {/* Empty Open Slots in 5x5 Squad */}
                                              {Array.from({ length: openSlots }).map((_, slotIdx) => (
                                                <div key={slotIdx} className="p-1.5 rounded-xl border border-dashed border-white/10 flex items-center justify-between text-[10px] text-slate-500">
                                                  <span className="font-mono text-slate-600">#{sqIdx * 5 + squadCount + slotIdx + 1}</span>
                                                  <span className="italic">Slot Open</span>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: TOP-DOWN DIRECTORY ────────────────────────────────────── */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by Name, Phone, ID..."
                value={dirSearch}
                onChange={e => setDirSearch(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
              <select
                value={dirRole}
                onChange={e => setDirRole(e.target.value)}
                className="flex-1 sm:flex-initial bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Tiers / Roles</option>
                {Object.entries(ROLE_DISPLAY).map(([k, r]) => (
                  <option key={k} value={k}>{r.tier}: {r.label}</option>
                ))}
              </select>
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={handleDownloadDirectory}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider transition shadow-sm active:scale-95 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Directory ({safeDirectory.length})</span>
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold">Loading directory records...</span>
              </div>
            ) : safeDirectory.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">
                No matching personnel found in this directory slice.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {safeDirectory.map(m => {
                  const roleMeta = ROLE_DISPLAY[m.campaign_role] || ROLE_DISPLAY.station_mobilizer;
                  const Icon = roleMeta.icon;

                  return (
                    <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl border ${roleMeta.bg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm sm:text-base text-slate-900">{m.full_name}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleMeta.bg}`}>
                              {roleMeta.tier} • {roleMeta.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            <span className="font-bold text-slate-700">Station of Voting:</span> {cleanCentreName(m.assigned_polling_centre || m.polling_station) || "Designated Polling Station"} ({m.assigned_ward || m.ward || "Ward"})
                          </p>
                          {isSuperAdmin && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-mono font-black text-xs sm:text-sm tracking-wide">
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {formatKenyanPhone(m.phone) || "No Phone"}
                              </span>
                              {m.national_id && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono font-bold text-xs">
                                  ID: {m.national_id}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSuperAdmin && m.phone && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <a
                            href={formatDial(m.phone)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 transition shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            Call {formatKenyanPhone(m.phone)}
                          </a>
                          <a
                            href={formatWhatsApp(m.phone, m.full_name)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 transition shadow-sm"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

            {/* ─── TAB 3: MY DIRECT TEAM ────────────────────────────────────────── */}
      {activeTab === "my_team" && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                Direct Supervision
              </span>
              <h2 className="text-xl font-black text-slate-900 mt-2">
                {myTeamData?.team_title || "My Direct Team"}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Personnel directly reporting to your command line ({myTeamData?.team_count || safeTeamMembers.length} active subordinates).
              </p>
            </div>

            {myTeamData?.can_appoint && (
              <button
                onClick={() => openAppointModal()}
                className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider transition shadow-md"
              >
                + Appoint Team Member
              </button>
            )}
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-12 text-center text-slate-600 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="font-bold">Loading direct team...</span>
              </div>
            ) : safeTeamMembers.length === 0 ? (
              <div className="p-12 text-center text-slate-500 italic">
                No direct team members appointed yet. Use the button above to assign leaders to your command line.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {safeTeamMembers.map(m => {
                  const roleMeta = ROLE_DISPLAY[m.campaign_role] || ROLE_DISPLAY.station_mobilizer;
                  const Icon = roleMeta.icon;

                  return (
                    <div key={m.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl border ${roleMeta.bg}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-black text-sm sm:text-base text-slate-900">{m.full_name}</h4>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${roleMeta.bg}`}>
                              {roleMeta.tier} • {roleMeta.label}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 font-medium">
                            <span className="font-bold text-slate-700">Station of Voting:</span> {cleanCentreName(m.assigned_polling_centre || m.polling_station) || "Designated Polling Station"} ({m.assigned_ward || m.ward || "Ward"})
                          </p>
                          {isSuperAdmin && (
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 border border-slate-200 text-slate-900 font-mono font-black text-xs sm:text-sm tracking-wide">
                                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                {formatKenyanPhone(m.phone) || "No Phone"}
                              </span>
                              {m.national_id && (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 font-mono font-bold text-xs">
                                  ID: {m.national_id}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {isSuperAdmin && m.phone && (
                        <div className="flex items-center gap-2 self-end sm:self-center">
                          <a
                            href={formatDial(m.phone)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs flex items-center gap-2 transition shadow-sm"
                          >
                            <Phone className="w-3.5 h-3.5 text-emerald-400" />
                            Call {formatKenyanPhone(m.phone)}
                          </a>
                          <a
                            href={formatWhatsApp(m.phone, m.full_name)}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center gap-1.5 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── ROLE APPOINTMENT MODAL (Lookup Voter OR Upgrade Member) ─────── */}
      <AnimatePresence>
        {showAssignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                    Official Appointment
                  </span>
                  <h3 className="text-xl font-black text-white mt-2">Appoint Subordinate</h3>
                </div>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400"
                >
                  ✕
                </button>
              </div>

              {/* Mode Toggle Tabs */}
              <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-950 rounded-2xl border border-white/10">
                <button
                  type="button"
                  onClick={() => setAssignModalMode("new_voter")}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                    assignModalMode === "new_voter"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  1. Lookup 263k Voter
                </button>
                <button
                  type="button"
                  onClick={() => setAssignModalMode("upgrade_existing")}
                  className={`py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition ${
                    assignModalMode === "upgrade_existing"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-md"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  2. Existing Member
                </button>
              </div>

              {/* Mode 1: Lookup 263k Voter */}
              {assignModalMode === "new_voter" && (
                <div className="space-y-4 mb-4">
                  {assignModalStep === "lookup" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-400">
                        Search any verified voter in Laikipia by National ID to automatically appoint them.
                      </p>
                      <VoterLookup
                        onVoterFound={(voter) => {
                          setAssignModalVoter(voter);
                          setAssignModalPrefill({
                            full_name: voter.full_name || voter.name || "",
                            national_id: voter.national_id || voter.id_number || "",
                            phone: voter.phone || "",
                            ward: voter.ward || "",
                            polling_station: voter.polling_station || voter.station_name || "",
                          });
                          setAssignModalStep("form");
                        }}
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-2xl">
                        <div>
                          <p className="text-xs font-bold text-white">{assignModalPrefill?.full_name}</p>
                          <p className="text-[10px] text-slate-400">ID: {assignModalPrefill?.national_id} • {assignModalPrefill?.ward}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAssignModalStep("lookup")}
                          className="text-xs text-emerald-400 font-bold hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <RegistrationForm
                        prefill={assignModalPrefill}
                        onSuccess={async (newMember) => {
                          try {
                            const newId = newMember?.member?.id || newMember?.id || newMember?.data?.id || newMember?.data?.member?.id;
                            if (newId) {
                              const assignRes = await api.assignCampaignRole({
                                ...assignForm,
                                member_id: newId,
                                assigned_ward: assignModalPrefill?.ward || assignForm.assigned_ward,
                                assigned_polling_centre: assignModalPrefill?.polling_station || assignForm.assigned_polling_centre,
                              });
                              if (assignRes?.error) {
                                toast.error(assignRes.error || "Voter registered but role assignment failed.");
                              } else {
                                toast.success("New voter enrolled and appointed successfully!");
                                setShowAssignModal(false);
                                fetchStats();
                                if (activeTab === "tree") fetchTree();
                                if (activeTab === "directory") fetchDirectory();
                                if (activeTab === "my_team") fetchMyTeam();
                              }
                            } else {
                              toast.error("Voter registered but could not resolve ID for appointment.");
                            }
                          } catch (err) {
                            toast.error("Voter registered but role assignment failed.");
                          }
                        }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Mode 2: Existing Movement Member Form */}
              <form onSubmit={handleAssignRole} className={`space-y-4 ${assignModalMode === "new_voter" ? "hidden" : ""}`}>
                {/* Search existing member */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                    1. Select Movement Member
                  </label>
                  {selectedMember ? (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-emerald-400">{selectedMember.full_name}</p>
                        <p className="text-[10px] text-slate-400">{selectedMember.phone} • {selectedMember.ward || "No Ward"}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedMember(null);
                          setAssignForm(f => ({ ...f, member_id: "" }));
                        }}
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
                        <div className="mt-2 bg-slate-950 border border-emerald-500/30 rounded-2xl max-h-48 overflow-y-auto divide-y divide-white/10 shadow-2xl">
                          {searchResults.map(sr => (
                            <div
                              key={sr.id}
                              onClick={() => {
                                setSelectedMember(sr);
                                setAssignForm(f => ({
                                  ...f,
                                  member_id: sr.id,
                                  assigned_ward: f.assigned_ward || sr.assigned_ward || sr.official_ward || sr.ward || "",
                                  assigned_polling_centre: cleanCentreName(f.assigned_polling_centre || sr.assigned_polling_centre || sr.official_polling_station || sr.polling_station || ""),
                                }));
                                setSearchResults([]);
                              }}
                              className="p-3 hover:bg-slate-800/90 cursor-pointer flex items-center justify-between text-xs transition"
                            >
                              <div>
                                <span className="font-bold text-white block text-sm">{sr.full_name}</span>
                                <span className="text-slate-400 text-[11px]">
                                  {sr.phone} • 📍 {sr.official_ward || sr.ward || "General"} ({cleanCentreName(sr.official_polling_station || sr.polling_station) || "No station"})
                                </span>
                              </div>
                              <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                Select
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Target Role */}
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

                {/* Geographic Assignments with Constituency Wards dropdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Assigned Ward
                    </label>
                    {constituencyWards.length > 0 && (isSuperAdmin || userRole === "sub_county_coordinator") ? (
                      <select
                        value={assignForm.assigned_ward}
                        onChange={e => setAssignForm(f => ({ ...f, assigned_ward: e.target.value }))}
                        className="w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        <option value="">Select Ward</option>
                        {constituencyWards.map(w => (
                          <option key={w} value={w}>{w} Ward</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        placeholder="e.g. Ol-Moran"
                        value={assignForm.assigned_ward}
                        readOnly={!isSuperAdmin && userRole === "ward_coordinator"}
                        onChange={e => setAssignForm(f => ({ ...f, assigned_ward: e.target.value }))}
                        className={`w-full bg-slate-950 border border-white/10 rounded-2xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 ${
                          !isSuperAdmin && userRole === "ward_coordinator" ? "opacity-75 cursor-not-allowed bg-slate-900 text-emerald-400 font-bold" : ""
                        }`}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-slate-400 mb-1.5">
                      Assigned Polling Centre
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Ol Moran Primary School"
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
