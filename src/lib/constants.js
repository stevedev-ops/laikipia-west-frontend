import { Crown, ShieldCheck, Building, MapPin, School, Award, Users } from "lucide-react";

export const CONSTITUENCIES = {
  'Laikipia West': [
    'Githiga',
    'Igwamiti',
    'Marmanet',
    'Ol-Moran',
    'Rumuruti Township',
    'Salama'
  ],
  'Laikipia East': [
    'Nanyuki',
    'Thingithu',
    'Ngobit',
    'Tigithi',
    'Umande'
  ],
  'Laikipia North': [
    'Mugogodo East',
    'Mugogodo West',
    'Segera',
    'Sosian'
  ]
};

export const LAIKIPIA_CONSTITUENCIES = CONSTITUENCIES;

export const ALL_LAIKIPIA_WARDS = Object.values(CONSTITUENCIES).flat();

export const ROLE_DISPLAY = {
  governor: { label: "Governor Aspirant", tier: "Tier 1", color: "from-amber-500 to-yellow-600", bg: "bg-amber-500/10 text-amber-400 border-amber-500/30", icon: Crown },
  county_manager: { label: "County Campaigns Manager", tier: "Tier 2", color: "from-emerald-500 to-green-600", bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", icon: ShieldCheck },
  sub_county_coordinator: { label: "Sub-County Coordinator", tier: "Tier 3", color: "from-blue-500 to-indigo-600", bg: "bg-blue-500/10 text-blue-400 border-blue-500/30", icon: Building },
  ward_coordinator: { label: "Ward Coordinator", tier: "Tier 4", color: "from-cyan-500 to-teal-600", bg: "bg-cyan-500/10 text-cyan-400 border-cyan-500/30", icon: MapPin },
  polling_centre_coordinator: { label: "Polling Centre Coordinator", tier: "Tier 5", color: "from-purple-500 to-violet-600", bg: "bg-purple-500/10 text-purple-400 border-purple-500/30", icon: School },
  pillar: { label: "Campaign Pillar (3/Centre)", tier: "Tier 6", color: "from-rose-500 to-pink-600", bg: "bg-rose-500/10 text-rose-400 border-rose-500/30", icon: Award },
  station_mobilizer: { label: "Station Mobilizer (25/Station)", tier: "Tier 7", color: "from-slate-400 to-slate-600", bg: "bg-slate-500/10 text-slate-300 border-slate-500/30", icon: Users },
};

export const MOBILIZER_SQUADS = [
  { id: "bronze", name: "Bronze Squad", tierLabel: "🥉 Bronze", range: "1-5", min: 1, max: 5, target: 5, color: "text-amber-500", bg: "bg-amber-500/10", border: "border-amber-500/30", badgeBg: "bg-amber-500/20 text-amber-300" },
  { id: "silver", name: "Silver Squad", tierLabel: "🥈 Silver", range: "6-10", min: 6, max: 10, target: 5, color: "text-slate-300", bg: "bg-slate-400/10", border: "border-slate-400/30", badgeBg: "bg-slate-400/20 text-slate-200" },
  { id: "gold", name: "Gold Squad", tierLabel: "🥇 Gold", range: "11-15", min: 11, max: 15, target: 5, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30", badgeBg: "bg-yellow-500/20 text-yellow-300" },
  { id: "platinum", name: "Platinum Squad", tierLabel: "💎 Platinum", range: "16-20", min: 16, max: 20, target: 5, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30", badgeBg: "bg-cyan-500/20 text-cyan-300" },
  { id: "diamond", name: "Diamond Squad", tierLabel: "👑 Diamond", range: "21-25", min: 21, max: 25, target: 5, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30", badgeBg: "bg-purple-500/20 text-purple-300" },
];

export const PILLAR_CATEGORIES = [
  { id: "youth", label: "Youth Pillar" },
  { id: "women", label: "Women Pillar" },
  { id: "elders_business", label: "Elders & Business Pillar" },
  { id: "special_interest", label: "Special Interest Pillar" },
];

export const FUNCTION_CATEGORIES = [
  { id: 'chama', label: 'Chama / Table Banking', icon: 'Users', color: 'bg-emerald-500' },
  { id: 'church', label: 'Church Service / Harambee', icon: 'Church', color: 'bg-blue-500' },
  { id: 'funeral', label: 'Funeral / Burial', icon: 'Heart', color: 'bg-slate-500' },
  { id: 'youth', label: 'Youth / Sports Tournament', icon: 'Trophy', color: 'bg-amber-500' },
  { id: 'women', label: 'Women Group Baraza', icon: 'Sparkles', color: 'bg-purple-500' },
  { id: 'market', label: 'Market Baraza / Townhall', icon: 'Store', color: 'bg-rose-500' },
  { id: 'rally', label: 'Major Campaign Rally', icon: 'Megaphone', color: 'bg-red-600' },
  { id: 'other', label: 'Community Function', icon: 'Calendar', color: 'bg-indigo-500' },
];

export function cleanCentreName(name) {
  if (!name) return "";
  let clean = String(name).trim();
  // 1. Remove parenthesized (Station 01), (Stream 1), (Station 1), (01), (1), etc.
  clean = clean.replace(/\s*\((?:Station|Stream|Stn|Str)?\s*\d+\)/gi, '');
  // 2. Remove trailing stream/station suffixes with separators: " Station 01", " · Stream 02", " - 01", " 01", " 02", ": Stream 1"
  clean = clean.replace(/\s*(?:[-/|•·:]\s*)?(?:Station|Stream|Stn|Str)?\s*\d+\s*$/gi, '');
  // 3. Strip trailing stream or station words if left over
  clean = clean.replace(/\s*(?:[-/|•·:]\s*)?(?:Station|Stream|Stn|Str)\s*$/gi, '');
  // 4. Strip any remaining dangling separators at end
  clean = clean.replace(/[\s\-/|•·:]+$/g, '');
  return clean.trim();
}
