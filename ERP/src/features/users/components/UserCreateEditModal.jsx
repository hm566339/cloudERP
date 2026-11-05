import React, { useState, useEffect } from "react";
import { useAppDispatch } from "../../../app/hooks";
import { addAlert } from "../../notifications/notificationSlice";
import { getCompanyModulesByCompany } from "../../../api/sso/companyModules";
import { useGetOrgMembersQuery } from "../../../api/sso/organization.api";
import apiClient from "../../../api/common/client";
import CustomSelect from '../../../components/common/CustomSelect';
import { UserPlus, Users, Info } from 'lucide-react';

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
 * Supports provisioning a new user or assigning an existing organization member to this company.
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
  const [creationMode, setCreationMode] = useState("NEW"); // "NEW" | "EXISTING"
  const [selectedMemberId, setSelectedMemberId] = useState("");
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

  // Fetch organization members when in create mode
  const { data: orgMembers = [], isLoading: isOrgMembersLoading } = useGetOrgMembersQuery(undefined, {
    skip: !isOpen || !!currentUser,
  });

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
      setCreationMode("NEW");
      setSelectedMemberId("");
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

  const handleModeChange = (mode) => {
    setCreationMode(mode);
    setSelectedMemberId("");
    setName("");
    setEmpId("");
    setUsername("");
    setEmail("");
    setValidationErrors({});
    setApiError("");
  };

  const handleSelectMember = (memberId) => {
    setSelectedMemberId(memberId);
    if (!memberId) {
      setName("");
      setUsername("");
      setEmail("");
      setEmpId("");
      return;
    }
    const member = (orgMembers || []).find(m => String(m.memberId || m.id) === String(memberId));
    if (member) {
      setName(member.fullName || member.username || "");
      setUsername(member.username || "");
      setEmail(member.email || "");
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError("");

    const errors = {};
    const nameRegex = /^[a-zA-Z\s'-]+$/;

    if (!currentUser && creationMode === "EXISTING" && !selectedMemberId) {
      errors.member = "Please select an organization member to assign";
    }

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
        : errors.member
          ? errors.member
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

          if (creationMode === "EXISTING") {
            dispatch(addAlert({
              type: "success",
              message: `User "${name}" successfully assigned to this company!`
            }));
          } else if (res && res.emailSent === false) {
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

    const isExistingMemberSelected = !currentUser && creationMode === "EXISTING" && !!selectedMemberId;

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
        <div className="card max-w-3xl w-full p-4 space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto bg-white dark:bg-[#1D212C] border border-zinc-200 dark:border-[#2A2F3D] shadow-xl dark:shadow-2xl">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-[#E6E8EE]">
              {currentUser
                ? "Modify User Profile"
                : creationMode === "EXISTING"
                  ? "Assign Existing Organization Member"
                  : "Provision User Account"}
            </h3>
            <button onClick={onClose} className="text-zinc-400 dark:text-[#6B7184] hover:text-zinc-600 dark:hover:text-[#E6E8EE]">✕</button>
          </div>

            {/* Mode Selector for Provision vs Existing Member */}
            {!currentUser && (
              <div className="flex items-center gap-2 p-1 bg-zinc-100 dark:bg-[#161922] rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
                <button
                  type="button"
                  onClick={() => handleModeChange("NEW")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all ${creationMode === "NEW"
                      ? "bg-white dark:bg-[#222736] text-primary shadow-sm font-bold"
                      : "text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]"
                    }`}
                >
                  <UserPlus className="w-4 h-4" />
                  Create New User
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("EXISTING")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold rounded-md transition-all ${creationMode === "EXISTING"
                      ? "bg-white dark:bg-[#222736] text-primary shadow-sm font-bold"
                      : "text-zinc-500 dark:text-[#A0A6B5] hover:text-zinc-800 dark:hover:text-[#E6E8EE]"
                    }`}
                >
                  <Users className="w-4 h-4" />
                  Assign Existing Organization Member
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {apiError && (
                  <div className="rounded-lg border border-rose-200 dark:border-[#F0616D]/30 bg-rose-50 dark:bg-[#F0616D]/15 px-4 py-3 text-sm text-rose-700 dark:text-[#F0616D]">
                    {apiError}
                  </div>
          )}

                  {/* Member Selection for Existing Mode */}
                  {!currentUser && creationMode === "EXISTING" && (
                    <div className="space-y-2 p-3 bg-zinc-50 dark:bg-[#161922] rounded-lg border border-zinc-200 dark:border-[#2A2F3D]">
                      <label className="text-xs font-bold text-zinc-700 dark:text-[#E6E8EE] block">
                        Select Organization Member *
                      </label>
                      {isOrgMembersLoading ? (
                        <div className="p-3 rounded-lg bg-white dark:bg-[#1D212C] text-sm text-zinc-500 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                          Loading organization members...
                        </div>
                      ) : orgMembers.length === 0 ? (
                        <div className="p-3 rounded-lg bg-white dark:bg-[#1D212C] text-sm text-zinc-500 dark:text-[#A0A6B5] border border-zinc-200 dark:border-[#2A2F3D]">
                          No existing organization members found.
                        </div>
                      ) : (
                        <CustomSelect
                          value={selectedMemberId}
                          onChange={(e) => handleSelectMember(e.target.value)}
                          className="input-field"
                        >
                          <option value="">-- Choose an existing Organization Member --</option>
                          {orgMembers.map((m) => {
                            const mid = m.memberId || m.id;
                            const isAlreadyInCompany =
                              m.authorizedCompanyIds?.some((cid) => String(cid) === String(companyUUID) || String(cid) === String(rawCompanyId));
                            return (
                              <option key={mid} value={mid} disabled={isAlreadyInCompany}>
                                {m.fullName || m.username} ({m.email}) {isAlreadyInCompany ? "• (Already in this company)" : ""}
                              </option>
                            );
                          })}
                        </CustomSelect>
                      )}
                      {validationErrors.member && (
                        <p className="text-xs text-rose-600 dark:text-[#F0616D] mt-1">{validationErrors.member}</p>
                      )}

                      {selectedMemberId && (
                        <div className="flex items-start gap-2 p-2.5 rounded-md bg-blue-50/70 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 mt-2">
                          <Info className="w-4 h-4 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold">Reusing Account:</span> This member will be assigned to this company under their existing single account. Password and credentials remain unchanged, and independent roles & permissions can be managed for this company.
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Full Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        readOnly={isExistingMemberSelected}
                        className={`input-field ${isExistingMemberSelected ? "bg-zinc-100 dark:bg-[#161922] cursor-not-allowed opacity-80" : ""}`}
                      />
                      {validationErrors.fullName && <p className="text-xs text-rose-600 dark:text-[#F0616D] mt-1">{validationErrors.fullName}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Employee ID *</label>
                      <input
                        type="text"
                        placeholder="e.g. EMP001"
                        value={empId}
                        onChange={(e) => setEmpId(e.target.value)}
                        className="input-field"
                        minLength={1}
                        maxLength={100}
                      />
                      {validationErrors.empId && <p className="text-xs text-rose-600 dark:text-[#F0616D] mt-1">{validationErrors.empId}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Username *</label>
                      <input
                        type="text"
                        placeholder="e.g. john.doe"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        readOnly={isExistingMemberSelected}
                        className={`input-field ${isExistingMemberSelected ? "bg-zinc-100 dark:bg-[#161922] cursor-not-allowed opacity-80" : ""}`}
                        minLength={3}
                        maxLength={100}
                      />
                      {validationErrors.username && <p className="text-xs text-rose-600 dark:text-[#F0616D] mt-1">{validationErrors.username}</p>}
                    </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Email Address *</label>
                        <input
                          type="email"
                          placeholder="e.g. john@techcorp.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          readOnly={isExistingMemberSelected}
                          className={`input-field ${isExistingMemberSelected ? "bg-zinc-100 dark:bg-[#161922] cursor-not-allowed opacity-80" : ""}`}
                          maxLength={255}
                        />
                        {validationErrors.email && <p className="text-xs text-rose-600 dark:text-[#F0616D] mt-1">{validationErrors.email}</p>}
                      </div>

                    {!currentUser && (
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs font-bold text-zinc-500 dark:text-[#A0A6B5] block">Module *</label>
                        {isCompanyModulesLoading ? (
                          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#161922] text-sm text-zinc-500 dark:text-[#A0A6B5] border border-zinc-100 dark:border-[#2A2F3D]">
                            Loading active modules...
                          </div>
                        ) : !rawCompanyId ? (
                          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#161922] text-sm text-zinc-500 dark:text-[#A0A6B5] border border-zinc-100 dark:border-[#2A2F3D]">
                            Unable to load modules without a company.
                          </div>
                        ) : activeModules.length === 0 ? (
                          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#161922] text-sm text-zinc-500 dark:text-[#A0A6B5] border border-zinc-100 dark:border-[#2A2F3D]">
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
                        {validationErrors.module && <p className="text-xs text-rose-600 dark:text-[#F0616D] mt-1">{validationErrors.module}</p>}
                      </div>
                    )}
                  </div>

                  <div className="pt-6 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-bold text-zinc-600 dark:text-[#A0A6B5] hover:bg-zinc-100 dark:hover:bg-[#222736] dark:hover:text-[#E6E8EE] rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="btn-primary"
                    >
                      {isSubmitting
                        ? (currentUser ? "Saving..." : creationMode === "EXISTING" ? "Assigning..." : "Provisioning...")
                        : currentUser
                          ? "Save Changes"
                          : creationMode === "EXISTING"
                            ? "Assign to Company"
                            : "Provision User"}
                    </button>
                  </div>
                </form>
      </div>
        </div>
        );
}
