import Cookies from 'js-cookie';

export const setAuthToken = (token: string) => {
  Cookies.set('auth-token', token, { expires: 7 }); // 7 days
};

export const getAuthToken = (): string | undefined => {
  return Cookies.get('auth-token');
};

export const removeAuthToken = () => {
  Cookies.remove('auth-token');
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};