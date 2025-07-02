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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;

    // 1. Guardar mensaje del usuario en Supabase
    const { error: userError } = await supabase
      .from('messages')
      .insert({
        client_id: client.id,
        sender: 'user',
        text: newMessage,
        source: 'web',
      });
    
    if (userError) {
      toast({ title: 'Error', description: userError.message, variant: 'destructive' });
      return;
    }

    // 2. Enviar mensaje al backend para obtener respuesta de NNIA
    try {
      const response = await fetch('/api/nnia/respond', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          message: newMessage,
          source: 'web',
        }),
      });
      const data = await response.json();
      if (data.nnia) {
        // 3. Guardar respuesta de NNIA en Supabase
        await supabase.from('messages').insert({
          client_id: client.id,
          sender: 'assistant',
          text: data.nnia,
          source: 'nnia',
        });
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Error al obtener respuesta de NNIA', variant: 'destructive' });
    }
    setNewMessage('');
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
          <div className="col-span-1 border-r border-border flex flex-col">
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar..." className="pl-9" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-2 text-center text-muted-foreground text-sm">
              {activeTab === 'messages' && <p>Lista de conversaciones (próximamente)</p>}
              {activeTab === 'tickets' && (
                <>
                  <Button className="mb-2" size="sm" onClick={() => exportToCSV(tickets.map(t => ({
                    Visitante: t.visitor_name || t.visitor_id,
                    Estado: t.status,
                    Mensaje: t.message,
                    Fecha: new Date(t.created_at).toLocaleString()
                  })), 'tickets.csv')}>Exportar a CSV</Button>
                  {tickets.length === 0 ? <p>No hay tickets.</p> : tickets.map(ticket => (
                    <div key={ticket.id} className="mb-2 p-2 border rounded text-left cursor-pointer hover:bg-muted/30" onClick={() => setSelectedTicket(ticket)}>
                      <div><b>Visitante:</b> {ticket.visitor_name || ticket.visitor_id}</div>
                      <div><b>Estado:</b> {ticket.status}</div>
                      <div><b>Mensaje:</b> {ticket.message}</div>
                      <div><b>Fecha:</b> {new Date(ticket.created_at).toLocaleString()}</div>
                      <button className="mt-2 text-xs text-blue-600 hover:underline" onClick={e => { e.stopPropagation(); archiveTicket(ticket.id); }}>Archivar</button>
                    </div>
                  ))}
                  <Dialog open={!!selectedTicket} onOpenChange={open => !open && setSelectedTicket(null)}>
                    <DialogContent>
                      <DialogTitle>Detalle del Ticket</DialogTitle>
                      {selectedTicket && (
                        <>
                          <DialogDescription>
                            <div><b>Visitante:</b> {selectedTicket.visitor_name || selectedTicket.visitor_id}</div>
                            <div><b>Estado:</b> {selectedTicket.status}</div>
                            <div><b>Mensaje inicial:</b> {selectedTicket.message}</div>
                            <div><b>Fecha:</b> {new Date(selectedTicket.created_at).toLocaleString()}</div>
                          </DialogDescription>
                          <div className="my-4">
                            <div className="font-semibold mb-2">Historial de mensajes</div>
                            <div className="max-h-48 overflow-y-auto space-y-2">
                              {ticketMessages.length === 0 ? <div className="text-muted-foreground">Sin mensajes</div> : ticketMessages.map((msg, idx) => (
                                <div key={idx} className={`text-sm p-2 rounded ${msg.sender === 'responsible' ? 'bg-primary/10 text-primary' : 'bg-muted'}`}>
                                  <b>{msg.sender === 'responsible' ? 'Tú' : msg.sender}:</b> {msg.text}
                                  <div className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleString()}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                          {selectedTicket.status === 'open' && (
                            <DialogFooter>
                              <Input
                                placeholder="Escribe una respuesta..."
                                value={ticketReply}
                                onChange={e => setTicketReply(e.target.value)}
                                disabled={replyLoading}
                              />
                              <Button onClick={handleTicketReply} disabled={replyLoading || !ticketReply.trim()}>
                                {replyLoading ? 'Enviando...' : 'Responder'}
                              </Button>
                            </DialogFooter>
                          )}
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {activeTab === 'leads' && (
                <>
                  <Button className="mb-2" size="sm" onClick={() => exportToCSV(leads.map(l => ({
                    Visitante: l.visitor_name || l.visitor_id,
                    Email: l.visitor_email || '-',
                    Teléfono: l.visitor_phone || '-',
                    Mensaje: l.message,
                    Fecha: new Date(l.created_at).toLocaleString()
                  })), 'leads.csv')}>Exportar a CSV</Button>
                  {leads.length === 0 ? <p>No hay leads.</p> : leads.map(lead => (
                    <div key={lead.id} className="mb-2 p-2 border rounded text-left cursor-pointer hover:bg-muted/30" onClick={() => setSelectedLead(lead)}>
                      <div><b>Visitante:</b> {lead.visitor_name || lead.visitor_id}</div>
                      <div><b>Email:</b> {lead.visitor_email || '-'}</div>
                      <div><b>Teléfono:</b> {lead.visitor_phone || '-'}</div>
                      <div><b>Mensaje:</b> {lead.message}</div>
                      <div><b>Fecha:</b> {new Date(lead.created_at).toLocaleString()}</div>
                      <button className="mt-2 text-xs text-blue-600 hover:underline" onClick={e => { e.stopPropagation(); archiveLead(lead.id); }}>Archivar</button>
                    </div>
                  ))}
                  <Dialog open={!!selectedLead} onOpenChange={open => !open && setSelectedLead(null)}>
                    <DialogContent>
                      <DialogTitle>Detalle del Lead</DialogTitle>
                      {selectedLead && (
                        <>
                          <DialogDescription>
                            <div><b>Visitante:</b> {selectedLead.visitor_name || selectedLead.visitor_id}</div>
                            <div><b>Email:</b> <span style={{cursor:'pointer',color:'#2563eb'}} onClick={() => navigator.clipboard.writeText(selectedLead.visitor_email || '')}>{selectedLead.visitor_email || '-'}</span></div>
                            <div><b>Teléfono:</b> <span style={{cursor:'pointer',color:'#2563eb'}} onClick={() => navigator.clipboard.writeText(selectedLead.visitor_phone || '')}>{selectedLead.visitor_phone || '-'}</span></div>
                            <div><b>Mensaje:</b> {selectedLead.message}</div>
                            <div><b>Fecha:</b> {new Date(selectedLead.created_at).toLocaleString()}</div>
                          </DialogDescription>
                        </>
                      )}
                    </DialogContent>
                  </Dialog>
                </>
              )}
              {activeTab === 'archived' && (
                <>
                  <div className="mb-2 font-semibold">Tickets Archivados</div>
                  {archivedTickets.length === 0 ? <p>No hay tickets archivados.</p> : archivedTickets.map(ticket => (
                    <div key={ticket.id} className="mb-2 p-2 border rounded text-left bg-muted/50">
                      <div><b>Visitante:</b> {ticket.visitor_name || ticket.visitor_id}</div>
                      <div><b>Estado:</b> {ticket.status}</div>
                      <div><b>Mensaje:</b> {ticket.message}</div>
                      <div><b>Fecha:</b> {new Date(ticket.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                  <div className="mb-2 font-semibold mt-4">Leads Archivados</div>
                  {archivedLeads.length === 0 ? <p>No hay leads archivados.</p> : archivedLeads.map(lead => (
                    <div key={lead.id} className="mb-2 p-2 border rounded text-left bg-muted/50">
                      <div><b>Visitante:</b> {lead.visitor_name || lead.visitor_id}</div>
                      <div><b>Email:</b> {lead.visitor_email || '-'}</div>
                      <div><b>Teléfono:</b> {lead.visitor_phone || '-'}</div>
                      <div><b>Mensaje:</b> {lead.message}</div>
                      <div><b>Fecha:</b> {new Date(lead.created_at).toLocaleString()}</div>
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
          <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col">
            {activeTab === 'messages' && (
              <>
                <div className="p-4 border-b border-border flex items-center space-x-4">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src="https://i.pravatar.cc/150?u=visitor" />
                    <AvatarFallback>V</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">Visitante Web</p>
                    <p className="text-sm text-green-400">En línea</p>
                  </div>
                </div>
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {loading ? (
                    <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
                  ) : (
                    messages.map((msg) => (
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
                    />
                    <Button type="submit" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8">
                      <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </form>
              </>
            )}
            {activeTab !== 'messages' && (
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