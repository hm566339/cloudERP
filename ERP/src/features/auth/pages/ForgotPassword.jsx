import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { Mail, CheckCircle2, ArrowRight } from "lucide-react";
import { forgotPassword } from '../../../api/sso/user';
import { useGetOpenCompaniesQuery } from '../../../api/sso';
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { useRoutePath } from "../../../hooks/useRoutePath";
import CustomSelect from '../../../components/common/CustomSelect';

const schema = yup.object().shape({
  companyCode: yup.string().required("Company Code is required"),
  email: yup
    .string()
    .email("Please enter a valid email")
    .required("Email is required"),
});

export default function ForgotPassword() {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const { data: companies = [], isLoading: loadingCompanies } = useGetOpenCompaniesQuery();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { buildPath } = useRoutePath();
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token");

  // If the user clicks an email link that points to /forgot-password?token=...
  // automatically redirect them to the actual reset password page.
  useEffect(() => {
    if (token) {
      navigate(`/reset-password?token=${token}`, { replace: true });
    }
  }, [token, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      await forgotPassword(data.email, data.companyCode);
      setSuccess(true);
    } catch (error) {
      dispatch(addAlert({ type: "error", message: error?.response?.data?.message || "Failed to send reset link" }));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-12 w-full max-w-lg mx-auto animate-fade-in-up text-center relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-500 mb-6 border border-emerald-100 shadow-sm">
            <CheckCircle2 size={32} />
          </div>
          <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight leading-tight mb-2">Verification Link Sent</h2>
          <p className="text-[12px] text-zinc-500 font-medium mb-8">
            Check your email box. We have sent recovery instructions to reset your account password.
          </p>
          <Link
            to={buildPath('/login')}
            className="w-full flex justify-center items-center gap-2 px-4 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white text-[12.8px] font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-xl shadow-emerald-500/20 group"
          >
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-12 w-full max-w-lg mx-auto animate-fade-in-up relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="space-y-3 mb-10 text-center relative z-10 mt-2">
        <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight leading-tight">Reset password</h2>
        <p className="text-[12px] text-zinc-500 font-medium">We'll email you instructions to reset it.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
        <div className="space-y-2">
          <label className="text-[11.2px] font-bold text-zinc-700 block">
            Company Code
          </label>
          <div className="relative group">
            <CustomSelect
              {...register("companyCode")}
              className={`w-full px-4 py-4 bg-white/50 hover:bg-white border ${errors.companyCode ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-2xl text-[12px] font-semibold text-zinc-800 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md appearance-none`}
              disabled={loadingCompanies}
            >
              <option value="">{loadingCompanies ? "Loading Companies..." : "Select a Company"}</option>
              {companies.map((company) => (
                <option key={company.id} value={company.code}>
                  {company.name} ({company.code})
                </option>
              ))}
            </CustomSelect>
          </div>
          {errors.companyCode && (
            <p className="text-[10.4px] text-rose-500 font-medium mt-1.5 animate-fade-in">
              {errors.companyCode.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="text-[11.2px] font-bold text-zinc-700 block">
            Your Registered Email
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none z-10">
              <Mail size={20} />
            </span>
            <input
              type="email"
              {...register("email")}
              placeholder="e.g. employee@company.com"
              className={`w-full pl-12 pr-4 py-4 bg-white/50 hover:bg-white border ${errors.email ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-2xl text-[12px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
          </div>
          {errors.email && (
            <p className="text-[10.4px] text-rose-500 font-medium mt-1.5 animate-fade-in">
              {errors.email.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-10 flex justify-center items-center gap-2 px-4 py-4 bg-zinc-900 hover:bg-zinc-800 text-white text-[12.8px] font-bold rounded-2xl transition-all duration-300 active:scale-[0.98] shadow-xl shadow-zinc-900/20 disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-6 h-6 border-2 border-zinc-300 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <span>Send Recovery Link</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </button>

        <div className="mt-8 pt-6 border-t border-zinc-100 text-center">
          <Link to={buildPath('/login')} className="inline-flex items-center justify-center gap-2 px-4 py-2 text-[11.2px] font-bold text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-xl transition-colors border border-zinc-200/50">
            ← Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
}
