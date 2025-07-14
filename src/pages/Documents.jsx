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
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Documentos</h1>
      <div className="flex-1 min-h-0 h-full flex flex-col">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="default" className="flex items-center gap-2" onClick={() => setShowNewDoc(true)}>
            Nuevo Documento
          </Button>
        </div>
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col min-h-0 h-full">
          {/* Encabezados de tabla con estilo de pestañas */}
          <div className="relative">
            <div className="grid grid-cols-4 w-full h-12 min-h-[48px] items-center px-4">
              <span className="text-base font-light text-black">Nombre</span>
              <span className="text-base font-light text-black pl-1">Tipo</span>
              <span className="text-base font-light text-black pl-3">Fecha</span>
              <span className="text-base font-light text-black pl-6">Acciones</span>
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-px w-full bg-border" />
          </div>
          {/* Contenido de la tabla con scroll interno */}
          <div className="flex-1 min-h-0 h-full overflow-y-auto relative">
            {/* Líneas divisorias verticales */}
            <div className="absolute top-0 left-1/4 bottom-0 w-px z-20 bg-border" />
            <div className="absolute top-0 left-1/2 bottom-0 w-px z-20 bg-border" />
            <div className="absolute top-0 left-3/4 bottom-0 w-px z-20 bg-border" />
            <div className="p-4">
              {loading ? (
                <div className="text-center py-8">Cargando...</div>
              ) : documents.length === 0 ? (
                null
              ) : (
                <div className="space-y-3">
                  {documents.map(doc => (
                    <div key={doc.id} className="flex items-center bg-white rounded-lg border px-6 py-4 shadow-sm group">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-black truncate">{doc.name}</div>
                        <div className="text-sm text-gray-500">{doc.file_type || 'Texto'}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm text-gray-500">{new Date(doc.created_at).toLocaleString()}</div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button size="icon" variant="ghost" title="Ver" onClick={() => navigate(`/documents/${doc.id}`)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                          <Eye className="h-4 w-4 text-[#ff9c9c]" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Editar" onClick={() => navigate(`/documents/${doc.id}`)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                          <Edit className="h-4 w-4 text-[#ff9c9c]" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Descargar" onClick={() => window.open(doc.file_url, '_blank')} disabled={!doc.file_url} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                          <Download className="h-4 w-4 text-[#ff9c9c]" />
                        </Button>
                        <Button size="icon" variant="ghost" title="Eliminar" className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                          <Trash2 className="h-4 w-4 text-[#ff9c9c]" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
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