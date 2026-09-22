import { useState, useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, CheckCircle2, AlertTriangle, MessageCircle, Share2,
  Users, Megaphone, Bike, Vote, Sparkles, ArrowRight, Lock, MapPin,
  Smartphone, User, Calendar, ExternalLink, ArrowLeft, HeartHandshake
} from "lucide-react";
import { api } from "../lib/api";
import { ALL_LAIKIPIA_WARDS, LAIKIPIA_CONSTITUENCIES } from "../lib/constants";
import { useLocationData } from "../contexts/LocationContext";
import { toast } from "sonner";

const VOLUNTEER_ROLES = [
  {
    id: "digital_champion",
    title: "Digital Champion",
    icon: Megaphone,
    desc: "Amplify posts, videos, and trends on TikTok, WhatsApp, and social media.",
    color: "border-pink-500/30 bg-pink-500/5 hover:border-pink-500 text-pink-400"
  },
  {
    id: "election_volunteer",
    title: "Election Day Volunteer",
    icon: Vote,
    desc: "Help organize voters and support activities at your local polling center.",
    color: "border-amber-500/30 bg-amber-500/5 hover:border-amber-500 text-amber-400"
  },
  {
    id: "boda_transport",
    title: "Boda-Boda Transport",
    icon: Bike,
    desc: "Help ferry elderly, disabled, or distant supporters on key campaign days.",
    color: "border-blue-500/30 bg-blue-500/5 hover:border-blue-500 text-blue-400"
  },
  {
    id: "general_supporter",
    title: "General Supporter",
    icon: Users,
    desc: "Receive official updates, campaign news, and attend local rallies.",
    color: "border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500 text-emerald-400"
  },
  {
    id: "custom",
    title: "Specialized Skill / Custom Role",
    icon: Sparkles,
    desc: "Offer your unique professional skill, service, or creative contribution.",
    color: "border-purple-500/30 bg-purple-500/5 hover:border-purple-500 text-purple-400"
  }
];

export default function SocialJoin() {
  const { src: routeSource } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Source attribution: URL param or query string (default: social_media)
  const rawSource = (routeSource || searchParams.get("src") || searchParams.get("source") || "social_media").toLowerCase();
  const source = ["x", "twitter", "x_twitter"].includes(rawSource)
    ? "x_twitter"
    : ["wa", "whatsapp"].includes(rawSource)
    ? "whatsapp"
    : ["tt", "tiktok"].includes(rawSource)
    ? "tiktok"
    : ["fb", "facebook"].includes(rawSource)
    ? "facebook"
    : ["web", "website"].includes(rawSource)
    ? "website"
    : "social_media";

  // WhatsApp group link from dynamic campaign config
  const [whatsappLink, setWhatsappLink] = useState("https://chat.whatsapp.com/sample");
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    website_url_trap: "",
    firstName: "",
    lastName: "",
    phone: "+254",
    nationalId: "",
    yob: "",
    ward: "",
    pollingStation: "",
    volunteerRole: "general_supporter",
    customRole: "",
    consent: false
  });

  const [isCustomStation, setIsCustomStation] = useState(false);
  const locationCtx = useLocationData ? useLocationData() : null;
  const wardStationMap = locationCtx?.wardStationMap || {};

  const cleanWard = (formData.ward || "").trim();
  const stationsForWard = (function() {
    if (!cleanWard || !wardStationMap) return [];
    if (wardStationMap[cleanWard]) return wardStationMap[cleanWard];
    const key = Object.keys(wardStationMap).find(k => k.toLowerCase() === cleanWard.toLowerCase());
    return key ? wardStationMap[key] : [];
  })();

  const [submitting, setSubmitting] = useState(false);
  const [duplicateError, setDuplicateError] = useState(null);
  const [successData, setSuccessData] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const { data } = await api.getCampaignConfig();
        if (data && data.whatsapp_community_link) {
          setWhatsappLink(data.whatsapp_community_link);
        }
      } catch (err) {
        console.error("Failed to load campaign config", err);
      } finally {
        setLoadingConfig(false);
      }
    }
    fetchConfig();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "ward") {
      setIsCustomStation(false);
      setFormData(prev => ({ ...prev, ward: value, pollingStation: "" }));
      if (duplicateError) setDuplicateError(null);
      return;
    }
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
    if (duplicateError) setDuplicateError(null);
  };

  const handlePhoneChange = (e) => {
    let val = e.target.value.replace(/\s+/g, "");
    if (!val.startsWith("+254")) {
      if (val.startsWith("0")) {
        val = "+254" + val.slice(1);
      } else if (val.startsWith("254")) {
        val = "+" + val;
      } else if (!val.startsWith("+")) {
        val = "+254" + val;
      }
    }
    setFormData(prev => ({ ...prev, phone: val }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setDuplicateError(null);

    // Basic validation
    const fullName = `${formData.firstName.trim()} ${formData.lastName.trim()}`.trim();
    if (!fullName || !formData.firstName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone || !/^\+254\d{9}$/.test(formData.phone)) {
      toast.error("Please enter a valid phone number (+2547XXXXXXXX or 07XXXXXXXX)");
      return;
    }
    if (!formData.nationalId || formData.nationalId.trim().length < 6) {
      toast.error("Please enter a valid National ID number");
      return;
    }
    const currentYear = new Date().getFullYear();
    const yobNum = parseInt(formData.yob, 10);
    if (!yobNum || isNaN(yobNum) || yobNum < 1920 || (currentYear - yobNum) < 18) {
      toast.error("You must be at least 18 years old to register (enter valid birth year)");
      return;
    }
    if (!formData.ward) {
      toast.error("Please select your Ward in Laikipia");
      return;
    }
    if (formData.volunteerRole === "custom" && !formData.customRole.trim()) {
      toast.error("Please describe how you would like to participate in the custom role field");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        full_name: fullName,
        phone: formData.phone.trim(),
        national_id: formData.nationalId.trim(),
        yob: yobNum,
        ward: formData.ward,
        polling_station: formData.pollingStation.trim() || "General Ward",
        source: source,
        website_url_trap: formData.website_url_trap || "",
        volunteer_role: formData.volunteerRole,
        custom_role: formData.volunteerRole === "custom" ? formData.customRole.trim() : "",
        referred_by: null // Explicitly null so online recruits are separate from field mobilizers
      };

      const res = await api.register(payload);

      if (res.status === 409 || res.errorData?.already_registered) {
        setDuplicateError({
          message: res.errorData?.error || "A supporter with this National ID or Phone Number is already registered.",
          hasReferrer: res.errorData?.has_referrer,
          referrerName: res.errorData?.referrer_name,
          memberName: res.errorData?.member_name || fullName
        });
        toast.warning("Account already exists");
        return;
      }

      if (res.error) {
        throw new Error(res.error.error || res.error.message || "Registration failed");
      }

      setSuccessData({
        fullName,
        ward: formData.ward,
        role: formData.volunteerRole,
        phone: formData.phone
      });
      toast.success("🎉 Welcome to the DCP Movement!");
      window.scrollTo({ top: 0, behavior: "smooth" });

    } catch (err) {
      toast.error(err.message || "Failed to submit registration. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleShare = () => {
    const text = `Join me in shaping the future of Laikipia! Register as an official DCP supporter in ${formData.ward || "Laikipia"} here: ${window.location.origin}/join?src=whatsapp`;
    const shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(shareUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white flex flex-col justify-between py-8 px-4 sm:px-6 relative overflow-hidden">
      {/* Background glowing accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-500/10 blur-[100px] pointer-events-none rounded-full" />

      <div className="max-w-2xl mx-auto w-full relative z-10">
        
        {/* Header Branding */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
            <ShieldCheck className="w-4 h-4" />
            Official DCP Supporter Network
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            Shape The Future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-400">Laikipia</span>
          </h1>
          <p className="text-slate-400 text-sm sm:text-base max-w-lg mx-auto">
            Join thousands of patriotic citizens standing for visionary leadership, empowerment, and accountable governance.
          </p>

          {source && source !== "social_media" && (
            <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60">
              <span>Invited via</span>
              <span className="font-bold text-amber-400 capitalize">{source}</span>
            </div>
          )}
        </header>

        {/* State 1: SUCCESS CONFIRMATION */}
        {successData ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-900/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-xl text-center relative overflow-hidden"
          >
            <div className="w-20 h-20 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl flex items-center justify-center mx-auto mb-6 text-emerald-400 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">
              You're Officially Registered!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mb-6">
              Karibu sana, <span className="font-bold text-emerald-400">{successData.fullName}</span>. Your details are securely logged under <span className="font-bold text-white">{successData.ward} Ward</span>.
            </p>

            {/* Official WhatsApp Community Card */}
            <div className="bg-gradient-to-br from-emerald-950/60 to-slate-900 border border-emerald-500/40 rounded-2xl p-6 mb-6 text-left relative">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 shadow-md">
                  <MessageCircle className="w-6 h-6 fill-slate-950" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-white mb-1 flex items-center gap-2">
                    Official WhatsApp Community
                    <span className="text-[10px] uppercase font-black tracking-wider bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">HQ Verified</span>
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Connect instantly with fellow supporters, access official statements, event announcements, and direct mobilization updates.
                  </p>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-[0.98] text-sm"
                >
                  <MessageCircle className="w-5 h-5 fill-slate-950" />
                  Join Official WhatsApp Group
                  <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
                </a>
              </div>
            </div>

            {/* Virality: Share with Friends */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="button"
                onClick={handleShare}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-5 rounded-xl border border-slate-700 transition-colors text-sm"
              >
                <Share2 className="w-4 h-4 text-emerald-400" />
                Share Link on WhatsApp
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="inline-flex items-center justify-center gap-2 bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-white font-medium py-3 px-5 rounded-xl transition-colors text-sm"
              >
                Access Member Portal
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-center gap-2">
              <HeartHandshake className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>A local campaign representative will connect with you during ward outreach.</span>
            </div>
          </motion.div>

        ) : (

          /* State 2: REGISTRATION FORM */
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative">

            {/* Lockout Notice if Duplicate */}
            {duplicateError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-400" />
                <div className="flex-1 text-xs">
                  <p className="font-bold text-sm text-amber-200 mb-1">Already Registered!</p>
                  <p className="mb-3 text-slate-300">
                    {duplicateError.message}
                  </p>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-400 transition-colors"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Log In to Your Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => setDuplicateError(null)}
                      className="text-slate-400 hover:text-white text-xs underline"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Anti-Bot Decoy Honeypot Trap */}
              <div style={{ display: 'none', opacity: 0, position: 'absolute', left: '-9999px', height: 0, width: 0, pointerEvents: 'none' }} aria-hidden="true">
                <input 
                  type="text" 
                  name="website_url_trap" 
                  tabIndex={-1} 
                  autoComplete="off" 
                  value={formData.website_url_trap || ""}
                  onChange={handleChange} 
                />
              </div>

              {/* Section 1: Personal Details */}
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Personal Information
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">First Name *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="e.g. Kiprono"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Last Name *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="e.g. Mwangi"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Contact & Identification */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    WhatsApp Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    placeholder="+2547XXXXXXXX"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Used for official party SMS and WhatsApp group invite</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    National ID Number *
                  </label>
                  <input
                    type="text"
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="e.g. 28492019"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Ensures each supporter has one official voice</p>
                </div>
              </div>

              {/* Section 3: Birth Year & Electoral Ward */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                    Year of Birth *
                  </label>
                  <input
                    type="number"
                    name="yob"
                    value={formData.yob}
                    onChange={handleChange}
                    placeholder="e.g. 1996"
                    min="1920"
                    max={new Date().getFullYear() - 18}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Must be 18 or older to join</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Ward in Laikipia *
                  </label>
                  <select
                    name="ward"
                    value={formData.ward}
                    onChange={handleChange}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="">Select your Ward...</option>
                    {Object.entries(LAIKIPIA_CONSTITUENCIES).map(([constituency, wards]) => (
                      <optgroup key={constituency} label={constituency} className="bg-slate-900 text-emerald-400 font-bold">
                        {wards.map(w => (
                          <option key={w} value={w} className="bg-slate-950 text-white font-normal">
                            {w} ({constituency})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dynamic Polling Station Dropdown */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                    Polling Station / Village <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  {stationsForWard.length > 0 && !isCustomStation && (
                    <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      {stationsForWard.length} Stations in {cleanWard}
                    </span>
                  )}
                </div>

                {isCustomStation ? (
                  <div className="space-y-1.5">
                    <input
                      type="text"
                      name="pollingStation"
                      value={formData.pollingStation}
                      onChange={handleChange}
                      placeholder="Type your custom polling station or village..."
                      autoFocus
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-emerald-500/60 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomStation(false);
                        setFormData(prev => ({ ...prev, pollingStation: "" }));
                      }}
                      className="text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1 transition"
                    >
                      ← Back to {cleanWard} Station List
                    </button>
                  </div>
                ) : (
                  <select
                    name="pollingStation"
                    value={formData.pollingStation}
                    onChange={(e) => {
                      if (e.target.value === "__custom__") {
                        setIsCustomStation(true);
                        setFormData(prev => ({ ...prev, pollingStation: "" }));
                      } else {
                        handleChange(e);
                      }
                    }}
                    disabled={!formData.ward}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/70 border border-slate-700/80 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {!formData.ward
                        ? "Select your Ward above first..."
                        : stationsForWard.length > 0
                        ? "Select your Polling Station from list..."
                        : "No polling stations found (Choose custom below)"}
                    </option>
                    {stationsForWard.map(st => (
                      <option key={st} value={st} className="bg-slate-950 text-white">
                        {st}
                      </option>
                    ))}
                    <option value="__custom__" className="bg-slate-950 text-emerald-400 font-semibold">
                      + Other / Custom Village (Type Manually)
                    </option>
                  </select>
                )}
              </div>

              {/* Section 4: Volunteer Role Selector */}
              <div className="pt-2">
                <label className="block text-xs font-black uppercase tracking-widest text-emerald-400 mb-2">
                  How Would You Like to Participate?
                </label>
                <p className="text-xs text-slate-400 mb-3">
                  Choose how you wish to support the campaign. You can change this anytime.
                </p>

                <div className="grid grid-cols-1 gap-2.5">
                  {VOLUNTEER_ROLES.map((r) => {
                    const Icon = r.icon;
                    const isSelected = formData.volunteerRole === r.id;
                    return (
                      <label
                        key={r.id}
                        className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-emerald-500 bg-emerald-500/10 shadow-md shadow-emerald-500/5"
                            : "border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60"
                        }`}
                      >
                        <input
                          type="radio"
                          name="volunteerRole"
                          value={r.id}
                          checked={isSelected}
                          onChange={handleChange}
                          className="mt-1 accent-emerald-500 w-4 h-4"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-400" : "text-slate-400"}`} />
                            <span className={`text-sm font-bold ${isSelected ? "text-white" : "text-slate-200"}`}>
                              {r.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            {r.desc}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* If Custom Role is selected, show expandable text field */}
                <AnimatePresence>
                  {formData.volunteerRole === "custom" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3 overflow-hidden"
                    >
                      <label className="block text-xs font-bold text-purple-300 mb-1">
                        Describe Your Skill or Contribution *
                      </label>
                      <textarea
                        name="customRole"
                        value={formData.customRole}
                        onChange={handleChange}
                        rows={3}
                        placeholder="e.g. Graphic Designer, Legal Advice, Sound & PA Equipment, Media relations..."
                        required
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-purple-500/40 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-400 transition-colors"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Terms and Conditions Tick & Link */}
              <div className="pt-2 p-3.5 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    id="social_consent_checkbox"
                    name="consent"
                    checked={formData.consent}
                    onChange={handleChange}
                    required
                    className="mt-1 accent-emerald-500 w-4 h-4 rounded cursor-pointer shrink-0"
                  />
                  <div className="text-xs text-slate-300 leading-relaxed">
                    <span>I confirm my information is true and agree to the </span>
                    <button
                      type="button"
                      onClick={() => setShowTermsModal(true)}
                      className="text-emerald-400 font-bold underline hover:text-emerald-300 transition inline-flex items-center gap-1 cursor-pointer"
                    >
                      Terms & Conditions and Privacy Policy
                    </button>
                    <span className="block text-[11px] text-slate-500 mt-1">
                      (Tap the link to read the full terms or simply tick this box to proceed)
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black py-4 px-6 rounded-2xl transition-all shadow-xl shadow-emerald-500/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none text-base"
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    <span>Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Confirm Official Registration</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

            </form>

            <div className="mt-6 text-center text-xs text-slate-500">
              Already registered by a local mobilizer?{" "}
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-emerald-400 hover:underline font-bold ml-1"
              >
                Sign In
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} Democratic Congress Party (DCP) · Laikipia County Secretariat</p>
          <p className="mt-1 text-[11px]">Authorized by HQ Campaign Mobilization Office</p>
        </footer>

      </div>
      {/* Terms and Conditions Modal */}
      <AnimatePresence>
        {showTermsModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto"
            onClick={() => setShowTermsModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden my-auto"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-wider">
                      DCP Supporter Terms & Privacy
                    </h3>
                    <p className="text-[10px] text-slate-400 uppercase tracking-widest">
                      Laikipia County Campaign Secretariat
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition text-xs font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-[11px] font-medium">
                  ⚖️ In full compliance with the <strong>Kenya Data Protection Act (2019)</strong> and the Constitution of Kenya.
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">1. Voluntary Supporter Enrollment</h4>
                  <p className="text-slate-400">
                    By registering, you voluntarily join as a civic supporter of the Democratic Congress Party (DCP) in Laikipia County. Enrollment is free, voluntary, and does not impose commercial obligations.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">2. Strict Data Privacy & Protection</h4>
                  <p className="text-slate-400">
                    Your personal information (Full Name, Phone Number, National ID, and Ward) is stored securely with encryption. It is used exclusively by authorized party leadership for internal mobilization and verification. Your data will <strong>never</strong> be sold, transferred, or shared with commercial marketers.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">3. Communications & Updates</h4>
                  <p className="text-slate-400">
                    You consent to receive campaign updates, rally notifications, and official party news via SMS text broadcasts and verified WhatsApp community groups. You may opt-out of notifications at any time.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">4. Single Official Registration</h4>
                  <p className="text-slate-400">
                    To safeguard electoral integrity and prevent ghost records, each supporter is registered once under their verified National ID. If you have already registered with a local mobilizer, your record is protected.
                  </p>
                </div>

                <div>
                  <h4 className="font-bold text-white text-xs mb-1">5. Peaceful Civic Conduct</h4>
                  <p className="text-slate-400">
                    Supporters agree to promote peaceful democratic engagement, respect community members across all wards, and adhere to national election guidelines.
                  </p>
                </div>

                <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-[11px]">
                  <h4 className="font-black text-emerald-400 uppercase tracking-wider text-[10px]">
                    🏛️ Statutory Data Controller & DPO Notice (DPA 2019)
                  </h4>
                  <p className="text-slate-300">
                    <strong>Data Controller:</strong> Democratic Congress Party (DCP) — Laikipia County Secretariat, Nanyuki, Kenya.<br />
                    <strong>Designated DPO:</strong> <a href="mailto:dpo@dcplaikipia.or.ke" className="text-emerald-400 underline font-bold">dpo@dcplaikipia.or.ke</a>
                  </p>
                  <p className="text-slate-400">
                    <strong>Your Statutory Rights (Sections 26, 34 & 40):</strong> You have the right to request access, correction, or erasure of your details. You can opt-out ("STOP") from outreach broadcasts at any time.
                  </p>
                  <p className="text-slate-400">
                    <strong>CA Bulk Messaging Window:</strong> Outreach SMS is transmitted strictly between 07:00 AM – 07:00 PM EAT in accordance with Communications Authority regulations.
                  </p>
                  <p className="text-slate-400">
                    <strong>ODPC Oversight:</strong> Data subjects may lodge complaints with the <em>Office of the Data Protection Commissioner (ODPC)</em> at <a href="mailto:complaints@odpc.go.ke" className="text-emerald-400 underline">complaints@odpc.go.ke</a>.
                  </p>
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({ ...prev, consent: true }));
                    setShowTermsModal(false);
                    toast.success("✅ Terms & Conditions Accepted!");
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-black transition shadow-lg shadow-emerald-500/20"
                >
                  ✓ Accept Terms & Check Box
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
