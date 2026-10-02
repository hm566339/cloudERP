import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import CustomSelect from '../../../components/common/CustomSelect';

/**
 * Modal to assign a role to a user.
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen
 * @param {Function} props.onClose
 * @param {Object} props.user
 * @param {Array} props.availableRoles
 * @param {Function} props.assignUserRoleMutation
 */
export default function UserAssignRoleModal({ isOpen, onClose, user, availableRoles, assignUserRoleMutation, onUpdated }) {
  const dispatch = useAppDispatch();
  const [selectedRoleId, setSelectedRoleId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && user) {
      const userRoles = Array.isArray(user.role) ? user.role : [user.role];
      const userRoleStrs = userRoles.map(r => (typeof r === 'string' ? r : r?.name)?.toLowerCase()).filter(Boolean);
      
      const currentRoleObj = (Array.isArray(availableRoles) ? availableRoles : []).find(r => 
        userRoleStrs.includes(r.name?.toLowerCase()) || 
        userRoleStrs.includes(r.roleName?.toLowerCase())
      );
      setSelectedRoleId(currentRoleObj ? currentRoleObj.id : "");
    }
  }, [isOpen, user, availableRoles]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRoleId) {
      dispatch(addAlert({ type: "warning", message: "Please select a valid role" }));
      return;
    }
    
    setIsSubmitting(true);
    try {
      await assignUserRoleMutation(user.id, selectedRoleId);
      
      dispatch(addAlert({ type: "success", message: `Role successfully updated for ${user.fullName || user.name}` }));
      onUpdated?.();
      onClose();
    } catch (error) {
      console.error("Assign role error:", error);
      dispatch(addAlert({ type: "error", message: error?.response?.data?.message || "Failed to update role" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-sm w-full p-6 space-y-6 animate-slide-up">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-zinc-900">
              Assign User Role
            </h3>
            <p className="text-sm text-zinc-500 mt-1">
              Change role for {user.fullName || user.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-650"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 block">
              Select Role
            </label>
            <CustomSelect
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="input-field appearance-none"
              required
            >
              <option value="">-- Choose Role --</option>
              {(Array.isArray(availableRoles) ? availableRoles : []).map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name || r.roleName}
                </option>
              ))}
            </CustomSelect>
          </div>

          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost"
            >
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn-primary">
              {isSubmitting ? "Updating..." : "Update Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
