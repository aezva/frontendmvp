import React from 'react';
import { NavLink, useLocation, Link } from 'react-router-dom';
import { LayoutDashboard, MessageSquare, Ticket, Briefcase, Bot, CreditCard, Settings, LogOut, ChevronRight, Calendar, Building2, MessageCircle, FileText } from 'lucide-react';
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
  { href: '/documents', label: 'Documentos', icon: FileText },
  { href: '/subscription', label: 'Suscripción', icon: CreditCard },
  { href: '/widget', label: 'Widget', icon: MessageCircle },
  { href: '/my-business', label: 'Mi Negocio', icon: Building2 },
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
        "fixed top-16 left-0 h-[calc(100vh-4rem)] bg-background border-r border-border z-40 transition-transform duration-300 ease-in-out",
        isSidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64",
        "md:translate-x-0 md:w-64"
      )}
    >
      <div className="flex flex-col h-full">
        {/* Elimino el botón para expandir/colapsar sidebar y el divisor superior */}
        <nav className="flex-1 px-6 py-6 space-y-2">
          {navItems.map(item => (
            <NavLink key={item.href} to={item.href} className={({ isActive }) => cn('flex items-center py-2.5 text-sm font-medium rounded-lg transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground')}>
              <item.icon className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} />
              <span>{item.label}</span>
              {location.pathname === item.href && (
                <motion.div layoutId="active-indicator" className="ml-auto">
                  <ChevronRight className="h-4 w-4" />
                </motion.div>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-border mt-auto">
          <button onClick={handleLogout} className="w-full flex items-center py-2.5 text-sm font-medium rounded-lg text-muted-foreground transition-colors pl-[10px]">
            <LogOut className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;