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
  const [attachedFile, setAttachedFile] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

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
        { id: Date.now(), sender: 'assistant', text: '✅ El contenido se guardó como documento y ya está disponible en la sección Documentos.' }
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
        { id: Date.now(), sender: 'assistant', text: '✅ El contenido se agregó al documento seleccionado.' }
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
        text: `¡Buenas tardes, ${userName}! 👋\n\nPregunta o encuentra lo que quieras desde tu espacio de trabajo...`,
      }]);
    }
  }, [client, userName]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4" style={{ height: '420px' }}>
      {/* Columna video vertical a la izquierda, fuera del Card */}
      <div className="flex items-center h-full">
        <div className="w-full h-[220px] max-w-[260px] bg-black/10 rounded-lg flex items-center justify-center overflow-hidden border border-border shadow-sm">
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
      {/* Columna chat a la derecha, ocupa 2/3 y está dentro de su Card */}
      <div className="col-span-2 h-full">
        <Card className="bg-card/50 backdrop-blur-sm h-full flex flex-col">
          <CardContent className="flex-1 flex flex-col justify-between p-4">
            <div className="flex-1 overflow-y-auto space-y-4 pt-2 pr-1" style={{ maxHeight: '320px' }}>
              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={
                    `rounded-2xl px-5 py-3 max-w-[80%] md:max-w-[65%] break-words shadow-sm ` +
                    (msg.sender === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md')
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
                disabled={analyzing || loading}
              />
              <Button type="button" size="icon" className="h-10 w-10" onClick={() => fileInputRef.current.click()} title="Adjuntar documento" disabled={analyzing || loading}>
                <Upload className="h-5 w-5" />
              </Button>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.txt,.xlsx,.xls"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileChange}
                disabled={analyzing || loading}
              />
              <Button type="submit" size="icon" className="h-10 w-10" disabled={analyzing || loading || (!newMessage.trim() && !attachedFile)}>
                <Send className="h-5 w-5" />
              </Button>
            </form>
            {attachedFile && (
              <div className="mt-2 text-xs text-muted-foreground flex items-center gap-2">
                <span>Archivo adjunto: <b>{attachedFile.name}</b></span>
                <Button size="sm" variant="ghost" onClick={() => setAttachedFile(null)}>Quitar</Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
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
    </div>
  );
};

export default ChatAssistant; 