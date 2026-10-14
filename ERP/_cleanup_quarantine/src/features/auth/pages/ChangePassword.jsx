import React, { useState } from "react";
import { selectCurrentUser } from "../../../features/auth/authSlice";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { KeyRound, Lock, Eye, EyeOff, Save } from "lucide-react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { useChangeUserPasswordMutation } from '../../../api/sso';
import { useSelector } from "react-redux";

const schema = yup.object().shape({
  currentPassword: yup
    .string()
    .required("Current Password is required"),
  newPassword: yup
    .string()
    .min(6, "Password must be at least 6 characters")
    .required("New Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("newPassword"), null], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function ChangePassword() {
  const dispatch = useAppDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [changePassword, { isLoading: loading }] = useChangeUserPasswordMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    if (!currentUser?.id) {
      dispatch(addAlert({ type: "error", message: "User session not found. Please log in again." }));
      return;
    }

    try {
      await changePassword({ 
        id: currentUser.id, 
        currentPassword: data.currentPassword, 
        newPassword: data.newPassword 
      }).unwrap();
      
      dispatch(
        addAlert({
          type: "success",
          message: "Password changed successfully!",
        }),
      );
      reset(); // Clear the form
    } catch (error) {
      dispatch(
        addAlert({
          type: "error",
          message: error.data?.message || "Failed to change password. Please check your current password.",
        })
      );
    }
  };

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 sm:p-8 w-full max-w-lg mx-auto">
      <div className="space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">Change Password</h2>
        <p className="text-sm text-slate-500 font-medium">Update your account password to stay secure.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Current Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 block">
            Current Password
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none z-10">
              <Lock size={18} />
            </span>
            <input
              type={showCurrentPassword ? "text" : "password"}
              {...register("currentPassword")}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border ${errors.currentPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-[2.4px] transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.currentPassword && (
            <p className="text-xs text-rose-500 font-medium mt-1">
              {errors.currentPassword.message}
            </p>
          )}
        </div>

        {/* New Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 block">
            New Password
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none z-10">
              <KeyRound size={18} />
            </span>
            <input
              type={showNewPassword ? "text" : "password"}
              {...register("newPassword")}
              placeholder="••••••••"
              className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border ${errors.newPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-[2.4px] transition-all`}
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors z-10"
            >
              {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          {errors.newPassword && (
            <p className="text-xs text-rose-500 font-medium mt-1">
              {errors.newPassword.message}
            </p>
          )}
        </div>

        {/* Confirm Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-bold text-slate-700 block">
            Confirm New Password
          </label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none z-10">
              <KeyRound size={18} />
            </span>
            <input
              type={showNewPassword ? "text" : "password"}
              {...register("confirmPassword")}
              placeholder="••••••••"
              className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border ${errors.confirmPassword ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20' : 'border-slate-200 focus:border-primary focus:ring-primary/20'} rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-[2.4px] transition-all`}
            />
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-rose-500 font-medium mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 flex justify-center items-center gap-2 px-4 py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-sm font-bold rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed group"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-zinc-300 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <Save size={18} />
              <span>Update Password</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
