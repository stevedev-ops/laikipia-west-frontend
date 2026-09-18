import { useLanguage } from '../contexts/LanguageContext';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, Download, Users, Phone, MapPin, Loader2, Copy, Clock, ShieldCheck, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { api } from "../lib/api";
import { useLocationData } from "../contexts/LocationContext";

export default function SmsExport() {
  const { t } = useLanguage();
  const { wardsWithCenters } = useLocationData();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ ward: "", station: "" });
  
  // Kenya EAT Timezone & CA Bulk SMS Curfew Check (07:00 - 19:00 EAT)
  const [eatTime, setEatTime] = useState({ timeStr: '', hour: 12, isCurfew: false });

  useEffect(() => {
    const updateEatTime = () => {
      const now = new Date();
      const eatFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Africa/Nairobi',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      });
      const timeStr = eatFormatter.format(now);
      const hour = parseInt(timeStr.split(':')[0], 10);
      const isCurfew = hour < 7 || hour >= 19;
      setEatTime({ timeStr, hour, isCurfew });
    };

    updateEatTime();
    const interval = setInterval(updateEatTime, 10000);
    return () => clearInterval(interval);
  }, []);

  const availableStations = form.ward ? wardsWithCenters.find(w => w.name === form.ward)?.centers || [] : [];

  const handleFilter = async () => {
    setLoading(true);
    try {
      const { data: res } = await api.getSmsRecipients(form);
      setData(res || { count: 0, recipients: [], opted_out_excluded: 0 });
    } catch (err) {
      toast.error("Failed to load recipients list");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyNumbers = () => {
    if (!data?.recipients.length) return;
    const numbers = data.recipients.map(r => r.phone).join(", ");
    navigator.clipboard.writeText(numbers);
    toast.success(`${data.count} numbers copied to clipboard!`);
  };

  const handleDownloadCsv = () => {
    if (!data?.recipients.length) return;
    const headers = "Name,Phone,Ward,Station,DPA_OptOut_Status\n";
    const rows = data.recipients.map(r => `"${r.name}","${r.phone}","${r.ward}","${r.station}","Consented (Opt-In Active)"`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dcp_sms_contacts_${form.ward || 'all'}_eat_${eatTime.timeStr.replace(/:/g, '')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV Downloaded!");
  };

  return (
    <div className="selection:bg-dcp-green/30">
      <div className="w-full space-y-6">

        {/* Header Banner */}
        <div className="relative overflow-hidden bg-slate-900 rounded-[2rem] p-8 border border-slate-800 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(0,132,61,0.2)_0%,transparent_60%)] pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.35em] text-slate-400 mb-1">{t('sms_title') || 'CAMPAIGN OUTREACH'}</p>
              <h1 className="text-3xl font-black text-white italic uppercase">Ward-Targeted SMS Export</h1>
              <p className="text-slate-400 text-sm mt-1">Export filtered lists of consented supporters for Africa's Talking / Bulk SMS</p>
            </div>
            
            {/* Live CA Curfew Indicator */}
            <div className={`p-4 rounded-2xl border flex items-center gap-3 backdrop-blur-sm ${
              eatTime.isCurfew 
                ? 'bg-rose-950/40 border-rose-500/40 text-rose-300' 
                : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            }`}>
              <Clock className="w-6 h-6 shrink-0" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black tracking-widest uppercase">EAT: {eatTime.timeStr || '--:--'}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase ${
                    eatTime.isCurfew ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-slate-950'
                  }`}>
                    {eatTime.isCurfew ? 'CA Curfew Active' : 'CA Window Open'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-300 mt-0.5">
                  {eatTime.isCurfew ? 'Night curfew 19:00 - 07:00 EAT' : 'Legal sending hours (07:00 - 19:00 EAT)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Regulatory Advisory Alert */}
        {eatTime.isCurfew ? (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3 shadow-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold text-amber-950">Communications Authority of Kenya (CA) Nighttime Bulk SMS Curfew Active</p>
              <p className="text-amber-800 leading-relaxed">
                CA Consumer Protection guidelines strictly prohibit sending promotional or campaign bulk SMS between <strong>7:00 PM and 7:00 AM East Africa Time</strong>. 
                You can generate and download lists now, but outgoing broadcasts should be scheduled for dispatch after <strong>07:00 AM EAT</strong>.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-emerald-950">CA & Kenya DPA 2019 Compliant Outreach Window</p>
              <p className="text-emerald-700">
                Bulk messaging window is active (07:00 – 19:00 EAT). Opted-out citizens ("STOP" requests) are automatically filtered out to ensure statutory compliance.
              </p>
            </div>
          </div>
        )}

        {/* Filter Controls */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('sms_filter') || 'SELECT JURISDICTION'}</p>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              DPA Right to Erasure / Exclusions Enabled
            </span>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Ward</label>
              <select value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value, station: "" }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none">
                <option value="">All Wards (Whole Constituency)</option>
                {wardsWithCenters.map(w => <option key={w.id} value={w.name}>{w.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1.5">Polling Station</label>
              <select value={form.station} onChange={e => setForm(f => ({ ...f, station: e.target.value }))} disabled={!form.ward}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold outline-none focus:border-dcp-green/50 transition appearance-none disabled:opacity-50">
                <option value="">{t('sms_all_stations') || 'All Polling Stations'}</option>
                {availableStations.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <button onClick={handleFilter} disabled={loading}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Users className="w-5 h-5" />} Generate Filtered SMS Audience
          </button>
        </div>

        {/* Results Display */}
        {data && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white border border-dcp-green/30 rounded-3xl p-6 shadow-md space-y-6">
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-baseline gap-3">
                  <p className="text-3xl font-black text-dcp-green">{data.count}</p>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Eligible Recipients</span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('sms_matching') || 'MATCHING ACTIVE CONSENT'}</p>
                  {data.opted_out_excluded > 0 && (
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-0.5 rounded-full border border-rose-200">
                      {data.opted_out_excluded} opted-out supporters excluded (DPA Right to Erasure)
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={handleCopyNumbers} disabled={data.count === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition disabled:opacity-50">
                  <Copy className="w-4 h-4" /> Copy Numbers
                </button>
                <button onClick={handleDownloadCsv} disabled={data.count === 0}
                  className="flex items-center gap-2 px-5 py-3 bg-dcp-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-dcp-green/90 transition shadow-lg shadow-dcp-green/20 disabled:opacity-50">
                  <Download className="w-4 h-4" /> Download Clean CSV
                </button>
              </div>
            </div>

            {/* Mandatory SMS compliance reminder */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2.5 text-xs text-slate-600">
              <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-slate-800">CA Kenya & DPA Mandatory Broadcast Guidelines:</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Always ensure every outgoing campaign SMS identifies <em>"DCP Laikipia"</em> as the sender and concludes with clear opt-out directions, e.g., <em>"To STOP receiving updates, reply STOP to 0722XXXXXX"</em>.
                </p>
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto pr-2 space-y-2">
              {data.recipients.map((r, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-slate-300 transition">
                  <div>
                    <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{r.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3" /> {r.ward} · {r.station}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-black text-slate-700 tracking-wider flex items-center gap-1.5 font-mono text-sm">
                      <Phone className="w-3.5 h-3.5 text-slate-400" /> {r.phone}
                    </p>
                    <span className="text-[9px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Active
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
