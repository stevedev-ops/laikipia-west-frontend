import { cleanCentreName } from "../lib/constants";
import { useState, useEffect, useCallback } from "react";
import {
  Search,
  User,
  MapPin,
  Smartphone,
  Hash,
  CheckCircle,
  ShieldCheck,
  Award,
  Users,
  Star,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLanguage } from "../contexts/LanguageContext";

const CAMPAIGN_ROLE_LABELS = {
  governor: "Governor Aspirant",
  county_manager: "County Campaigns Manager",
  sub_county_coordinator: "Sub-County Coordinator",
  ward_coordinator: "Ward Coordinator",
  polling_centre_coordinator: "Polling Centre Coordinator",
  pillar: "Campaign Pillar",
  station_mobilizer: "Station Mobilizer",
  field_mobilizer: "Field Mobilizer",
};

const PILLAR_LABELS = {
  youth: "Youth Pillar",
  women: "Women Pillar",
  elders_business: "Elders & Business Pillar",
  special_interest: "Special Interest Pillar",
};

export default function Members({ memberId, profile, isAdmin = false }) {
  const { t } = useLanguage();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isCoordinator = ['polling_centre_coordinator', 'ward_coordinator', 'sub_county_coordinator', 'pillar', 'county_manager', 'governor'].includes(profile?.campaign_role);

  const fetchMembersPage = useCallback(async (pageIdx) => {
    if (pageIdx === 0) setLoading(true);
    else setLoadingMore(true);

    try {
      const params = {
        page: pageIdx + 1,
      };
      if (query && query.trim()) {
        params.search = query.trim();
      }

      // Only scope strictly to direct referral ID if regular mobilizer
      if (!isCoordinator && !isAdmin && memberId) {
        params.referred_by = memberId;
      }

      const { data, error } = await api.getMembers(params);

      if (error) {
        if (error.message?.includes('401') || error.message?.includes('403')) {
          console.warn("Unauthorized access to member list");
        }
        throw error;
      }

      const list = data?.results || (Array.isArray(data) ? data : []);
      if (pageIdx === 0) setMembers(list);
      else setMembers(prev => [...prev, ...list]);
      
      setHasMore(!!data?.next);
      setPage(pageIdx);
    } catch (err) {
      console.error("Members fetch failed:", err);
      toast.error("Unable to load team members right now.");
      if (pageIdx === 0) setMembers([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [memberId, isCoordinator, isAdmin, query]);

  useEffect(() => {
    fetchMembersPage(0);
  }, [fetchMembersPage]);

  const filtered = members.filter((m) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.ward?.toLowerCase().includes(q) ||
      m.polling_station?.toLowerCase().includes(q) ||
      m.campaign_role?.toLowerCase().includes(q) ||
      m.national_id?.includes(q)
    );
  });

  // Calculate total recruitment metrics across subordinates
  const totalTeamRecruits = members.reduce((sum, m) => sum + (m.recruits_count || 0), 0);

  // Group by ward for numerical display
  const wardStats = members.reduce((acc, m) => {
    const w = m.ward || "Unknown";
    acc[w] = (acc[w] || 0) + 1;
    return acc;
  }, {});

  const sortedWards = Object.entries(wardStats)
    .map(([ward, count]) => ({ ward, count }))
    .sort((a, b) => b.count - a.count);

  if (selectedMember) {
    return (
      <div className="relative overflow-hidden selection:bg-dcp-green/30 min-h-[80vh] p-4 md:p-8">
        <div className="w-full max-w-4xl mx-auto space-y-8 relative z-10 pt-4">
          <button
            onClick={() => setSelectedMember(null)}
            className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-black uppercase tracking-widest text-xs"
          >
            ← Back to Team Roster
          </button>

          <header className="flex flex-col sm:flex-row items-start sm:items-center gap-6 bg-white border border-slate-200 rounded-[2rem] p-6 md:p-8 shadow-sm">
            <div className="w-20 h-20 bg-slate-950 rounded-2xl flex items-center justify-center text-emerald-400 shadow-xl shrink-0">
              <User size={36} strokeWidth={2.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  ★ {selectedMember.campaign_role === 'pillar' ? (PILLAR_LABELS[selectedMember.pillar_category] || "Campaign Pillar") : (CAMPAIGN_ROLE_LABELS[selectedMember.campaign_role] || "Station Mobilizer")}
                </span>
                <span className="text-xs text-slate-400">• ID: {selectedMember.national_id || "Verified"}</span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-slate-900 truncate">
                {selectedMember.full_name}
              </h1>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">
                📍 {cleanCentreName(selectedMember.polling_station) || selectedMember.ward || "Laikipia County"}
              </p>
            </div>
          </header>

          <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{t("recruitment_yield")}</p>
              <p className="text-3xl font-black text-slate-900">{selectedMember.recruits_count || 0} <span className="text-xs font-bold text-slate-400">{t("voters_recruited")}</span></p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Assigned Ward</p>
              <p className="text-xl font-black text-slate-900 truncate">{selectedMember.ward || "General"}</p>
            </div>
            <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Station HQ</p>
              <p className="text-xl font-black text-slate-900 truncate">{cleanCentreName(selectedMember.polling_station) || "Main Centre"}</p>
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-900 p-4 md:p-8 space-y-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* ── Header Deck ────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[2.5rem] p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-0.5 rounded-full">
                {isCoordinator ? "Command & Team Oversight" : "My Downline Team"}
              </span>
              <span className="text-xs text-slate-400 font-bold">• Active Jurisdiction</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 uppercase tracking-tight italic">
              {isCoordinator
                ? `${CAMPAIGN_ROLE_LABELS[profile?.campaign_role] || 'Coordinator'} Team Roster`
                : "My Recruits Downline"}
            </h1>
            <p className="text-sm text-slate-500 mt-1 max-w-2xl font-medium">
              {isCoordinator
                ? `Monitoring Station Mobilizers, Pillars, and recruitment performance in ${cleanCentreName(profile?.polling_station) || profile?.ward || 'your jurisdiction'}.`
                : "Numerical breakdown and roster of all supporters registered into your direct network."}
            </p>
          </div>

          <div className="w-full md:w-80">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("search_team_placeholder")}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-emerald-500 text-xs font-bold uppercase tracking-wider"
              />
            </div>
          </div>
        </div>

        {/* ── KPI Summary Cards ───────────────────────────────────── */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">
                {isCoordinator ? "Subordinate Mobilizers" : "Total Direct Recruits"}
              </p>
              <Users size={18} className="text-emerald-600" />
            </div>
            <p className="text-4xl font-black text-slate-900">{members.length}</p>
            <p className="text-xs text-slate-500 font-medium mt-2">{t("active_personnel_under_command")}</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">
                {isCoordinator ? "Total Voters Mobilized" : "Wards Covered"}
              </p>
              <TrendingUp size={18} className="text-amber-500" />
            </div>
            <p className="text-4xl font-black text-slate-900">
              {isCoordinator ? totalTeamRecruits : sortedWards.length}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-2">
              {isCoordinator ? "Combined grassroots reach" : "Active ward locations"}
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm sm:col-span-2 md:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-black">
                Command Jurisdiction HQ
              </p>
              <MapPin size={18} className="text-blue-500" />
            </div>
            <p className="text-lg font-black text-slate-900 truncate">
              {cleanCentreName(profile?.polling_station) || profile?.ward || "Laikipia County"}
            </p>
            <p className="text-xs text-slate-500 font-medium mt-2 truncate">
              {profile?.ward ? `Ward: ${profile.ward}` : "Constituency Wide"}
            </p>
          </div>
        </section>

        {/* ── Subordinates & Mobilizer Roster Table ─────────────────── */}
        <div className="bg-white border border-slate-200 rounded-[2rem] shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-widest text-xs">
                {isCoordinator ? "Station Mobilizers & Subordinates Roster" : "Direct Recruits Directory"}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                {isCoordinator ? "Showing mobilizers and their individual recruitment outputs" : "Voters registered through your referral link"}
              </p>
            </div>
            <span className="text-xs font-black text-slate-400">{filtered.length} Listed</span>
          </div>

          <div className="overflow-x-auto">
            <div className="grid grid-cols-12 gap-4 text-[10px] uppercase tracking-[0.25em] text-slate-500 bg-slate-100/60 border-b border-slate-200 px-6 py-3.5 font-black min-w-[700px]">
              <div className="col-span-5">{t("subordinate_member_role")}</div>
              <div className="col-span-4">{t("jurisdiction_polling_station")}</div>
              <div className="col-span-3 text-right">{t("recruitment_output")}</div>
            </div>

            <div className="divide-y divide-slate-100 min-w-[700px]">
              {loading ? (
                <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest">{t("loading_roster")}</p>
                </div>
              ) : filtered.length === 0 ? (
                <div className="p-12 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                  {isCoordinator
                    ? `No mobilizers or subordinates enrolled yet under ${cleanCentreName(profile?.polling_station) || profile?.ward || 'your jurisdiction'}.`
                    : "No direct recruits enrolled yet."}
                </div>
              ) : (
                filtered.map((member) => (
                  <div
                    key={member.id}
                    onClick={() => setSelectedMember(member)}
                    className="grid grid-cols-12 gap-4 items-center px-6 py-4 hover:bg-slate-50 transition cursor-pointer group"
                  >
                    <div className="col-span-5 min-w-0">
                      <p className="font-black text-slate-900 truncate uppercase text-sm group-hover:text-emerald-700 transition">
                        {member.full_name}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 truncate">
                          ★ {member.campaign_role === 'pillar' ? (PILLAR_LABELS[member.pillar_category] || "Campaign Pillar") : (CAMPAIGN_ROLE_LABELS[member.campaign_role] || "Station Mobilizer")}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">
                          ID: {member.national_id ? `••••${String(member.national_id).slice(-4)}` : 'Verified'}
                        </span>
                      </div>
                    </div>

                    <div className="col-span-4 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate uppercase">
                        {cleanCentreName(member.polling_station || member.official_polling_station) || "Polling Centre"}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate">
                        {member.ward || "Ward Division"}
                      </p>
                    </div>

                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-sm font-black text-slate-900">
                          {member.recruits_count || 0}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                          Recruits
                        </span>
                      </div>
                      <div className="w-24 ml-auto bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1">
                        <div
                          className="bg-emerald-500 h-full rounded-full"
                          style={{
                            width: `${Math.min(100, ((member.recruits_count || 0) / 10) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {hasMore && (
            <div className="flex justify-center p-6 border-t border-slate-100">
              <button
                onClick={() => fetchMembersPage(page + 1)}
                disabled={loadingMore}
                className="px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border border-slate-200 bg-white hover:bg-slate-50 transition disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load More Roster"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
