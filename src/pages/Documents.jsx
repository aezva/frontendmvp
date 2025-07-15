import React, { useEffect, useState } from 'react';
import { FileText, Plus, Download, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import DocumentsTable from '../components/DocumentsTable';

const Documents = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!client) return;
    fetch(`${import.meta.env.VITE_API_URL}/nnia/documents?clientId=${client.id}`)
      .then(res => res.json())
      .then(data => {
        setDocuments(data);
        setLoading(false);
      })
      .catch(() => {
        toast({ title: 'Error', description: 'No se pudieron cargar los documentos.' });
        setLoading(false);
      });
  }, [client]);

  const handleCreateNewDoc = async () => {
    if (!client || !newDocName.trim() || !newDocContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/nnia/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, name: newDocName, content: newDocContent })
      });
      if (!res.ok) throw new Error('Error al crear documento');
      setShowNewDoc(false);
      setNewDocName('');
      setNewDocContent('');
      // Refrescar lista
      fetch(`${import.meta.env.VITE_API_URL}/nnia/documents?clientId=${client.id}`)
        .then(res => res.json())
        .then(data => setDocuments(data));
      toast({ title: 'Documento creado', description: 'El documento se creó correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear el documento.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Documentos</h1>
      <div className="flex-1 min-h-0 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="default" className="flex items-center gap-2" onClick={() => setShowNewDoc(true)}>
            Nuevo Documento
          </Button>
        </div>
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col min-h-0 h-full">
          {/* Encabezados y contenido de la tabla ahora en DocumentsTable */}
          <DocumentsTable 
            documents={documents} 
            loading={loading} 
            onView={id => navigate(`/documents/${id}`)}
            onEdit={id => navigate(`/documents/${id}`)}
            onDownload={url => window.open(url, '_blank')}
            // onDelete pendiente de implementar
          />
        </Card>
      </div>
      <Dialog open={showNewDoc} onOpenChange={setShowNewDoc}>
        <DialogContent>
          <DialogTitle>Nuevo Documento</DialogTitle>
          <div className="space-y-2">
            <Input
              placeholder="Nombre del documento"
              value={newDocName}
              onChange={e => setNewDocName(e.target.value)}
              disabled={saving}
            />
            <textarea
              className="w-full border rounded p-2 min-h-[120px] text-sm focus:outline-none focus:ring-0 focus:border-border"
              placeholder="Contenido..."
              value={newDocContent}
              onChange={e => setNewDocContent(e.target.value)}
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button 
              variant="default" 
              onClick={handleCreateNewDoc} 
              disabled={saving || !newDocName.trim() || !newDocContent.trim()}
              className="hover:bg-primary hover:text-primary-foreground"
            >
              Crear
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowNewDoc(false)} 
              disabled={saving}
              className="hover:bg-transparent hover:text-[#ff9c9c]"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents; 