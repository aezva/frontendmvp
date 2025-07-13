import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
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
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 },
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5,
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Topbar />
      <div className="flex flex-1">
        {/* Columna lateral izquierda: Video cuadrado arriba y chat debajo con altura fija */}
        <div 
          className={`hidden md:flex flex-col bg-background border-r border-border fixed left-0 top-16 z-40 transition-all duration-300 ease-in-out ${!isVisible ? 'opacity-0 pointer-events-none' : ''}`} 
          style={{ 
            width: sidebarWidth, 
            minWidth: sidebarWidth, 
            maxWidth: sidebarWidth, 
            height: 'calc(100vh - 4rem)' 
          }}
        >

          
          {/* Video cuadrado arriba, altura fija */}
          <div className="w-full flex-shrink-0">
            <div className="w-full h-64 shadow-sm" style={{ background: 'rgba(0,0,0,0.05)' }}>
              <video
                src="https://cafolvqmbzzqwtmuyvnj.supabase.co/storage/v1/object/public/app-assets//Professional_Mode_beautiful_pink_haired_woman_movi.mp4"
                className="object-cover w-full h-full"
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
              <Routes>
                <Route path="/" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Dashboard /></motion.div>} />
                <Route path="/messages" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Messages /></motion.div>} />
                <Route path="/my-business" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><MyBusiness /></motion.div>} />
                <Route path="/subscription" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Subscription /></motion.div>} />
                <Route path="/settings" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Settings /></motion.div>} />
                <Route path="/citas" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><CitasPage /></motion.div>} />
                <Route path="/widget" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><WidgetSettings /></motion.div>} />
                <Route path="/reservas" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Reservations /></motion.div>} />
                <Route path="/documents" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><Documents /></motion.div>} />
                <Route path="/documents/:id" element={<motion.div initial="initial" animate="in" exit="out" variants={pageVariants} transition={pageTransition}><DocumentView /></motion.div>} />
              </Routes>
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