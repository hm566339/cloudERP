import React, { useState } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";

/**
 * Modal to change a user's password.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {Function} props.onClose - Function to call to close the modal
 * @param {Object} props.user - The user object whose password is to be changed
 * @param {Function} props.changeUserPasswordMutation - The mutation function to change password
 */
export default function UserChangePasswordModal({ isOpen, onClose, user, changeUserPasswordMutation }) {
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      dispatch(addAlert({ type: "warning", message: "Both current and new passwords are required" }));
      return;
    }

    setIsSubmitting(true);
    try {
      await changeUserPasswordMutation(user.id, currentPassword, newPassword);

      dispatch(
        addAlert({
          type: "success",
          message: `Password updated successfully for ${user.name}.`,
        }),
      );
      onClose();
    } catch (error) {
      dispatch(
        addAlert({
          type: "error",
          message: error?.response?.data?.message || "Failed to update password",
        }),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-sm w-full p-4 space-y-4 animate-slide-up">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-zinc-900">
            Change Password
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650"
          >
            ✕
          </button>
        </div>
        
        <p className="text-xs text-zinc-500 font-medium">
          Updating password for <strong className="text-zinc-800">{user.name}</strong>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 block">
              Current Password *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="input-field"
              required
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 block">
              New Password *
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="input-field"
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full btn-primary justify-center py-2.5 font-bold bg-amber-500 hover:bg-amber-600 text-white border-amber-600"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
