import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { motion } from "framer-motion";
void motion;
import { User, CreditCard, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

const schema = z.object({
  firstName: z.string().min(2, "First name is required"),
  nationalId: z.string().min(7, "Valid ID number is required"),
});

export default function LoginForm({ onLogin }) {
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      const fName = data.firstName.trim();
      const nId = data.nationalId.trim();

      const { data: res, error } = await api.login(fName, nId);

      if (error) throw error;
      const { member: user, token } = res;

      if (!user) {
        throw new Error("No member found with that First Name and ID combination.");
      }

      toast.success(`Welcome back, ${(user.full_name || 'Member').split(' ')[0]}!`);
      onLogin(user.id, token);
      
      const isCoordinator = ['polling_centre_coordinator', 'ward_coordinator', 'sub_county_coordinator', 'pillar', 'county_manager', 'governor'].includes(user.campaign_role);

      if (user.is_admin) {
        navigate("/admin", { replace: true });
      } else if (isCoordinator) {
        navigate("/dashboard", { replace: true });
      } else if (user.is_agent) {
        navigate("/agent-dashboard", { replace: true });
      } else if (user.security_rank && user.security_rank !== 'none') {
        navigate("/security", { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      toast.error(error.message || "Failed to log in.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="max-w-xl mx-auto -mt-4 sm:-mt-10 relative z-30 px-2 sm:px-4"
    >
      <div className="card-official p-4 sm:p-8 border-t-4 sm:border-t-8 border-t-dcp-green shadow-xl rounded-2xl sm:rounded-3xl">
        <header className="flex flex-col items-center mb-4 sm:mb-8 text-center">
          <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-dcp-green mb-2 sm:mb-4">
            <ShieldCheck size={32} />
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mb-1">Member Login</h2>
          <p className="text-slate-500 font-medium text-sm">Access your DCP Command Center dashboard.</p>
        </header>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-5">
          <section className="space-y-3 pt-1 sm:pt-3">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-1.5 mb-3">User Identity Verification</h3>

            <div className="space-y-4">
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("firstName")}
                  className="input-official pl-12"
                  placeholder="First Name (As per ID Card)"
                />
                {errors.firstName && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.firstName.message}</p>}
              </div>

              <div className="relative">
                <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-dcp-green transition-colors" />
                <input
                  {...register("nationalId")}
                  className="input-official pl-12"
                  placeholder="National ID Number"
                  type="password"
                  autoComplete="current-password"
                inputMode="numeric" />
                {errors.nationalId && <p className="text-red-500 text-[10px] mt-1.5 ml-1 font-bold">{errors.nationalId.message}</p>}
              </div>
            </div>
          </section>

          <motion.button
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            className="btn-primary w-full mt-6 flex items-center justify-center gap-3 active:bg-dcp-green-dark"
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Authenticating...
              </span>
            ) : "Log In to Dashboard"}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}
