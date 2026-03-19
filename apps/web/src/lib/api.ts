import axios from "axios";

export const api = axios.create({
  baseURL: "http://localhost:4000",
  withCredentials: true, // QUAN TRỌNG: gửi/nhận cookie
});