import React, { useEffect, useState } from 'react';
import { Plus, Folder, FileText, ArrowLeft, Edit, Trash2, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const Documents = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const [folders, setFolders] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewDoc, setShowNewDoc] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocContent, setNewDocContent] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [saving, setSaving] = useState(false);
  const [currentFolder, setCurrentFolder] = useState(null); // null = raíz
  const [editingDoc, setEditingDoc] = useState(null); // doc a editar
  const [editDocName, setEditDocName] = useState('');
  const [editDocContent, setEditDocContent] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [draggedDoc, setDraggedDoc] = useState(null);

  // Cargar carpetas y documentos
  const fetchAll = () => {
    if (!client) return;
    setLoading(true);
    fetch(`/nnia/folders?clientId=${client.id}`)
      .then(res => res.json())
      .then(folders => setFolders(folders))
      .catch(() => setFolders([]));
    fetch(`/nnia/documents?clientId=${client.id}${currentFolder ? `&folderId=${currentFolder}` : ''}`)
      .then(res => res.json())
      .then(docs => setDocuments(docs))
      .catch(() => setDocuments([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [client, currentFolder]);

  // Crear carpeta
  const handleCreateFolder = async () => {
    if (!client || !newFolderName.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/nnia/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, name: newFolderName })
      });
      if (!res.ok) throw new Error('Error al crear carpeta');
      setShowNewFolder(false);
      setNewFolderName('');
      fetchAll();
      toast({ title: 'Carpeta creada', description: 'La carpeta se creó correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear la carpeta.' });
    } finally {
      setSaving(false);
    }
  };

  // Crear documento
  const handleCreateNewDoc = async () => {
    if (!client || !newDocName.trim() || !newDocContent.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/nnia/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, name: newDocName, content: newDocContent, folder_id: currentFolder })
      });
      if (!res.ok) throw new Error('Error al crear documento');
      setShowNewDoc(false);
      setNewDocName('');
      setNewDocContent('');
      fetchAll();
      toast({ title: 'Documento creado', description: 'El documento se creó correctamente.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo crear el documento.' });
    } finally {
      setSaving(false);
    }
  };

  // Drag & drop para mover documento a carpeta
  const handleDropOnFolder = async (folderId) => {
    if (!draggedDoc) return;
    try {
      await fetch(`/nnia/documents/${draggedDoc}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, folderId })
      });
      fetchAll();
      toast({ title: 'Documento movido', description: 'El documento fue movido a la carpeta.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo mover el documento.' });
    }
    setDraggedDoc(null);
  };

  // Drag & drop para mover documento a raíz
  const handleDropOnRoot = async () => {
    if (!draggedDoc) return;
    try {
      await fetch(`/nnia/documents/${draggedDoc}/move`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, folderId: null })
      });
      fetchAll();
      toast({ title: 'Documento movido', description: 'El documento fue movido a la raíz.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo mover el documento.' });
    }
    setDraggedDoc(null);
  };

  // Abrir editor de documento
  const openEditDoc = (doc) => {
    setEditingDoc(doc);
    setEditDocName(doc.name);
    setEditDocContent(doc.content);
  };

  // Guardar edición de documento
  const handleSaveEditDoc = async () => {
    if (!editingDoc || !editDocName.trim() || !editDocContent.trim()) return;
    setEditSaving(true);
    try {
      await fetch(`/nnia/documents/${editingDoc.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id, name: editDocName, content: editDocContent })
      });
      setEditingDoc(null);
      fetchAll();
      toast({ title: 'Documento actualizado', description: 'Los cambios se guardaron.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo guardar.' });
    } finally {
      setEditSaving(false);
    }
  };

  // Eliminar documento
  const handleDeleteDoc = async (docId) => {
    if (!window.confirm('¿Seguro que quieres eliminar este documento?')) return;
    try {
      await fetch(`/nnia/documents/${docId}?clientId=${client.id}`, { method: 'DELETE' });
      fetchAll();
      toast({ title: 'Eliminado', description: 'Documento eliminado.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar.' });
    }
  };

  // Eliminar carpeta
  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm('¿Seguro que quieres eliminar esta carpeta? Los documentos no se eliminarán.')) return;
    try {
      await fetch(`/nnia/folders/${folderId}?clientId=${client.id}`, { method: 'DELETE' });
      if (currentFolder === folderId) setCurrentFolder(null);
      fetchAll();
      toast({ title: 'Carpeta eliminada', description: 'La carpeta fue eliminada.' });
    } catch {
      toast({ title: 'Error', description: 'No se pudo eliminar la carpeta.' });
    }
  };

  // UI principal
  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Documentos</h1>
      {/* Sección de carpetas */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-medium text-black mb-4 flex items-center">
            <Users className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Carpetas
          </h2>
          <Button onClick={() => setShowNewFolder(true)} variant="default" className="gap-2 bg-white text-black transition-colors hover:bg-[#ff9c9c] hover:text-black"><Plus className="w-4 h-4" /> Nueva carpeta</Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folders.length === 0 && <div className="text-gray-400 col-span-full">No hay carpetas.</div>}
          {folders.map(folder => (
            <Card
              key={folder.id}
              className={`flex flex-col gap-2 p-4 cursor-pointer group border-2 border-transparent hover:border-[#ff9c9c] transition-all relative`}
              onClick={() => setCurrentFolder(folder.id)}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); handleDropOnFolder(folder.id); }}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#ff9c9c]" />
                <span className="font-medium text-base truncate flex-1">{folder.name}</span>
                <Button size="icon" variant="ghost" onClick={e => { e.stopPropagation(); handleDeleteFolder(folder.id); }}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
              <div className="text-xs text-gray-400">{new Date(folder.created_at).toLocaleDateString()}</div>
            </Card>
          ))}
        </div>
      </div>
      {/* Sección de documentos */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {currentFolder && (
              <Button size="icon" variant="ghost" onClick={() => setCurrentFolder(null)}><ArrowLeft className="w-5 h-5" /></Button>
            )}
            <h2 className="text-base font-medium text-black mb-4 flex items-center">
              <Users className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />{currentFolder ? 'Documentos en carpeta' : 'Documentos recientes'}
            </h2>
          </div>
          <Button onClick={() => setShowNewDoc(true)} variant="default" className="gap-2 bg-white text-black transition-colors hover:bg-[#ff9c9c] hover:text-black"><Plus className="w-4 h-4" /> Nuevo documento</Button>
        </div>
        <div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          onDragOver={e => e.preventDefault()}
          onDrop={e => { e.preventDefault(); handleDropOnRoot(); }}
        >
          {loading ? <div className="text-gray-400 col-span-full">Cargando...</div> : null}
          {!loading && documents.length === 0 && <div className="text-gray-400 col-span-full">No hay documentos.</div>}
          {documents.map(doc => (
            <Card
              key={doc.id}
              className="flex flex-col gap-2 p-4 group border-2 border-transparent hover:border-[#ff9c9c] transition-all relative"
              draggable
              onDragStart={() => setDraggedDoc(doc.id)}
              onDragEnd={() => setDraggedDoc(null)}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#ff9c9c]" />
                <span className="font-medium text-base truncate flex-1">{doc.name}</span>
                <Button size="icon" variant="ghost" onClick={() => openEditDoc(doc)}><Edit className="w-4 h-4 text-[#ff9c9c]" /></Button>
                <Button size="icon" variant="ghost" onClick={() => handleDeleteDoc(doc.id)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
              </div>
              <div className="text-xs text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</div>
              <div className="text-xs text-gray-500">{doc.file_type || 'Texto'}</div>
            </Card>
          ))}
        </div>
      </div>
      {/* Modal crear carpeta */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent>
          <DialogTitle>Nueva carpeta</DialogTitle>
          <div className="space-y-2">
            <Input
              placeholder="Nombre de la carpeta"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              disabled={saving}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleCreateFolder} disabled={saving || !newFolderName.trim()} className="bg-white text-black transition-colors hover:bg-[#ff9c9c] hover:text-black">Crear</Button>
            <Button variant="outline" onClick={() => setShowNewFolder(false)} disabled={saving}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal crear documento */}
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
            <Button onClick={handleCreateNewDoc} disabled={saving || !newDocName.trim() || !newDocContent.trim()} className="bg-white text-black transition-colors hover:bg-[#ff9c9c] hover:text-black">Crear</Button>
            <Button variant="outline" onClick={() => setShowNewDoc(false)} disabled={saving}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal editar documento */}
      <Dialog open={!!editingDoc} onOpenChange={v => { if (!v) setEditingDoc(null); }}>
        <DialogContent style={{ width: '80vw', maxWidth: 900 }}>
          <DialogTitle>Editar Documento</DialogTitle>
          <div className="space-y-2">
            <Input
              placeholder="Nombre del documento"
              value={editDocName}
              onChange={e => setEditDocName(e.target.value)}
              disabled={editSaving}
            />
            <textarea
              className="w-full border rounded p-2 min-h-[200px] text-sm focus:outline-none focus:ring-0 focus:border-border"
              placeholder="Contenido..."
              value={editDocContent}
              onChange={e => setEditDocContent(e.target.value)}
              disabled={editSaving}
            />
          </div>
          <DialogFooter>
            <Button onClick={handleSaveEditDoc} disabled={editSaving || !editDocName.trim() || !editDocContent.trim()} className="bg-[#ff9c9c] text-black">Guardar</Button>
            <Button variant="outline" onClick={() => setEditingDoc(null)} disabled={editSaving}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Documents; 