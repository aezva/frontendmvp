import axios from 'axios';
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function fetchNotifications(clientId) {
  const res = await axios.get(`${API_URL}/nnia/notifications`, { params: { clientId } });
  return res.data.notifications;
}

export async function createNotification(notification) {
  const res = await axios.post(`${API_URL}/nnia/notifications`, notification);
  return res.data.notification;
}

export async function markNotificationRead(id) {
  const res = await axios.post(`${API_URL}/nnia/notifications/${id}/read`);
  return res.data.notification;
}

export async function fetchTickets(clientId) {
  const { data, error } = await window.supabase
    .from('tickets')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchLeads(clientId) {
  const { data, error } = await window.supabase
    .from('leads')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
} 