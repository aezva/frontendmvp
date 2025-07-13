import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import Messages from '@/components/Messages';
import MyBusiness from '@/components/MyBusiness';
import Subscription from '@/components/Subscription';
import Settings from '@/components/Settings';
import { Menu, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useSidebar } from '@/contexts/SidebarContext';
import { useToast } from '@/components/ui/use-toast';
import AppTutorial from '@/components/AppTutorial';
import WelcomeMessage from '@/components/WelcomeMessage';
import CitasPage from '@/pages/Citas';
import Topbar from './Topbar';
import WidgetSettings from '@/components/WidgetSettings';
import Reservations from '@/components/Reservations';
import Documents from '@/pages/Documents';
import DocumentView from '@/pages/DocumentView';
import ChatAssistant from './ChatAssistant';

const ClientPanel = () => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isChatOpen, setChatOpen] = useState(true);
  const { signOut, client } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const location = useLocation();

  // Ancho de sidebars
  const sidebarWidth = isSidebarOpen ? 256 : 0; // 64 = 16rem
  const chatbarWidth = isChatOpen ? 340 : 0; // ancho fijo para chat

  const handleLogout = async () => {
    const { error } = await signOut();
    if (error) {
      toast({ 
        title: 'Error al cerrar sesión', 
        description: error.message, 
        variant: 'destructive' 
      });
    } else {
      navigate('/login');
      toast({ title: 'Has cerrado sesión exitosamente.' });
    }
  };

  const pageVariants = {
    initial: { opacity: 0 },
    in: { opacity: 1 },
    out: { opacity: 0 },
  };
  const pageTransition = {
    duration: 0.35,
    ease: 'easeInOut',
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar 
        onToggleSidebar={() => setSidebarOpen(v => !v)}
        onToggleChat={() => setChatOpen(v => !v)}
        isSidebarOpen={isSidebarOpen}
        isChatOpen={isChatOpen}
      />
      <div className="flex flex-1 min-h-0">
        {/* Sidebar izquierdo de navegación */}
        <Sidebar isSidebarOpen={isSidebarOpen} handleLogout={handleLogout} />
        {/* Contenido principal */}
        <main 
          className="flex-1 flex flex-col transition-all duration-300 ease-in-out min-w-0"
          style={{ marginLeft: isSidebarOpen ? sidebarWidth : 0, marginRight: isChatOpen ? chatbarWidth : 0 }}
        >
          <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto bg-background">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: 'easeInOut' }}
                style={{ height: '100%' }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
        {/* Barra lateral derecha: chat y video */}
        <div
          className={`hidden md:flex flex-col bg-background border-l border-border fixed right-0 top-16 z-40 transition-all duration-300 ease-in-out ${isChatOpen ? 'translate-x-0' : 'translate-x-full'} shadow-lg`}
          style={{
            width: chatbarWidth,
            minWidth: chatbarWidth,
            maxWidth: chatbarWidth,
            height: 'calc(100vh - 4rem)'
          }}
        >
          {/* Header de chat tipo WhatsApp */}
          <div className="w-full flex-shrink-0 h-16 flex items-center gap-3 px-4 border-b border-border bg-background/80" style={{height: 64}}>
            <div className="flex items-center justify-center">
              {/* Avatar NNIA */}
              <img src="/logo-assistant.png" alt="NNIA" className="h-10 w-10 rounded-full bg-muted object-cover" />
            </div>
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-semibold text-base text-foreground truncate">Chat de NNIA</span>
              <span className="text-xs text-muted-foreground truncate">Asistente IA</span>
            </div>
          </div>
          {/* ChatAssistant debajo, ocupa el resto del espacio vertical disponible */}
          <div className="flex-1 min-h-0">
            <ChatAssistant userName={client?.name || 'Usuario'} client={client} />
          </div>
        </div>
      </div>
      <WelcomeMessage />
      <AppTutorial />
    </div>
  );
};

export default ClientPanel;