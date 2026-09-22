import React, { useState } from 'react';
import { ShieldCheck, KeyRound, Lock, Eye, EyeOff, CheckCircle2, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../lib/api';

export default function AdminSecuritySettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await api.changeAdminPassword(currentPassword, newPassword, confirmPassword);
      if (error) {
        toast.error(error.message || 'Failed to update password.');
      } else {
        toast.success(data?.message || 'Password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      toast.error(err?.message || 'An error occurred while updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-slate-900 rounded-3xl p-6 sm:p-8 border border-slate-800 shadow-2xl text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_100%_0%,rgba(0,132,61,0.25)_0%,transparent_60%)] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-dcp-green/20 border border-dcp-green/40 text-dcp-green text-[10px] font-black uppercase tracking-widest mb-2">
              <ShieldCheck size={14} />
              HQ Administrative Security
            </div>
            <h1 className="text-2xl sm:text-3xl font-black italic tracking-tight">Admin Password & Credentials</h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              Securely update your master administrative password. This password is used for root access and the backend Django control panel.
            </p>
          </div>
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0 shadow-inner">
            <KeyRound className="text-amber-400 w-7 h-7" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Main Password Change Form */}
        <div className="md:col-span-2 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <h2 className="text-lg font-black text-slate-900 uppercase tracking-wide mb-1 flex items-center gap-2">
            <Lock className="text-dcp-green" size={20} />
            Update Administrator Password
          </h2>
          <p className="text-slate-500 text-xs mb-6">
            Enter your current password and choose a strong new password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current Password */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password (default: admin123)"
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-dcp-green focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-dcp-green focus:bg-white transition"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {newPassword && (
                <div className="mt-2 flex items-center gap-2">
                  <div className={`h-1.5 flex-1 rounded-full ${newPassword.length >= 8 ? 'bg-dcp-green' : newPassword.length >= 6 ? 'bg-amber-400' : 'bg-red-400'}`} />
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {newPassword.length >= 8 ? 'Strong' : newPassword.length >= 6 ? 'Fair' : 'Too Short'}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm New Password */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-4 pr-11 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-dcp-green focus:bg-white transition"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-emerald-600 text-xs font-bold mt-1.5 flex items-center gap-1">
                  <CheckCircle2 size={14} /> Passwords match
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 bg-slate-900 text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-dcp-green transition flex items-center justify-center gap-2 shadow-md disabled:opacity-50 mt-4"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Updating Password...
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  Save New Password
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security Info Sidebar */}
        <div className="space-y-4">
          <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-3 flex items-center gap-2">
              <Sparkles size={16} className="text-amber-500" />
              Security Guidelines
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-dcp-green font-bold">✓</span>
                Use a unique password with mixed letters, numbers, and symbols.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dcp-green font-bold">✓</span>
                All password changes are cryptographically hashed and logged to the system audit trail.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-dcp-green font-bold">✓</span>
                Never share HQ credentials with unauthorized field mobilizers.
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-2">
              Backend Control Panel
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-normal">
              You can also access the full Django Administration interface for advanced audit logs and voter registry operations.
            </p>
            <a
              href="https://laikipia-backend.onrender.com/admin/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider transition"
            >
              Open Django Admin ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
