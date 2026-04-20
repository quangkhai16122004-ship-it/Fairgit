import axios from "axios";

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: { VITE_API_BASE_URL?: string };
  }
}

const API_BASE_URL =
  window.__RUNTIME_CONFIG__?.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:4000";

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 30_000,
});
