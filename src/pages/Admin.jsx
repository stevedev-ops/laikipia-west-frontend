import Diary from './Diary';
import AdminSecuritySettings from '../components/AdminSecuritySettings';
import { useState, useEffect, useCallback } from "react";
import { KeyRound, AlertCircle, Users, Star, Network, Database, ShieldCheck, MapPin, Search, Menu, X, CheckCircle2, ChevronRight, ChevronDown, Plus, Download, User, Smartphone, Hash, LayoutDashboard, BarChart3, LogOut, UserCheck, Mail, BookOpen, Truck, UserCog, ClipboardList, AlertTriangle, Phone, Link2, MessageSquare, Navigation, Trophy, UserPlus, Calendar, Megaphone, Loader2, BrainCircuit, Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import RegistrationForm from "../components/RegistrationForm";
import VoterLookup from "../components/VoterLookup";
import logo from "../assets/logo.png";
import { getChildrenById } from "../lib/memberCache";
import Reports from "./Reports";
import PollingCoverage from "./PollingCoverage";
import Canvass from "./Canvass";
import Transport from "./Transport";
import PollingAgents from "./PollingAgents";
import Pvt from "./Pvt";
import Incidents from "./Incidents";
import SecurityCommand from "./SecurityCommand";
import PhoneBank from "./PhoneBank";
import ContactMatcher from "./ContactMatcher";
import { exportToCSV } from "../lib/exportUtils";
import { LAIKIPIA_CONSTITUENCIES, ALL_LAIKIPIA_WARDS } from "../lib/constants";
import SmsExport from "./SmsExport";
import Gotv from "./Gotv";
import Leaderboard from "./Leaderboard";
import Enrollment from "./Enrollment";
import Events from "./Events";
import SecurityRoster from "./SecurityRoster";
import CheatSheets from "./CheatSheets";
import CampaignHierarchy from "./CampaignHierarchy";
import { useLanguage } from "../contexts/LanguageContext";

const PAGE_SIZE = 20;

// ─── Tier helper ─────────────────────────────────────────────────────────────
const TIER_MAP = [
  { min: 1,  max: 5,  name: "Bronze",   color: "text-amber-600",  bg: "bg-amber-100"  },
  { min: 6,  max: 10, name: "Silver",   color: "text-slate-500",  bg: "bg-slate-100"  },
  { min: 11, max: 15, name: "Gold",     color: "text-yellow-600", bg: "bg-yellow-100" },
  { min: 16, max: 20, name: "Platinum", color: "text-cyan-600",   bg: "bg-cyan-100"   },
  { min: 21, max: 25, name: "Diamond",  color: "text-blue-600",   bg: "bg-blue-100"   },
];
function getTierBadge(count) {
  if (!count) return null;
  const tier = TIER_MAP.find(t => count >= t.min && count <= t.max)
    || (count > 25 ? TIER_MAP[4] : null);
  return tier;
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

const InfoRow = ({ icon, label, value }) => (
  <div className="flex items-center gap-4 bg-black/20 p-3 rounded-xl border border-white/5">
    <div className="text-slate-500 shrink-0">{icon}</div>
    <div className="min-w-0">
      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-sm font-black text-white truncate">{value || 'N/A'}</p>
    </div>
  </div>
);

const LineageCard = ({ label, title, subtitle, badge, meta }) => (
  <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col justify-between hover:bg-black/40 transition-colors">
    <div className="flex justify-between items-start mb-3">
      <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{label}</p>
      {badge && <span className="px-2 py-0.5 rounded shadow-sm text-[9px] font-black uppercase tracking-widest bg-white/10 text-white/90 border border-white/10">{badge}</span>}
    </div>
    <div>
      <h4 className="text-sm font-black text-white leading-tight truncate">{title}</h4>
      <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-widest truncate">{subtitle}</p>
      {meta && <p className="text-[9px] text-dcp-green mt-2 font-bold uppercase tracking-widest">{meta}</p>}
    </div>
  </div>
);

const NavItem = ({ id, icon: Icon, label, count, activeTab, setActiveTab, onSelect }) => (
  <button 
    onClick={() => {
      setActiveTab(id);
      if (onSelect) onSelect();
      if (typeof window !== 'undefined' && window.innerWidth < 1024) {
        // Handled by onSelect or state
      }
    }}
    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
      activeTab === id 
        ? 'bg-slate-950 text-white shadow-md' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`}
  >
    <div className="flex items-center gap-3">
      <Icon size={18} className={activeTab === id ? 'text-dcp-green' : ''} />
      <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
    </div>
    {count !== undefined && (
      <span className={`text-[10px] px-2 py-1 rounded-md font-black ${
        activeTab === id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
      }`}>
        {count}
      </span>
    )}
  </button>
);

const TreeNode = ({ member, depth = 0, onSelectMember }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [children, setChildren] = useState([]);
  const [loading, setLoading] = useState(false);
  const [childrenCount, setChildrenCount] = useState(0);

  useEffect(() => {
    getChildrenById(member.id).then(ch => setChildrenCount(ch.length));
  }, [member.id]);

  const toggleExpand = async (e) => {
    if (e) e.stopPropagation();
    if (!isExpanded) {
      if (children.length === 0) {
        setLoading(true);
        const fetchedChildren = await getChildrenById(member.id);
        setChildren(fetchedChildren);
        setLoading(false);
      }
    }
    setIsExpanded(!isExpanded);
  };

  const toggleDetails = (e) => {
    if (e) e.stopPropagation();
    setIsDetailsOpen(!isDetailsOpen);
    if (onSelectMember) onSelectMember(member);
  };

  const isDigital = member.source && member.source !== 'field_mobilizer';
  const isRoot = !member.referred_by && !isDigital;
  const maxQuota = isRoot ? 25 : 5;
  const isFull = childrenCount >= maxQuota;

  return (
    <div className="w-full my-1.5">
      <div 
        onClick={toggleDetails}
        className={`flex items-center justify-between group py-3 px-3.5 rounded-2xl transition-all cursor-pointer border select-none ${
          isDetailsOpen ? 'bg-amber-50/80 border-amber-400 shadow-md' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-sm'
        }`}
        style={{ marginLeft: `${depth * 20}px` }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-xs font-black shadow-sm ${
            isRoot ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-slate-100 text-slate-600 border border-slate-200'
          }`}>
            {isRoot ? <Star size={16} /> : <User size={16} />}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h4 className="text-sm font-black text-slate-900 truncate">{member.full_name}</h4>
              {member.is_voter_verified && (
                <CheckCircle2 size={12} className="text-dcp-green shrink-0" title="Verified 2022 Voter" />
              )}
              {member.source && member.source !== 'field_mobilizer' && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                  {member.source}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5">
              {member.ward || 'No Ward'} {member.polling_station ? `· ${member.polling_station}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Downline recruits button if children exist */}
          {childrenCount > 0 && (
            <button 
              type="button"
              onClick={toggleExpand}
              className={`px-2.5 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                isExpanded ? 'bg-amber-200 text-amber-950 border border-amber-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Expand downline invitees"
            >
              <Users size={12} className={isExpanded ? 'text-amber-800' : 'text-slate-500'} />
              <span>{childrenCount}</span>
              {loading ? (
                <div className="w-2.5 h-2.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin ml-0.5" />
              ) : isExpanded ? (
                <ChevronDown size={13} className="text-amber-800" />
              ) : (
                <ChevronRight size={13} className="text-slate-400" />
              )}
            </button>
          )}

          {childrenCount === 0 && (
            <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-100 rounded-lg">
              0 recruits
            </span>
          )}

          {/* Details toggle arrow */}
          <button
            type="button"
            onClick={toggleDetails}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ${
              isDetailsOpen ? 'text-amber-700 bg-amber-100' : ''
            }`}
            title={isDetailsOpen ? "Collapse details" : "View details below"}
          >
            {isDetailsOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>
      </div>

      {/* Inline Details Dropdown Below Member */}
      {isDetailsOpen && (
        <div 
          className="border border-slate-200/90 bg-slate-50 rounded-2xl p-4 sm:p-5 my-2 space-y-3 text-xs animate-in fade-in duration-150 shadow-sm"
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">Phone</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{member.phone || 'N/A'}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">National ID</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{member.national_id || 'N/A'}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">Recruitment Source</p>
              <p className="font-bold text-slate-800 truncate mt-0.5 capitalize">{member.source || 'field_mobilizer'}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">Volunteer Role</p>
              <p className="font-bold text-slate-800 truncate mt-0.5 capitalize">{(member.volunteer_role || 'general_supporter').replace('_', ' ')}</p>
            </div>
          </div>

          {member.custom_role && (
            <div className="bg-purple-50 border border-purple-200 text-purple-900 p-2.5 rounded-xl text-xs">
              <strong>Custom Skill / Notes:</strong> {member.custom_role}
            </div>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap pt-1 border-t border-slate-200/80">
            <div className="flex items-center gap-2">
              {member.phone && (
                <a
                  href={`tel:${member.phone}`}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black flex items-center gap-1.5 shadow-sm transition"
                >
                  <Phone size={12} /> Call
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/?ref=${member.id}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Referral link copied!");
                }}
                className="px-3.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Link2 size={12} /> Copy Link
              </button>
            </div>

            <span className="text-[10px] font-bold text-slate-500">
              {childrenCount} direct downline recruits
            </span>
          </div>
        </div>
      )}

      {/* Children Downline Tree */}
      <AnimatePresence initial={false}>
        {isExpanded && children.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-l-2 border-slate-200 pl-2 sm:pl-3 ml-4 sm:ml-5 my-1"
          >
            {children.map(child => (
              <TreeNode 
                key={child.id} 
                member={child} 
                depth={depth + 1} 
                onSelectMember={onSelectMember}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Admin Component
// ─────────────────────────────────────────────────────────────────────────────


// ─── Invitee Drilldown Node (Recursive) ──────────────────────────────────────
function InviteeNode({ 
  member, 
  depth = 1,
  wardStationMap,
  onPromoteToRoot
}) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isInviteesOpen, setIsInviteesOpen] = useState(false);
  const [invitees, setInvitees] = useState([]);
  const [loadingInvitees, setLoadingInvitees] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const currentMember = member;
  const directCount = currentMember.recruits_count || 0;

  const toggleInvitees = async (e) => {
    if (e) e.stopPropagation();
    if (!isInviteesOpen && !hasLoaded) {
      setLoadingInvitees(true);
      try {
        const fetched = await getChildrenById(currentMember.id);
        setInvitees(fetched);
        setHasLoaded(true);
      } catch (err) {
        console.error("Failed to load invitees", err);
      } finally {
        setLoadingInvitees(false);
      }
    }
    setIsInviteesOpen(!isInviteesOpen);
  };

  const toggleDetails = (e) => {
    if (e) e.stopPropagation();
    setIsDetailsOpen(!isDetailsOpen);
  };

  return (
    <div className={`rounded-2xl border transition-all ${
      isDetailsOpen ? 'border-amber-300 bg-white shadow-sm' : 'border-slate-200/80 bg-white/90 hover:bg-white'
    }`}>
      {/* Invitee Row Header */}
      <div 
        onClick={toggleDetails}
        className="p-3.5 flex items-center justify-between gap-3 cursor-pointer select-none"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0 text-xs font-black">
            <User size={14} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h5 className="text-xs sm:text-sm font-black text-slate-900 truncate">{currentMember.full_name}</h5>
              {currentMember.is_voter_verified && (
                <CheckCircle2 size={11} className="text-dcp-green shrink-0" title="Verified 2022 Voter" />
              )}
              {currentMember.security_rank && currentMember.security_rank !== 'none' && (
                <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-blue-100 text-blue-800">
                  {currentMember.security_rank.replace('_', ' ')}
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate mt-0.5">
              {currentMember.ward || 'No Ward'} {currentMember.polling_station ? `· ${currentMember.polling_station}` : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* If they have invitees, show an arrow button specifically for invitees */}
          {directCount > 0 && (
            <button
              type="button"
              onClick={toggleInvitees}
              className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 transition ${
                isInviteesOpen 
                  ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
              }`}
              title="Toggle downline invitees"
            >
              <Users size={12} className={isInviteesOpen ? 'text-amber-700' : 'text-slate-500'} />
              <span>{directCount}</span>
              {loadingInvitees ? (
                <div className="w-2.5 h-2.5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin ml-0.5" />
              ) : isInviteesOpen ? (
                <ChevronDown size={12} className="text-amber-700" />
              ) : (
                <ChevronRight size={12} className="text-slate-400" />
              )}
            </button>
          )}

          {directCount === 0 && (
            <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 bg-slate-50 rounded-lg">
              0 recruits
            </span>
          )}

          {/* Details toggle arrow */}
          <button
            type="button"
            onClick={toggleDetails}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition ${
              isDetailsOpen ? 'text-amber-600 bg-amber-50' : ''
            }`}
            title={isDetailsOpen ? "Collapse details" : "View details"}
          >
            {isDetailsOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Details of Invitee */}
      {isDetailsOpen && (
        <div 
          className="border-t border-slate-100 bg-slate-50/70 p-4 space-y-3.5 text-xs animate-in fade-in duration-150"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Quick info grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">Phone</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{currentMember.phone || 'N/A'}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">National ID</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{currentMember.national_id || 'N/A'}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">Direct Recruits</p>
              <p className="font-bold text-slate-800 truncate mt-0.5">{directCount}</p>
            </div>
            <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-[8px] font-black uppercase text-slate-400">Voter Status</p>
              <p className={`font-bold truncate mt-0.5 ${currentMember.is_voter_verified ? 'text-emerald-700' : 'text-slate-500'}`}>
                {currentMember.is_voter_verified ? 'Verified' : 'Unverified'}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 flex-wrap pt-1">
            <div className="flex items-center gap-2">
              {currentMember.phone && (
                <a
                  href={`tel:${currentMember.phone}`}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Phone size={11} /> Call
                </a>
              )}
              <button
                type="button"
                onClick={() => {
                  const link = `${window.location.origin}/?ref=${currentMember.id}`;
                  navigator.clipboard.writeText(link);
                  toast.success("Referral link copied!");
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-[11px] font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <Link2 size={11} /> Copy Link
              </button>
            </div>

            {directCount > 0 && !isInviteesOpen && (
              <button
                type="button"
                onClick={toggleInvitees}
                className="px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 text-[11px] font-black flex items-center gap-1.5 transition"
              >
                <Users size={12} /> View {directCount} Downline Invitees <ChevronRight size={12} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Nested Invitees (Drill Down) */}
      {isInviteesOpen && (
        <div 
          className="border-t border-slate-200 bg-amber-50/20 p-3 sm:p-4 space-y-2.5 pl-3 sm:pl-5 border-l-4 border-l-amber-400"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between pb-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-800 flex items-center gap-1.5">
              <Users size={12} className="text-amber-600" />
              Direct Invitees of {currentMember.full_name} ({invitees.length})
            </p>
            <button
              type="button"
              onClick={toggleInvitees}
              className="text-[10px] font-bold text-slate-400 hover:text-slate-700"
            >
              Hide
            </button>
          </div>

          {loadingInvitees ? (
            <div className="py-4 text-center">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
              <p className="text-[10px] font-bold text-slate-400 uppercase">Loading invitees...</p>
            </div>
          ) : invitees.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No downline members found.</p>
          ) : (
            <div className="space-y-2">
              {invitees.map(inv => (
                <InviteeNode
                  key={inv.id}
                  member={inv}
                  depth={depth + 1}
                  wardStationMap={wardStationMap}
                  onPromoteToRoot={onPromoteToRoot}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Admin({ onLogout }) {
  const { t } = useLanguage();
  const handleSaveWhatsappLink = async () => {
    if (!tempWhatsappLink.trim()) {
      toast.error("Please enter a valid WhatsApp invite link");
      return;
    }
    setSavingWhatsapp(true);
    try {
      const { data, error } = await api.updateCampaignConfig("whatsapp_community_link", tempWhatsappLink.trim());
      if (error) {
        throw new Error(error.error || error.message || "Failed to update WhatsApp link");
      }
      setWhatsappLink(tempWhatsappLink.trim());
      setEditingWhatsapp(false);
      toast.success("✅ Official WhatsApp Community Link updated successfully!");
    } catch (err) {
      toast.error(err.message || "Failed to update WhatsApp link");
    } finally {
      setSavingWhatsapp(false);
    }
  };

  const copyShareLink = (platform) => {
    const origin = window.location.origin;
    const url = platform === "general" ? `${origin}/join` : `${origin}/join/${platform}`;
    navigator.clipboard.writeText(url);
    toast.success(`Copied ${platform.toUpperCase()} Join Link to clipboard!`);
  };

  const handleDownloadCallSmsList = async () => {
    setExportingCsv(true);
    try {
      const params = {};
      if (activeTab === "social") {
        params.is_digital = 'true';
        if (digitalSourceFilter !== "all") {
          params.source = digitalSourceFilter;
        }
      } else if (activeTab === "mobilizers") {
        params.referred_by = 'null';
      }

      if (wardFilter !== "all") params.ward = wardFilter;
      if (voterStatusFilter !== "all" && activeTab !== "social") params.voter_status = voterStatusFilter;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const filterLabel = activeTab === "social"
        ? `${digitalSourceFilter === "all" ? "All Channels" : digitalSourceFilter.toUpperCase()} Recruits`
        : (wardFilter === "all" ? "All Wards" : wardFilter);

      toast.info(`Preparing Call & SMS list for ${filterLabel}...`);
      await api.downloadMembersCsv(params);
      toast.success("✅ Downloaded Call & SMS list successfully!");
    } catch (err) {
      console.warn("API export failed, using local member export:", err);
      // Fallback: Export loaded members formatted specifically for calling/texting
      let sourceList = activeTab === "social" 
        ? digitalMembers 
        : (activeTab === "mobilizers" ? roots : allMembers);

      if (activeTab === "social") {
        if (digitalSourceFilter !== "all") {
          sourceList = sourceList.filter(m => {
            const s = (m.source || '').toLowerCase();
            if (digitalSourceFilter === 'x_twitter') return ['x', 'twitter', 'x_twitter'].includes(s);
            if (digitalSourceFilter === 'whatsapp') return ['wa', 'whatsapp'].includes(s);
            if (digitalSourceFilter === 'tiktok') return ['tt', 'tiktok'].includes(s);
            if (digitalSourceFilter === 'facebook') return ['fb', 'facebook'].includes(s);
            if (digitalSourceFilter === 'social_media') return ['social_media', 'social', 'social_link', 'website', 'web'].includes(s);
            return s === digitalSourceFilter.toLowerCase();
          });
        }
        if (wardFilter !== "all") {
          sourceList = sourceList.filter(m => (m.official_ward || m.ward || '').toLowerCase() === wardFilter.toLowerCase());
        }
        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          sourceList = sourceList.filter(m => 
            (m.full_name || '').toLowerCase().includes(q) || 
            (m.phone || '').includes(q) || 
            (m.national_id || '').includes(q)
          );
        }
      }

      const dataToExport = sourceList.map(m => ({
        "Full Name": m.full_name,
        "Phone (Call / SMS)": m.phone,
        "Ward": m.official_ward || m.ward,
        "Polling Station": m.official_polling_station || m.polling_station || "N/A",
        "Source Channel": m.source || "field_mobilizer",
        "Volunteer Role": (m.volunteer_role || "general_supporter").replace('_', ' ').toUpperCase(),
        "Custom Skills / Notes": m.custom_role || "",
        "Mobilizer": m.referrer_name || (m.referred_by ? "Delegate" : "Unassigned Online Supporter"),
        "2022 Verified Voter": m.is_voter_verified ? "YES" : "NO"
      }));
      const fileLabel = activeTab === "social" 
        ? `digital_${digitalSourceFilter}_${wardFilter.toLowerCase().replace(/\s+/g, '_')}` 
        : `members_${wardFilter.toLowerCase().replace(/\s+/g, '_')}`;
      exportToCSV(dataToExport, `dcp_${fileLabel}_${new Date().toISOString().split('T')[0]}`);
      toast.success("✅ Downloaded contact list!");
    } finally {
      setExportingCsv(false);
    }
  };

  const loadDigitalMembers = useCallback(async (q = "", ward = "all", source = "all") => {
    setLoadingDigital(true);
    try {
      const params = { is_digital: 'true' };
      if (q.trim()) params.search = q.trim();
      if (ward !== 'all') params.ward = ward;
      if (source !== 'all') params.source = source;

      const { data, error } = await api.getMembers(params);
      if (data) {
        const list = (data.results || []).filter(m => !m.is_admin && !m.is_staff);
        setDigitalMembers(list);
        setDigitalCount(data.count || list.length);
      }
    } catch (err) {
      console.error("Error loading digital recruits", err);
    } finally {
      setLoadingDigital(false);
    }
  }, []);

  const handlePanicWipe = () => {
    localStorage.clear();
    window.location.href = "https://www.google.com/search?q=weather+in+nairobi";
  };
  const navigate = useNavigate();

  // Primary State
  const [activeTab, setActiveTab] = useState("overview");
  const [isSecurityMode, setIsSecurityMode] = useState(false);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [wardInsights, setWardInsights] = useState([]);

  // Emergency Broadcast State
  const [activeBroadcast, setActiveBroadcast] = useState(null);
  const [broadcastText, setBroadcastText] = useState("");
  const [broadcastSeverity, setBroadcastSeverity] = useState("critical");
  const [broadcastTargetType, setBroadcastTargetType] = useState("global");
  const { wardStationMap } = useLocationData();
  const [broadcastTargetWards, setBroadcastTargetWards] = useState([]);
  const [broadcastTargetStations, setBroadcastTargetStations] = useState([]);
  const [broadcastTargetMembers, setBroadcastTargetMembers] = useState([]);
  const [isBroadcasting, setIsBroadcasting] = useState(false); 
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => typeof window !== 'undefined' ? window.innerWidth >= 1024 : false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalStep, setAddModalStep] = useState('lookup');
  const [showSecurityModal, setShowSecurityModal] = useState(false);

  // Sidebar Notification Counts
  const [transportCount, setTransportCount] = useState(0);
  const [incidentCount, setIncidentCount] = useState(0);

  // Dynamic WhatsApp Community & Social Join Config
  const [whatsappLink, setWhatsappLink] = useState("https://chat.whatsapp.com/sample");
  const [editingWhatsapp, setEditingWhatsapp] = useState(false);
  const [tempWhatsappLink, setTempWhatsappLink] = useState("");
  const [savingWhatsapp, setSavingWhatsapp] = useState(false);

  // Ward Filter & Call/SMS Export State
  const [wardFilter, setWardFilter] = useState("all");
  const [exportingCsv, setExportingCsv] = useState(false);

  // Digital & Social Recruits State
  const [digitalMembers, setDigitalMembers] = useState([]);
  const [digitalCount, setDigitalCount] = useState(0);
  const [loadingDigital, setLoadingDigital] = useState(false);
  const [digitalSourceFilter, setDigitalSourceFilter] = useState("all");
  const [selectedSocialIds, setSelectedSocialIds] = useState(new Set());
  const [isConvertingSocial, setIsConvertingSocial] = useState(false);

  const handleConvertToMobilizer = async (idsToConvert) => {
    const ids = Array.isArray(idsToConvert) ? idsToConvert : [idsToConvert];
    if (ids.length === 0) return;

    const confirmMsg = ids.length === 1
      ? "Promote this social recruit to a Polling Station Mobilizer?"
      : `Promote ${ids.length} selected social recruits to Polling Station Mobilizers?`;

    if (!window.confirm(confirmMsg)) return;

    setIsConvertingSocial(true);
    try {
      const res = await api.convertToMobilizer(ids);
      if (res && res.status === "success") {
        toast.success(res.message || `Promoted ${res.converted_count || ids.length} recruit(s) to Mobilizer!`);
        setSelectedSocialIds(new Set());
        loadDigitalMembers(searchQuery, wardFilter, digitalSourceFilter);
        loadRootPage(0, searchQuery);
        loadMembersPage(0, searchQuery, voterStatusFilter);
      }
    } catch (err) {
      toast.error(err?.message || "Failed to promote recruit(s)");
    } finally {
      setIsConvertingSocial(false);
    }
  };

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [transRes, incRes] = await Promise.all([
          api.getTransport(),
          api.getIncidents()
        ]);
        if (transRes.data) {
          setTransportCount(transRes.data.filter(t => t.status === 'pending').length);
        }
        if (incRes.data) {
          setIncidentCount(incRes.data.filter(i => i.status !== 'resolved').length);
        }
      } catch (err) {}
    };
    fetchCounts();
    const interval = setInterval(fetchCounts, 60000);
    return () => clearInterval(interval);
  }, []);
  const [addModalPrefill, setAddModalPrefill] = useState(null);
  const [addModalVoter, setAddModalVoter] = useState(null);
  const [selectedMember, setSelectedMember] = useState(null);
  const [mainInvitees, setMainInvitees] = useState([]);
  const [showMainInvitees, setShowMainInvitees] = useState(false);
  const [loadingMainInvitees, setLoadingMainInvitees] = useState(false);

  useEffect(() => {
    setMainInvitees([]);
    setShowMainInvitees(false);
    setLoadingMainInvitees(false);
  }, [selectedMember?.id]);

  const toggleMainMemberInvitees = async (e) => {
    if (e) e.stopPropagation();
    if (!showMainInvitees && mainInvitees.length === 0 && selectedMember) {
      setLoadingMainInvitees(true);
      setShowMainInvitees(true);
      try {
        const children = await getChildrenById(selectedMember.id);
        setMainInvitees(children);
      } catch (err) {
        console.error("Failed to load invitees", err);
      } finally {
        setLoadingMainInvitees(false);
      }
    } else {
      setShowMainInvitees(!showMainInvitees);
    }
  };
  const [generatedInvite, setGeneratedInvite] = useState(null);
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);

  // Global System Stats
  const [totalRegistered, setTotalRegistered] = useState(0);
  const [totalRoots, setTotalRoots] = useState(0);
  const [verifiedVoters, setVerifiedVoters] = useState(0);
  const [unverifiedNew, setUnverifiedNew] = useState(0);
  const [dbStatus, setDbStatus] = useState("checking"); // "checking" | "online" | "error"

  // Pagination & Data States for Roots
  const [roots, setRoots] = useState([]);
  const [rootPage, setRootPage] = useState(0);
  const [hasMoreRoots, setHasMoreRoots] = useState(true);
  const [loadingMoreRoots, setLoadingMoreRoots] = useState(false);
  
  // Pagination & Data States for All Members
  const [allMembers, setAllMembers] = useState([]);
  const [memberPage, setMemberPage] = useState(0);
  const [hasMoreMembers, setHasMoreMembers] = useState(true);
  const [loadingMoreMembers, setLoadingMoreMembers] = useState(false);
  const [voterStatusFilter, setVoterStatusFilter] = useState("all"); // "all" | "verified" | "unverified"
  const [memberSort, setMemberSort] = useState("id"); // "id" | "voter_status"

  // Voter Registry States
  const [voterRecords, setVoterRecords] = useState([]);
  const [voterPage, setVoterPage] = useState(0);
  const [hasMoreVoters, setHasMoreVoters] = useState(true);
  const [loadingVoters, setLoadingVoters] = useState(false);
  const [voterSearch, setVoterSearch] = useState("");

  // Overview extras
  const [recentMembers, setRecentMembers] = useState([]);
  const [wardSnapshot, setWardSnapshot] = useState([]);

  const loadOverviewData = useCallback(async () => {
    try {
      const { data: allData } = await api.getMembers({});
      const list = Array.isArray(allData) ? allData : (allData?.results || []);
      const filteredList = list.filter(m => !m.is_admin && !m.is_staff);
      const recent = filteredList.slice(0, 6);
      setRecentMembers(recent);
      const map = {};
      filteredList.forEach(m => { const w = m.ward || 'Unknown'; map[w] = (map[w] || 0) + 1; });
      const sorted = Object.entries(map).map(([ward, count]) => ({ ward, count })).sort((a, b) => b.count - a.count).slice(0, 5);
      setWardSnapshot(sorted);
    } catch (e) { console.error('Overview data error:', e); }
  }, []);

  // Selected Member Analytics
  const [selectedMemberDirectCount, setSelectedMemberDirectCount] = useState(0);
  const [selectedMemberNetworkSize, setSelectedMemberNetworkSize] = useState(0);
  const [selectedMemberLineage, setSelectedMemberLineage] = useState([]);

  // Fetch Total Registrations + Root Count + DB Health
  const loadTotalRegistered = useCallback(async () => {
    try {
      const { data: stats, error } = await api.getStats();
      if (error) throw new Error("Query failed");
      setTotalRegistered(stats.total_registered);
      setTotalRoots(stats.total_roots);
      setVerifiedVoters(stats.verified_voters || 0);
      setUnverifiedNew(stats.unverified_new || 0);
      setDbStatus("online");
    } catch (e) {
      console.error("Stats count error:", e);
      setDbStatus("error");
    }
  }, []);

  // Fetch Roots Page
  const loadRootPage = useCallback(async (pageIdx, q = "") => {
    setLoadingMoreRoots(true);
    try {
      const { data, error } = await api.getMembers({ 
        referred_by: 'null', 
        search: q,
        page: pageIdx + 1
      });
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) {
          navigate('/');
        }
        throw error;
      }
      if (data) {
        const members = (data.results || []).filter(m => !m.is_admin && !m.is_staff);
        if (pageIdx === 0) setRoots(members);
        else setRoots(prev => [...prev, ...members]);
        setHasMoreRoots(!!data.next);
        setRootPage(pageIdx);
      }
    } catch (err) { console.error(err); toast.error("Error loading mobilizers"); }
    finally { setLoadingMoreRoots(false); }
  }, [navigate]);

  // Fetch Members Page
  const loadMembersPage = useCallback(async (pageIdx, q = "", voterStatus = "all", ward = wardFilter) => {
    setLoadingMoreMembers(true);
    try {
      const params = { 
        search: q,
        page: pageIdx + 1,
        sort: memberSort === "voter_status" ? "voter_status" : undefined
      };
      if (voterStatus !== "all") {
        params.voter_status = voterStatus;
      }
      if (ward && ward !== "all") {
        params.ward = ward;
      }

      const { data, error } = await api.getMembers(params);
      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) {
          navigate('/');
        }
        throw error;
      }
      if (data) {
        const members = (data.results || []).filter(m => !m.is_admin && !m.is_staff);
        if (pageIdx === 0) setAllMembers(members);
        else setAllMembers(prev => [...prev, ...members]);
        setHasMoreMembers(!!data.next);
        setMemberPage(pageIdx);
      }
    } catch (err) { console.error(err); toast.error("Error loading recruits"); }
    finally { setLoadingMoreMembers(false); }
  }, [navigate, memberSort, wardFilter]);


  const loadWardInsights = useCallback(async () => {
    try {
      setLoadingInsights(true);
      const { data } = await api.getWardHealthInsights();
      if (data && data.insights) setWardInsights(data.insights);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingInsights(false);
    }
  }, []);

  // Debounced search & filter effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (activeTab === "mobilizers") {
        loadRootPage(0, searchQuery);
      } else if (activeTab === "all") {
        loadMembersPage(0, searchQuery, voterStatusFilter);
      } else if (activeTab === "social") {
        loadDigitalMembers(searchQuery, wardFilter, digitalSourceFilter);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, voterStatusFilter, activeTab, wardFilter, digitalSourceFilter, loadRootPage, loadMembersPage, loadDigitalMembers]);


  // Fetch Voter Records
  const loadVoterRecordsPage = useCallback(async (pageIdx, q = "") => {
    setLoadingVoters(true);
    try {
      const { data, error } = await api.getVoterRecords({ 
        search: q,
        page: pageIdx + 1
      });
      if (data) {
        if (pageIdx === 0) setVoterRecords(data.results || []);
        else setVoterRecords(prev => [...prev, ...(data.results || [])]);
        setHasMoreVoters(!!data.next);
        setVoterPage(pageIdx);
      }
    } catch (err) { console.error(err); }
    finally { setLoadingVoters(false); }
  }, []);

  const loadBroadcast = useCallback(async () => {
    try {
      const { data } = await api.getBroadcast();
      if (data && data.is_active) setActiveBroadcast(data);
      else setActiveBroadcast(null);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Initial Fetch
  useEffect(() => {
    loadTotalRegistered();
    loadRootPage(0, "");
    loadMembersPage(0, "", voterStatusFilter);
    loadDigitalMembers("", "all", "all");
    loadOverviewData();
    loadBroadcast();
    
    api.getMe().then(({ data }) => {
      if (data) setCurrentUser(data);
    });
  }, [loadTotalRegistered, loadRootPage, loadMembersPage, loadOverviewData, loadBroadcast]);

  const handleSetBroadcast = async () => {
    if (!broadcastText.trim()) {
      toast.error("Message is required.");
      return;
    }
    setIsBroadcasting(true);
    try {
      const { data, error } = await api.adminCreateBroadcast({
        message: broadcastText,
        severity: broadcastSeverity,
        target_type: broadcastTargetType,
        target_wards: broadcastTargetWards,
        target_polling_stations: broadcastTargetStations,
        target_member_ids: broadcastTargetMembers.map(m => m.id)
      });
      if (error) throw error;
      setActiveBroadcast(data);
      setBroadcastText("");
      setBroadcastTargetMembers([]);
      setBroadcastTargetWards([]);
      setBroadcastTargetStations([]);
      toast.success("Targeted Emergency Broadcast sent!");
    } catch (err) {
      toast.error(err.message || "Failed to send broadcast");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleClearBroadcast = async () => {
    setIsBroadcasting(true);
    try {
      const { error } = await api.adminClearBroadcast();
      if (error) throw error;
      setActiveBroadcast(null);
      toast.success("Broadcast cleared.");
    } catch (err) {
      toast.error("Failed to clear broadcast");
    } finally {
      setIsBroadcasting(false);
    }
  };

  useEffect(() => {
    if (activeTab === "voter-registry") {
      const timer = setTimeout(() => {
        loadVoterRecordsPage(0, voterSearch);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, voterSearch, loadVoterRecordsPage]);

  // Deep Network Analytics logic
  const computeNetworkStats = useCallback(async (memberId) => {
    let directCount = 0;
    let totalNetwork = 0;
    try {
      const directs = await getChildrenById(memberId);
      directCount = directs.length;
      totalNetwork += directs.length;
      
      let processing = [...directs];
      let depthLimit = 1;
      while (processing.length > 0 && depthLimit < 6) {
        let nxt = [];
        for (let p of processing) {
          const ch = await getChildrenById(p.id);
          totalNetwork += ch.length;
          nxt.push(...ch);
        }
        processing = nxt;
        depthLimit++;
      }
    } catch (err) { console.error(err); }
    return { directCount, totalNetwork };
  }, []);

  const buildLineage = useCallback(async (memberId) => {
    try {
      const { data: insights } = await api.getInsights(memberId);
      return insights?.lineage || [];
    } catch (err) { console.error(err); return []; }
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (selectedMember) {
      setSelectedMemberNetworkSize(0);
      setSelectedMemberDirectCount(0);
      setSelectedMemberLineage([]);
      (async () => {
        const stats = await computeNetworkStats(selectedMember.id);
        const lineage = await buildLineage(selectedMember.id);
        if (!cancelled) {
          setSelectedMemberDirectCount(stats.directCount);
          setSelectedMemberNetworkSize(stats.totalNetwork);
          setSelectedMemberLineage(lineage);
        }
      })();
    }
    return () => { cancelled = true; };
  }, [selectedMember, computeNetworkStats, buildLineage]);

  const handlePromoteToRoot = async () => {
    if (!selectedMember || !selectedMember.referred_by) return;
    if (!window.confirm(`Are you sure you want to promote ${selectedMember.full_name} to a Root Mobilizer? They will be detached from their current referrer.`)) return;

    try {
      const { data, error } = await api.updateMember(selectedMember.id, { referred_by: null });
      if (error) throw new Error(error.message || "Failed to promote");
      
      toast.success(`${selectedMember.full_name} is now a Root Mobilizer!`);
      setSelectedMember(null);
      loadRootPage(0, searchQuery);
      loadMembersPage(0, searchQuery, voterStatusFilter);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const directInviter = selectedMemberLineage.length > 1 ? selectedMemberLineage[selectedMemberLineage.length - 2] : null;
  const topMobilizer = selectedMemberLineage.length > 0 ? selectedMemberLineage[0] : null;
  const selectedMemberTier = selectedMemberLineage.length;
  const selectedMemberDepth = selectedMemberTier - 1;

  const getTierValue = (member) => {
    if (!member) return 0;
    const idx = selectedMemberLineage.findIndex(m => m.id === member.id);
    return idx + 1;
  };

  const generateInviteToken = async () => {
    setIsGeneratingInvite(true);
    try {
      const { data, error } = await api.createInvite({ target_role: 'root' });
      
      if (error) throw error;
      if (data) {
        const url = `${window.location.origin}/?invite=${data.id}`;
        setGeneratedInvite(url);
        toast.custom((t) => (
          <div className="bg-slate-900 border border-amber-400/30 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 min-w-[320px]">
            <p className="text-[10px] font-black uppercase tracking-widest text-amber-400">One-Time Invite Generated</p>
            <p className="text-white text-xs font-mono break-all bg-white/5 p-2 rounded-lg">{url}</p>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(url);
                toast.dismiss(t);
                toast.success("Invite link copied!");
              }}
              className="bg-amber-400 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-300 transition-colors"
            >
              Copy & Close
            </button>
          </div>
        ), { duration: 6000 });
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate invite token");
    } finally {
      setIsGeneratingInvite(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex w-full">
      <AnimatePresence initial={false}>
         {isSidebarOpen && (
            <>
              {/* Mobile overlay backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSidebarOpen(false)}
                className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-30 lg:hidden"
              />
              <motion.div 
                 initial={{ x: -300 }}
                 animate={{ x: 0 }}
                 exit={{ x: -300 }}
                 transition={{ type: "spring", stiffness: 300, damping: 30 }}
                 className="w-72 bg-white border-r border-slate-200 shadow-2xl lg:shadow-sm z-40 flex flex-col fixed inset-y-0 left-0"
              >
               <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                     <div className="bg-slate-100 p-2 rounded-xl">
                        <img src={logo} alt="DCP" className="w-10 h-10 object-contain mix-blend-multiply" />
                     </div>
                     <div>
                        <h2 className="text-base font-black text-slate-900 uppercase tracking-widest leading-none">HQ Admin</h2>
                        <span className="text-[9px] text-dcp-green font-bold uppercase tracking-[0.2em] mt-1 block">Command Center</span>
                     </div>
                  </div>
                  <button onClick={() => setIsSidebarOpen(false)} className="md:hidden p-2 text-slate-400 hover:bg-slate-100 rounded-lg">
                     <X size={18} />
                  </button>
               </div>
               <div className="flex-1 p-4 space-y-2 overflow-y-auto">
                  {isSecurityMode ? (
                     <>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 py-2 mt-2">Security Operations</p>
                        <NavItem id="security-command" icon={ShieldCheck} label="Security Overview" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="security-roster" icon={Users} label="Security Roster" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="incidents" icon={AlertTriangle} label="Incident Reports" count={incidentCount > 0 ? incidentCount : undefined} activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Intelligence & Field</p>
                        <NavItem id="voter-registry" icon={Database} label="Voter Registry" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="coverage" icon={MapPin} label="Coverage Map" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="agents" icon={UserCog} label="Polling Agents" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="events" icon={Calendar} label="Rally Security" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        
                        <div className="mt-8 px-2">
                           <button onClick={() => setShowSecurityModal(true)} className="w-full flex items-center gap-3 p-3 rounded-xl transition-all text-slate-300 bg-slate-900 border border-slate-700 hover:bg-slate-800 hover:text-white shadow-lg">
                              <ShieldCheck size={18} className="text-blue-400" />
                              <span className="text-xs font-bold uppercase tracking-widest">Deploy Security</span>
                           </button>
                        </div>
                     </>
                  ) : (
                     <>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 py-2 mt-2">Dashboard</p>
                        <NavItem id="overview" icon={LayoutDashboard} label="Overview" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Network</p>
                        <NavItem id="tree" icon={Network} label="Hierarchy" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="mobilizers" icon={Star} label="Mobilizers" count={roots.length} activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="social" icon={Megaphone} label="Social Recruits" count={digitalCount} activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="all" icon={Users} label="All Members" count={totalRegistered} activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Intelligence</p>
                        <NavItem id="voter-registry" icon={Database} label="Voter Registry" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="analytics" icon={BarChart3} label="System Analytics" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-4 pt-6 pb-2">Operations</p>
                        <NavItem id="coverage" icon={MapPin} label="Coverage" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="canvass" icon={BookOpen} label="Panna (Canvass)" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="transport" icon={Truck} label="Boda Transport" count={transportCount > 0 ? transportCount : undefined} activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="agents" icon={UserCog} label="Polling Agents" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="tally" icon={ClipboardList} label="PVT Tally" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="phonebank" icon={Phone} label="Phone Bank" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="matcher" icon={Link2} label="Contact Matcher" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="sms" icon={MessageSquare} label="SMS Export" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="diary" icon={Calendar} label="Governor's Diary" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="events" icon={Calendar} label="Rally Check-ins" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="gotv" icon={Navigation} label="GOTV" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="leaderboard" icon={Trophy} label="Leaderboard" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="enroll" icon={UserPlus} label="Enroll Member" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="training" icon={BookOpen} label="Training Materials" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                        <NavItem id="security-settings" icon={KeyRound} label="Admin Password" activeTab={activeTab} setActiveTab={setActiveTab} onSelect={() => { if (typeof window !== "undefined" && window.innerWidth < 1024) setIsSidebarOpen(false); }} />
                     </>
                  )}
               </div>
               <div className="p-4 border-t border-slate-100">
                  <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md">
                     <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-full bg-dcp-green/20 border border-dcp-green/30 flex items-center justify-center">
                           <ShieldCheck size={14} className="text-dcp-green" />
                        </div>
                        <div>
                            <p className="text-xs font-black uppercase tracking-widest">{currentUser?.full_name || 'System Admin'}</p>
                            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">{currentUser?.is_admin ? 'HQ Administrator' : currentUser?.security_rank ? currentUser.security_rank.replace('_', ' ') : currentUser?.is_security_only ? 'Security Personnel' : 'Mobilizer'}</p>
                        </div>
                     </div>
                     {!isSecurityMode ? (
                       <button onClick={() => { setIsSecurityMode(true); setActiveTab('security-command'); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-[10px] font-black uppercase tracking-widest mt-2 text-white border border-slate-700 shadow-md">
                          <ShieldCheck size={14} className="text-blue-400" /> Switch to Security
                       </button>
                     ) : (
                       <button onClick={() => { setIsSecurityMode(false); setActiveTab('overview'); if(window.innerWidth < 768) setIsSidebarOpen(false); }} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 transition-colors text-[10px] font-black uppercase tracking-widest mt-2 text-white border border-slate-700 shadow-md">
                          <LayoutDashboard size={14} className="text-dcp-green" /> Switch to General
                       </button>
                     )}
                     <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-[10px] font-bold uppercase tracking-widest mt-2">
                        <LogOut size={14} /> Sign Out
                     </button>
                     <button onClick={handlePanicWipe} className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 transition-colors text-[10px] font-black uppercase tracking-widest mt-2 shadow-lg shadow-red-500/20">
                        <AlertTriangle size={14} /> {t('wipe_device')}
                     </button>
                  </div>
               </div>
            </motion.div>
            </>
         )}
      </AnimatePresence>

      <div className={`flex-1 flex flex-col min-w-0 min-h-screen transition-all bg-slate-50/50 ${isSidebarOpen ? 'lg:ml-72' : ''}`}>
        <header className="h-16 sm:h-20 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between shrink-0 shadow-sm sticky top-0 z-20 w-full min-w-0 gap-2">
         <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
            <button 
               onClick={() => setIsSidebarOpen(v => !v)} 
               className="p-2 sm:p-2.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl shadow-sm transition-colors shrink-0"
               aria-label="Toggle menu"
            >
               <Menu size={18} />
            </button>
            <div className="min-w-0 flex-1">
               <h1 className="text-xs sm:text-base md:text-xl font-black text-slate-900 uppercase tracking-wider sm:tracking-widest truncate">
                  {activeTab === 'overview' && 'System Overview'}
                  {activeTab === 'tree' && 'Mobilization Tree'}
                  {activeTab === 'mobilizers' && 'Root Directory'}
                  {activeTab === 'social' && 'Social & Digital Recruits'}
                  {activeTab === 'all' && 'Membership Registry'}
                  {activeTab === 'security-command' && 'HQ Security Command'}
                  {activeTab === 'voter-registry' && '2022 Official Voter Database'}
                  {activeTab === 'analytics' && 'Official Party Reports'}
                  {activeTab === 'coverage' && 'Polling Coverage Map'}
                  {activeTab === 'canvass' && 'Panna Canvass Management'}
                  {activeTab === 'transport' && 'Boda Transport Management'}
                  {activeTab === 'agents' && 'Polling Agent Management'}
                  {activeTab === 'tally' && 'PVT Parallel Vote Tally'}
                  {activeTab === 'incidents' && 'Alerts & Incident Reports'}
                  {activeTab === 'phonebank' && 'Phone Bank Operations'}
                  {activeTab === 'matcher' && 'Relational Contact Matcher'}
                  {activeTab === 'sms' && 'SMS Export'}
                  {activeTab === 'diary' && "Governor's Campaign Diary & Chamas"}
                  {activeTab === 'events' && 'Rally & Event Check-ins'}
                  {activeTab === 'gotv' && 'GOTV — Get Out The Vote'}
                  {activeTab === 'leaderboard' && 'Mobilizer Leaderboard'}
                  {activeTab === 'enroll' && 'Enroll New Member'}
                  {activeTab === 'training' && 'Printable Training Materials'}
               </h1>
               <div className="flex items-center gap-2 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-dcp-green animate-pulse"></span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">{totalRegistered} Recruits Synced</p>
               </div>
            </div>
         </div>
         <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
           <button onClick={() => { setShowSecurityModal(true); }} className="bg-slate-800 border border-slate-700 text-white px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-[10px] items-center gap-1.5 hover:bg-slate-700 transition-colors shadow-sm flex shrink-0">
              <ShieldCheck size={14} className="text-blue-400 shrink-0" /> 
              <span className="hidden xs:inline">Security</span>
           </button>
           <button onClick={() => { setShowAddModal(true); setAddModalStep('lookup'); setAddModalPrefill(null); }} className="bg-slate-950 text-white px-2.5 py-2 sm:px-4 sm:py-2.5 rounded-xl font-bold uppercase tracking-widest text-[9px] sm:text-[10px] items-center gap-1.5 hover:bg-slate-800 transition-colors shadow-sm flex shrink-0">
              <Plus size={14} className="text-dcp-green shrink-0" /> 
              <span className="hidden xs:inline">Add Root</span>
           </button>
         </div>
        </header>

        <main className="flex-1 p-4 md:p-8 relative flex flex-col md:flex-row gap-6">
          <div className="flex-1 flex flex-col w-full">
            {activeTab === "security-command" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full max-w-6xl mx-auto">
                <SecurityCommand />
              </div>
            ) : activeTab === "security-roster" ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full flex-1">
                <SecurityRoster />
              </div>
            ) : activeTab === "overview" ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Users size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Members</p>
                    <p className="text-4xl font-black text-slate-900">{totalRegistered.toLocaleString()}</p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Verified Voters</span><span>Unverified</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden flex">
                        <div
                          className="h-full bg-dcp-green transition-all duration-700"
                          style={{ width: totalRegistered > 0 ? `${Math.round((verifiedVoters / totalRegistered) * 100)}%` : '0%' }}
                        />
                        <div className="h-full flex-1 bg-amber-400/40" />
                      </div>
                      <div className="flex justify-between text-[9px] font-black text-slate-500">
                        <span>{verifiedVoters}</span>
                        <span>{unverifiedNew}</span>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Star size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Root Mobilizers</p>
                    <p className="text-4xl font-black text-slate-900">{totalRoots}</p>
                    <div className="mt-4 space-y-1.5">
                      <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-400">
                        <span>Network Capacity</span>
                        <span>{(totalRoots * 25).toLocaleString()} slots</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-amber-400 transition-all duration-700"
                          style={{ width: totalRoots > 0 ? `${Math.min(100, Math.round(((totalRegistered - totalRoots) / (totalRoots * 25)) * 100))}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {totalRoots > 0 ? Math.min(100, Math.round(((totalRegistered - totalRoots) / (totalRoots * 25)) * 100)) : 0}% capacity used
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 opacity-[0.03]"><Network size={120} /></div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Avg. Recruits / Root</p>
                    <div className="flex items-end gap-1.5">
                      <p className="text-4xl font-black text-slate-900">
                        {totalRoots > 0 ? (((totalRegistered - totalRoots) / totalRoots)).toFixed(1) : '0.0'}
                      </p>
                      <p className="text-base font-black text-slate-300 mb-1">/ 25</p>
                    </div>
                    <div className="mt-4 space-y-1.5">
                      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className="h-full bg-dcp-green transition-all duration-700"
                          style={{ width: totalRoots > 0 ? `${Math.min(100, Math.round((((totalRegistered - totalRoots) / totalRoots) / 25) * 100))}%` : '0%' }}
                        />
                      </div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {totalRoots > 0 ? Math.round(25 - (totalRegistered - totalRoots) / totalRoots) : 25} slots avg. remaining
                      </p>
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-900 p-6 shadow-lg flex flex-col justify-between items-start">
                    <div className="w-full">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">System Health</p>
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${dbStatus === 'online' ? 'bg-dcp-green/20 border-dcp-green/30' : dbStatus === 'error' ? 'bg-red-500/20 border-red-500/30' : 'bg-slate-700 border-slate-600'}`}>
                          <Database size={20} className={dbStatus === 'online' ? 'text-dcp-green' : dbStatus === 'error' ? 'text-red-400' : 'text-slate-400'} />
                        </div>
                        <div>
                          <p className="text-sm font-black text-white">
                            {dbStatus === 'online' ? 'Operational' : dbStatus === 'error' ? 'Degraded' : 'Connecting...'}
                          </p>
                          <p className={`text-[10px] font-bold mt-0.5 uppercase tracking-widest ${dbStatus === 'online' ? 'text-dcp-green' : dbStatus === 'error' ? 'text-red-400' : 'text-slate-500'}`}>
                            {dbStatus === 'online' ? 'Real-time sync' : dbStatus === 'error' ? 'Check connection' : 'Please wait'}
                          </p>
                        </div>
                      </div>
                      <div className="border-t border-slate-800 pt-3 flex flex-col gap-2 w-full">
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Verified Voters</p>
                          <p className="text-sm font-black text-dcp-green">{verifiedVoters.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">New Registrants</p>
                          <p className="text-sm font-black text-amber-400">{unverifiedNew.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digital Recruitment & Official WhatsApp Link Settings */}
                <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl border border-slate-800">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest border border-emerald-500/30">
                          Digital Supporter Channel
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                          Public Join Links
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-white tracking-tight">
                        WhatsApp Community & Social Media Recruitment
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                        Supporters who register online join separately from ground mobilizer quotas. Set your official WhatsApp Community invite link below to welcome them automatically.
                      </p>
                    </div>

                    {/* WhatsApp Community Link Setting */}
                    <div className="bg-black/40 border border-white/10 rounded-2xl p-4 min-w-[280px] sm:min-w-[340px]">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center justify-between">
                        <span>Official WhatsApp Community</span>
                        <span className="text-emerald-400 font-bold">HQ Verified</span>
                      </p>
                      {editingWhatsapp ? (
                        <div className="space-y-2 mt-2">
                          <input
                            type="url"
                            value={tempWhatsappLink}
                            onChange={(e) => setTempWhatsappLink(e.target.value)}
                            placeholder="https://chat.whatsapp.com/..."
                            className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-emerald-500/50 text-white text-xs focus:outline-none"
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={handleSaveWhatsappLink}
                              disabled={savingWhatsapp}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition disabled:opacity-50"
                            >
                              {savingWhatsapp ? "Saving..." : "Save Link"}
                            </button>
                            <button
                              type="button"
                              onClick={() => { setEditingWhatsapp(false); setTempWhatsappLink(whatsappLink); }}
                              className="py-1.5 px-3 rounded-lg bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs font-mono text-emerald-300 truncate mb-2">
                            {whatsappLink}
                          </p>
                          <button
                            type="button"
                            onClick={() => { setTempWhatsappLink(whatsappLink); setEditingWhatsapp(true); }}
                            className="text-[11px] font-black text-amber-400 hover:text-amber-300 uppercase tracking-wider flex items-center gap-1"
                          >
                            Edit WhatsApp Link →
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Public Share Links & Campaign Channels */}
                  <div className="pt-6">
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-300 mb-3">
                      Copy Dedicated Recruitment Links:
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {[
                        { id: "general", label: "General Join", icon: "🌐", bg: "hover:border-emerald-500/50" },
                        { id: "tiktok", label: "TikTok Channel", icon: "🎵", bg: "hover:border-pink-500/50" },
                        { id: "whatsapp", label: "WhatsApp Broadcast", icon: "💬", bg: "hover:border-emerald-500/50" },
                        { id: "facebook", label: "Facebook Page", icon: "📘", bg: "hover:border-blue-500/50" },
                        { id: "x", label: "X / Twitter", icon: "𝕏", bg: "hover:border-slate-400/50" },
                      ].map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => copyShareLink(item.id)}
                          className={`flex flex-col items-start p-3 rounded-2xl bg-black/30 border border-white/5 ${item.bg} transition text-left group`}
                        >
                          <span className="text-xl mb-1">{item.icon}</span>
                          <span className="text-xs font-bold text-white group-hover:text-amber-300 transition">
                            {item.label}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                            /join{item.id === "general" ? "" : `/${item.id}`}
                          </span>
                          <span className="text-[9px] font-bold text-emerald-400 mt-2 uppercase tracking-wider">
                            Click to Copy
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                
                {/* AI Ward Health Insights */}
                <div className="bg-slate-900 rounded-3xl p-6 shadow-xl border border-slate-800">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <BrainCircuit size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Algorithmic AI</p>
                      <h3 className="font-black text-white text-base uppercase tracking-widest">Predictive Ward Health</h3>
                    </div>
                  </div>
                  
                  {loadingInsights ? (
                    <div className="animate-pulse flex space-x-4">
                      <div className="flex-1 space-y-4 py-1">
                        <div className="h-2 bg-slate-700 rounded w-3/4"></div>
                        <div className="h-2 bg-slate-700 rounded w-1/2"></div>
                      </div>
                    </div>
                  ) : wardInsights.length === 0 ? (
                    <div className="bg-dcp-green/10 border border-dcp-green/20 rounded-2xl p-5 flex items-start gap-4">
                      <div className="w-8 h-8 rounded-full bg-dcp-green/20 text-dcp-green flex items-center justify-center shrink-0">
                        <Activity size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-white">All Wards Optimal</p>
                        <p className="text-xs font-bold text-slate-400 mt-1">
                          No significant drops in mobilization velocity detected across the system over the last 48 hours. The network is growing steadily.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {wardInsights.map((insight, idx) => (
                        <div key={idx} className={`rounded-2xl p-4 flex items-start gap-4 border ${insight.type === 'warning' ? 'bg-red-500/10 border-red-500/20' : 'bg-dcp-green/10 border-dcp-green/20'}`}>
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${insight.type === 'warning' ? 'bg-red-500/20 text-red-400' : 'bg-dcp-green/20 text-dcp-green'}`}>
                            <Activity size={16} />
                          </div>
                          <div>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${insight.type === 'warning' ? 'text-red-400' : 'text-dcp-green'}`}>
                              {insight.type === 'warning' ? 'Velocity Warning' : 'Growth Trend'}
                            </p>
                            <p className="text-xs font-bold text-slate-300 leading-relaxed">
                              {insight.message}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Emergency Command Center */}
                <div className={`rounded-3xl border ${activeBroadcast ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'} p-6 shadow-sm`}>
                  <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeBroadcast ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-100 text-slate-400'}`}>
                      <Megaphone size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">System Override</p>
                      <h3 className="font-black text-slate-900 text-base uppercase tracking-widest">Emergency Broadcast</h3>
                    </div>
                  </div>
                  
                  {activeBroadcast ? (
                    <div className="space-y-4">
                      <div className="bg-red-600 text-white p-4 rounded-2xl">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Active Alert</p>
                        <p className="font-bold">{activeBroadcast.message}</p>
                      </div>
                      <button 
                        onClick={handleClearBroadcast}
                        disabled={isBroadcasting}
                        className="w-full bg-white border-2 border-slate-200 text-slate-900 font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-slate-50 transition"
                      >
                        {isBroadcasting ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Clear Global Alert"}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <textarea
                        value={broadcastText}
                        onChange={(e) => setBroadcastText(e.target.value)}
                        placeholder="Type emergency alert message..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold resize-none focus:outline-none focus:border-red-400 focus:bg-white transition"
                        rows="3"
                      />
                      <div className="flex flex-col gap-3 border-t border-slate-100 pt-3">
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select 
                            value={broadcastSeverity}
                            onChange={(e) => setBroadcastSeverity(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none flex-1"
                          >
                            <option value="critical">Severity: Critical (Red)</option>
                            <option value="warning">Severity: Warning (Yellow)</option>
                          </select>
                          <select 
                            value={broadcastTargetType}
                            onChange={(e) => setBroadcastTargetType(e.target.value)}
                            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest text-slate-600 focus:outline-none flex-1"
                          >
                            <option value="global">Target: Global (Everyone)</option>
                            <option value="ward">Target: Specific Wards</option>
                            <option value="specific_people">Target: Specific People</option>
                          </select>
                        </div>
                        
                        {broadcastTargetType === 'ward' && (
                          <div className="flex flex-col gap-3 border border-slate-200 rounded-xl p-4 bg-white">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2">Select Target Wards</p>
                            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                               {Object.keys(wardStationMap).length === 0 ? <p className="text-xs text-slate-400">Loading wards...</p> : Object.keys(wardStationMap).map(ward => (
                                  <label key={ward} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${broadcastTargetWards.includes(ward) ? 'bg-dcp-green/10 border-dcp-green/30 text-slate-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                      <input 
                                          type="checkbox" 
                                          className="hidden"
                                          checked={broadcastTargetWards.includes(ward)}
                                          onChange={(e) => {
                                              if (e.target.checked) setBroadcastTargetWards([...broadcastTargetWards, ward]);
                                              else {
                                                setBroadcastTargetWards(broadcastTargetWards.filter(w => w !== ward));
                                                // Remove stations that belonged to this ward
                                                const stationsToRemove = wardStationMap[ward] || [];
                                                setBroadcastTargetStations(prev => prev.filter(s => !stationsToRemove.includes(s)));
                                              }
                                          }}
                                      />
                                      <span className="text-xs font-bold">{ward}</span>
                                  </label>
                               ))}
                            </div>

                            {broadcastTargetWards.length > 0 && (
                                <div className="mt-2 pt-3 border-t border-slate-100">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest border-b border-slate-100 pb-2 mb-2">Select Target Polling Stations (Optional)</p>
                                   <p className="text-[9px] text-slate-400 mb-2">Leave unselected to broadcast to ALL stations in the selected wards.</p>
                                   <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                                      {broadcastTargetWards.map(ward => (
                                          (wardStationMap[ward] || []).map(station => (
                                             <label key={station} className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer border transition-all ${broadcastTargetStations.includes(station) ? 'bg-amber-400/20 border-amber-400/40 text-slate-900 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}>
                                                 <input 
                                                     type="checkbox" 
                                                     className="hidden"
                                                     checked={broadcastTargetStations.includes(station)}
                                                     onChange={(e) => {
                                                         if (e.target.checked) setBroadcastTargetStations([...broadcastTargetStations, station]);
                                                         else setBroadcastTargetStations(broadcastTargetStations.filter(s => s !== station));
                                                     }}
                                                 />
                                                 <span className="text-xs font-bold">{station}</span>
                                             </label>
                                          ))
                                      ))}
                                   </div>
                                </div>
                            )}
                          </div>
                        )}

                        {broadcastTargetType === 'specific_people' && (
                          <div className="flex flex-col gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Target Members</p>
                            <div className="flex gap-2">
                               <select 
                                  onChange={(e) => {
                                      const id = e.target.value;
                                      if (!id) return;
                                      const m = allMembers.find(x => x.id.toString() === id);
                                      if (m && !broadcastTargetMembers.find(x => x.id === m.id)) {
                                          setBroadcastTargetMembers([...broadcastTargetMembers, m]);
                                      }
                                      e.target.value = "";
                                  }}
                                  className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none"
                               >
                                  <option value="">-- Select Member to Add --</option>
                                  {allMembers.map(m => (
                                      <option key={m.id} value={m.id}>{m.full_name} ({m.phone})</option>
                                  ))}
                               </select>
                            </div>
                            {broadcastTargetMembers.length > 0 && (
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {broadcastTargetMembers.map(m => (
                                        <span key={m.id} className="bg-slate-200 text-slate-700 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                                            {m.full_name}
                                            <button onClick={() => setBroadcastTargetMembers(broadcastTargetMembers.filter(x => x.id !== m.id))} className="text-red-500 hover:text-red-700"><X size={12} /></button>
                                        </span>
                                    ))}
                                </div>
                            )}
                          </div>
                        )}

                        <button 
                          onClick={handleSetBroadcast}
                          disabled={isBroadcasting || !broadcastText.trim() || (broadcastTargetType === 'ward' && broadcastTargetWards.length === 0) || (broadcastTargetType === 'specific_people' && broadcastTargetMembers.length === 0)}
                          className="w-full bg-red-600 text-white font-black text-xs uppercase tracking-widest py-3 rounded-xl hover:bg-red-700 transition disabled:opacity-50 flex justify-center items-center gap-2 shadow-lg shadow-red-600/20 mt-2"
                        >
                          {isBroadcasting ? <Loader2 size={16} className="animate-spin" /> : <><Megaphone size={16} /> Send Targeted Alert</>}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <button onClick={() => { setShowAddModal(true); setAddModalStep('lookup'); setAddModalPrefill(null); }} className="bg-slate-900 text-white p-5 rounded-2xl flex items-center gap-4 hover:bg-slate-800 transition-colors shadow-sm text-left">
                    <div className="w-10 h-10 rounded-xl bg-dcp-green/20 flex items-center justify-center shrink-0"><Plus size={18} className="text-dcp-green" /></div>
                    <div><p className="font-black text-sm uppercase tracking-widest">Add Root</p><p className="text-[10px] text-slate-400 font-bold mt-0.5">Manual entry</p></div>
                  </button>
                  <button 
                    onClick={generateInviteToken} 
                    disabled={isGeneratingInvite}
                    className="bg-amber-400 text-slate-950 p-5 rounded-2xl flex items-center gap-4 hover:bg-amber-300 transition-colors shadow-sm text-left disabled:opacity-50"
                  >
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                      {isGeneratingInvite ? <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" /> : <Smartphone size={18} className="text-slate-950" />}
                    </div>
                    <div><p className="font-black text-sm uppercase tracking-widest">Generate Invite</p><p className="text-[10px] text-slate-900/60 font-bold mt-0.5">One-time link</p></div>
                  </button>
                  <button onClick={() => setActiveTab('mobilizers')} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-dcp-green/30 transition-colors shadow-sm text-left">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0"><Star size={18} className="text-amber-500" /></div>
                    <div><p className="font-black text-sm text-slate-900 uppercase tracking-widest">Mobilizers</p><p className="text-[10px] text-slate-400 font-bold mt-0.5">Directory</p></div>
                  </button>
                  <button onClick={() => setActiveTab('analytics')} className="bg-white border border-slate-200 p-5 rounded-2xl flex items-center gap-4 hover:border-dcp-green/30 transition-colors shadow-sm text-left">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0"><BarChart3 size={18} className="text-blue-500" /></div>
                    <div><p className="font-black text-sm text-slate-900 uppercase tracking-widest">Reports</p><p className="text-[10px] text-slate-400 font-bold mt-0.5">Party analytics</p></div>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Latest Activity</p>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Recent Registrations</h3>
                      </div>
                      <button onClick={() => setActiveTab('all')} className="text-[10px] font-black text-dcp-green uppercase tracking-widest hover:underline">View All</button>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {recentMembers.length === 0 ? (
                        <p className="p-6 text-xs text-slate-500 font-bold uppercase tracking-widest text-center">No registrations yet.</p>
                      ) : recentMembers.map(m => {
                        const isDigital = m.source && m.source !== 'field_mobilizer';
                        return (
                          <div key={m.id} onClick={() => { setSelectedMember(m); setActiveTab('all'); }} className="px-6 py-3 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs ${
                                isDigital
                                  ? 'bg-purple-100 text-purple-600'
                                  : m.referred_by 
                                  ? 'bg-slate-100 text-slate-500' 
                                  : 'bg-amber-100 text-amber-600'
                              }`}>
                                {isDigital ? <Megaphone size={14} /> : m.referred_by ? <User size={14} /> : <Star size={14} />}
                              </div>
                              <div>
                                <p className="font-black text-slate-900 text-xs">{m.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{m.ward}</p>
                              </div>
                            </div>
                            <p className="text-[10px] font-bold shrink-0">
                              {isDigital ? (
                                <span className="text-purple-600 font-bold">Online</span>
                              ) : m.referred_by ? (
                                <span className="text-slate-400">Delegate</span>
                              ) : (
                                <span className="text-amber-500 font-black">Root</span>
                              )}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Network Distribution</p>
                        <h3 className="font-black text-slate-900 text-sm uppercase tracking-widest">Top 5 Wards</h3>
                      </div>
                      <button onClick={() => setActiveTab('analytics')} className="text-[10px] font-black text-dcp-green uppercase tracking-widest hover:underline">Full Report</button>
                    </div>
                    <div className="p-6 space-y-4">
                      {wardSnapshot.length === 0 ? (
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest text-center py-4">No data yet.</p>
                      ) : wardSnapshot.map((w, i) => {
                        const pct = totalRegistered > 0 ? Math.round((w.count / totalRegistered) * 100) : 0;
                        return (
                          <div key={w.ward}>
                            <div className="flex items-center justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400 w-4">#{i + 1}</span>
                                <p className="font-black text-slate-900 text-xs uppercase tracking-widest">{w.ward}</p>
                              </div>
                              <span className="text-xs font-black text-slate-700">{w.count.toLocaleString()} <span className="text-slate-400 font-bold">({pct}%)</span></span>
                            </div>
                            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-dcp-green h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === "tree" ? (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6 px-3">
                    Click an arrow to expand downline tree
                </p>
                {roots.map(root => (
                  <TreeNode key={root.id} member={root} onSelectMember={setSelectedMember} />
                ))}
              </div>
                        ) : activeTab === "social" ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in duration-300">
                {/* Header & Filter Controls */}
                <div className="p-5 border-b border-slate-100 bg-slate-50/60 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black uppercase tracking-wider border border-purple-200">
                          Online Recruitment Channel
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          {digitalCount} Total Recruits
                        </span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">
                        Social Media & Public Link Supporters
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        These supporters joined online without a field mobilizer and are ready for in-person ward verification.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Ward Filter */}
                      <div className="relative min-w-[200px]">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                        <select
                          value={wardFilter}
                          onChange={(e) => {
                            const newWard = e.target.value;
                            setWardFilter(newWard);
                            loadDigitalMembers(searchQuery, newWard, digitalSourceFilter);
                          }}
                          className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="all">📍 All Wards (Laikipia)</option>
                          {Object.entries(LAIKIPIA_CONSTITUENCIES).map(([constituency, wards]) => (
                            <optgroup key={constituency} label={constituency} className="font-bold text-slate-900 bg-slate-100">
                              {wards.map(w => (
                                <option key={w} value={w}>{w} ({constituency})</option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>

                      {/* Download Call/SMS Button */}
                      <button
                        onClick={handleDownloadCallSmsList}
                        disabled={exportingCsv}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-sm transition disabled:opacity-50"
                      >
                        {exportingCsv ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Download size={14} />}
                        <span>Download Call / SMS List</span>
                      </button>
                    </div>
                  </div>

                  {/* Search Bar for Social Recruits */}
                  <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="SEARCH SOCIAL RECRUITS BY NAME, PHONE, OR ID..."
                      className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 font-bold text-xs tracking-wider uppercase shadow-sm"
                      value={searchQuery}
                      onChange={(e) => {
                        const q = e.target.value;
                        setSearchQuery(q);
                        loadDigitalMembers(q, wardFilter, digitalSourceFilter);
                      }}
                    />
                  </div>

                  {/* Channel Filter Pills */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {[
                      { id: 'all', label: 'All Channels' },
                      { id: 'whatsapp', label: '💬 WhatsApp' },
                      { id: 'tiktok', label: '🎵 TikTok' },
                      { id: 'facebook', label: '📘 Facebook' },
                      { id: 'x_twitter', label: '𝕏 Twitter / X' },
                      { id: 'social_media', label: '🌐 Social Link' }
                    ].map(ch => (
                      <button
                        key={ch.id}
                        type="button"
                        onClick={() => {
                          setDigitalSourceFilter(ch.id);
                          loadDigitalMembers(searchQuery, wardFilter, ch.id);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          digitalSourceFilter === ch.id
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {ch.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Select All & Batch Move to Mobilizer Toolbar */}
                {digitalMembers.length > 0 && (
                  <div className="mx-4 sm:mx-6 mt-4 p-3.5 bg-purple-50/70 border border-purple-200/80 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer text-xs font-black text-slate-800 uppercase tracking-wider select-none">
                      <input
                        type="checkbox"
                        checked={digitalMembers.length > 0 && selectedSocialIds.size === digitalMembers.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSocialIds(new Set(digitalMembers.map(m => m.id)));
                          } else {
                            setSelectedSocialIds(new Set());
                          }
                        }}
                        className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer accent-emerald-600"
                      />
                      <span>Select All ({digitalMembers.length} Social Recruits)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      {selectedSocialIds.size > 0 && (
                        <>
                          <span className="text-xs font-bold text-purple-900 bg-purple-200/70 px-2.5 py-1 rounded-xl">
                            {selectedSocialIds.size} Selected
                          </span>
                          <button
                            type="button"
                            onClick={() => handleConvertToMobilizer(Array.from(selectedSocialIds))}
                            disabled={isConvertingSocial}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition active:scale-95 disabled:opacity-50"
                          >
                            <Star size={14} className="fill-white" />
                            {isConvertingSocial ? "Moving..." : `Move ${selectedSocialIds.size} to Mobilizers`}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* List of Digital Recruits */}
                <div className="divide-y divide-slate-100 p-4 sm:p-6 space-y-3">
                  {loadingDigital ? (
                    <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                      <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-3" />
                      <p className="text-xs font-bold uppercase tracking-wider">Loading social recruits...</p>
                    </div>
                  ) : digitalMembers.length === 0 ? (
                    <div className="py-16 text-center">
                      <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto mb-3">
                        <Megaphone size={24} />
                      </div>
                      <p className="font-black text-slate-800 text-base">No Digital Recruits Found</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Share your public join links on TikTok or WhatsApp to welcome online supporters here!
                      </p>
                    </div>
                  ) : (
                    digitalMembers.map((m) => {
                      const isUnassigned = !m.referred_by;
                      return (
                        <div
                          key={m.id}
                          className="bg-white border border-slate-200 rounded-2xl p-4 hover:border-purple-300 hover:shadow-sm transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={selectedSocialIds.has(m.id)}
                              onChange={(e) => {
                                const newSet = new Set(selectedSocialIds);
                                if (e.target.checked) {
                                  newSet.add(m.id);
                                } else {
                                  newSet.delete(m.id);
                                }
                                setSelectedSocialIds(newSet);
                              }}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 mt-3 cursor-pointer accent-emerald-600 shrink-0"
                            />
                            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 shadow-sm font-black text-xs">
                              <User size={18} />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className="text-sm font-black text-slate-900">{m.full_name}</h4>
                                <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
                                  {m.source}
                                </span>
                                {m.volunteer_role && (
                                  <span className="px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    {m.volunteer_role.replace('_', ' ')}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-500 font-medium">
                                <strong>{m.ward} Ward</strong> {m.polling_station ? `· ${m.polling_station}` : ''} · ID: {m.national_id || 'N/A'}
                              </p>
                              {m.custom_role && (
                                <p className="text-[11px] text-purple-800 bg-purple-50 rounded-lg px-2.5 py-1 mt-1.5 border border-purple-100 inline-block">
                                  💡 <strong>Notes:</strong> {m.custom_role}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                            {isUnassigned ? (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                                Unassigned Supporter
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Under: {m.referrer_name || 'Mobilizer'}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleConvertToMobilizer(m.id)}
                              disabled={isConvertingSocial}
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 border border-emerald-300 text-xs font-black flex items-center gap-1.5 shadow-sm transition active:scale-95 disabled:opacity-50"
                              title="Make this supporter a Mobilizer"
                            >
                              <Star size={13} className="text-emerald-600 fill-emerald-600" />
                              Make Mobilizer
                            </button>
                            {m.phone && (
                              <a
                                href={`tel:${m.phone}`}
                                className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition"
                              >
                                <Phone size={13} /> Call
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ) : activeTab === "analytics" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Reports />
              </div>
            ) : activeTab === "coverage" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <PollingCoverage />
              </div>
            ) : activeTab === "canvass" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Canvass memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "transport" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Transport memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "agents" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <PollingAgents isAdmin={true} />
              </div>
            ) : activeTab === "tally" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Pvt memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "incidents" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Incidents isAdmin={true} />
              </div>
            ) : activeTab === "phonebank" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <PhoneBank isAdmin={true} />
              </div>
            ) : activeTab === "matcher" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <ContactMatcher isAdmin={true} />
              </div>
            ) : activeTab === "sms" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <SmsExport isAdmin={true} />
              </div>
            ) : activeTab === "diary" ? (
              <Diary user={currentUser} />
            ) : activeTab === "events" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Events isAdmin={true} />
              </div>
            ) : activeTab === "gotv" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Gotv memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "leaderboard" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Leaderboard memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "enroll" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0">
                <Enrollment memberId={null} isAdmin={true} />
              </div>
            ) : activeTab === "training" ? (
              <div className="w-full rounded-3xl bg-white border border-slate-200 shadow-sm relative z-0 p-6">
                <CheatSheets />
              </div>
            ) : activeTab === "voter-registry" ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
                  <div className="flex gap-4 items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search 2022 voter database by name, ID, phone, or ward..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-dcp-green/50 focus:ring-4 focus:ring-dcp-green/10 transition-all font-bold text-sm tracking-wider uppercase"
                        value={voterSearch}
                        onChange={(e) => setVoterSearch(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-slate-100 flex-1">
                  {voterRecords.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                        <Database size={24} className="text-amber-500" />
                      </div>
                      <p className="font-black text-slate-900 text-lg uppercase tracking-tight mb-2">No Voter Records Found</p>
                      
                      {!voterSearch ? (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mt-4">
                          <p className="text-sm text-slate-600 mb-3 font-bold">
                            The 2022 Official Database has not been loaded into this environment.
                          </p>
                          <p className="text-xs text-slate-500 bg-white border border-slate-200 rounded-xl px-3 py-2 font-mono text-left">
                            <span className="text-dcp-green font-black"># Run this on your server</span><br/>
                            python manage.py import_voter_register
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-bold text-slate-500 mt-2">
                          No match found for your search filters.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                      {voterRecords.map(record => (
                        <div key={record.id} className="p-6 hover:bg-slate-50 transition-colors flex flex-col justify-between border-b border-slate-100">
                          <div className="flex items-start justify-between mb-4">
                            <div>
                              <h4 className="font-black text-slate-900 text-base uppercase tracking-tight">{record.full_name}</h4>
                              <p className="text-[10px] font-bold text-dcp-green uppercase tracking-[0.2em] mt-1">{record.ward || 'Unknown Ward'}</p>
                            </div>
                            <div className="bg-slate-100 px-2 py-1 rounded text-[9px] font-black text-slate-500 uppercase tracking-widest">
                              2022 Official
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">National ID</p>
                              <p className="text-xs font-bold text-slate-700">{record.id_number || 'N/A'}</p>
                            </div>
                            <div>
                              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                              <p className="text-xs font-bold text-slate-700">{record.phone_number || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {hasMoreVoters && (
                    <div className="p-8 flex justify-center">
                      <button
                        onClick={() => loadVoterRecordsPage(voterPage + 1, voterSearch)}
                        disabled={loadingVoters}
                        className="px-8 py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg"
                      >
                        {loadingVoters ? "Scanning Database..." : "Load More Official Records"}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (activeTab === "mobilizers" || activeTab === "all") && (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 shrink-0 space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex gap-2 p-1 bg-slate-200/50 rounded-xl w-fit">
                      {[
                        { id: 'all', label: 'All Registrants', count: totalRegistered },
                        { id: 'verified', label: 'Verified Voters', count: verifiedVoters },
                        { id: 'unverified', label: 'Unverified', count: unverifiedNew }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => { setVoterStatusFilter(tab.id); setMemberPage(0); }}
                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                            voterStatusFilter === tab.id 
                              ? 'bg-white text-slate-900 shadow-sm' 
                              : 'text-slate-500 hover:text-slate-700'
                          }`}
                        >
                          {tab.label} <span className="ml-1 opacity-50">({tab.count})</span>
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Ward Filter Dropdown */}
                      <div className="relative min-w-[210px]">
                        <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600 pointer-events-none" />
                        <select
                          value={wardFilter}
                          onChange={(e) => {
                            const newWard = e.target.value;
                            setWardFilter(newWard);
                            setMemberPage(0);
                            loadMembersPage(0, searchQuery, voterStatusFilter, newWard);
                          }}
                          className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 hover:border-emerald-500 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition shadow-sm appearance-none cursor-pointer"
                        >
                          <option value="all">📍 All Wards (Laikipia County)</option>
                          {Object.entries(LAIKIPIA_CONSTITUENCIES).map(([constituency, wards]) => (
                            <optgroup key={constituency} label={constituency} className="font-bold text-slate-900 bg-slate-100">
                              {wards.map(w => (
                                <option key={w} value={w} className="bg-white text-slate-800 font-normal">
                                  {w} ({constituency})
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                      </div>

                      <button 
                        onClick={() => {
                          const newSort = memberSort === "id" ? "voter_status" : "id";
                          setMemberSort(newSort);
                          setMemberPage(0);
                          loadMembersPage(0, searchQuery, voterStatusFilter, wardFilter);
                        }}
                        className={`px-3.5 py-2.5 rounded-xl border transition-all font-bold text-xs uppercase tracking-widest flex items-center gap-2 ${
                          memberSort === "voter_status" ? "bg-dcp-green/10 border-dcp-green/30 text-dcp-green" : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <ShieldCheck size={15} /> Sort Verified
                      </button>

                      {/* Download Call / SMS Contact List Button */}
                      <button
                        onClick={handleDownloadCallSmsList}
                        disabled={exportingCsv}
                        className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs uppercase tracking-wider flex items-center gap-2 shadow-md transition disabled:opacity-50"
                        title="Download CSV formatted with phone numbers and names to call or text"
                      >
                        {exportingCsv ? (
                          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Download size={15} />
                        )}
                        <span>Download Call / SMS List</span>
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder={`SEARCH ${activeTab === "mobilizers" ? "ROOTS" : "ALL MEMBERS"} BY NAME OR ID...`}
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:border-dcp-green/50 focus:ring-4 focus:ring-dcp-green/10 transition-all font-bold text-sm tracking-wider uppercase"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                </div>
                <div className="divide-y divide-slate-100 flex-1">
                  {(activeTab === "mobilizers" ? roots : allMembers).length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                      <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <p className="font-black text-slate-700 text-sm uppercase tracking-widest">No Results Found</p>
                      <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                        {searchQuery ? `No match for "${searchQuery}"` : "No records available"}
                      </p>
                    </div>
                    ) : (activeTab === "mobilizers" ? roots : allMembers).map(member => {
                      const directCount = member.recruits_count || 0;
                      const tier = activeTab === "mobilizers" ? getTierBadge(directCount) : null;
                      const referrerName = activeTab === "all" ? member.referrer_name : null;
                      const isExpanded = selectedMember?.id === member.id;
                    const isMemberDigital = member.source && member.source !== 'field_mobilizer';
                    return (
                      <div key={member.id} className="border-b border-slate-100 last:border-b-0 transition-colors">
                        <div
                          onClick={() => setSelectedMember(isExpanded ? null : member)}
                          className={`p-4 transition-all cursor-pointer flex justify-between items-center gap-3 ${isExpanded ? 'bg-amber-50/70 border-l-4 border-l-amber-500 pl-3' : 'hover:bg-slate-50'}`}
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className={`w-11 h-11 rounded-full flex items-center justify-center shrink-0 shadow-sm transition-colors ${
                              isExpanded 
                                ? 'bg-amber-400 text-slate-950 font-black' 
                                : isMemberDigital 
                                ? 'bg-purple-100 text-purple-700 border border-purple-200' 
                                : (member.referred_by ? 'bg-slate-100 text-slate-500' : 'bg-amber-100 text-amber-600')
                            }`}>
                              {isMemberDigital ? <Megaphone size={18} /> : member.referred_by ? <User size={18} /> : <Star size={18} />}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-slate-900 flex items-center gap-1.5 truncate">
                                {member.full_name}
                                {member.is_voter_verified && (
                                  <CheckCircle2 
                                    size={12} 
                                    className="text-dcp-green shrink-0" 
                                    title="Verified 2022 Voter"
                                  />
                                )}
                                {member.is_opted_out && (
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-200 shrink-0">
                                    Opted Out
                                  </span>
                                )}
                              </h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5 truncate">
                                {member.ward}
                                {activeTab === "all" && referrerName && (
                                  <span className="text-slate-300"> · Under: <span className="text-slate-500">{referrerName}</span></span>
                                )}
                                {activeTab === "all" && !member.referred_by && (
                                  isMemberDigital ? (
                                    <span className="text-purple-600 font-black">
                                      {' · '}
                                      {member.source === 'x_twitter' ? '𝕏 Twitter Supporter' :
                                       member.source === 'tiktok' ? '🎵 TikTok Supporter' :
                                       member.source === 'whatsapp' ? '💬 WhatsApp Supporter' :
                                       member.source === 'facebook' ? '📘 Facebook Supporter' :
                                       '🌐 Online Supporter'}
                                    </span>
                                  ) : (
                                    <span className="text-amber-500 font-black"> · Root Mobilizer</span>
                                  )
                                )}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {tier && (
                              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${tier.bg} ${tier.color}`}>
                                {tier.name}
                              </span>
                            )}
                            <div className="text-right">
                              <p className="text-sm font-black text-slate-900">{directCount}</p>
                              <p className="text-[9px] font-bold text-slate-400 uppercase">recruits</p>
                            </div>
                            <div className="text-slate-400 ml-1 p-1 rounded-lg hover:bg-slate-200/60 transition flex items-center">
                              {isExpanded ? <ChevronDown size={18} className="text-amber-600" /> : <ChevronRight size={18} />}
                            </div>
                          </div>
                        </div>

                        {/* Inline Expandable Details Panel */}
                        {isExpanded && selectedMember && (
                          <div 
                            className="bg-slate-50/90 border-t border-slate-200/80 p-4 sm:p-6 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Member Header Bar */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200/80">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${
                                    selectedMember.source && selectedMember.source !== 'field_mobilizer'
                                      ? 'bg-purple-100 text-purple-800 border border-purple-300'
                                      : selectedMember.referred_by 
                                      ? 'bg-slate-200 text-slate-700' 
                                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                                  }`}>
                                    {selectedMember.source && selectedMember.source !== 'field_mobilizer'
                                      ? (selectedMember.source === 'x_twitter' ? '𝕏 Twitter Supporter' :
                                         selectedMember.source === 'tiktok' ? '🎵 TikTok Supporter' :
                                         selectedMember.source === 'whatsapp' ? '💬 WhatsApp Supporter' :
                                         selectedMember.source === 'facebook' ? '📘 Facebook Supporter' :
                                         '🌐 Online Recruit')
                                      : (selectedMember.referred_by ? "Constitutional Delegate" : "⭐ Root Mobilizer")}
                                  </span>
                                  {selectedMember.is_voter_verified ? (
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                      <CheckCircle2 size={11} /> Verified 2022 Voter
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-slate-200/80 text-slate-600 border border-slate-300">
                                      Unverified
                                    </span>
                                  )}
                                  {selectedMember.security_rank && selectedMember.security_rank !== 'none' && (
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                                      <ShieldCheck size={11} /> {selectedMember.security_rank.replace('_', ' ')}
                                    </span>
                                  )}
                                  {selectedMember.is_opted_out ? (
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-rose-100 text-rose-800 border border-rose-300 flex items-center gap-1">
                                      <AlertCircle size={11} /> Opted Out (STOP)
                                    </span>
                                  ) : (
                                    <span className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                                      <CheckCircle2 size={11} /> DPA Active (Consented)
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-bold mt-1.5 flex items-center gap-1.5 flex-wrap">
                                  <MapPin size={13} className="text-slate-400 shrink-0" />
                                  <span>{selectedMember.ward || 'No Ward'}</span>
                                  {selectedMember.polling_station && <span>· Polling Station: <strong className="text-slate-700">{selectedMember.polling_station}</strong></span>}
                                </p>
                              </div>

                              <div className="flex items-center gap-2 flex-wrap self-start sm:self-center">
                                {selectedMember.phone && (
                                  <a
                                    href={`tel:${selectedMember.phone}`}
                                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition"
                                  >
                                    <Phone size={13} /> Call
                                  </a>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    const link = `${window.location.origin}/?ref=${selectedMember.id}`;
                                    navigator.clipboard.writeText(link);
                                    toast.success("Referral link copied to clipboard!");
                                  }}
                                  className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition shadow-sm"
                                  title="Copy Referral Link"
                                >
                                  <Link2 size={13} /> Copy Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setSelectedMember(null)}
                                  className="px-3 py-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 text-xs font-bold transition flex items-center gap-1"
                                  title="Close details"
                                >
                                  <X size={14} /> Close
                                </button>
                              </div>
                            </div>

                            {/* Metrics & Info 4-Card Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Direct Recruits</p>
                                <p className="text-2xl font-black text-slate-900">{selectedMemberDirectCount ?? member.recruits_count ?? 0}</p>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Downline</p>
                                <p className="text-2xl font-black text-slate-900">{selectedMemberNetworkSize ?? 0}</p>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">National ID</p>
                                <p className="text-sm font-black text-slate-800 truncate">{selectedMember.national_id || 'N/A'}</p>
                              </div>
                              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Phone Number</p>
                                <p className="text-sm font-black text-slate-800 truncate">{selectedMember.phone || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Role Management & Referral Lineage */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                              {/* Role & Security Assignment */}
                              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 flex items-center gap-1.5">
                                    <ShieldCheck size={14} className="text-dcp-green" /> Role & Security Management
                                  </p>
                                </div>
                                <div>
                                  <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Security Rank</label>
                                  <select 
                                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl focus:border-dcp-green focus:bg-white outline-none transition"
                                    value={selectedMember.security_rank || 'none'}
                                    onChange={(e) => {
                                      const rankVal = e.target.value;
                                      api.updateMemberRole(selectedMember.id, { security_rank: rankVal })
                                        .then(() => {
                                          toast.success('Rank updated');
                                          setSelectedMember(prev => ({ ...prev, security_rank: rankVal }));
                                          setRoots(prev => prev.map(m => m.id === selectedMember.id ? { ...m, security_rank: rankVal } : m));
                                          setAllMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, security_rank: rankVal } : m));
                                        });
                                    }}
                                  >
                                    <option value="none">Standard Member (No Rank)</option>
                                    <option value="guard">Guard</option>
                                    <option value="station_commander">Station Commander</option>
                                    <option value="ward_commander">Ward Commander</option>
                                  </select>
                                </div>

                                {selectedMember.security_rank && selectedMember.security_rank !== 'none' && (
                                  <div className="space-y-3 pt-1">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      <div>
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Deploy Ward</label>
                                        <select
                                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl focus:border-dcp-green focus:bg-white outline-none transition"
                                          value={selectedMember.ward || ''}
                                          onChange={(e) => {
                                            const wardVal = e.target.value;
                                            api.updateMemberRole(selectedMember.id, { ward: wardVal, polling_station: '' })
                                              .then(() => {
                                                toast.success('Deployed to ' + wardVal);
                                                setSelectedMember(prev => ({ ...prev, ward: wardVal, polling_station: '' }));
                                                setRoots(prev => prev.map(m => m.id === selectedMember.id ? { ...m, ward: wardVal, polling_station: '' } : m));
                                                setAllMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, ward: wardVal, polling_station: '' } : m));
                                              });
                                          }}
                                        >
                                          <option value="">-- Select Ward --</option>
                                          {wardStationMap && Object.keys(wardStationMap).map(ward => (
                                            <option key={ward} value={ward}>{ward}</option>
                                          ))}
                                        </select>
                                      </div>

                                      <div>
                                        <label className="block text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1">Deploy Station</label>
                                        <select
                                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold p-2.5 rounded-xl focus:border-dcp-green focus:bg-white outline-none transition"
                                          value={selectedMember.polling_station || ''}
                                          disabled={!selectedMember.ward || selectedMember.security_rank === 'ward_commander'}
                                          onChange={(e) => {
                                            const stVal = e.target.value;
                                            api.updateMemberRole(selectedMember.id, { polling_station: stVal })
                                              .then(() => {
                                                toast.success('Deployed to ' + stVal);
                                                setSelectedMember(prev => ({ ...prev, polling_station: stVal }));
                                                setRoots(prev => prev.map(m => m.id === selectedMember.id ? { ...m, polling_station: stVal } : m));
                                                setAllMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, polling_station: stVal } : m));
                                              });
                                          }}
                                        >
                                          <option value="">-- Select Station --</option>
                                          {selectedMember.ward && wardStationMap && 
                                            (wardStationMap[selectedMember.ward] || []).map(s => (
                                            <option key={s} value={s}>{s}</option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                                      <div>
                                        <p className="text-xs font-bold text-slate-800">Security Only Mode</p>
                                        <p className="text-[10px] text-slate-400">Hides campaign tools for this user</p>
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newVal = !selectedMember.is_security_only;
                                          api.updateMemberRole(selectedMember.id, { is_security_only: newVal })
                                            .then(() => {
                                              toast.success(newVal ? 'Locked to security only' : 'Campaign tools enabled');
                                              setSelectedMember(prev => ({ ...prev, is_security_only: newVal }));
                                              setRoots(prev => prev.map(m => m.id === selectedMember.id ? { ...m, is_security_only: newVal } : m));
                                              setAllMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, is_security_only: newVal } : m));
                                            });
                                        }}
                                        className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${selectedMember.is_security_only ? 'bg-dcp-green' : 'bg-slate-300'}`}
                                      >
                                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${selectedMember.is_security_only ? 'left-7' : 'left-1'}`} />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>

                            {/* Kenya DPA 2019 Right to Erasure / Opt-Out Controls */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                    selectedMember.is_opted_out ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    <ShieldCheck size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                                      Kenya DPA 2019 Consent Management
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold">Section 34 & 40 Compliance (Right to Erasure / Stop Communications)</p>
                                  </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  selectedMember.is_opted_out 
                                    ? 'bg-rose-100 text-rose-800 border border-rose-200' 
                                    : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                }`}>
                                  {selectedMember.is_opted_out ? 'Opted Out (STOP)' : 'Consent Active'}
                                </span>
                              </div>

                              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                                <div className="text-xs text-slate-600 space-y-0.5">
                                  <p className="font-bold text-slate-800">
                                    {selectedMember.is_opted_out
                                      ? 'Supporter has revoked messaging consent'
                                      : 'Supporter has active statutory consent on file'}
                                  </p>
                                  <p className="text-[11px] text-slate-400">
                                    {selectedMember.is_opted_out
                                      ? `Marked opted-out on ${selectedMember.opted_out_at ? new Date(selectedMember.opted_out_at).toLocaleDateString() : 'Record'}. Excluded from Bulk SMS exports.`
                                      : 'Eligible to receive campaign mobilization SMS broadcasts and phone calls.'}
                                  </p>
                                </div>

                                <button
                                  type="button"
                                  onClick={async () => {
                                    try {
                                      const res = await api.toggleMemberOptOut(selectedMember.id);
                                      const updated = res.data || res;
                                      toast.success(updated.is_opted_out ? 'Member marked as Opted-Out (STOP)' : 'Member opt-in consent restored');
                                      setSelectedMember(prev => ({ ...prev, is_opted_out: updated.is_opted_out, opted_out_at: updated.opted_out_at }));
                                      setRoots(prev => prev.map(m => m.id === selectedMember.id ? { ...m, is_opted_out: updated.is_opted_out, opted_out_at: updated.opted_out_at } : m));
                                      setAllMembers(prev => prev.map(m => m.id === selectedMember.id ? { ...m, is_opted_out: updated.is_opted_out, opted_out_at: updated.opted_out_at } : m));
                                    } catch (err) {
                                      toast.error('Failed to toggle opt-out status');
                                    }
                                  }}
                                  className={`px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition shrink-0 ${
                                    selectedMember.is_opted_out
                                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                                      : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300'
                                  }`}
                                >
                                  {selectedMember.is_opted_out ? 'Restore Consent (Opt In)' : 'Record Opt-Out (STOP)'}
                                </button>
                              </div>
                            </div>

                            {/* Direct Invitees & Recruits Drilldown */}
                            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-100 flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                                    <Users size={16} />
                                  </div>
                                  <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 flex items-center gap-2">
                                      Direct Invitees & Recruits
                                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">
                                        {selectedMemberDirectCount ?? member.recruits_count ?? 0}
                                      </span>
                                    </h4>
                                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                                      {(selectedMemberDirectCount ?? member.recruits_count ?? 0) > 0 
                                        ? `Tap arrow to explore invitees recruited by ${selectedMember.full_name}`
                                        : "No recruits registered under this member yet"}
                                    </p>
                                  </div>
                                </div>

                                {(selectedMemberDirectCount ?? member.recruits_count ?? 0) > 0 && (
                                  <button
                                    type="button"
                                    onClick={toggleMainMemberInvitees}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition ${
                                      showMainInvitees
                                        ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
                                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                    }`}
                                  >
                                    <span>{showMainInvitees ? "Hide Invitees" : `View ${selectedMemberDirectCount ?? member.recruits_count ?? 0} Invitees`}</span>
                                    {loadingMainInvitees ? (
                                      <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                                    ) : showMainInvitees ? (
                                      <ChevronDown size={15} />
                                    ) : (
                                      <ChevronRight size={15} />
                                    )}
                                  </button>
                                )}
                              </div>

                              {(selectedMemberDirectCount ?? member.recruits_count ?? 0) === 0 ? (
                                <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center">
                                  <p className="text-xs font-bold text-slate-500">This member currently has 0 direct invitees.</p>
                                  <p className="text-[10px] text-slate-400 mt-1">Copy and share their referral link above to recruit under their line.</p>
                                </div>
                              ) : (
                                showMainInvitees && (
                                  <div className="space-y-2.5 pt-1">
                                    {loadingMainInvitees ? (
                                      <div className="py-6 text-center">
                                        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading direct invitees...</p>
                                      </div>
                                    ) : mainInvitees.length === 0 ? (
                                      <div className="p-4 rounded-xl bg-slate-50 text-center">
                                        <p className="text-xs font-bold text-slate-500">No invitee records found in database.</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                          Tap any invitee below to view details and drill into their downline:
                                        </p>
                                        {mainInvitees.map(inv => (
                                          <InviteeNode
                                            key={inv.id}
                                            member={inv}
                                            depth={1}
                                            wardStationMap={wardStationMap}
                                            onPromoteToRoot={handlePromoteToRoot}
                                          />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>

                              {/* Referral Lineage */}
                              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
                                <div>
                                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-600 flex items-center gap-1.5">
                                      <Network size={14} className="text-slate-500" /> Referral Lineage
                                    </p>
                                    <span className="text-[10px] font-bold text-slate-400">
                                      {selectedMember.referred_by ? `Tier ${selectedMemberTier || 1}` : "Root Tier"}
                                    </span>
                                  </div>
                                  
                                  <div className="space-y-2">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                      <div>
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Invited By</p>
                                        <p className="font-bold text-slate-800">
                                          {directInviter ? directInviter.full_name : selectedMember.referrer_name || (selectedMember.referred_by ? "Delegate Referrer" : "Direct Party Registration (Root)")}
                                        </p>
                                        {directInviter && (
                                          <p className="text-[10px] text-slate-500">{directInviter.ward} · {directInviter.polling_station}</p>
                                        )}
                                      </div>
                                      <span className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[9px] font-black uppercase text-slate-600">
                                        {selectedMember.referred_by ? `Depth ${selectedMemberDepth || 1}` : "Root"}
                                      </span>
                                    </div>

                                    {topMobilizer && topMobilizer.id !== selectedMember.id && (
                                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                                        <div>
                                          <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Root Mobilizer</p>
                                          <p className="font-bold text-slate-800">{topMobilizer.full_name}</p>
                                          <p className="text-[10px] text-slate-500">{topMobilizer.ward} · {topMobilizer.polling_station}</p>
                                        </div>
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 border border-amber-200 rounded text-[9px] font-black uppercase">
                                          Top of Chain
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {selectedMember.referred_by && (
                                  <div className="pt-2">
                                    <button 
                                      type="button"
                                      onClick={handlePromoteToRoot}
                                      className="w-full py-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl text-amber-800 font-black text-[10px] uppercase tracking-widest transition flex items-center justify-center gap-2"
                                    >
                                      <Star size={14} className="text-amber-500" /> Promote to Root Mobilizer
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                {/* Pagination Controls */}
                {(activeTab === "mobilizers" ? hasMoreRoots : hasMoreMembers) && (
                  <div className="flex justify-center p-6 border-t border-slate-100 bg-slate-50/50 shrink-0">
                    <button
                      onClick={() => {
                        if (activeTab === "mobilizers") loadRootPage(rootPage + 1, searchQuery);
                        else loadMembersPage(memberPage + 1, searchQuery);
                      }}
                      disabled={activeTab === "mobilizers" ? loadingMoreRoots : loadingMoreMembers}
                      className="px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.3em] border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
                    >
                      {activeTab === "mobilizers" 
                        ? (loadingMoreRoots ? "Loading..." : "Load more mobilizers")
                        : (loadingMoreMembers ? "Loading..." : "Load more recruits")}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>

      <AnimatePresence>
        {showSecurityModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSecurityModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] flex flex-col my-auto mx-auto"
            >
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">Deploy Security</h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fast-Track Enrollment</p>
                </div>
                <button onClick={() => setShowSecurityModal(false)} className="p-2 hover:bg-slate-200 rounded-xl text-slate-500 transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar">
                 <form onSubmit={(e) => {
                   e.preventDefault();
                   const fd = new FormData(e.target);
                   const data = Object.fromEntries(fd.entries());
                   data.is_security_only = true;
                   
                   api.register(data).then(({ error }) => {
                     if (error) { toast.error(error.message || 'Failed to deploy'); return; }
                     toast.success('Security Personnel Deployed!');
                     setShowSecurityModal(false);
                     loadMembersPage(0, searchQuery, voterStatusFilter);
                   });
                 }} className="space-y-4">
                    <input name="full_name" placeholder="Full Name" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
                    <input name="national_id" placeholder="ID Number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
                    <input name="phone" placeholder="Phone Number" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" />
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <select name="security_rank" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" onChange={(e) => {
                         const sSelect = document.getElementById('sec_station_select');
                         if (e.target.value === 'ward_commander') {
                             sSelect.disabled = true;
                             sSelect.value = '';
                         } else {
                             sSelect.disabled = false;
                         }
                      }}>
                        <option value="">- Select Rank -</option>
                        <option value="guard">Guard</option>
                        <option value="station_commander">Station Commander</option>
                        <option value="ward_commander">Ward Commander</option>
                      </select>
                      <select name="ward" required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition" onChange={(e) => {
                         const stations = (wardStationMap[e.target.value] || []);
                         const sSelect = document.getElementById('sec_station_select');
                         sSelect.innerHTML = '<option value="">- Select Station -</option>' + stations.map(s => `<option value="${s}">${s}</option>`).join('');
                      }}>
                        <option value="">- Select Ward -</option>
                        {wardStationMap && Object.keys(wardStationMap).map(ward => <option key={ward} value={ward}>{ward}</option>)}
                      </select>
                    </div>
                    <select id="sec_station_select" name="polling_station" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-blue-500 transition">
                      <option value="">- Select Station -</option>
                    </select>

                    <button type="submit" className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-black text-sm uppercase tracking-widest mt-4">
                       Deploy Now
                    </button>
                 </form>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-start justify-center overflow-y-auto py-8 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowAddModal(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.96 }}
              className="w-full max-w-xl relative"
            >
              <div className="flex items-center justify-between mb-4 px-1">
                <div>
                  <p className="text-white font-black uppercase tracking-widest text-sm flex items-center gap-2">
                    <Star size={16} className="text-amber-400" />
                    New Root Mobilizer
                  </p>
                  <p className="text-slate-400 text-[11px] font-bold mt-0.5">
                    This member will have null referrer and a quota of 25.
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                >
                  <X size={18} className="text-white" />
                </button>
              </div>

              {addModalStep === 'lookup' ? (
                <div className="bg-white rounded-[2rem] p-6 shadow-2xl">
                  <VoterLookup 
                    onSelect={(formData, voter) => {
                      setAddModalPrefill(formData);
                      setAddModalVoter(voter);
                      setAddModalStep('form');
                    }}
                    onSkip={() => {
                      setAddModalPrefill(null);
                      setAddModalVoter(null);
                      setAddModalStep('form');
                    }}
                  />
                </div>
              ) : (
                <RegistrationForm
                  referrerId={null}
                  isAdmin={true}
                  initialData={addModalPrefill}
                  selectedVoter={addModalVoter}
                  onSuccess={() => { setShowAddModal(false); toast.success("Root Mobilizer established!"); loadRootPage(0, ""); }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
