import axios from "axios";

const API = "/api/api/dashboard";

export const getSummary = () => axios.get(`${API}/summary`);
export const getRevenueByDay = () => axios.get(`${API}/revenue-by-day`);
export const getRecentInvoices = () => axios.get(`${API}/recent-invoices`);
