import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Ticket, Users, BarChart3, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { fetchAppointments } from '@/services/appointmentsService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { fetchTasks } from '@/services/tasksService';

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
  // 1. Añadir estados para documentos, tareas, reservas
  const [lastDocuments, setLastDocuments] = useState([]);
  const [lastTasks, setLastTasks] = useState([]);
  const [lastReservations, setLastReservations] = useState([]);

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

  // 2. useEffect para cargar los dos últimos documentos, tareas y reservas
  useEffect(() => {
    async function fetchLastDocuments() {
      if (!client) return;
      try {
        const { data, error } = await supabase
          .from('documents')
          .select('*')
          .eq('client_id', client.id)
          .order('updated_at', { ascending: false })
          .limit(2);
        setLastDocuments(data || []);
      } catch {
        setLastDocuments([]);
      }
    }
    async function fetchLastTasks() {
      if (!client) return;
      try {
        const data = await fetchTasks(client.id);
        setLastTasks(data.slice(-2));
      } catch {
        setLastTasks([]);
      }
    }
    async function fetchLastReservations() {
      if (!client) return;
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('*')
          .eq('client_id', client.id)
          .order('updated_at', { ascending: false })
          .limit(2);
        setLastReservations(data || []);
      } catch {
        setLastReservations([]);
      }
    }
    fetchLastDocuments();
    fetchLastTasks();
    fetchLastReservations();
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-gray-500 font-normal">Un resumen de la actividad de tu asistente.</p>
          </div>
        </div>

        {/* NUEVA FILA DE ESTADÍSTICAS EN 3 COLUMNAS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {statsData.map((stat, index) => (
            <Card key={index} className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-colors duration-300 p-4 flex flex-col items-start">
              <div className="flex flex-col items-start gap-1 w-full">
                {/* Ajuste aquí: flex-row y items-center para alinear verticalmente */}
                <div className="flex flex-row items-center justify-start w-full gap-2">
                  <h3 className="text-base font-light text-black mb-1 flex-1 flex items-center">{stat.title}</h3>
                  <span className="flex items-center mb-4"><stat.icon className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} /></span>
                </div>
                <div className="flex flex-row items-center gap-[50px] w-full">
                  <span className="text-sm font-normal text-black">{stat.value}</span>
                  <span className="text-xs font-normal" style={{ color: '#ff9c9c' }}>{stat.change || '+0% hoy'}</span>
                </div>
                {/* Barra de progreso visual minimalista */}
                <div className="w-full mt-2">
                  <div className="relative h-2 w-full rounded-full bg-[#ff9c9c]/20">
                    <div className="absolute top-0 left-0 h-2 rounded-full bg-[#ff9c9c] transition-all" style={{ width: `${Math.min(parseInt(stat.value.replace(/\D/g, '')) || 0, 100)}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Próximas citas, tareas y documentos, reservas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Columna 1: Tareas Pendientes y Documentos Creados */}
          <div className="flex flex-col gap-6">
            {/* Tareas Pendientes */}
            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow p-4 flex flex-col items-center">
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center justify-start w-full gap-2">
                  <h3 className="text-base font-light text-black mb-2 flex-1 flex items-center">Tareas Pendientes</h3>
                  <span className="flex items-center mb-4"><svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 12l2 2l4 -4"/><circle cx="12" cy="12" r="9"/></svg></span>
                </div>
                {lastTasks.length === 0 ? (
                  <span className="text-sm text-gray-500 font-normal text-left">No hay tareas.</span>
                ) : (
                  <ul className="w-full flex flex-col gap-2">
                    {lastTasks.map(task => (
                      <li key={task.id} className="flex flex-row items-center gap-2">
                        <span className="text-sm font-normal text-gray-500 flex-1 truncate">{task.name || task.title || 'Tarea'}</span>
                        <span className="text-xs font-light text-gray-500">{task.status === 'completed' ? 'Completada' : task.status === 'in_progress' ? 'En Progreso' : 'Pendiente'}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="flex items-center gap-2 text-[#ff9c9c] text-xs font-light transition hover:underline hover:scale-105" onClick={() => navigate('/tareas')}>
                  Ver todas
                  <svg width="16" height="16" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 18l6-6-6-6"/></svg>
                </button>
              </div>
            </Card>
            {/* Documentos Creados */}
            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow p-4 flex flex-col items-center">
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center justify-start w-full gap-2">
                  <h3 className="text-base font-light text-black mb-2 flex-1 flex items-center">Documentos Creados</h3>
                  <span className="flex items-center mb-4"><svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 2v4M16 2v4M4 10h16"/></svg></span>
                </div>
                {lastDocuments.length === 0 ? (
                  <span className="text-sm text-gray-500 font-normal text-left">No hay documentos creados.</span>
                ) : (
                  <ul className="w-full flex flex-col gap-2">
                    {lastDocuments.map(doc => (
                      <li key={doc.id} className="flex flex-col gap-0.5">
                        <span className="text-sm font-normal text-black">{doc.name}</span>
                        <span className="text-xs font-normal" style={{ color: '#ff9c9c' }}>{doc.updated_at ? new Date(doc.updated_at).toLocaleString() : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="flex items-center gap-2 text-[#ff9c9c] text-xs font-light transition hover:underline hover:scale-105" onClick={() => navigate('/documents')}>
                  Ver todas
                  <svg width="16" height="16" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 18l6-6-6-6"/></svg>
                </button>
              </div>
            </Card>
          </div>
          {/* Columna 2: Próximas citas y Próximas reservas */}
          <div className="flex flex-col gap-6">
            {/* Próximas citas */}
            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow p-4 flex flex-col items-center">
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center justify-start w-full gap-2">
                  <h3 className="text-base font-light text-[#ff9c9c] mb-2 flex-1">Próximas Citas</h3>
                  <svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                </div>
                {nextAppointments.length === 0 ? (
                  <span className="text-sm text-gray-500 font-normal text-left mt-2">No hay citas próximas.</span>
                ) : (
                  <ul className="divide-y divide-border w-full flex flex-col gap-2">
                    {nextAppointments.slice(0,2).map(appt => (
                      <li key={appt.id} className="py-3 flex flex-col gap-1">
                        <div className="font-medium text-sm text-black">{appt.name} ({appt.email})</div>
                        <div className="text-xs font-normal" style={{ color: '#ff9c9c' }}>{appt.type} - {appt.date} {appt.time}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="flex items-center gap-2 text-[#ff9c9c] text-xs font-light transition hover:underline hover:scale-105" onClick={() => navigate('/citas')}>
                  Ver todas
                  <svg width="16" height="16" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 18l6-6-6-6"/></svg>
                </button>
              </div>
            </Card>
            {/* Próximas Reservas */}
            <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow p-4 flex flex-col items-center">
              <div className="flex flex-col items-start gap-1 w-full">
                <div className="flex items-center justify-start w-full gap-2">
                  <h3 className="text-base font-light text-[#ff9c9c] mb-2 flex-1">Próximas Reservas</h3>
                  <svg width="20" height="20" fill="none" stroke="#ff9c9c" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8 2v4M16 2v4M4 10h16"/></svg>
                </div>
                {lastReservations.length === 0 ? (
                  <span className="text-sm text-gray-500 font-normal text-left mt-2">No hay reservas próximas.</span>
                ) : (
                  <ul className="divide-y divide-border w-full flex flex-col gap-2">
                    {lastReservations.map(res => (
                      <li key={res.id} className="py-3 flex flex-col gap-1">
                        <div className="font-medium text-sm">{res.name} ({res.email})</div>
                        <div className="text-xs text-muted-foreground">{res.type} - {res.date} {res.time}</div>
                      </li>
                    ))}
                  </ul>
                )}
                <button className="flex items-center gap-2 text-[#ff9c9c] text-xs font-light transition hover:underline hover:scale-105" onClick={() => navigate('/reservas')}>
                  Ver todas
                  <svg width="16" height="16" fill="none" stroke="#ff9c9c" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M13 18l6-6-6-6"/></svg>
                </button>
              </div>
            </Card>
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;