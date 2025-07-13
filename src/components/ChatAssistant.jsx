import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useTheme } from '@/contexts/ThemeContext';

const CHAT_SESSION_KEY = 'nnia_chat_messages';

// Función para determinar el saludo según la hora del día
const getGreetingByTime = (userName) => {
  const hour = new Date().getHours();
  let greeting = '';
  
  if (hour >= 5 && hour < 12) {
    greeting = `Buenos días, ${userName}.`;
  } else if (hour >= 12 && hour < 18) {
    greeting = `Buenas tardes, ${userName}.`;
  } else {
    greeting = `Buenas noches, ${userName}.`;
  }
  
  return greeting;
};

const ChatAssistant = ({ userName, client: clientProp }) => {
  const { client: clientCtx } = useAuth();
  const client = clientProp || clientCtx;
  const [messages, setMessages] = useState(() => {
    const saved = sessionStorage.getItem(CHAT_SESSION_KEY);
    return saved ? JSON.parse(saved) : [{
      id: 1,
      sender: 'assistant',
      text: `${getGreetingByTime(userName)}\n\nPregunta o encuentra lo que necesites desde tu espacio de trabajo.`,
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
  const [attachedFile, setAttachedFile] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(messages));
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (newMessage.trim() === '' && !attachedFile) return;
    const userMsg = { id: Date.now(), sender: 'user', text: newMessage };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    try {
      if (attachedFile) {
        // Subir archivo a Supabase Storage
        const file = attachedFile;
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
            prompt: newMessage.trim() || 'Analiza el documento.'
          })
        });
        const result = await res.json();
        setMessages((prev) => [
          ...prev,
          { id: Date.now(), sender: 'assistant', text: result.result || 'No se pudo analizar el documento.', analysis: true }
        ]);
        setLastAnalysis({ file_url, file_type: fileExt, content: result.result });
        setLastGenerated({ content: result.result, file_url, file_type: fileExt });
        setAttachedFile(null);
      } else {
        // Mensaje normal sin archivo
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
          setLastGenerated({ content: data.nnia });
          setLastAnalysis(null);
        } else {
          setMessages((prev) => [
            ...prev,
            { id: Date.now() + 1, sender: 'assistant', text: 'No se recibió respuesta de NNIA.' },
          ]);
          setLastGenerated(null);
          setLastAnalysis(null);
        }
        if (data.threadId) setThreadId(data.threadId);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { id: Date.now() + 2, sender: 'assistant', text: 'Ocurrió un error al procesar tu solicitud.' },
      ]);
      setLastAnalysis(null);
      setLastGenerated(null);
      setAttachedFile(null);
    } finally {
      setLoading(false);
      setNewMessage('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setAttachedFile(file);
    e.target.value = '';
  };

  const handleCreateDocument = async () => {
    if (!client || !lastGenerated) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          name: `Documento NNIA - ${new Date().toLocaleString()}`,
          content: lastGenerated.content,
          file_url: lastGenerated.file_url,
          file_type: lastGenerated.file_type
        })
      });
      const doc = await res.json();
      toast({ title: 'Documento creado', description: 'El contenido se guardó como documento.' });
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: 'El contenido se guardó como documento y ya está disponible en la sección Documentos.' }
      ]);
      setLastGenerated(null);
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
    if (!client || !lastGenerated || !selectedDocId) return;
    try {
      // Obtener el documento actual
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents/${selectedDocId}?clientId=${client.id}`);
      const doc = await res.json();
      // Actualizar el contenido agregando el texto generado
      const updatedContent = doc.content + '\n\n---\n\n' + lastGenerated.content;
      await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents/${selectedDocId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, name: doc.name, content: updatedContent })
      });
      toast({ title: 'Documento actualizado', description: 'El contenido se agregó al documento.' });
      setMessages((prev) => [
        ...prev,
        { id: Date.now(), sender: 'assistant', text: 'El contenido se agregó al documento seleccionado.' }
      ]);
      setShowDocModal(false);
      setLastGenerated(null);
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
        text: `${getGreetingByTime(userName)}\n\nPregunta o encuentra lo que necesites desde tu espacio de trabajo.`,
      }]);
    }
  }, [client, userName]);

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-sm">
      <div className="absolute right-0 top-0 h-full w-px bg-border z-20" />
      {/* Área de mensajes con scroll interno */}
      <div className="flex-1 overflow-y-auto chat-scrollbar p-2 px-3 relative">
        <div className="space-y-2">
          {messages.map((msg, idx) => (
            <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} w-full ${idx === 0 ? 'mt-10' : ''}`}>
              <div className={
                `px-3 py-2 w-fit max-w-[90%] break-words shadow-sm border text-sm leading-relaxed rounded-2xl ` +
                (msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground ml-8'
                  : 'bg-muted text-foreground mr-8')
              }>
                {msg.text}
                {/* Mostrar los botones debajo del último mensaje de NNIA si hay lastGenerated */}
                {msg.sender === 'assistant' && lastGenerated && idx === messages.length - 1 && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <Button variant="default" size="sm" onClick={handleCreateDocument}>Crear nuevo documento</Button>
                    <Button variant="outline" size="sm" onClick={handleOpenAddToExisting}>Agregar a existente</Button>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start w-full">
              <div className="bg-muted text-foreground px-3 py-2 w-fit max-w-[90%] shadow-sm border opacity-70 text-sm rounded-2xl">
                NNIA está escribiendo...
              </div>
            </div>
          )}
          {analyzing && (
            <div className="text-center py-4 text-primary font-semibold text-sm">Analizando documento... Por favor espera.</div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
      {/* Área de input fija en la parte inferior */}
      <div className="flex-shrink-0 p-2 border-t border-border/50 bg-background/50 backdrop-blur-sm">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Escribe un mensaje..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="flex-1"
            autoComplete="off"
            disabled={analyzing || loading}
          />
          <Button
            type="button"
            size="icon"
            className={`h-10 w-10 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-zinc-100'} border border-border`}
            onClick={() => fileInputRef.current.click()}
            title="Adjuntar documento"
            disabled={analyzing || loading}
          >
            <Upload className="h-5 w-5" style={{ color: isDarkMode ? '#fff' : '#000' }} />
          </Button>
          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
            disabled={analyzing || loading}
          />
          <Button
            type="submit"
            size="icon"
            className={`h-10 w-10 ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-white hover:bg-zinc-100'} border border-border`}
            disabled={analyzing || loading || (!newMessage.trim() && !attachedFile)}
          >
            <Send className="h-5 w-5" style={{ color: isDarkMode ? '#ff9c9c' : '#ff9c9c' }} />
          </Button>
        </form>
        {attachedFile && (
          <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
            <span>Archivo adjunto: <b>{attachedFile.name}</b></span>
            <Button size="sm" variant="ghost" onClick={() => setAttachedFile(null)}>Quitar</Button>
          </div>
        )}
      </div>
      <Dialog open={showDocModal} onOpenChange={setShowDocModal}>
        <DialogContent>
          <DialogTitle>Agregar análisis a un documento existente</DialogTitle>
          <div className="space-y-2">
            <select
              className="w-full border border-border rounded p-2 bg-background text-foreground"
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
    </div>
  );
};

export default ChatAssistant; 