import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { getCompanyModulesByCompany } from "../../../api/sso/companyModules";
import apiClient from "../../../api/common/client";
import CustomSelect from '../../../components/common/CustomSelect';

/**
 * UUID v4 pattern for detecting whether a string is a UUID.
 */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Resolve a company identifier to a UUID.
 * If it's already a UUID, return it as-is.
 * If it's a company code string, fetch the UUID from the backend.
 */
const resolveCompanyUUID = async (companyIdOrCode) => {
  if (!companyIdOrCode) return null;
  if (UUID_REGEX.test(companyIdOrCode)) return companyIdOrCode;

  // It's a company code — resolve to UUID
  try {
    const res = await apiClient.get(`/api/sso/company/code/${companyIdOrCode}`);
    const company = res.data?.data || res.data;
    if (company?.id) return company.id;
  } catch (e) {
    console.warn("Failed to resolve company UUID from code:", companyIdOrCode, e);
  }
  return null;
};

/**
 * Modal to create or edit a user.
 */
export default function UserCreateEditModal({
  isOpen,
  onClose,
  currentUser,
  companyId,
  createUserMutation, // createUser(companyId, module, payload)
  updateUserMutation, // updateUser(id, payload)
}) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState("");
  const [empId, setEmpId] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [selectedModuleId, setSelectedModuleId] = useState("");
  const [validationErrors, setValidationErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [activeModules, setActiveModules] = useState([]);
  const [isCompanyModulesLoading, setIsCompanyModulesLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [companyUUID, setCompanyUUID] = useState(null);

  // The raw company identifier (could be UUID or code string)
  const rawCompanyId = currentUser?.companyId || companyId;

  // Resolve raw company ID to a proper UUID when modal opens
  useEffect(() => {
    if (isOpen && rawCompanyId) {
      resolveCompanyUUID(rawCompanyId).then((uuid) => {
        setCompanyUUID(uuid);
      });
    }
  }, [isOpen, rawCompanyId]);

  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setName(currentUser.fullName || currentUser.username || currentUser.name || "");
        setEmpId(currentUser.empId || "");
        setUsername(currentUser.username || "");
        setEmail(currentUser.email || "");
        setSelectedModuleId("");
        setValidationErrors({});
        setApiError("");
      } else {
        setName("");
        setEmpId("");
        setUsername("");
        setEmail("");
        setSelectedModuleId("");
        setValidationErrors({});
        setApiError("");
      }

      if (rawCompanyId) {
        fetchModules(rawCompanyId);
      }
    }
  }, [isOpen, currentUser, rawCompanyId]);

  const fetchModules = async (cid) => {
    setIsCompanyModulesLoading(true);
    try {
      const res = await apiClient.get(`/api/sso/company-modules/company/${cid}`);
      const responseData = res.data?.companyModuleResponse || res.data?.data?.companyModuleResponse || res.data?.data || res.data || [];
      const dataArray = Array.isArray(responseData) ? responseData : (responseData.content || []);
      const filteredModules = dataArray.filter(m => m?.status !== false && m?.status !== "INACTIVE" && m?.active !== false);
      const uniqueModules = Array.from(
        new Map(filteredModules.map(m => [m.moduleId || m.module?.id || m.moduleName, m])).values()
      );
      setActiveModules(uniqueModules);
    } catch (error) {
      console.error("Failed to load company modules", error);
    } finally {
      setIsCompanyModulesLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const errors = {};
    const nameRegex = /^[a-zA-Z\s'-]+$/;
    if (!name.trim()) {
      errors.fullName = "Full Name is required";
    } else if (!nameRegex.test(name.trim())) {
      errors.fullName = "Full Name should only contain letters, spaces, hyphens, and apostrophes (no special characters allowed)";
    }
    if (!empId.trim()) errors.empId = "Employee ID is required";
    if (!username.trim()) errors.username = "Username is required";
    if (!email.trim()) errors.email = "Email address is required";
    if (!currentUser && !companyUUID && !rawCompanyId) errors.company = "Company selection is required";
    if (!currentUser && !selectedModuleId) errors.module = "Module selection is required";

    setValidationErrors(errors);
    if (Object.keys(errors).length > 0) {
      const msg = errors.fullName && errors.fullName.includes("special characters") 
        ? errors.fullName 
        : "Please complete the required fields correctly.";
      dispatch(addAlert({ type: "warning", message: msg }));
      return;
    }

    setIsSubmitting(true);
    try {
      if (currentUser) {
        await updateUserMutation(currentUser.id, {
          empId,
          username,
          email,
          fullName: name.trim(),
        });
        dispatch(addAlert({ type: "success", message: `User "${name}" updated successfully` }));
      } else {
        // Ensure we have a valid UUID for companyId
        let finalCompanyId = companyUUID;
        if (!finalCompanyId || !UUID_REGEX.test(finalCompanyId)) {
          finalCompanyId = await resolveCompanyUUID(rawCompanyId);
        }
        if (!finalCompanyId) {
          throw new Error("Could not resolve company UUID. Please select a valid company.");
        }

        const res = await createUserMutation(finalCompanyId, selectedModuleId, {
          empId,
          username,
          email,
          fullName: name.trim(),
        });
        if (res && res.emailSent === false) {
          dispatch(addAlert({
            type: "warning",
            message: `User created, but password-setup email could not be delivered: ${res.emailError || "SMTP service unavailable"}. You can resend the setup email from the user actions.`
          }));
        } else {
          dispatch(addAlert({
            type: "success",
            message: "User account provisioned successfully and password setup email sent!"
          }));
        }
      }
      onClose();
    } catch (error) {
      console.error("User save error:", error);
      const msg = error?.response?.data?.message || error?.message || `Request failed`;
      setApiError(msg);
      dispatch(addAlert({ type: "error", message: msg }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="card max-w-3xl w-full p-4 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-bold text-zinc-900">
            {currentUser ? "Modify User Profile" : "Provision User Account"}
          </h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-650">✕</button>
        </div>

        <form onSubmit={handleSubmit}>
          {apiError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 mb-4">
              {apiError}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 block">Full Name *</label>
            <input
              type="text"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
            {validationErrors.fullName && <p className="text-xs text-rose-600 mt-1">{validationErrors.fullName}</p>}
          </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 block">Employee ID *</label>
              <input
                type="text"
                placeholder="e.g. EMP001"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
                className="input-field"
                minLength={1}
                maxLength={100}
              />
              {validationErrors.empId && <p className="text-xs text-rose-600 mt-1">{validationErrors.empId}</p>}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 block">Username *</label>
              <input
                type="text"
                placeholder="e.g. john.doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input-field"
                minLength={3}
                maxLength={100}
              />
              {validationErrors.username && <p className="text-xs text-rose-600 mt-1">{validationErrors.username}</p>}
            </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-zinc-500 block">Email Address *</label>
            <input
              type="email"
              placeholder="e.g. john@techcorp.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              maxLength={255}
            />
            {validationErrors.email && <p className="text-xs text-rose-600 mt-1">{validationErrors.email}</p>}
          </div>

          {!currentUser && (
            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-500 block">Module *</label>
              {isCompanyModulesLoading ? (
                <div className="p-3 rounded-lg bg-zinc-50 text-sm text-zinc-500 border border-zinc-100">
                  Loading active modules...
                </div>
              ) : !rawCompanyId ? (
                <div className="p-3 rounded-lg bg-zinc-50 text-sm text-zinc-500 border border-zinc-100">
                  Unable to load modules without a company.
                </div>
              ) : activeModules.length === 0 ? (
                <div className="p-3 rounded-lg bg-zinc-50 text-sm text-zinc-500 border border-zinc-100">
                  No active modules available.
                </div>
              ) : (
                <CustomSelect
                  value={selectedModuleId}
                  onChange={(e) => setSelectedModuleId(e.target.value)}
                  className="input-field"
                >
                  <option value="">Select a Module to grant initial access</option>
                  {activeModules.map(m => {
                    const moduleUuid = m.moduleId || m.module?.id;
                    if (!moduleUuid) return null;
                    return (
                      <option key={moduleUuid} value={moduleUuid}>
                        {m.name || m.label || m.module?.name || m.moduleName || "Unknown Module"}
                      </option>
                    );
                  })}
                </CustomSelect>
              )}
              {validationErrors.module && <p className="text-xs text-rose-600 mt-1">{validationErrors.module}</p>}
            </div>
          )}
          </div>

          <div className="pt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? (currentUser ? "Saving..." : "Provisioning...") : currentUser ? "Save Changes" : "Provision User"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
