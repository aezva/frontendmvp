import React, { useEffect, useState } from 'react';
import { FileText, Plus, Download, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';

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
    <div className="flex flex-col flex-1 min-h-0 h-full w-full max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold tracking-tight mb-6 flex items-center gap-2">
        <FileText className="h-6 w-6 text-primary" /> Documentos
      </h1>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="default" className="flex items-center gap-2" onClick={() => setShowNewDoc(true)}>
          <Plus className="h-4 w-4" /> Nuevo Documento
        </Button>
      </div>
      <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col min-h-0 h-full">
        <CardHeader className="pb-0">
          <CardTitle className="text-base font-light text-black">Lista de documentos</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-sm">
              <thead>
                <tr className="bg-muted text-muted-foreground">
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Nombre</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Tipo</th>
                  <th className="px-6 py-3 text-left font-medium uppercase tracking-wider">Fecha</th>
                  <th className="px-6 py-3 text-right font-medium uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr>
                ) : documents.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-[#ff9c9c]">No hay documentos aún.</td></tr>
                ) : (
                  documents.map(doc => (
                    <tr key={doc.id}>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">{doc.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{doc.file_type || 'Texto'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(doc.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-right flex gap-2 justify-end">
                        <Button size="icon" variant="ghost" title="Ver" onClick={() => navigate(`/documents/${doc.id}`)}><Eye className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => navigate(`/documents/${doc.id}`)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Descargar" onClick={() => window.open(doc.file_url, '_blank')} disabled={!doc.file_url}><Download className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" title="Eliminar"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
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
              className="w-full border rounded p-2 min-h-[120px] text-sm"
              placeholder="Contenido..."
              value={newDocContent}
              onChange={e => setNewDocContent(e.target.value)}
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button variant="default" onClick={handleCreateNewDoc} disabled={saving || !newDocName.trim() || !newDocContent.trim()}>Crear</Button>
            <Button variant="outline" onClick={() => setShowNewDoc(false)} disabled={saving}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents; 