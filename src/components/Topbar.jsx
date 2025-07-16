import React from 'react';
import { NavLink } from 'react-router-dom';
import { Bell, Sun, Moon, MessageSquare, MessageCircle } from 'lucide-react';
import { LayoutDashboard, FileText, Calendar, Menu, Building2, CreditCard, Settings, LogOut } from 'lucide-react';
import { useNotifications } from '../contexts/NotificationsContext';
import { useAuth } from '../contexts/AuthContext';
import { useSidebar } from '../contexts/SidebarContext';
import { useTheme } from '../contexts/ThemeContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/messages', label: 'Mensajes', icon: MessageSquare },
  { href: '/documents', label: 'Documentos', icon: FileText },
  { href: '/appointments', label: 'Citas', icon: Calendar },
  { href: '/reservations', label: 'Reservas', icon: Calendar },
];
const profileMenuItems = [
  { href: '/my-business', label: 'Mi Negocio', icon: Building2 },
  { href: '/widget', label: 'Widget', icon: MessageCircle },
  { href: '/subscription', label: 'Suscripción', icon: CreditCard },
  { href: '/settings', label: 'Configuración', icon: Settings },
];

export default function Topbar({ onToggleSidebar, onToggleChat, isSidebarOpen, isChatOpen }) {
  const { unreadCount, notifications, markAsRead } = useNotifications();
  const { user, client, logout } = useAuth();
  const { sidebarState, toggleSidebar } = useSidebar();
  const { isDarkMode, toggleTheme } = useTheme();
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const notifRef = React.useRef();
  const menuRef = React.useRef();

  // Usar siempre el mismo icono para consistencia visual
  const ChatIcon = MessageSquare;

  React.useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) setNotifOpen(false);
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full bg-background border-b border-border grid grid-cols-3 items-center px-6 h-[52px]">
      {/* Columna izquierda: Solo logo NNIA, sin botón de menú */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="font-alata text-2xl tracking-[0.19em] text-foreground select-none">NNIA</div>
      </div>
      {/* Columna central vacía (o logo si se desea) */}
      <div />
      {/* Columna derecha: Acciones */}
      <div className="flex items-center justify-end min-w-0 gap-[25px] items-center">
        {/* Botón de Chat (barra lateral derecha) */}
        <button
          className="transition-colors ml-0 flex items-center"
          onClick={onToggleChat}
          title={isChatOpen ? 'Ocultar chat' : 'Mostrar chat'}
        >
          <MessageSquare className="h-5 w-5" style={{ color: '#ff9c9c' }} />
        </button>
        {/* Botón de Modo Día/Noche */}
        <button
          className="transition-colors flex items-center"
          onClick={toggleTheme}
          title={`Cambiar a modo ${isDarkMode ? 'día' : 'noche'}`}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5" style={{ color: '#ff9c9c' }} />
          ) : (
            <Moon className="h-5 w-5" style={{ color: '#ff9c9c' }} />
          )}
        </button>
        {/* Notificaciones */}
        <div className="relative flex items-center" ref={notifRef}>
          <button
            className="relative transition-colors flex items-center"
            onClick={() => setNotifOpen(o => !o)}
            aria-label="Notificaciones"
          >
            <Bell className="h-5 w-5" style={{ color: '#ff9c9c' }} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-[54px] w-72 bg-popover border border-border/50 border-t-0 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50 backdrop-blur-sm">
              <div className="p-3 border-b border-border/30 font-semibold text-popover-foreground text-sm">Notificaciones</div>
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Sin notificaciones recientes.</div>
              ) : (
                <ul>
                  {notifications.slice(0, 10).map(n => (
                    <li key={n.id} className={`px-4 py-3 border-b border-border/20 last:border-b-0 cursor-pointer transition-colors ${!n.read ? 'bg-accent/30' : ''}`}
                        onClick={() => { markAsRead(n.id); setNotifOpen(false); }}>
                      <div className="font-semibold text-sm">{n.title}</div>
                      <div className="text-xs text-muted-foreground">{n.body}</div>
                      <div className="text-xs text-right text-gray-400">{new Date(n.created_at).toLocaleString()}</div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
} 