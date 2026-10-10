import apiClient from '../common/client';

export const getUsers = async (companyId, params = {}) => {
  if (!companyId || companyId === 'all') {
    throw new Error('companyId is required to fetch users');
  }
  const safeParams = {
    page: params?.page ?? 0,
    pageSize: params?.pageSize ?? 200,
  };
  if (params?.search) safeParams.search = params.search;
  if (params?.status) safeParams.status = params.status;
  if (params?.role) safeParams.role = params.role;

  const response = await apiClient.get(`/api/sso/user/company/${companyId}`, { params: safeParams });
  return response.data?.data || response.data;
};

export const getUserById = async (id) => {
  const response = await apiClient.get(`/api/sso/user/${id}`);
  return response.data?.data || response.data;
};

const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

const validateUserFullName = (fullName) => {
  if (fullName !== undefined && fullName !== null && fullName.trim() !== '') {
    if (!NAME_REGEX.test(fullName.trim())) {
      const error = new Error("Full Name should only contain letters, spaces, hyphens, and apostrophes (no special characters allowed)");
      error.response = {
        data: {
          success: false,
          message: "Full Name should only contain letters, spaces, hyphens, and apostrophes (no special characters allowed)"
        }
      };
      throw error;
    }
  }
};

export const createUser = async (companyId, module, payload) => {
  if (!companyId) {
    throw new Error("companyId is required to create a user. Please ensure a company is selected.");
  }
  if (!module) {
    throw new Error("module is required to create a user");
  }

  validateUserFullName(payload?.fullName || payload?.name);

  const response = await apiClient.post(`/api/sso/user`, { data: payload }, {
    params: { companyId, module }
  });
  return response.data?.data || response.data;
};

export const updateUser = async (id, payload) => {
  validateUserFullName(payload?.fullName || payload?.name);
  const response = await apiClient.put(`/api/sso/user/${id}`, { data: payload });
  return response.data?.data || response.data;
};

export const deleteUser = async (id) => {
  const response = await apiClient.delete(`/api/sso/user/${id}`);
  return response.data?.data || response.data;
};

export const updateUserStatus = async (id, status) => {
  const response = await apiClient.patch(`/api/sso/user/${id}/status`, null, {
    params: { status }
  });
  return response.data?.data || response.data;
};

export const verifyUserEmail = async (userId, status) => {
  const response = await apiClient.patch(`/api/sso/user/${userId}/verify-email`, null, {
    params: { status }
  });
  return response.data?.data || response.data;
};

export const verifyEmailToken = async (token) => {
  const response = await apiClient.get(`/api/sso/user/verify-email`, {
    params: { token }
  });
  return response.data?.data || response.data;
};

export const assignRole = async (id, roleId) => {
  const response = await apiClient.post(`/api/sso/user/${id}/role`, { data: { roleId } });
  return response.data?.data || response.data;
};

export const removeRole = async (id, roleId) => {
  const response = await apiClient.delete(`/api/sso/user/${id}/role/${roleId}`);
  return response.data?.data || response.data;
};

export const grantPortalAccess = async (id, moduleId) => {
  try {
    const response = await apiClient.post(`/api/sso/user/${id}/portal-access`, { data: { moduleId } });
    return response.data?.data || response.data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      const response = await apiClient.post(`/api/sso/user/${id}/portalaccess`, { data: { moduleId } });
      return response.data?.data || response.data;
    }
    throw err;
  }
};

export const removePortalAccess = async (id, moduleId) => {
  try {
    const response = await apiClient.delete(`/api/sso/user/${id}/portalaccess/${moduleId}`);
    return response.data?.data || response.data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      const response = await apiClient.delete(`/api/sso/user/${id}/portal-access/${moduleId}`);
      return response.data?.data || response.data;
    }
    throw err;
  }
};

export const togglePortalAccess = async (userId, moduleId) => {
  try {
    const response = await apiClient.patch(`/api/sso/user/${userId}/portal/${moduleId}/toggle`);
    return response.data?.data || response.data;
  } catch (err) {
    if (err?.response?.status === 404 || err?.response?.status === 405) {
      try {
        const response = await apiClient.patch(`/api/sso/user/${userId}/portal-access/${moduleId}/toggle`);
        return response.data?.data || response.data;
      } catch (err2) {
        const response = await apiClient.post(`/api/sso/user/${userId}/portal-access`, { data: { moduleId } });
        return response.data?.data || response.data;
      }
    }
    throw err;
  }
};

export const changePassword = async (id, currentPassword, newPassword) => {
  const response = await apiClient.post(`/api/sso/user/${id}/change-password`, {
    data: { currentPassword, newPassword }
  });
  return response.data?.data || response.data;
};

export const forgotPassword = async (email, companyCode) => {
  const response = await apiClient.post(`/api/sso/user/forgot-password`, null, {
    params: { email, companyCode }
  });
  return response.data?.data || response.data;
};

export const resetPassword = async (token, password) => {
  const response = await apiClient.post(`/api/sso/user/reset-password`, { data: { password } }, {
    params: { token }
  });
  return response.data?.data || response.data;
};

export const resendSetupEmail = async (userId) => {
  const response = await apiClient.post(`/api/sso/user/${userId}/resend-setup-email`);
  return response.data?.data || response.data;
};
