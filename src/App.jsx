import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Onboarding from '@/components/Onboarding';
import ClientPanel from '@/components/ClientPanel';
import Dashboard from '@/components/Dashboard';
import Messages from '@/components/Messages';
import MyBusiness from '@/components/MyBusiness';
import Subscription from '@/components/Subscription';
import Settings from '@/components/Settings';
import CitasPage from '@/pages/Citas';
import WidgetSettings from '@/components/WidgetSettings';
import Reservations from '@/components/Reservations';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import Documents from './pages/Documents.jsx';
import DocumentView from './pages/DocumentView.jsx';
import Tareas from './pages/Tareas.jsx';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { Bot } from 'lucide-react';
import ChoosePlan from '@/components/ChoosePlan';

function App() {
  return (
    <>
      <Helmet>
        <title>Asistente IA para Ventas</title>
        <meta name="description" content="Plataforma SaaS para configurar asistentes de IA personalizados para tu negocio." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </Helmet>
      <Router>
        <AppContent />
      </Router>
    </>
  );
}

function AppContent() {
    const { session, client, loading } = useAuth();
    const location = useLocation();
    const [subscriptionStatus, setSubscriptionStatus] = React.useState(null);

    React.useEffect(() => {
      // Consultar el estado de la suscripción si hay cliente
      const fetchStatus = async () => {
        if (client && client.id) {
          const { data, error } = await import('@/lib/supabaseClient').supabase
            .from('subscriptions')
            .select('status')
            .eq('client_id', client.id)
            .single();
          setSubscriptionStatus(data?.status || null);
        }
      };
      fetchStatus();
    }, [client?.id]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="text-center">
                    <Bot className="h-16 w-16 mx-auto animate-pulse text-primary"/>
                    <p className="mt-4 text-muted-foreground">Cargando tu espacio de trabajo...</p>
                </div>
            </div>
        );
    }

    return (
        <AnimatePresence mode="wait">
            <Routes location={location} key={location.pathname}>
                {!session ? (
                    <>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="*" element={<Navigate to="/login" replace />} />
                    </>
                ) : (client && subscriptionStatus !== 'active') ? (
                    <>
                        <Route path="/choose-plan" element={<ChoosePlan />} />
                        <Route path="*" element={<Navigate to="/choose-plan" replace />} />
                    </>
                ) : (client && !client.onboarding_completed) ? (
                    <>
                        <Route path="/onboarding" element={<Onboarding />} />
                        <Route path="*" element={<Navigate to="/onboarding" replace />} />
                    </>
                ) : client ? (
                     <>
                        <Route path="/" element={
                            <ThemeProvider>
                                <SidebarProvider>
                                    <ClientPanel />
                                </SidebarProvider>
                            </ThemeProvider>
                        }>
                            <Route index element={<Dashboard />} />
                            <Route path="messages" element={<Messages />} />
                            <Route path="my-business" element={<MyBusiness />} />
                            <Route path="subscription" element={<Subscription />} />
                            <Route path="settings" element={<Settings />} />
                            <Route path="appointments" element={<CitasPage />} />
                            <Route path="widget" element={<WidgetSettings />} />
                            <Route path="reservas" element={<Reservations />} />
                            <Route path="documents" element={<Documents />} />
                            <Route path="documents/:id" element={<DocumentView />} />
                            <Route path="tasks" element={<Tareas />} />
                        </Route>
                        <Route path="/login" element={<Navigate to="/" replace />} />
                        <Route path="/signup" element={<Navigate to="/" replace />} />
                        <Route path="/onboarding" element={<Navigate to="/" replace />} />
                    </>
                ) : (
                    <Route path="*" element={<Navigate to="/login" replace />} />
                )}
            </Routes>
        </AnimatePresence>
    );
}

export default App;