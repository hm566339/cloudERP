import sys

file_path = 'c:/Users/HARSHO MOHIT/Desktop/New folder (4)/ERP/src/api/sso/user.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_code = '''export const getUsers = async (companyId, params = {}) => {
  const url = companyId && companyId !== 'all' ? `/api/sso/user/company/${companyId}` : `/api/sso/user`;
  const response = await apiClient.get(url, { params });
  return response.data?.data || response.data;
};'''

new_code = '''export const getUsers = async (companyId, params = {}) => {
  const url = companyId && companyId !== 'all' ? `/api/sso/user/company/${companyId}` : `/api/sso/user`;
  
  const cleanParams = { ...params };
  if (companyId && companyId !== 'all') {
    if ('companyId' in cleanParams) {
        delete cleanParams.companyId;
    }
  }
  
  const response = await apiClient.get(url, { params: cleanParams });
  return response.data?.data || response.data;
};'''

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print('Successfully patched user.js')
else:
    print('old_code not found in user.js')
