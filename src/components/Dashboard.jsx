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
      <div className="space-y-8">
        {/* Chat tipo GPT al inicio */}
        <ChatAssistant userName={client?.name || 'Usuario'} />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Un resumen de la actividad de tu asistente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Columna 1: Conversaciones Recientes */}
          <Card className="bg-card/50 backdrop-blur-sm flex flex-col justify-between h-full">
            <CardHeader>
              <CardTitle className="text-lg font-semibold">Conversaciones Recientes</CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground py-16">
              <p>Gráfico de conversaciones irá aquí.</p>
              <p className="text-sm">(Función en desarrollo)</p>
            </CardContent>
          </Card>
          {/* Columna 2: Métricas verticales */}
          <div className="flex flex-col gap-4">
            {statsData.map((stat, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors duration-300">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                  <stat.icon className="h-5 w-5 text-primary" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <p className={`text-xs ${stat.change.startsWith('+') ? 'text-green-400' : 'text-red-400'}`}> 
                    {stat.change} vs el mes pasado
                  </p>
                  <button
                    className="mt-2 text-xs text-[#ff9c9c] hover:underline bg-transparent border-none p-0 cursor-pointer"
                    onClick={() => {
                      if (stat.title.includes('Conversaciones')) navigate('/messages');
                      else if (stat.title.includes('Tickets')) navigate('/messages');
                      else if (stat.title.includes('Leads')) navigate('/messages');
                    }}
                  >
                    Ver todas
                  </button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Próximas citas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Columna 1: Tareas Pendientes y Documentos Creados */}
          <div className="flex flex-col gap-4">
            {/* Tareas Pendientes */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Tareas Pendientes</CardTitle>
                <button
                  className="text-xs text-[#ff9c9c] hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/tareas')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                {/* Aquí se mostrarán las tareas pendientes cuando se conecte la funcionalidad */}
                <div className="text-muted-foreground text-sm">No hay tareas pendientes.</div>
              </CardContent>
            </Card>
            {/* Documentos Creados */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Documentos Creados</CardTitle>
                <button
                  className="text-xs text-[#ff9c9c] hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/documents')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                {/* Aquí se mostrarán los documentos creados cuando se conecte la funcionalidad */}
                <div className="text-muted-foreground text-sm">No hay documentos creados.</div>
              </CardContent>
            </Card>
          </div>
          {/* Columna 2: Próximas citas y Próximas reservas */}
          <div className="flex flex-col gap-4">
            {/* Próximas citas */}
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Próximas citas</CardTitle>
                <button
                  className="text-xs text-[#ff9c9c] hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/citas')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                {nextAppointments.length === 0 ? (
                  <div className="text-muted-foreground text-sm">No hay citas próximas.</div>
                ) : (
                  <ul className="divide-y divide-border">
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
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg font-semibold">Próximas Reservas</CardTitle>
                <button
                  className="text-xs text-[#ff9c9c] hover:underline bg-transparent border-none p-0 cursor-pointer"
                  onClick={() => navigate('/reservas')}
                >
                  Ver todas
                </button>
              </CardHeader>
              <CardContent>
                {/* Aquí se mostrarán las próximas reservas cuando se conecte la funcionalidad */}
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