import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FileText, ArrowLeft, Download, Save, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const DocumentView = () => {
  const { id } = useParams();
  const { client } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [content, setContent] = useState('');
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!client || !id) return;
    fetch(`/nnia/documents/${id}?clientId=${client.id}`)
      .then(res => res.json())
      .then(data => {
        setDoc(data);
        setName(data.name);
        setContent(data.content);
        setLoading(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: 'No se pudo cargar el documento.' });
        setLoading(false);
      });
  }, [client, id]);

  const handleSave = () => {
    setSaving(true);
    fetch(`/nnia/documents/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: client.id, name, content })
    })
      .then(res => res.json())
      .then(data => {
        setDoc(data);
        toast({ title: 'Guardado', description: 'Documento actualizado.' });
        setSaving(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: 'No se pudo guardar.' });
        setSaving(false);
      });
  };

  const handleDelete = () => {
    if (!window.confirm('¿Seguro que quieres eliminar este documento?')) return;
    fetch(`/nnia/documents/${id}?clientId=${client.id}`, { method: 'DELETE' })
      .then(res => res.json())
      .then(() => {
        toast({ title: 'Eliminado', description: 'Documento eliminado.' });
        navigate('/documents');
      })
      .catch(() => {
        toast({ title: 'Error', description: 'No se pudo eliminar.' });
      });
  };

  if (loading) return <div className="w-full max-w-3xl mx-auto py-12 text-center">Cargando...</div>;
  if (!doc) return <div className="w-full max-w-3xl mx-auto py-12 text-center">Documento no encontrado.</div>;

  return (
    <div className="flex flex-col w-full max-w-3xl mx-auto py-8 px-4 gap-6">
      <div className="flex items-center gap-2 mb-2">
        <Button variant="ghost" size="icon" onClick={() => navigate('/documents')}><ArrowLeft className="h-5 w-5" /></Button>
        <FileText className="h-6 w-6 text-primary" />
        <input
          className="text-xl font-bold bg-transparent border-none outline-none flex-1"
          value={name}
          onChange={e => setName(e.target.value)}
        />
      </div>
      <div className="text-sm text-muted-foreground mb-2">{new Date(doc.created_at).toLocaleString()}</div>
      <textarea
        className="w-full min-h-[300px] rounded-lg border border-border p-4 text-base bg-card focus:outline-primary resize-vertical"
        value={content}
        onChange={e => setContent(e.target.value)}
      />
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={() => window.open(doc.file_url, '_blank')} disabled={!doc.file_url}><Download className="h-4 w-4 mr-2" /> Descargar</Button>
        <Button variant="destructive" onClick={handleDelete}><Trash2 className="h-4 w-4 mr-2" /> Eliminar</Button>
        <Button variant="default" onClick={handleSave} disabled={saving}><Save className="h-4 w-4 mr-2" /> Guardar</Button>
      </div>
    </div>
  );
};

export default DocumentView; 