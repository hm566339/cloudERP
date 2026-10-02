const fs = require('fs');
const file = 'c:/Users/HARSHO MOHIT/Desktop/New folder (4)/ERP/src/api/sso/user.js';
let content = fs.readFileSync(file, 'utf8');
const oldCode = export const getUsers = async (companyId, params = {}) => {
  const url = companyId && companyId !== 'all' ? \/api/sso/user/company/\\ : \/api/sso/user\;
  const response = await apiClient.get(url, { params });
  return response.data?.data || response.data;
};;
const newCode = export const getUsers = async (companyId, params = {}) => {
  const url = companyId && companyId !== 'all' ? \/api/sso/user/company/\\ : \/api/sso/user\;
  
  const cleanParams = { ...params };
  if (companyId && companyId !== 'all') {
    delete cleanParams.companyId;
  }
  
  const response = await apiClient.get(url, { params: cleanParams });
  return response.data?.data || response.data;
};;
content = content.replace(oldCode, newCode);
fs.writeFileSync(file, content);
console.log('Replaced successfully');
