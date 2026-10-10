import React, { useState } from "react";
import { Link, useNavigate, useLocation, useSearchParams, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { KeyRound, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { resetPassword } from '../../../api/sso/user';
import { useRoutePath } from "../../../hooks/useRoutePath";

const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@#$%^&+=])/,
      "Password must contain uppercase, lowercase, number, and special character (@#$%^&+=)"
    )
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const { buildPath } = useRoutePath();
  const dispatch = useAppDispatch();
  const [showPassword, setShowPassword] = useState(false);
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const token = paramToken || searchParams.get("token");
  const [loading, setLoading] = useState(false);

  const isSetPassword = location.pathname.includes("set-password");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    if (!token) {
      dispatch(addAlert({ type: "error", message: "Invalid or missing setup/reset token." }));
      return;
    }
    
    try {
      setLoading(true);
      const res = await resetPassword(token, data.password);
      dispatch(
        addAlert({
          type: "success",
          message: isSetPassword
            ? "Password created successfully! Please log in to your company portal."
            : "Password reset successfully! Log in with your new credentials.",
        }),
      );
      if (res?.companyCode) {
        navigate(`/c/${res.companyCode}/login`);
      } else {
        navigate(buildPath("/login"));
      }
    } catch (error) {
      dispatch(
        addAlert({
          type: "error",
          message: error?.response?.data?.message || "Failed to process password. The link might be expired or already used.",
        })
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white/95 backdrop-blur-2xl border border-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2rem] p-8 sm:p-12 w-full max-w-lg mx-auto animate-fade-in-up relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

      <div className="space-y-3 mb-10 text-center relative z-10 mt-2">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 mb-2 shadow-inner">
          <ShieldCheck size={26} />
        </div>
        <h2 className="text-3xl sm:text-4xl font-display font-black text-zinc-900 tracking-tight leading-tight">
          {isSetPassword ? "Set Your Password" : "New password"}
        </h2>
        <p className="text-[12px] text-zinc-500 font-medium">
          {isSetPassword 
            ? "Create a secure password to activate your company user account" 
            : "Please enter and confirm your new credentials"}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 relative z-10">
        {/* New Password */}
        <div className="space-y-2">
          <label className="text-[11.2px] font-bold text-zinc-700 block">
            {isSetPassword ? "New Password" : "New Password"}
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none z-10">
              <Lock size={20} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              {...register("password")}
              placeholder="••••••••"
              className={`w-full pl-12 pr-12 py-4 bg-white/50 hover:bg-white border ${errors.password ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-2xl text-[12px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-zinc-400 hover:text-zinc-600 transition-colors z-10"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[10.4px] text-rose-500 font-medium mt-1.5 animate-fade-in">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-2">
          <label className="text-[11.2px] font-bold text-zinc-700 block">
            Confirm Password
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-zinc-400 group-focus-within:text-primary transition-colors pointer-events-none z-10">
              <KeyRound size={20} />
            </span>
            <input
              type={showPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="••••••••"
              className={`w-full pl-12 pr-4 py-4 bg-white/50 hover:bg-white border ${errors.confirmPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-zinc-200/80 focus:border-primary focus:ring-primary/20'} rounded-2xl text-[12px] font-semibold text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-[3.2px] transition-all shadow-sm backdrop-blur-md`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-[10.4px] text-rose-500 font-medium mt-1.5 animate-fade-in">
              {errors.confirmPassword.message}
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
              <span>{isSetPassword ? "Set Password & Continue" : "Reset Password"}</span>
              <ArrowRight size={20} className="group-hover:translate-x-1.5 transition-transform" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}
