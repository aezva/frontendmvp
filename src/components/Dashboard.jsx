import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Ticket, Users, BarChart3, Loader2, FileText, Calendar } from 'lucide-react';
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
      <div className="min-h-screen w-full bg-gradient-to-br from-pink-100 to-white p-4 sm:p-8 lg:p-12">
        {/* Chat tipo GPT al inicio */}
        <div className="mb-8">
          <ChatAssistant userName={client?.name || 'Usuario'} />
        </div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Un resumen de la actividad de tu asistente.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Columna 1: Conversaciones Recientes */}
          <Card className="bg-white/80 rounded-2xl shadow-md border border-pink-200 flex flex-col h-full min-h-[260px] max-h-[260px] justify-between">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-pink-400" />
                <CardTitle className="text-lg font-semibold">Conversaciones Recientes</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="divide-y divide-pink-100">
                {recentConversations.length === 0 ? (
                  <li className="text-muted-foreground text-sm p-4">No hay conversaciones recientes.</li>
                ) : (
                  recentConversations.map((conv, idx) => (
                    <li key={conv.visitor_id || idx} className="flex items-center gap-3 px-4 py-3 hover:bg-pink-50 transition cursor-pointer rounded-xl">
                      <Avatar className="h-9 w-9 bg-pink-200">
                        <AvatarFallback>{conv.visitor_id?.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{conv.visitor_id?.slice(0, 8)}</div>
                        <div className="text-xs text-muted-foreground truncate">{conv.last_message}</div>
                      </div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">{conv.last_timestamp ? new Date(conv.last_timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</div>
                    </li>
                  ))
                )}
              </ul>
            </CardContent>
          </Card>
          {/* Columna 2: Métricas verticales, más pequeñas y organizadas */}
          <div className="flex flex-col gap-4 justify-between h-full min-h-[260px] max-h-[260px]">
            {statsData.map((stat, index) => (
              <Card key={index} className="bg-white/80 rounded-2xl shadow-md border border-pink-200 hover:border-pink-400 transition-colors duration-300 p-2 flex-1 flex flex-col justify-center min-h-[70px] max-h-[70px]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-pink-100 p-2"><stat.icon className="h-5 w-5 text-pink-400" /></span>
                    <span className="text-xs font-medium text-muted-foreground">{stat.title}</span>
                  </div>
                  <div className="text-lg font-bold text-pink-500">{stat.value}</div>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}>{stat.change} vs mes pasado</p>
                  <button
                    className="text-xs text-pink-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => {
                      if (stat.title.includes('Conversaciones')) navigate('/messages');
                      else if (stat.title.includes('Tickets')) navigate('/messages');
                      else if (stat.title.includes('Leads')) navigate('/messages');
                    }}
                  >
                    Ver todas
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </div>
        {/* Próximas citas y otras secciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Columna 1: Tareas Pendientes y Documentos Creados */}
          <div className="flex flex-col gap-4">
            {/* Tareas Pendientes */}
            <Card className="bg-white/80 rounded-2xl shadow-md border border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-pink-400" />
                  <CardTitle className="text-lg font-semibold">Tareas Pendientes</CardTitle>
                </div>
                <button
                  className="text-xs text-pink-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/tareas')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">No hay tareas pendientes.</div>
              </CardContent>
            </Card>
            {/* Documentos Creados */}
            <Card className="bg-white/80 rounded-2xl shadow-md border border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-pink-400" />
                  <CardTitle className="text-lg font-semibold">Documentos Creados</CardTitle>
                </div>
                <button
                  className="text-xs text-pink-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/documents')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">No hay documentos creados.</div>
              </CardContent>
            </Card>
          </div>
          {/* Columna 2: Próximas citas y Próximas reservas */}
          <div className="flex flex-col gap-4">
            {/* Próximas citas */}
            <Card className="bg-white/80 rounded-2xl shadow-md border border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-400" />
                  <CardTitle className="text-lg font-semibold">Próximas citas</CardTitle>
                </div>
                <button
                  className="text-xs text-pink-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/citas')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                {nextAppointments.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No hay citas próximas.</div>
                ) : (
                  <ul className="divide-y divide-pink-100">
                    {nextAppointments.map((appt, idx) => (
                      <li key={appt.id || idx} className="py-3 flex flex-col gap-1">
                        <div className="font-medium text-sm">{appt.name} ({appt.email})</div>
                        <div className="text-xs text-muted-foreground">{appt.type} - {appt.date} {appt.time}</div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
            {/* Próximas Reservas */}
            <Card className="bg-white/80 rounded-2xl shadow-md border border-pink-200">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-pink-400" />
                  <CardTitle className="text-lg font-semibold">Próximas Reservas</CardTitle>
                </div>
                <button
                  className="text-xs text-pink-400 hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/reservas')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                <div className="text-muted-foreground text-sm">No hay reservas próximas.</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;