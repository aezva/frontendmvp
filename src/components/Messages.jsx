import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, Send, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import { fetchTickets, fetchLeads } from '@/services/notificationsService';
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const TABS = [
  { key: 'messages', label: 'Mensajes' },
  { key: 'tickets', label: 'Tickets' },
  { key: 'leads', label: 'Leads' },
  { key: 'archived', label: 'Archivados' },
];

// Nuevo: Componente de tarjeta para Lead/Ticket
function LeadTicketCard({ item, type, onViewConversation }) {
  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-4 mb-4 flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="inline-block px-2 py-0.5 text-xs rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
          {type === 'lead' ? 'Lead' : 'Ticket'}
        </span>
        <span className="text-xs text-zinc-400 ml-auto">{new Date(item.created_at).toLocaleString()}</span>
      </div>
      {type === 'lead' && (
        <>
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{item.visitor_name || 'Visitante'}</div>
          {item.visitor_email && <div className="text-xs text-zinc-500">📧 {item.visitor_email}</div>}
          {item.visitor_phone && <div className="text-xs text-zinc-500">📱 {item.visitor_phone}</div>}
        </>
      )}
      {type === 'ticket' && (
        <>
          <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{item.visitor_name || 'Visitante'}</div>
          <div className="text-xs text-zinc-500">{item.message}</div>
          <div className="text-xs text-zinc-500">Estado: <span className="font-semibold">{item.status}</span></div>
        </>
      )}
      <button
        className="mt-2 px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition"
        onClick={() => onViewConversation(item.visitor_id)}
      >
        Ver conversación
      </button>
    </div>
  );
}

const Messages = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const [activeTab, setActiveTab] = useState('messages');
  const [tickets, setTickets] = useState([]);
  const [leads, setLeads] = useState([]);
  const [archivedTickets, setArchivedTickets] = useState([]);
  const [archivedLeads, setArchivedLeads] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketMessages, setTicketMessages] = useState([]);
  const [ticketReply, setTicketReply] = useState('');
  const [replyLoading, setReplyLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [conversationMessages, setConversationMessages] = useState([]);
  const [convLoading, setConvLoading] = useState(false);

  useEffect(() => {
    const fetchMessages = async () => {
      if (!client) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', client.id)
        .order('timestamp', { ascending: true });

      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        setMessages(data);
      }
      setLoading(false);
    };
    fetchMessages();
  }, [client, toast]);
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!client) return;

    const channel = supabase
      .channel(`public:messages:client_id=eq.${client.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${client.id}` }, (payload) => {
        setMessages((prevMessages) => [...prevMessages, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [client]);

  useEffect(() => {
    if (!client) return;
    if (activeTab === 'tickets') {
      fetchTickets(client.id).then(setTickets).catch(() => setTickets([]));
    } else if (activeTab === 'leads') {
      fetchLeads(client.id).then(setLeads).catch(() => setLeads([]));
    } else if (activeTab === 'archived') {
      fetchTickets(client.id).then(data => setArchivedTickets(data.filter(t => t.status === 'archived'))).catch(() => setArchivedTickets([]));
      fetchLeads(client.id).then(data => setArchivedLeads(data.filter(l => l.status === 'archived'))).catch(() => setArchivedLeads([]));
    }
  }, [activeTab, client]);

  useEffect(() => {
    if (!selectedTicket) return;
    (async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('client_id', client.id)
        .eq('visitor_id', selectedTicket.visitor_id)
        .order('timestamp', { ascending: true });
      setTicketMessages(data || []);
    })();
  }, [selectedTicket, client]);

  useEffect(() => {
    if (!client) return;
    // Suscripción a nuevos tickets
    const ticketChannel = supabase
      .channel(`public:tickets:client_id=eq.${client.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets', filter: `client_id=eq.${client.id}` }, (payload) => {
        toast({
          title: 'Nuevo ticket de soporte',
          description: 'Un visitante ha solicitado hablar con un responsable.',
        });
        setTickets(tickets => [payload.new, ...tickets]);
      })
      .subscribe();
    // Suscripción a nuevos leads
    const leadChannel = supabase
      .channel(`public:leads:client_id=eq.${client.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads', filter: `client_id=eq.${client.id}` }, (payload) => {
        toast({
          title: 'Nuevo lead capturado',
          description: 'NNIA ha capturado un nuevo lead de contacto.',
        });
        setLeads(leads => [payload.new, ...leads]);
      })
      .subscribe();
    return () => {
      supabase.removeChannel(ticketChannel);
      supabase.removeChannel(leadChannel);
    };
  }, [client, toast]);

  useEffect(() => {
    if (!client) return;
    const fetchConversations = async () => {
      setConvLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/conversations?clientId=${client.id}`);
        const data = await res.json();
        if (data.success) setConversations(data.conversations);
        else setConversations([]);
      } catch {
        setConversations([]);
      }
      setConvLoading(false);
    };
    if (activeTab === 'messages') fetchConversations();
  }, [client, activeTab]);

  useEffect(() => {
    if (!client || !selectedConversation) return;
    const fetchConvMessages = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/messages?clientId=${client.id}&visitorId=${selectedConversation.visitor_id}`);
        const data = await res.json();
        if (data.success) setConversationMessages(data.messages);
        else setConversationMessages([]);
      } catch {
        setConversationMessages([]);
      }
      setLoading(false);
    };
    fetchConvMessages();
  }, [client, selectedConversation]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation) return;
    setLoading(true);
    try {
      // Enviar mensaje al backend (se guardará usuario y NNIA)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nnia/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          message: newMessage,
          source: 'panel',
          visitorId: selectedConversation.visitor_id
        }),
      });
      const data = await response.json();
      // Refrescar mensajes tras enviar
      if (data.success) {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/messages?clientId=${client.id}&visitorId=${selectedConversation.visitor_id}`);
        const msgData = await res.json();
        setConversationMessages(msgData.messages || []);
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Error al enviar mensaje', variant: 'destructive' });
    }
    setNewMessage('');
    setLoading(false);
  };

  async function archiveTicket(id) {
    if (!id) return;
    await supabase.from('tickets').update({ status: 'archived' }).eq('id', id);
    setTickets(tickets => tickets.filter(t => t.id !== id));
    setArchivedTickets(archived => [...archived, tickets.find(t => t.id === id)]);
  }

  async function archiveLead(id) {
    if (!id) return;
    await supabase.from('leads').update({ status: 'archived' }).eq('id', id);
    setLeads(leads => leads.filter(l => l.id !== id));
    setArchivedLeads(archived => [...archived, leads.find(l => l.id === id)]);
  }

  function exportToCSV(data, filename) {
    if (!data || data.length === 0) return;
    const replacer = (key, value) => value === null || value === undefined ? '' : value;
    const header = Object.keys(data[0]);
    const csv = [
      header.join(','),
      ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(','))
    ].join('\r\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  async function handleTicketReply() {
    if (!ticketReply.trim() || !selectedTicket) return;
    setReplyLoading(true);
    await supabase.from('messages').insert({
      client_id: client.id,
      sender: 'responsible',
      text: ticketReply,
      source: 'panel',
      visitor_id: selectedTicket.visitor_id,
      timestamp: new Date().toISOString()
    });
    setTicketMessages(msgs => [...msgs, {
      client_id: client.id,
      sender: 'responsible',
      text: ticketReply,
      source: 'panel',
      visitor_id: selectedTicket.visitor_id,
      timestamp: new Date().toISOString()
    }]);
    setTicketReply('');
    setReplyLoading(false);
  }

  return (
    <>
      <Helmet>
        <title>Mensajes - Asistente IA</title>
      </Helmet>
      <div className="flex flex-col flex-1 min-h-0 h-full justify-center">
        <h1 className="text-xl font-semibold tracking-tight mb-6">Mensajes</h1>
        <div className="flex-1 min-h-0 h-full">
          <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col h-full min-h-0">
          {/* Pestañas dentro de la tarjeta */}
          <div className="relative mb-4">
            <div className="flex items-center gap-6 w-full h-12 min-h-[48px] justify-start px-4" style={{alignItems: 'center'}}>
              {TABS.map(tab => (
                <span
                  key={tab.key}
                  className={`text-base font-light cursor-pointer pb-2 transition-colors select-none ${activeTab === tab.key ? 'text-[#ff9c9c]' : 'text-black hover:text-[#ff9c9c]'}`}
                  onClick={() => setActiveTab(tab.key)}
                  style={{padding: 0, margin: 0}}
                >
                  {tab.label}
                </span>
              ))}
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-px w-full bg-border" />
          </div>
          {/* Cambia el layout de los paneles dentro de la tarjeta: */}
          <div className="flex flex-row min-h-[400px] h-full w-full">
            {/* Panel izquierdo: lista de conversaciones, leads o tickets */}
            <div className="w-full md:w-1/3 flex flex-col overflow-y-auto py-2 pl-0 pr-0 h-full min-h-0">
              <div className="flex-1 flex flex-col px-4">
              {activeTab === 'messages' && (
                <>
                  {convLoading ? (
                    <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                  ) : conversations.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm" style={{minHeight: '100%'}}>
                      <span className="mx-0 my-auto">Sin conversaciones</span>
                    </div>
                  ) : (
                    conversations.map(conv => (
                      <div
                        key={conv.visitor_id}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedConversation && selectedConversation.visitor_id === conv.visitor_id ? 'bg-muted border border-[#ff9c9c]' : 'hover:bg-muted/50'}`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <Avatar>
                          <AvatarFallback>{conv.visitor_id?.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate text-sm">{conv.visitor_id?.slice(0, 8)}</div>
                          <div className="text-xs text-muted-foreground truncate">{conv.last_message}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">{conv.last_timestamp ? new Date(conv.last_timestamp).toLocaleString() : ''}</div>
                      </div>
                    ))
                  )}
                </>
              )}
              {activeTab === 'leads' && (
                <>
                  {leads.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm" style={{minHeight: '100%'}}>
                      <span className="mx-0 my-auto">Sin leads</span>
                    </div>
                  ) : (
                    leads.map(lead => (
                      <LeadTicketCard key={lead.id} item={lead} type="lead" onViewConversation={(visitorId) => {
                        setActiveTab('messages');
                        const conv = conversations.find(c => c.visitor_id === visitorId) || { visitor_id: visitorId };
                        setSelectedConversation(conv);
                      }} />
                    ))
                  )}
                </>
              )}
              {activeTab === 'tickets' && (
                <>
                  {tickets.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm" style={{minHeight: '100%'}}>
                      <span className="mx-0 my-auto">Sin tickets</span>
                    </div>
                  ) : (
                    tickets.map(ticket => (
                      <LeadTicketCard key={ticket.id} item={ticket} type="ticket" onViewConversation={(visitorId) => {
                        setActiveTab('messages');
                        const conv = conversations.find(c => c.visitor_id === visitorId) || { visitor_id: visitorId };
                        setSelectedConversation(conv);
                      }} />
                    ))
                  )}
                </>
              )}
              {activeTab === 'archived' && (
                <>
                  {archivedTickets.length === 0 && archivedLeads.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm" style={{minHeight: '100%'}}>
                      <span className="mx-0 my-auto">Sin archivados</span>
                    </div>
                  ) : (
                    <>
                      {archivedTickets.map(ticket => (
                        <LeadTicketCard key={ticket.id} item={ticket} type="ticket" onViewConversation={() => {}} />
                      ))}
                      {archivedLeads.map(lead => (
                        <LeadTicketCard key={lead.id} item={lead} type="lead" onViewConversation={() => {}} />
                      ))}
                    </>
                  )}
                </>
              )}
              </div>
            </div>
            {/* Panel derecho: mensajes de la conversación seleccionada */}
            <div className="flex-1 flex flex-col min-w-0 h-full min-h-0 border-l border-border" style={{marginLeft: '-1px'}}>
              <div className="px-4 h-full flex flex-col">
              {activeTab === 'messages' && selectedConversation ? (
                <>
                  <div className="flex-1 p-0 overflow-y-auto space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                      conversationMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={
                            `px-3 py-2 w-fit max-w-[90%] break-words shadow-sm border text-sm leading-[1.35] rounded-2xl ` +
                            (msg.sender === 'user'
                              ? 'bg-primary text-primary-foreground ml-8'
                              : 'bg-muted text-foreground mr-8')
                          }>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-0 border-t border-border mt-auto">
                    <div className="relative">
                      <Input
                        placeholder="Escribe un mensaje..."
                        className="pr-12"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        disabled={loading}
                      />
                      <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8" disabled={loading}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                  {activeTab === 'messages'
                    ? 'Selecciona una conversación para ver los mensajes.'
                    : 'Selecciona un ticket o lead para ver más detalles (próximamente).'}
                </div>
              )}
              </div>
            </div>
          </div>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Messages;