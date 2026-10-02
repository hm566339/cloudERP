import { getCurrentUser, getSsoCurrentUser } from './auth';

/** Get current user from cookie session (account auth) */
export const getProfile = async () => {
  return await getCurrentUser();
};

/** Get current user from SSO auth (Authorization header) */
export const getSsoProfile = async () => {
  return await getSsoCurrentUser();
};
