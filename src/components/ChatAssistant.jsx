import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CHAT_SESSION_KEY = 'nnia_chat_messages';

const ChatAssistant = ({ userName }) => {
  const { client } = useAuth();
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(CHAT_SESSION_KEY);
    return saved ? JSON.parse(saved) : [{
      id: 1,
      sender: 'assistant',
      text: `¡Buenas tardes, ${userName}! 👋\n\nPregunta o encuentra lo que quieras desde tu espacio de trabajo...`,
    }];
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisPrompt, setAnalysisPrompt] = useState('Haz un resumen del documento.');
  const [lastAnalysis, setLastAnalysis] = useState(null);
  const { toast } = useToast();
  const [showDocModal, setShowDocModal] = useState(false);
  const [userDocs, setUserDocs] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '') return;
    const userMsg = { id: Date.now(), sender: 'user', text: newMessage };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client?.id,
          message: newMessage,
          source: 'client-panel',
          threadId,
        }),
      });
      const data = await res.json();
      if (data.nnia) {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'assistant', text: data.nnia },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          { id: Date.now() + 1, sender: 'assistant', text: 'No se recibió respuesta de NNIA.' },
        ]);
      }
      if (data.threadId) setThreadId(data.threadId);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, sender: 'assistant', text: 'Ocurrió un error al conectar con NNIA.' },
      ]);
    } finally {
      setLoading(false);
      setNewMessage('');
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!client) return;
    setAnalyzing(true);
    setLoading(true);
    try {
      // Subir archivo a Supabase Storage
      const fileExt = file.name.split('.').pop();
      const filePath = `${client.id}/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage.from('documents').upload(filePath, file);
      if (error) throw error;
      // Obtener URL pública
      const { data: publicUrlData } = supabase.storage.from('documents').getPublicUrl(filePath);
      const file_url = publicUrlData.publicUrl;
      // Llamar al backend para análisis
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/analyze-document`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          file_url,
          file_type: fileExt,
          prompt: analysisPrompt
        })
      });
      const result = await res.json();
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: result.result || 'No se pudo analizar el documento.', analysis: true }
      ]);
      setLastAnalysis({ file_url, file_type: fileExt, content: result.result });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: 'Ocurrió un error al analizar el documento.' }
      ]);
      setLastAnalysis(null);
    } finally {
      setAnalyzing(false);
      setLoading(false);
      e.target.value = '';
    }
  };

  const handleCreateDocument = async () => {
    if (!client || !lastAnalysis) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          name: `Documento NNIA - ${new Date().toLocaleString()}`,
          content: lastAnalysis.content,
          file_url: lastAnalysis.file_url,
          file_type: lastAnalysis.file_type
        })
      });
      const doc = await res.json();
      toast({ title: 'Documento creado', description: 'El análisis se guardó como documento.' });
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: '✅ El análisis se guardó como documento y ya está disponible en la sección Documentos.' }
      ]);
      setLastAnalysis(null);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo guardar el documento.' });
    }
  };

  const handleOpenAddToExisting = async () => {
    if (!client) return;
    setShowDocModal(true);
    // Cargar documentos del usuario
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents?clientId=${client.id}`);
      const docs = await res.json();
      setUserDocs(docs);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudieron cargar los documentos.' });
    }
  };

  const handleAddToExisting = async () => {
    if (!client || !lastAnalysis || !selectedDocId) return;
    try {
      // Obtener el documento actual
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents/${selectedDocId}?clientId=${client.id}`);
      const doc = await res.json();
      // Actualizar el contenido agregando el análisis
      const updatedContent = doc.content + '\n\n---\n\n' + lastAnalysis.content;
      await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents/${selectedDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, name: doc.name, content: updatedContent })
      });
      toast({ title: 'Documento actualizado', description: 'El análisis se agregó al documento.' });
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: '✅ El análisis se agregó al documento seleccionado.' }
      ]);
      setShowDocModal(false);
      setLastAnalysis(null);
    } catch (err) {
      toast({ title: 'Error', description: 'No se pudo actualizar el documento.' });
    }
  };

  // Limpia el chat al cerrar sesión
  useEffect(() => {
    if (!client) {
      sessionStorage.removeItem(CHAT_SESSION_KEY);
      setMessages([{
        id: 1,
        sender: 'assistant',
        text: `¡Buenas tardes, ${userName}! 👋\n\nPregunta o encuentra lo que quieras desde tu espacio de trabajo...`,
      }]);
    }
  }, [client, userName]);

  return (
    <Card className="bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <Avatar className="h-10 w-10">
          <AvatarImage src="https://cafolvqmbzzqwtmuyvnj.supabase.co/storage/v1/object/public/app-assets//nnia-profile-picture.webp" />
          <AvatarFallback>AI</AvatarFallback>
        </Avatar>
        <CardTitle className="text-xl font-alata tracking-[0.19em] text-black">NNIA</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[350px] md:h-[400px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={
                `rounded-2xl px-5 py-3 max-w-[80%] md:max-w-[65%] break-words shadow-sm ` +
                (msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-md'
                  : 'bg-muted text-foreground rounded-bl-md')
              }>
                {msg.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-muted text-foreground rounded-2xl px-5 py-3 max-w-[80%] md:max-w-[65%] shadow-sm opacity-70">
                NNIA está escribiendo...
              </div>
            </div>
          )}
          {analyzing && (
            <div className="text-center py-4 text-primary font-semibold">Analizando documento... Por favor espera.</div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoComplete="off"
            disabled={analyzing}
          />
          <Button type="button" size="icon" className="h-10 w-10" onClick={() => fileInputRef.current.click()} title="Subir documento para analizar" disabled={analyzing}>
            <Upload className="h-5 w-5" />
          </Button>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={analyzing}
          />
          <Button type="submit" size="icon" className="h-10 w-10" disabled={analyzing}>
            <Send className="h-5 w-5" />
          </Button>
        </form>
        <div className="mt-2 flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">Prompt para análisis:</span>
          <Input
            value={analysisPrompt}
            onChange={e => setAnalysisPrompt(e.target.value)}
            className="text-xs py-1 px-2 w-64"
            disabled={analyzing}
          />
        </div>
        {/* Botones de acción tras análisis */}
        {lastAnalysis && (
          <div className="mt-4 flex gap-2 justify-end">
            <Button variant="default" size="sm" onClick={handleCreateDocument}>Crear nuevo documento</Button>
            <Button variant="outline" size="sm" onClick={handleOpenAddToExisting}>Agregar a existente</Button>
          </div>
        )}
      </CardContent>
      <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
        <DialogContent>
          <DialogTitle>Agregar análisis a un documento existente</DialogTitle>
          <div className="space-y-2">
            <select
              className="w-full border rounded p-2"
              value={selectedDocId}
              onChange={e => setSelectedDocId(e.target.value)}
            >
              <option value="">Selecciona un documento</option>
              {userDocs.map(doc => (
                <option key={doc.id} value={doc.id}>{doc.name}</option>
              ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="default" onClick={handleAddToExisting} disabled={!selectedDocId}>Agregar</Button>
            <Button variant="outline" onClick={() => setShowDocModal(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ChatAssistant; 