import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL } from './apiEndpoints';

const axiosInstance: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    accept: 'application/json',
  },
  withCredentials: false,
});

export default axiosInstance;
