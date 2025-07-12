import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Ticket, Users, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import ChatAssistant from './ChatAssistant';
import { useNavigate } from 'react-router-dom';
import { fetchAppointments } from '@/services/appointmentsService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const Dashboard = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalConversations: 0,
    openTickets: 0,
    totalLeads: 0 // Preparado para conectar
  });
  const [loading, setLoading] = useState(true);
  const [nextAppointments, setNextAppointments] = useState([]);
  // Estado para las conversaciones recientes
  const [recentConversations, setRecentConversations] = useState([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!client) return;
      
      setLoading(true);
      try {
        // Obtener estadísticas de mensajes
        const { count: messageCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        // Obtener estadísticas de tickets
        const { count: ticketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id);

        // Obtener tickets abiertos
        const { count: openTicketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'open');

        // Calcular tasa de resolución (tickets cerrados / total tickets)
        const { count: closedTicketCount } = await supabase
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('client_id', client.id)
          .eq('status', 'closed');

        const resolutionRate = ticketCount > 0 ? Math.round((closedTicketCount / ticketCount) * 100) : 0;

        // Por ahora, usar un valor fijo ya que no tenemos customer_id en messages
        const uniqueCustomerCount = 0;

        // Obtener próximas citas (solo 2 más próximas, status pendiente)
        const appointments = await fetchAppointments(client.id);
        const now = new Date();
        const upcoming = (appointments || [])
          .filter(a => a.status === 'pending' && new Date(a.date + 'T' + a.time) >= now)
          .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time))
          .slice(0, 2);
        setNextAppointments(upcoming);

        setStats({
          totalConversations: messageCount || 0,
          openTickets: openTicketCount || 0,
          totalLeads: 0 // Aquí se conectará el dato real después
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: 'Error',
          description: 'No se pudieron cargar las estadísticas',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [client, toast, navigate]);

  useEffect(() => {
    async function fetchRecentConversations() {
      if (!client) return;
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/conversations?clientId=${client.id}`);
        const data = await res.json();
        if (data.success) setRecentConversations(data.conversations.slice(0, 3));
        else setRecentConversations([]);
      } catch {
        setRecentConversations([]);
      }
    }
    fetchRecentConversations();
  }, [client]);

  const statsData = [
    {
      title: 'Conversaciones Totales',
      value: stats.totalConversations.toLocaleString(),
      icon: MessageSquare,
      change: '+0%'
    },
    // Nuevo apartado para Leads Captados
    {
      title: 'Leads Captados',
      value: stats.totalLeads ? stats.totalLeads.toString() : '0', // Dejar preparado para conectar
      icon: Users, // Puedes cambiar el icono si prefieres otro
      change: '+0%'
    },
    {
      title: 'Tickets Abiertos',
      value: stats.openTickets.toString(),
      icon: Ticket,
      change: '+0%'
    },
    // Eliminados: Clientes Atendidos y Tasa de Resolución
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Dashboard - Asistente IA</title>
      </Helmet>
      {/* Video y chat (no modificar) */}
      <div className="grid grid-cols-4 gap-6 mb-8">
        <div className="col-span-1 flex items-center justify-start h-full">
          {/* ...video... */}
        </div>
        <div className="col-span-3 h-full">
          {/* ...chat... */}
        </div>
      </div>
      {/* Nuevo dashboard minimalista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Métricas principales */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <svg width="32" height="32" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
            <div>
              <div className="text-xs text-muted-foreground">Citas activas</div>
              <div className="text-2xl font-bold">{stats.totalConversations}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <svg width="32" height="32" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>
            <div>
              <div className="text-xs text-muted-foreground">Tickets abiertos</div>
              <div className="text-2xl font-bold">{stats.openTickets}</div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex items-center gap-4">
            <svg width="32" height="32" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6M12 4v2m0 0a8 8 0 1 1 0 16a8 8 0 0 1 0-16z" /></svg>
            <div>
              <div className="text-xs text-muted-foreground">Leads captados</div>
              <div className="text-2xl font-bold">{stats.totalLeads}</div>
            </div>
          </div>
        </div>
        {/* Notificaciones y recordatorios */}
        <div className="col-span-1 flex flex-col gap-6">
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm font-semibold mb-4">Notificaciones y recordatorios</div>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                <span className="text-xs text-muted-foreground">Nueva cita agendada para mañana a las 10:00</span>
              </li>
              <li className="flex items-center gap-3">
                <svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="4" /></svg>
                <span className="text-xs text-muted-foreground">Ticket marcado como resuelto</span>
              </li>
              <li className="flex items-center gap-3">
                <svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 20v-6M12 4v2m0 0a8 8 0 1 1 0 16a8 8 0 0 1 0-16z" /></svg>
                <span className="text-xs text-muted-foreground">Lead nuevo: Juan Pérez</span>
              </li>
            </ul>
          </div>
          {/* Próximas tareas/citas/reservas */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm font-semibold mb-4">Próximas tareas y citas</div>
            <ul className="space-y-2">
              {nextAppointments.length === 0 ? (
                <li className="text-sm" style={{ color: '#ff9c9c' }}>No hay citas próximas.</li>
              ) : (
                nextAppointments.map((appt, idx) => (
                  <li key={appt.id || idx} className="flex items-center gap-2">
                    <svg width="18" height="18" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /></svg>
                    <span className="text-xs">{appt.name} - {appt.type} - {appt.date} {appt.time}</span>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
        {/* Analítica y documentos recientes */}
        <div className="col-span-1 flex flex-col gap-6">
          {/* Analítica visual (placeholder) */}
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-start">
            <div className="text-sm font-semibold mb-4">Analítica de actividad</div>
            <div className="w-full h-24 bg-gray-100 rounded flex items-center justify-center text-muted-foreground text-xs">[Gráfica próximamente]</div>
          </div>
          {/* Documentos recientes */}
          <div className="bg-white rounded-xl shadow p-6">
            <div className="text-sm font-semibold mb-4">Documentos recientes</div>
            <ul className="space-y-2">
              <li className="text-sm" style={{ color: '#ff9c9c' }}>No hay documentos recientes.</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;