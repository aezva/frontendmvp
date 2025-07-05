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
      <div className="h-full flex flex-col">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Mensajes</h1>
        <div className="mb-4 flex gap-2">
          {TABS.map(tab => (
            <Button key={tab.key} variant={activeTab === tab.key ? 'default' : 'outline'} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </Button>
          ))}
        </div>
        <Card className="flex-1 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 h-[calc(100vh-12rem)] bg-card/50">
          {activeTab === 'messages' && (
            <div className="col-span-1 border-r border-border flex flex-col overflow-y-auto">
              <div className="p-4 border-b border-border font-semibold">Conversaciones</div>
              {convLoading ? (
                <div className="flex-1 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
              ) : conversations.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-muted-foreground">Sin conversaciones</div>
              ) : (
                conversations.map(conv => (
                  <div
                    key={conv.visitor_id}
                    className={`flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 ${selectedConversation && selectedConversation.visitor_id === conv.visitor_id ? 'bg-muted' : ''}`}
                    onClick={() => setSelectedConversation(conv)}
                  >
                    <Avatar>
                      <AvatarFallback>{conv.visitor_id?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{conv.visitor_id?.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground truncate">{conv.last_message}</div>
                    </div>
                    <div className="text-xs text-muted-foreground">{conv.last_timestamp ? new Date(conv.last_timestamp).toLocaleString() : ''}</div>
                  </div>
                ))
              )}
            </div>
          )}
          <div className={`col-span-1 md:col-span-2 lg:col-span-3 flex flex-col ${activeTab === 'messages' ? '' : 'items-center justify-center'}`}>
            {activeTab === 'messages' ? (
              selectedConversation ? (
                <>
                  <div className="flex-1 p-6 overflow-y-auto space-y-4">
                    {loading ? (
                      <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                    ) : (
                      conversationMessages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                          <div className={`${msg.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'} p-3 rounded-lg max-w-xs`}>
                            {msg.text}
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-border mt-auto">
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
                <div className="flex-1 flex items-center justify-center text-muted-foreground">Selecciona una conversación para ver los mensajes.</div>
              )
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <span>Selecciona un ticket o lead para ver más detalles (próximamente).</span>
              </div>
            )}
          </div>
        </Card>
      </div>
    </>
  );
};

export default Messages;