import { useLanguage } from '../contexts/LanguageContext';
import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  MapPin, 
  Clock, 
  Phone, 
  PhoneCall,
  Users, 
  CheckCircle2, 
  UserCheck, 
  XCircle, 
  AlertCircle, 
  Filter, 
  Search, 
  Share2, 
  ChevronRight, 
  Sparkles,
  ChevronLeft,
  Eye,
  ShieldCheck,
  Building,
  Tag,
  ChevronDown
} from 'lucide-react';
import { api } from '../lib/api';
import { LAIKIPIA_CONSTITUENCIES, FUNCTION_CATEGORIES } from '../lib/constants';
import { toast } from 'sonner';

export default function Diary({ user }) {
  const { t } = useLanguage();
  const isAdmin = user?.is_admin || user?.is_staff || user?.is_superuser;
  
  const [functions, setFunctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedConstituency, setSelectedConstituency] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRsvpModal, setShowRsvpModal] = useState(false);
  const [selectedFunction, setSelectedFunction] = useState(null);

  // Form State for Add Event
  const [formData, setFormData] = useState({
    title: '',
    event_type: 'chama',
    constituency: 'Laikipia West',
    ward: '',
    venue: '',
    event_date: new Date().toISOString().split('T')[0],
    start_time: '10:00 AM',
    contact_person_name: '',
    contact_person_phone: '',
    expected_attendance: 50,
    description: '',
    status: isAdmin ? 'attending' : 'pending',
    delegate_name: '',
    delegate_phone: '',
    admin_notes: '',
  });

  // Form State for RSVP Modal
  const [rsvpData, setRsvpData] = useState({
    status: 'attending',
    delegate_name: '',
    delegate_phone: '',
    admin_notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch functions from backend
  const fetchFunctions = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedConstituency !== 'all') params.constituency = selectedConstituency;
      if (selectedStatus !== 'all') params.status = selectedStatus;
      if (selectedCategory !== 'all') params.type = selectedCategory;
      
      const { data, error } = await api.getFunctions(params);
      if (error) throw error;
      setFunctions(data || []);
    } catch (err) {
      console.error("Failed to load campaign diary:", err);
      toast.error("Failed to load campaign diary");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFunctions();
  }, [selectedConstituency, selectedStatus, selectedCategory]);

  // Handle Creating a Function
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.venue || !formData.contact_person_name) {
      toast.error("Please fill in the function title, venue, and contact person.");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await api.createFunction(formData);
      if (error) throw error;
      
      toast.success(
        isAdmin 
          ? "Function added to Governor's Diary!" 
          : "Function submitted to Secretariat for review!"
      );
      setShowAddModal(false);
      // Reset form
      setFormData({
        title: '',
        event_type: 'chama',
        constituency: 'Laikipia West',
        ward: '',
        venue: '',
        event_date: new Date().toISOString().split('T')[0],
        start_time: '10:00 AM',
        contact_person_name: '',
        contact_person_phone: '',
        expected_attendance: 50,
        description: '',
        status: isAdmin ? 'attending' : 'pending',
        delegate_name: '',
        delegate_phone: '',
        admin_notes: '',
      });
      fetchFunctions();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to submit function");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Admin RSVP Update
  const handleRsvpSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFunction) return;

    try {
      setIsSubmitting(true);
      const { data, error } = await api.updateFunction(selectedFunction.id, rsvpData);
      if (error) throw error;

      toast.success(`Updated status to: ${rsvpData.status.toUpperCase()}`);
      setShowRsvpModal(false);
      setSelectedFunction(null);
      fetchFunctions();
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Failed to update RSVP");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open RSVP Modal
  const openRsvp = (func) => {
    setSelectedFunction(func);
    setRsvpData({
      status: func.status,
      delegate_name: func.delegate_name || '',
      delegate_phone: func.delegate_phone || '',
      admin_notes: func.admin_notes || '',
    });
    setShowRsvpModal(true);
  };

  // Filtered list by client-side search query
  const filteredFunctions = useMemo(() => {
    return functions.filter(f => {
      const matchSearch = 
        f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.venue.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.ward && f.ward.toLowerCase().includes(searchQuery.toLowerCase())) ||
        f.contact_person_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [functions, searchQuery]);

  // Compute Upcoming D-Day Reminders (Functions today or within next 72 hours)
  const upcomingReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const threeDaysOut = new Date(today);
    threeDaysOut.setDate(threeDaysOut.getDate() + 3);

    return functions
      .filter(f => {
        if (f.status !== 'attending' && f.status !== 'delegated') return false;
        const d = new Date(f.event_date);
        return d >= today && d <= threeDaysOut;
      })
      .sort((a, b) => new Date(a.event_date) - new Date(b.event_date));
  }, [functions]);

  // Available Wards for selected constituency
  const availableWards = useMemo(() => {
    return LAIKIPIA_CONSTITUENCIES[formData.constituency] || [];
  }, [formData.constituency]);

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto px-2 sm:px-4">
      {/* ── Top Header & Executive Summary ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-3xl text-white shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-widest mb-1">
            <CalendarIcon size={16} /> Campaign Diary & Grassroots Calendar
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            {t('diary_title')}
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            Track and coordinate community invitations, church harambees, chamas, and grassroots barazas across Laikipia.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition shrink-0"
        >
          <Plus size={18} />
          <span>{isAdmin ? "Add Event / Chama" : t('diary_register_btn')}</span>
        </button>
      </div>

      {/* ── Constituency Selector Bar ── */}
      <div className="bg-white p-2 sm:p-3 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-1.5 flex-wrap">
        <label htmlFor="region-select" className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 shrink-0 flex items-center gap-1.5">
          <Building size={14} className="text-slate-500" /> Region:
        </label>
        <div className="relative min-w-[200px] sm:w-64">
          <select
            id="region-select"
            value={selectedConstituency}
            onChange={(e) => setSelectedConstituency(e.target.value)}
            className="w-full appearance-none bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 pr-9 text-xs font-bold text-slate-800 transition cursor-pointer focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="all">🌍 {t('all_laikipia')}</option>
            <option value="Laikipia East">📍 {t('laikipia_east')}</option>
            <option value="Laikipia West">📍 {t('laikipia_west')}</option>
            <option value="Laikipia North">📍 {t('laikipia_north')}</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
            <ChevronDown size={14} />
          </div>
        </div>
      </div>

      {/* ── D-Day Reminders Banner ({t('diary_next_72h')}) ── */}
      {upcomingReminders.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Sparkles size={16} /> 🚨 {t('diary_reminders_title')} ({upcomingReminders.length})
            </h2>
            <span className="text-[11px] font-bold text-slate-400">{t('diary_next_72h')}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingReminders.map(rem => {
              const isToday = new Date(rem.event_date).toDateString() === new Date().toDateString();
              return (
                <div 
                  key={rem.id}
                  className={`p-4 rounded-2xl border shadow-sm flex flex-col justify-between transition relative overflow-hidden ${
                    isToday 
                      ? 'bg-amber-50/70 border-amber-300 ring-2 ring-amber-400/30' 
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                        isToday ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-900 text-white'
                      }`}>
                        {isToday ? '🔥 TODAY' : `📅 ${rem.event_date}`}
                      </span>
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                        <Clock size={12} /> {rem.start_time}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{rem.title}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin size={12} className="text-emerald-600 shrink-0" />
                      <span className="truncate">{rem.venue} {rem.ward ? `(${rem.ward})` : ''}</span>
                    </p>

                    <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{t('diary_contact_person')}</p>
                        <p className="font-bold text-slate-800 truncate">{rem.contact_person_name}</p>
                      </div>
                      {rem.contact_person_phone && (
                        <a
                          href={`tel:${rem.contact_person_phone}`}
                          className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg flex items-center gap-1 text-[11px] font-bold transition shrink-0"
                          title="Call {t('diary_contact_person')}"
                        >
                          <PhoneCall size={12} /> Call
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      rem.status === 'attending' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {rem.status === 'attending' ? t('diary_attending') : `👥 Delegate: ${rem.delegate_name || 'Assigned'}`}
                    </span>
                    {isAdmin && (
                      <button 
                        onClick={() => openRsvp(rem)}
                        className="text-xs font-bold text-slate-600 hover:text-slate-900 underline"
                      >
                        Change RSVP
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Status Tabs & Search Filters ── */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap pb-1 md:pb-0">
            {[
              { id: 'all', label: t('diary_all_agendas') },
              { id: 'attending', label: '👑 Confirmed' },
              { id: 'delegated', label: '👥 Delegated' },
              { id: 'pending', label: '⏳ Pending' },
              { id: 'declined', label: '❌ Declined' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedStatus(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  selectedStatus === tab.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Search event, venue, leader..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0">
            Category:
          </span>
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
              selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            All Types
          </button>
          {FUNCTION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition shrink-0 ${
                selectedCategory === cat.id ? 'bg-slate-800 text-white' : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Diary Cards Grid ── */}
      {loading ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
          <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3" />
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Loading Campaign Diary...</p>
        </div>
      ) : filteredFunctions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6">
          <CalendarIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-700 text-base">{t('diary_no_functions')}</h3>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            {selectedStatus !== 'all' || selectedConstituency !== 'all' 
              ? "No functions match your active filters." 
              : "No community functions registered yet. Mobilizers and Secretariat can submit new events above."}
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
          >
            + Add First Function
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFunctions.map(func => {
            const isSubmitter = user?.id === func.submitted_by;
            return (
              <div
                key={func.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between hover:shadow-md transition"
              >
                <div>
                  {/* Category & Status Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {func.event_type_display}
                    </span>

                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${
                      func.status === 'attending'
                        ? 'bg-emerald-100 text-emerald-800'
                        : func.status === 'delegated'
                        ? 'bg-blue-100 text-blue-800'
                        : func.status === 'pending'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}>
                      {func.status === 'attending' && <CheckCircle2 size={12} />}
                      {func.status === 'delegated' && <UserCheck size={12} />}
                      {func.status === 'pending' && <AlertCircle size={12} />}
                      {func.status === 'declined' && <XCircle size={12} />}
                      {func.status_display}
                    </span>
                  </div>

                  {/* Title & Timing */}
                  <h3 className="font-bold text-slate-900 text-base leading-snug">{func.title}</h3>
                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-2 font-medium">
                    <span className="flex items-center gap-1 text-emerald-700 font-bold">
                      <CalendarIcon size={14} /> {func.event_date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={14} /> {func.start_time}
                    </span>
                  </div>

                  {/* Location Info */}
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600 border border-slate-100">
                    <div className="flex items-start gap-1.5">
                      <MapPin size={14} className="text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-slate-800">{func.venue}</span>
                        <p className="text-[11px] text-slate-500">{func.ward || 'General Ward'}, {func.constituency}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 text-[11px]">
                      <span className="flex items-center gap-1 text-slate-500">
                        <Users size={12} /> Expected: <strong className="text-slate-800">{func.expected_attendance} voters</strong>
                      </span>
                      {func.submitted_by_name && (
                        <span className="text-slate-400">By: {func.submitted_by_name}</span>
                      )}
                    </div>
                  </div>

                  {/* Delegate / Admin Notes (if delegated or declined) */}
                  {func.status === 'delegated' && (
                    <div className="mt-2.5 p-2.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
                      <p className="text-[10px] font-bold uppercase text-blue-600">{t('diary_assigned_delegate')}</p>
                      <p className="font-bold">{func.delegate_name || 'Representative'} {func.delegate_phone ? `(${func.delegate_phone})` : ''}</p>
                    </div>
                  )}

                  {func.status === 'declined' && func.admin_notes && (
                    <div className="mt-2.5 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                      <p className="text-[10px] font-bold uppercase text-rose-600">{t('diary_regrets_note')}</p>
                      <p>{func.admin_notes}</p>
                    </div>
                  )}
                </div>

                {/* Card Action Footer */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {/* {t('diary_contact_person')} */}
                  <div className="text-xs truncate">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Contact</span>
                    <span className="font-bold text-slate-800 truncate">{func.contact_person_name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {func.contact_person_phone && (
                      <a
                        href={`tel:${func.contact_person_phone}`}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                        title="Call Contact"
                      >
                        <Phone size={14} />
                      </a>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => openRsvp(func)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                      >
                        RSVP
                      </button>
                    )}

                    {isSubmitter && !isAdmin && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                        Submitted by you
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL: Register New Function / Chama ── */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {isAdmin ? "Add Event to Governor's Diary" : "Register Chama / Community Function"}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isAdmin 
                      ? "Add an event directly to the Governor's official itinerary"
                      : "Submit a grassroots meeting for Governor/Secretariat review"}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {/* Title */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Function / Chama Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sosian Youth SACCO AGM / St. Peters Harambee"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Category & Expected Crowd */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Event Type
                    </label>
                    <select
                      value={formData.event_type}
                      onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {FUNCTION_CATEGORIES.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Estimated Crowd Size
                    </label>
                    <input
                      type="number"
                      min="5"
                      value={formData.expected_attendance}
                      inputMode="numeric" onChange={(e) => setFormData({ ...formData, expected_attendance: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Constituency & Ward */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Constituency
                    </label>
                    <select
                      value={formData.constituency}
                      onChange={(e) => setFormData({ ...formData, constituency: e.target.value, ward: '' })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      {Object.keys(LAIKIPIA_CONSTITUENCIES).map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Ward
                    </label>
                    <select
                      value={formData.ward}
                      onChange={(e) => setFormData({ ...formData, ward: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    >
                      <option value="">-- Select Ward --</option>
                      {availableWards.map(w => (
                        <option key={w} value={w}>{w}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Venue */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    Specific Venue / Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ol Moran Catholic Hall / Nanyuki Central Park"
                    value={formData.venue}
                    onChange={(e) => setFormData({ ...formData, venue: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Date & Start Time */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Event Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.event_date}
                      onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Start Time
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 10:00 AM"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* {t('diary_contact_person')} */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Contact Leader Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chair Mary Wanjiku"
                      value={formData.contact_person_name}
                      onChange={(e) => setFormData({ ...formData, contact_person_name: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Contact Phone Number
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0722000000"
                      value={formData.contact_person_phone}
                      onChange={(e) => setFormData({ ...formData, contact_person_phone: e.target.value })}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Governor Direct Status Selection (for Admin) */}
                {isAdmin && (
                  <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-3">
                    <label className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                      Initial Attendance Status
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'attending', label: '👑 Attending' },
                        { id: 'delegated', label: '👥 Delegate' },
                        { id: 'pending', label: '⏳ Pending' },
                      ].map(s => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, status: s.id })}
                          className={`p-2 rounded-xl text-xs font-bold transition text-center ${
                            formData.status === s.id
                              ? 'bg-emerald-500 text-slate-950 font-black'
                              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>

                    {formData.status === 'delegated' && (
                      <div className="pt-2 grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Delegate Name"
                          value={formData.delegate_name}
                          onChange={(e) => setFormData({ ...formData, delegate_name: e.target.value })}
                          className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        />
                        <input
                          type="tel"
                          placeholder="Delegate Phone"
                          value={formData.delegate_phone}
                          inputMode="tel" onChange={(e) => setFormData({ ...formData, delegate_phone: e.target.value })}
                          className="p-2.5 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    {isSubmitting ? t('diary_saving') : (isAdmin ? t('diary_save_btn') : t('diary_submit_btn'))}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── MODAL: Admin RSVP & {t('diary_delegate_assignment')} ── */}
      <AnimatePresence>
        {showRsvpModal && selectedFunction && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-black text-slate-900">{t('diary_update_rsvp')}</h3>
                  <p className="text-xs text-slate-500 truncate max-w-xs">{selectedFunction.title}</p>
                </div>
                <button
                  onClick={() => setShowRsvpModal(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleRsvpSubmit} className="space-y-4">
                {/* RSVP Options */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'attending', label: t('diary_attending'), color: 'border-emerald-500 text-emerald-800' },
                    { id: 'delegated', label: t('diary_send_delegate'), color: 'border-blue-500 text-blue-800' },
                    { id: 'pending', label: t('diary_keep_pending'), color: 'border-amber-500 text-amber-800' },
                    { id: 'declined', label: t('diary_send_regrets'), color: 'border-rose-500 text-rose-800' },
                  ].map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setRsvpData({ ...rsvpData, status: opt.id })}
                      className={`p-3 rounded-2xl text-xs font-bold border-2 transition text-left ${
                        rsvpData.status === opt.id
                          ? `bg-slate-900 text-white border-slate-900 shadow-md`
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Delegate Details if Delegated */}
                {rsvpData.status === 'delegated' && (
                  <div className="space-y-3 p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
                    <p className="text-[11px] font-bold text-blue-800 uppercase">{t('diary_delegate_assignment')}</p>
                    <input
                      type="text"
                      required
                      placeholder={t('diary_delegate_name')}
                      value={rsvpData.delegate_name}
                      onChange={(e) => setRsvpData({ ...rsvpData, delegate_name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                    <input
                      type="tel"
                      placeholder={t('diary_delegate_phone')}
                      value={rsvpData.delegate_phone}
                      inputMode="tel" onChange={(e) => setRsvpData({ ...rsvpData, delegate_phone: e.target.value })}
                      className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-xs font-semibold focus:outline-none"
                    />
                  </div>
                )}

                {/* Admin Notes */}
                <div>
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                    {t('diary_notes')}
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Bring 10 footballs for the youth SACCO / Confirmed with Pastor Njoroge"
                    value={rsvpData.admin_notes}
                    onChange={(e) => setRsvpData({ ...rsvpData, admin_notes: e.target.value })}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowRsvpModal(false)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-lg transition"
                  >
                    {isSubmitting ? t('diary_updating') : t('diary_save_rsvp')}
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
