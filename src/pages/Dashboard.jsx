import { cleanCentreName } from "../lib/constants";
const CAMPAIGN_ROLE_LABELS = {
  governor: "Governor Aspirant",
  county_manager: "County Campaigns Manager",
  sub_county_coordinator: "Sub-County Coordinator",
  ward_coordinator: "Ward Coordinator",
  polling_centre_coordinator: "Polling Centre Coordinator",
  pillar: "Campaign Pillar",
  station_mobilizer: "Polling Station Mobilizer",
};

const PILLAR_LABELS = {
  youth: "Youth Pillar",
  women: "Women Pillar",
  elders_business: "Elders & Business Pillar",
  special_interest: "Special Interest Pillar",
};

import Diary from './Diary';
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, Lock, Star, AlertCircle, QrCode, Copy, Share2, Download, WifiOff, CloudUpload, Crosshair, ShieldCheck, ClipboardList, Calendar, ChevronRight, Award, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { api } from "../lib/api";
import logo from "../assets/logo.png";
import { useLanguage } from "../contexts/LanguageContext";
import { useSync } from "../contexts/SyncContext";

// ─── Tier config for Mobilizer 5x5 Squads (Bronze Tier 7.1, Silver Tier 7.2, Gold Tier 7.3, Platinum Tier 7.4, Diamond Tier 7.5) ─────────────
const TIERS = [
  {
    name: "Bronze Squad",
    subtitle: "Foundation Mobilizers Pod",
    slots: "Slots #1 – #5",
    range: [1, 5],
    icon: "🥉",
    color: "#CD7F32",
    bg: "from-amber-900/20 to-amber-800/10",
    border: "border-amber-700/40",
    fill: "bg-amber-600",
    text: "text-amber-500",
    glow: "shadow-amber-500/20",
  },
  {
    name: "Silver Squad",
    subtitle: "Expansion Mobilizers Pod",
    slots: "Slots #6 – #10",
    range: [6, 10],
    icon: "🥈",
    color: "#A8A9AD",
    bg: "from-slate-400/20 to-slate-300/10",
    border: "border-slate-400/40",
    fill: "bg-slate-400",
    text: "text-slate-300",
    glow: "shadow-slate-400/20",
  },
  {
    name: "Gold Squad",
    subtitle: "Intermediate Mobilizers Pod",
    slots: "Slots #11 – #15",
    range: [11, 15],
    icon: "🥇",
    color: "#FFD700",
    bg: "from-yellow-900/20 to-yellow-800/10",
    border: "border-yellow-700/40",
    fill: "bg-yellow-500",
    text: "text-yellow-400",
    glow: "shadow-yellow-500/20",
  },
  {
    name: "Platinum Squad",
    subtitle: "Advanced Mobilizers Pod",
    slots: "Slots #16 – #20",
    range: [16, 20],
    icon: "💎",
    color: "#67e8f9",
    bg: "from-cyan-900/20 to-cyan-800/10",
    border: "border-cyan-700/40",
    fill: "bg-cyan-500",
    text: "text-cyan-400",
    glow: "shadow-cyan-500/20",
  },
  {
    name: "Diamond Squad",
    subtitle: "Station Command Cap Pod",
    slots: "Slots #21 – #25",
    range: [21, 25],
    icon: "👑",
    color: "#c084fc",
    bg: "from-purple-900/20 to-purple-800/10",
    border: "border-purple-700/40",
    fill: "bg-purple-500",
    text: "text-purple-400",
    glow: "shadow-purple-500/20",
  }
];

function getTierState(tierIndex, referralCount) {
  const tier = TIERS[tierIndex];
  const [from, to] = tier.range;
  const filledInTier = Math.max(0, Math.min(5, referralCount - (from - 1)));
  const isComplete = referralCount >= to;
  const isActive = referralCount >= from - 1 && !isComplete;
  const isLocked = referralCount < from - 1;
  return { filledInTier, isComplete, isActive, isLocked };
}

function TierCard({ tier, tierIndex, referralCount, delay }) {
  const { filledInTier, isComplete, isActive, isLocked } = getTierState(tierIndex, referralCount);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        relative rounded-2xl border p-5 flex flex-col items-center gap-3 overflow-hidden
        bg-gradient-to-b ${tier.bg} ${tier.border}
        ${isLocked ? "opacity-50 grayscale" : ""}
        ${isActive ? `shadow-lg ${tier.glow} ring-1 ring-emerald-500/50` : ""}
        transition-all duration-500
      `}
    >
      {isLocked && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/40 backdrop-blur-[1px]">
          <Lock size={22} className="text-slate-400" />
        </div>
      )}

      {isComplete && (
        <span className="absolute top-2 right-2 bg-emerald-500/20 border border-emerald-500/40 rounded-full px-2 py-0.5 text-[8px] font-black text-emerald-400 uppercase tracking-widest">
          ✓ Full
        </span>
      )}

      {isActive && (
        <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${tier.fill} animate-pulse`} />
      )}

      <div className="text-2xl">{tier.icon}</div>

      <div className="text-center w-full">
        <p className={`text-xs font-black uppercase tracking-wider ${isLocked ? "text-slate-500" : tier.text}`}>
          {tier.name}
        </p>
        <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">
          {tier.subtitle}
        </p>
        <p className="text-[10px] font-mono text-slate-500 mt-0.5">
          {tier.slots}
        </p>
      </div>

      <div className="flex gap-1.5 justify-center my-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`
              w-5 h-5 rounded-full border transition-all duration-300
              ${i < filledInTier
                ? `${tier.fill} border-transparent shadow-sm`
                : "bg-slate-800 border-slate-700"}
            `}
          />
        ))}
      </div>

      <div className="w-full pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-bold">
        <span className="text-slate-500">Progress</span>
        <span className={isLocked ? "text-slate-600 font-mono font-black" : "text-white font-mono font-black"}>
          {filledInTier} / 5
        </span>
      </div>
    </motion.div>
  );
}

function NetworkStatCard({ label, sublabel, value, suffix, max, icon, accent, delay }) {
  const pct = max ? Math.min(100, Math.round((value / max) * 100)) : null;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`
        rounded-2xl border p-6 flex flex-col gap-2
        ${accent
          ? "bg-slate-900 border-dcp-green/30 shadow-lg shadow-dcp-green/5"
          : "bg-white border-slate-200 shadow-sm"}
      `}
    >
      <div className="flex items-center justify-between">
        <p className={`text-[10px] font-black uppercase tracking-widest ${
          accent ? "text-slate-400" : "text-slate-500"
        }`}>{label}</p>
        <span className="text-xl">{icon}</span>
      </div>
      <div className="flex items-end gap-1">
        <span className={`text-4xl font-black ${
          accent ? "text-white" : "text-slate-900"
        }`}>{value}</span>
        {max && (
          <span className={`text-base font-bold mb-1 ${
            accent ? "text-slate-500" : "text-slate-400"
          }`}>/ {max}</span>
        )}
        {suffix && (
          <span className={`text-sm font-bold mb-1 ${
            accent ? "text-dcp-green" : "text-slate-400"
          }`}>{suffix}</span>
        )}
      </div>
      {pct !== null && (
        <div className={`h-1.5 rounded-full ${
          accent ? "bg-slate-800" : "bg-slate-100"
        }`}>
          <div
            className={`h-1.5 rounded-full transition-all duration-700 ${
              accent ? "bg-dcp-green" : "bg-slate-700"
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
      <p className={`text-[10px] font-bold ${
        accent ? "text-slate-500" : "text-slate-400"
      }`}>{sublabel}</p>
    </motion.div>
  );
}

// ─── Skeleton placeholder ─────────────────────────────────────────────────────
function SkeletonCard({ className = "" }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-6 animate-pulse ${className}`}>
      <div className="h-3 w-24 bg-slate-200 rounded mb-4" />
      <div className="h-10 w-16 bg-slate-200 rounded mb-3" />
      <div className="h-1.5 w-full bg-slate-100 rounded" />
    </div>
  );
}

export default function Dashboard({ memberId, onLogout }) {
  const { t } = useLanguage();
  const [member, setMember] = useState(null);
  const [referralCount, setReferralCount] = useState(0);
  const [networkSize, setNetworkSize] = useState(0);
  const [networkDepth, setNetworkDepth] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [targets, setTargets] = useState([]);
  const [showQR, setShowQR] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const navigate = useNavigate();

  const fetchMemberData = useCallback(async () => {
    try {
      const { data: insights, error: fetchErr } = await api.getInsights(memberId);
      if (fetchErr) throw new Error("Member not found");
      
      // The insights endpoint returns comprehensive data
      const memberData = insights.lineage[insights.lineage.length - 1];
      setMember(memberData);
      setReferralCount(insights.direct_invites || 0);
      setNetworkSize(insights.network_size || 0);
      setNetworkDepth(insights.network_depth || (insights.tier - 1));

      try {
        const { data: targetsData } = await api.getTargets(memberId);
        if (targetsData && targetsData.targets) {
           setTargets(targetsData.targets);
        }
      } catch (err) {
        console.error("Targets error:", err);
      }

    } catch (err) {
      console.error("Dashboard data error:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [memberId]);

  useEffect(() => {
    if (memberId) fetchMemberData();
  }, [memberId, fetchMemberData]);

  const { offlineCount, isSyncing: syncing, syncOfflineQueue, isOnline } = useSync();

  // PWA Install Prompt
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const isCoordinator = ['polling_centre_coordinator', 'ward_coordinator', 'sub_county_coordinator', 'pillar', 'county_manager', 'governor'].includes(member?.campaign_role);
  const coordinatorQuota = 25;
  const coordinatorPct = Math.min(100, Math.round((referralCount / coordinatorQuota) * 100));
  const isRoot = true; // All mobilizers and leaders use the 25 5x5 recruitment tier system
  const quota = 25;
  const remaining = Math.max(0, quota - referralCount);
  const pct = Math.min(100, Math.round((referralCount / quota) * 100));

  // Referral share link
  const referralLink = member ? `${window.location.origin}/?ref=${member.uuid || member.referral_code || member.id}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success("Link copied to clipboard!");
  };

  const shareLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Join DCP Laikipia',
        text: `${member?.full_name} is inviting you to join the DCP Laikipia network. Register here:`,
        url: referralLink,
      });
    } else {
      copyLink();
    }
  };

  const downloadQR = () => {
    const svg = document.getElementById('member-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 300; canvas.height = 300;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 300, 300);
      ctx.drawImage(img, 0, 0, 300, 300);
      const link = document.createElement('a');
      link.download = `dcp-qr-${member?.full_name?.replace(/ /g, '-')}.png`;
      link.href = canvas.toDataURL();
      link.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const activeTierIndex = isRoot
    ? TIERS.findIndex((_, i) => !getTierState(i, referralCount).isComplete)
    : -1;
  const activeTier = activeTierIndex >= 0 ? TIERS[activeTierIndex] : null;
  const tierRemaining = activeTier ? activeTier.range[1] - referralCount : 0;
  const tierFilledIn = activeTier ? getTierState(activeTierIndex, referralCount).filledInTier : 5;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="w-full space-y-8 pt-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-pulse flex items-center gap-6">
          <div className="w-24 h-12 bg-slate-200 rounded-xl" />
          <div className="space-y-2">
            <div className="h-3 w-40 bg-slate-200 rounded" />
            <div className="h-5 w-32 bg-slate-200 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );

  // ── Error state ──────────────────────────────────────────────────────────────
  if (error)
    return (
      <div className="w-full pt-16 flex flex-col items-center text-center gap-4">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
          <AlertCircle size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">{t('failed_load_dashboard')}</h2>
        <p className="text-sm text-slate-500 max-w-xs">Could not connect to the server. Check your connection and try again.</p>
        <button
          onClick={() => { setError(false); setLoading(true); fetchMemberData(); }}
          className="mt-2 px-6 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-slate-700 transition"
        >
          Try Again
        </button>
      </div>
    );

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-8">


        {/* ── AI Target Matching ────────────────────────────────────────── */}
        {member?.is_root && targets.length > 0 && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
             <div className="flex items-center gap-4 mb-6 relative z-10">
               <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center">
                  <Crosshair className="w-6 h-6" />
               </div>
               <div>
                  <p className="text-[10px] uppercase tracking-[0.35em] text-indigo-400 font-black">{t('ai_recommendations')}</p>
                  <h2 className="text-xl font-black text-white">{t('suggested_targets')}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">{t("family_network_suggested")}</p>
               </div>
             </div>
             
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 relative z-10">
                {targets.map((t, idx) => (
                   <div key={idx} className="bg-slate-800/50 border border-slate-700 p-4 rounded-2xl flex items-center justify-between">
                      <div>
                         <p className="text-sm font-black text-white truncate">{t.full_name}</p>
                         <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mt-1">ID: {t.id_number}</p>
                      </div>
                      <button onClick={() => navigate('/enroll', { state: { prefillId: t.id_number, prefillName: t.full_name }})} className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-colors">
                         Enroll
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* ── Offline & PWA Sync Bars ────────────────────────────────── */}
        <AnimatePresence>
          {offlineCount > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl shadow-sm"
            >
              <div className="flex items-center gap-3">
                <WifiOff className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-black text-amber-800 uppercase tracking-widest">
                    {offlineCount} {t('dash_queue')}
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold mt-0.5">
                    These will sync automatically when internet is available.
                  </p>
                </div>
              </div>
              <button
                onClick={syncOfflineQueue}
                disabled={syncing || !isOnline}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-600 transition disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <CloudUpload className="w-4 h-4" />
                {syncing ? '...' : t('dash_sync')}
              </button>
            </motion.div>
          )}

          {deferredPrompt && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="flex items-center justify-between gap-4 p-4 bg-dcp-green/10 border border-dcp-green/20 rounded-2xl shadow-sm mt-4"
            >
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-dcp-green shrink-0" />
                <div>
                  <p className="text-xs font-black text-dcp-green uppercase tracking-widest">
                    Install App
                  </p>
                  <p className="text-[10px] text-dcp-green/80 font-bold mt-0.5">
                    Add DCP Mobilizer to your home screen for quick access.
                  </p>
                </div>
              </div>
              <button
                onClick={handleInstallClick}
                className="flex items-center gap-2 px-4 py-2 bg-dcp-green text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shrink-0"
              >
                <Download className="w-4 h-4" />
                Install Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>


        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-8 md:p-12 shadow-2xl border border-slate-800"
        >
          {/* Background Decorative Elements */}
          <div className="absolute top-0 right-0 w-1/2 h-full pointer-events-none opacity-30">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,132,61,0.6)_0%,transparent_70%)]" />
          </div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-dcp-green/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col items-center md:items-start text-center md:text-left">
              <div className="flex items-center gap-3 mb-6 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 self-center md:self-start">
                <div className="w-2 h-2 rounded-full bg-dcp-green animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-300">★ {member?.campaign_role === "pillar" ? (PILLAR_LABELS[member?.pillar_category] || "Campaign Pillar") : (CAMPAIGN_ROLE_LABELS[member?.campaign_role] || "Official Delegate Verified")}</span>
              </div>
              
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em] mb-3">{t("welcome_back")}</p>
              <h1 className="text-4xl md:text-6xl font-black text-white italic leading-none mb-6 tracking-tight uppercase">
                {member?.full_name?.split(' ')[0]} <span className="text-dcp-green not-italic">{member?.full_name?.split(' ').slice(1).join(' ')}</span>
              </h1>

              <div className="flex flex-wrap justify-center md:justify-start gap-3 mt-2">
                <div className="px-4 py-2 bg-white/5 border border-amber-500/20 bg-amber-500/5 rounded-xl">
                  <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest mb-0.5">{t("dash_role") || "Role / Position"}</p>
                  <p className="text-sm font-black text-white flex items-center gap-1.5">
                    <Star size={14} className="text-amber-400 fill-amber-400 shrink-0" />
                    {member?.campaign_role === 'pillar'
                      ? (PILLAR_LABELS[member?.pillar_category] || "Campaign Pillar")
                      : (CAMPAIGN_ROLE_LABELS[member?.campaign_role] || (isRoot ? "Root Mobilizer" : "Mobilization Delegate"))}
                  </p>
                </div>
                
                {member?.campaign_role === 'sub_county_coordinator' ? (
                  <>
                    <div className="px-4 py-2 bg-white/5 border border-blue-500/20 bg-blue-500/5 rounded-xl">
                      <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-0.5">{t("subcounty_command")}</p>
                      <p className="text-sm font-bold text-white">{member?.assigned_sub_county || "Laikipia West"} (6 Wards)</p>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Base Station HQ</p>
                      <p className="text-sm font-bold text-white">{cleanCentreName(member?.polling_station) || member?.ward || "Constituency HQ"}</p>
                    </div>
                  </>
                ) : member?.campaign_role === 'ward_coordinator' ? (
                  <>
                    <div className="px-4 py-2 bg-white/5 border border-cyan-500/20 bg-cyan-500/5 rounded-xl">
                      <p className="text-[9px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">{t("ward_polling_command")}</p>
                      <p className="text-sm font-bold text-white">{member?.assigned_ward || member?.ward} Ward</p>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Base Station HQ</p>
                      <p className="text-sm font-bold text-white">{cleanCentreName(member?.polling_station) || "Ward HQ"}</p>
                    </div>
                  </>
                ) : member?.campaign_role === 'polling_centre_coordinator' ? (
                  <>
                    <div className="px-4 py-2 bg-white/5 border border-purple-500/20 bg-purple-500/5 rounded-xl">
                      <p className="text-[9px] font-black text-purple-400 uppercase tracking-widest mb-0.5">{t("station_command")}</p>
                      <p className="text-sm font-bold text-white">{cleanCentreName(member?.assigned_polling_centre || member?.polling_station)}</p>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Ward Jurisdiction</p>
                      <p className="text-sm font-bold text-white">{member?.assigned_ward || member?.ward}</p>
                    </div>
                  </>
                ) : member?.campaign_role === 'governor' || member?.campaign_role === 'county_manager' ? (
                  <>
                    <div className="px-4 py-2 bg-white/5 border border-emerald-500/20 bg-emerald-500/5 rounded-xl">
                      <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-0.5">{t("county_ops")}</p>
                      <p className="text-sm font-bold text-white">All Laikipia (15 Wards)</p>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Supreme Base</p>
                      <p className="text-sm font-bold text-white">County HQ</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Ward Authority</p>
                      <p className="text-sm font-bold text-white">{member?.ward || "Laikipia"}</p>
                    </div>
                    <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Station HQ</p>
                      <p className="text-sm font-bold text-white">{cleanCentreName(member?.polling_station) || "Station Base"}</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-center gap-4">
              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white p-4 shadow-xl border border-slate-200 flex items-center justify-center"
              >
                <img src={logo} alt="DCP" className="w-full h-full object-contain mix-blend-multiply" />
              </motion.div>
              <button 
                onClick={onLogout}
                className="text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-red-400 transition"
              >
                {t('sign_out')}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ── Primary Action Center ────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
          <motion.button
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate("/enroll")}
            className="group relative overflow-hidden rounded-[2rem] p-8 bg-dcp-green text-white shadow-lg shadow-dcp-green/20 text-left border border-dcp-green/30"
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <Star size={80} strokeWidth={3} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-white/70">
              {isCoordinator ? "Command Mandate" : "Expansion"}
            </p>
            <h3 className="text-2xl font-black mb-3 italic uppercase">
              {isCoordinator ? "Enrol Supporter / Agent" : "Enrol New Voter"}
            </h3>
            <p className="text-sm text-white/80 leading-relaxed font-medium">
              {isCoordinator
                ? `Directly onboard field mobilizers and registered supporters under your ${CAMPAIGN_ROLE_LABELS[member?.campaign_role] || 'Command'} authority.`
                : "Use your authority to register and onboard new supporters to the movement."}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-black/10 w-fit px-4 py-2 rounded-full">
              Open Recruitment Tools →
            </div>
          </motion.button>

          <motion.button
            whileHover={{ y: -4 }}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate(isCoordinator ? "/hierarchy" : "/members")}
            className="group relative overflow-hidden rounded-[2rem] p-8 bg-white text-slate-900 shadow-sm border border-slate-200 text-left hover:border-slate-300 transition"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <ShieldCheck size={80} strokeWidth={3} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-2 text-slate-400">
              {isCoordinator ? "Official Hierarchy Tree" : "Team Leadership"}
            </p>
            <h3 className="text-2xl font-black mb-3 italic uppercase">
              {isCoordinator ? "Command Tree & Roster" : "My Team Network"}
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed font-medium">
              {isCoordinator
                ? "Access your 7-tier official campaign hierarchy, monitor station mobilizers, and oversee downlines."
                : "Track your personal team performance and view registration statuses."}
            </p>
            <div className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest bg-slate-50 w-fit px-4 py-2 rounded-full border border-slate-100 group-hover:bg-slate-100 transition">
              {isCoordinator ? "Open Command Tree →" : "Manage Network →"}
            </div>
          </motion.button>
        </section>

        {/* ── QR Code Share Card ───────────────────────────────────── */}
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden"
        >
          <button
            onClick={() => setShowQR(!showQR)}
            className="w-full flex items-center justify-between p-6 hover:bg-slate-50 transition"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-dcp-green/10 border border-dcp-green/20 flex items-center justify-center">
                <QrCode size={22} className="text-dcp-green" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">{t("offline_sharing_tool")}</p>
                <h3 className="font-black text-slate-900">{t("my_referral_qr")}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{t("show_or_print_barazas")}</p>
              </div>
            </div>
            <motion.div animate={{ rotate: showQR ? 180 : 0 }} className="text-slate-400">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M8 11L2 5h12L8 11z"/></svg>
            </motion.div>
          </button>

          <AnimatePresence>
            {showQR && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-slate-100"
              >
                <div className="p-6 flex flex-col md:flex-row items-center gap-8">
                  {/* QR Code */}
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-inner">
                      <QRCodeSVG
                        id="member-qr-svg"
                        value={referralLink}
                        size={180}
                        bgColor="#ffffff"
                        fgColor="#0f172a"
                        level="H"
                        includeMargin={false}
                      />
                    </div>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-600 text-center">{t("scan_to_join_network")}</p>
                  </div>

                  {/* Info + Actions */}
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t("your_referral_link")}</p>
                      <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                        <p className="text-xs font-bold text-slate-700 truncate flex-1">{referralLink}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <button
                        onClick={copyLink}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-700 transition"
                      >
                        <Copy size={14} /> Copy Link
                      </button>
                      <button
                        onClick={shareLink}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-dcp-green text-white rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition"
                      >
                        <Share2 size={14} /> Share
                      </button>
                      <button
                        onClick={downloadQR}
                        className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-slate-50 transition"
                      >
                        <Download size={14} /> Download QR
                      </button>
                    </div>
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">💡 Field Tip</p>
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Download this QR code and <strong>print it</strong> to use at barazas. Anyone with a smartphone can scan it to register — no link needed.
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>


        {/* ── Network Stats Banner ─────────────────────────────────── */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <NetworkStatCard
            label="My Direct Enrolments"
            sublabel={isRoot
              ? `${tierRemaining} more to complete ${activeTier?.name ?? "all"} tier`
              : `${remaining} slot${remaining !== 1 ? 's' : ''} remaining`
            }
            value={isRoot ? tierFilledIn : referralCount}
            max={isRoot ? 5 : quota}
            icon="👤"
            delay={0.15}
          />
          <NetworkStatCard
            label="Total Network Growth"
            sublabel="Everyone registered under you at all levels"
            value={networkSize}
            suffix={networkSize === 1 ? " person" : " people"}
            icon="🌐"
            accent
            delay={0.2}
          />
          <NetworkStatCard
            label="Hierarchy Depth"
            sublabel="How many tiers deep your network reaches"
            value={networkDepth}
            suffix={networkDepth === 1 ? " tier" : " tiers"}
            icon="📊"
            delay={0.25}
          />
        </section>



        {/* ── Coordinator Command Deck (For Coordinators & Pillars) ────── */}
        {isCoordinator ? (
          <motion.section
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 rounded-[2.5rem] border border-amber-500/20 p-8 md:p-10 shadow-2xl text-white relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <ShieldCheck size={28} className="text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
                        Official Mandate
                      </span>
                      <span className="text-xs text-slate-400 font-bold">• Active Jurisdiction</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                      {CAMPAIGN_ROLE_LABELS[member?.campaign_role] || "Campaign Coordinator"} Command Desk
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => navigate("/hierarchy")}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-widest hover:bg-amber-400 transition shadow-lg shadow-amber-500/20 shrink-0"
                >
                  <Users size={16} /> Open Hierarchy Tree →
                </button>
              </div>

              {/* Coordinator Metrics Grid Tailored to Specific Mandate */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {member?.campaign_role === 'sub_county_coordinator' ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Constituency Command</p>
                        <p className="text-2xl md:text-3xl font-black text-white truncate">{member?.assigned_sub_county || member?.sub_county || "Laikipia West"}</p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 font-medium">Supervising all Ward Coordinators and campaign apparatus across the sub-county.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ward Coordination</p>
                        <p className="text-3xl font-black text-emerald-400">All Wards <span className="text-sm text-slate-400 font-normal">Active</span></p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 font-medium">Full oversight over all Polling Centre Coordinators and field teams in the constituency.</p>
                    </div>
                  </>
                ) : member?.campaign_role === 'ward_coordinator' ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Ward Command Scope</p>
                        <p className="text-3xl font-black text-white">{member?.assigned_ward || member?.ward || "Ward Division"}</p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 font-medium">Supervising all Polling Centre Coordinators, Pillars, and Station Mobilizers in this Ward.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Polling Centres Target</p>
                        <p className="text-3xl font-black text-emerald-400">100% <span className="text-sm text-slate-400 font-normal">Stations Oversight</span></p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 font-medium">Direct leadership over all stations and grassroots mobilization bunches in {member?.ward}.</p>
                    </div>
                  </>
                ) : member?.campaign_role === 'pillar' ? (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Demographic Pillar</p>
                        <p className="text-2xl font-black text-rose-400">{PILLAR_LABELS[member?.pillar_category] || "Campaign Pillar"}</p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 font-medium">Targeted demographic voter outreach and sector engagement across {member?.ward}.</p>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Pillar Mobilization</p>
                        <p className="text-3xl font-black text-white">{referralCount} <span className="text-sm text-slate-400 font-normal">Recruits</span></p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 font-medium">Onboarding demographic champions and grassroots community leaders.</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Station Mobilizers Quota</p>
                        <p className="text-3xl font-black text-white">{referralCount} <span className="text-sm text-slate-400 font-normal">/ {coordinatorQuota} Mobilizers</span></p>
                      </div>
                      <div className="mt-4">
                        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-full transition-all duration-1000" style={{ width: `${coordinatorPct}%` }} />
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 font-bold">{coordinatorPct}% of station mobilization quota filled</p>
                      </div>
                    </div>
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Campaign Pillars</p>
                        <p className="text-3xl font-black text-emerald-400">3 <span className="text-sm text-slate-400 font-normal">Pillars Target</span></p>
                      </div>
                      <p className="text-xs text-slate-300 mt-4 leading-relaxed font-medium">
                        Youth, Women, and Special Interest & Faith Pillars coordinating outreach in {member?.ward}.
                      </p>
                    </div>
                  </>
                )}

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Command Jurisdiction HQ</p>
                    <p className="text-lg font-black text-white truncate">
                      {member?.campaign_role === 'sub_county_coordinator'
                        ? `${member?.assigned_sub_county || 'Laikipia West'} Sub-County Command`
                        : member?.campaign_role === 'ward_coordinator'
                        ? `${member?.assigned_ward || member?.ward} Ward Command`
                        : (cleanCentreName(member?.assigned_polling_centre || member?.polling_station) || member?.ward || "Laikipia County")}
                    </p>
                    <p className="text-xs text-slate-400 font-bold uppercase mt-0.5">
                      {member?.campaign_role === 'sub_county_coordinator'
                        ? `Base: ${cleanCentreName(member?.polling_station) || member?.ward || 'HQ'}`
                        : member?.ward ? `Ward: ${member.ward}` : "Constituency Wide"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-white/10 text-xs text-amber-300 font-black uppercase tracking-wider">
                    <CheckCircle size={14} /> IEBC Register Verified
                  </div>
                </div>
              </div>

              {/* Fast Command Links */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800">
                <button
                  onClick={() => navigate("/hierarchy")}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left group"
                >
                  <div className="truncate">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Structure</p>
                    <p className="text-xs font-black text-white group-hover:text-amber-300">Hierarchy</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => navigate("/members")}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left group"
                >
                  <div className="truncate">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Team</p>
                    <p className="text-xs font-black text-white group-hover:text-amber-300">Recruits Roster</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => navigate("/tally")}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left group"
                >
                  <div className="truncate">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">PVT Audit</p>
                    <p className="text-xs font-black text-white group-hover:text-amber-300">Form 34A Tally</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                </button>

                <button
                  onClick={() => navigate("/diary")}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition text-left group"
                >
                  <div className="truncate">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Mobilization</p>
                    <p className="text-xs font-black text-white group-hover:text-amber-300">Governor Diary</p>
                  </div>
                  <ChevronRight size={14} className="text-slate-500 group-hover:text-white" />
                </button>
              </div>
            </div>
          </motion.section>
        ) : (
          /* ── Performance Goal Summary & Tiers (For Grassroots Mobilizers) ── */
          <>
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-12">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-white border border-slate-200 p-8 md:p-10 rounded-[2rem] shadow-sm flex flex-col md:flex-row items-center gap-8 md:gap-12"
                >
                  <div className="relative shrink-0 flex items-center justify-center">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-[10px] border-slate-50 flex items-center justify-center relative">
                      <div className="absolute inset-0 rounded-full border-[10px] border-dcp-green transition-all duration-1000" 
                           style={{ clipPath: `inset(0 0 0 0 round 9999px)`, strokeDasharray: 440, strokeDashoffset: 440 - (440 * (isRoot ? Math.round((tierFilledIn / 5) * 100) : pct)) / 100 }} />
                       <svg className="w-full h-full absolute -rotate-90">
                          <circle 
                            cx="50%" cy="50%" r="45%" 
                            stroke="currentColor" 
                            strokeWidth="10" 
                            fill="transparent" 
                            className="text-slate-50"
                          />
                          <circle 
                            cx="50%" cy="50%" r="45%" 
                            stroke="currentColor" 
                            strokeWidth="10" 
                            fill="transparent" 
                            strokeDasharray="283"
                            strokeDashoffset={283 - (283 * (isRoot ? (tierFilledIn / 5) * 100 : pct)) / 100}
                            strokeLinecap="round"
                            className="text-dcp-green transition-all duration-1000"
                          />
                       </svg>
                       <div className="flex flex-col items-center">
                          <span className="text-4xl font-black text-slate-900">{isRoot ? tierFilledIn : referralCount}</span>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Recruits</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-3">
                      {isRoot ? "Current Tier Status" : "Mobilization Target"}
                    </p>
                    <h3 className="text-3xl font-black text-slate-900 mb-4 tracking-tight uppercase italic">
                      {isRoot ? (activeTier ? `${activeTier.name} Bunch` : "All Tiers Complete") : `Goal: ${quota} Members`}
                    </h3>
                    
                    <div className="flex flex-col md:flex-row gap-4 md:items-center">
                      <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${isRoot ? Math.round((tierFilledIn / 5) * 100) : pct}%` }}
                          transition={{ duration: 1, delay: 0.5 }}
                          className="h-full bg-slate-900 rounded-full"
                        />
                      </div>
                      <span className="text-sm font-black text-slate-900 shrink-0 whitespace-nowrap">
                        {isRoot ? Math.round((tierFilledIn / 5) * 100) : pct}% Complete
                      </span>
                    </div>

                    <p className="mt-4 text-sm text-slate-500 font-medium max-w-xl">
                      {isRoot
                        ? activeTier
                          ? `You are currently filling your ${activeTier.name} bunch. You need ${tierRemaining} more to unlock the next level.`
                          : "You have completed all your recruitment tiers. Exceptional leadership!"
                        : remaining > 0
                          ? `Continue your outreach in ${member?.ward}. You need ${remaining} more personal recruits to hit your quota.`
                          : "Outstanding! You have reached your primary mobilization quota."}
                    </p>
                  </div>
                </motion.div>
              </div>
            </section>

            {/* Goal context for non-root members */}
            {!isRoot && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex items-start gap-5"
              >
                <div className="w-12 h-12 rounded-2xl bg-dcp-green/10 border border-dcp-green/20 flex items-center justify-center shrink-0">
                  <Star size={20} className="text-dcp-green" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t('recruitment_goal')}</p>
                  <h4 className="font-black text-slate-900 mb-1">Recruit {quota} members to unlock rewards</h4>
                  <p className="text-xs text-slate-500">
                    You have <span className="font-black text-slate-900">{referralCount}</span> of <span className="font-black text-slate-900">{quota}</span> recruits.
                    {remaining > 0
                      ? ` Bring in ${remaining} more to hit your target and qualify for party recognition.`
                      : " You have reached your quota — well done!"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* TIER SYSTEM (root members only) */}
            {isRoot && (
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-3 mb-6">
                  <div className="flex items-center gap-3">
                    <Star className="text-dcp-green w-5 h-5" />
                    <div>
                      <h3 className="text-white font-black uppercase tracking-widest text-sm">{t('recruitment_tiers')}</h3>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                        {t('fill_bunch')}
                      </p>
                    </div>
                  </div>
                  {activeTier && (
                    <span
                      className="sm:ml-auto w-fit text-xs font-black px-3 py-1 rounded-full border"
                      style={{ color: activeTier.color, borderColor: activeTier.color + "60", background: activeTier.color + "15" }}
                    >
                      {activeTier.icon} {activeTier.name} Active
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {TIERS.map((tier, i) => (
                    <TierCard
                      key={tier.name}
                      tier={tier}
                      tierIndex={i}
                      referralCount={referralCount}
                      delay={0.35 + i * 0.07}
                    />
                  ))}
                </div>

                <div className="mt-6 pt-6 border-t border-slate-800">
                  <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">
                    <span>{t('overall_progress')}</span>
                    <span>{referralCount} / 25</span>
                  </div>
                  <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden">
                    {[1, 2, 3, 4].map((d) => (
                      <div
                        key={d}
                        className="absolute top-0 bottom-0 w-px bg-slate-700 z-10"
                        style={{ left: `${d * 20}%` }}
                      />
                    ))}
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: "linear-gradient(90deg, #CD7F32, #A8A9AD, #FFD700, #67e8f9, #93c5fd)",
                        width: `${pct}%`,
                      }}
                      initial={{ width: "0%" }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.6 }}
                    />
                  </div>
                </div>
              </motion.section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
