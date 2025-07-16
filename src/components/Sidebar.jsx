import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Ticket, Briefcase, Bot, CreditCard, Settings, LogOut, ChevronRight, Calendar, Building2, MessageCircle, FileText, Check, ListChecks } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useNotifications } from '../contexts/NotificationsContext';
import { useState, useRef, useEffect } from 'react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/messages', label: 'Mensajes', icon: MessageSquare },
  { href: '/tareas', label: 'Tareas', icon: ListChecks },
  { href: '/documents', label: 'Documentos', icon: FileText },
  { href: '/citas', label: 'Citas', icon: Calendar },
  // { href: '/reservas', label: 'Reservas', icon: Calendar }, // Oculto temporalmente
  { href: '/my-business', label: 'Mi Negocio', icon: Building2 },
  { href: '/widget', label: 'Widget', icon: MessageCircle },
  { href: '/subscription', label: 'Suscripción', icon: CreditCard },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

const Sidebar = ({ isSidebarOpen, handleLogout, onToggleSidebar }) => {
  const location = useLocation();
  const { toast } = useToast();
  const { user, client } = useAuth();
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNotImplemented = () => {
    toast({
      title: "🚧 ¡Función en construcción!",
      description: "Esta característica aún no está implementada, ¡pero puedes solicitarla en tu próximo prompt! 🚀",
      variant: "default"
    });
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <aside
      // NOTA IMPORTANTE: Para que el sidebar pueda ocultarse correctamente en escritorio (pantallas md+),
      // hay que eliminar la clase "md:translate-x-0" de aquí. Actualmente, esta clase fuerza a que el sidebar
      // siempre esté visible en escritorio, aunque isSidebarOpen sea false. Cuando se quiera implementar el botón
      // para ocultar el sidebar, simplemente eliminar esta clase y funcionará correctamente.
      className={cn(
        "fixed top-[52px] left-0 h-[calc(100vh-52px)] bg-background border-r border-border z-40 transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0 w-48" : "-translate-x-full w-48",
        "md:translate-x-0 md:w-48"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Elimino el botón para expandir/colapsar sidebar y el divisor superior */}
        <nav className="flex-1 pl-6 pr-6 py-6 space-y-1">
          {navItems.map(item => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => cn('flex items-center py-2 text-sm font-normal rounded-lg transition-colors', isActive ? 'bg-primary/5 text-[#ff9c9c]' : 'text-black')}>
              <item.icon 
                className="mr-3 h-5 w-5"
                style={{ color: location.pathname === item.href ? '#ff9c9c' : '#6b7280' }}
                strokeWidth={1.5}
              />
              <span className={location.pathname === item.href ? 'text-[#ff9c9c] font-normal' : 'text-black font-normal'}>{item.label}</span>
              {location.pathname === item.href && (
                <motion.div layoutId="active-indicator" className="ml-auto">
                  <ChevronRight className="h-4 w-4" color="#ff9c9c" strokeWidth={1.5} />
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="pl-6 pr-6 border-t border-border mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center py-2.5 text-sm font-normal rounded-lg text-black transition-colors pl-0 pr-0">
            <LogOut 
              className="mr-3 h-5 w-5"
              style={{ color: '#ff9c9c' }}
              strokeWidth={1.5}
            />
            <span className="text-black font-normal">Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;