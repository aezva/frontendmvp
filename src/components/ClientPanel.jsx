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
  const { signOut, client } = useAuth();
  const { sidebarWidth, isVisible, sidebarState, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const { toast } = useToast();



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

  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        {/* Columna lateral izquierda: Video cuadrado arriba y chat debajo con altura fija */}
        <div 
          className={`hidden md:flex flex-col bg-background border-r-0 border-border fixed left-0 top-16 z-40 transition-all duration-300 ease-in-out ${!isVisible ? 'opacity-0 pointer-events-none' : ''}`} 
          style={{ 
            width: sidebarWidth, 
            minWidth: sidebarWidth, 
            maxWidth: sidebarWidth, 
            height: 'calc(100vh - 4rem)' 
          }}
        >
          {/* Video cuadrado arriba, altura fija */}
          <div className="w-full flex-shrink-0">
            <div className="w-full h-64 shadow-sm border border-[#ff9c9c]/40 border-t-0 border-l-0 glitch-video-container" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <div className="glitch-color"></div>
              <video
                src="https://cafolvqmbzzqwtmuyvnj.supabase.co/storage/v1/object/public/app-assets//Professional_Mode_beautiful_pink_haired_woman_movi.mp4"
                className="glitch-video"
                autoPlay
                loop
                muted
                playsInline
                style={{ background: '#000' }}
              />
            </div>
          </div>
          {/* ChatAssistant debajo, ocupa el resto del espacio vertical disponible */}
          <div className="flex-1 min-h-0">
            <ChatAssistant userName={client?.name || 'Usuario'} client={client} />
          </div>
        </div>
        {/* Contenido principal a la derecha del lateral fijo */}
        <main className="flex-1 flex flex-col transition-all duration-300 ease-in-out" style={{ marginLeft: sidebarWidth }}>
          <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-background">
            <span className="font-bold text-lg text-foreground">Asistente IA</span>
            <button onClick={() => setSidebarOpen(!isSidebarOpen)}>
              {isSidebarOpen ? <X /> : <Menu />}
            </button>
          </div>
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
      </div>
      <WelcomeMessage />
      <AppTutorial />
    </div>
  );
};

export default ClientPanel;