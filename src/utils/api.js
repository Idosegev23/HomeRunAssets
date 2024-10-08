import axios from 'axios'; // וודא שהייבוא הזה נמצא בראש הקובץ

export const getApiBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://home-run-assets.vercel.app/api';
  }
  return 'http://localhost:5001/api';
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
});

api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log('Request config:', config);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('API response error:', error);
    }
    return Promise.reject(error);
  }
);

export default api;
