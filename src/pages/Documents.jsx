import React, { useEffect, useState } from 'react';
import { FileText, Plus, Download, Edit, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

const Documents = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!client) return;
    fetch(`/nnia/documents?clientId=${client.id}`)
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

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" /> Documentos
        </h1>
        <Button variant="default" className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Nuevo Documento
        </Button>
      </div>
      <Card>
        <CardContent className="p-0">
          <table className="min-w-full divide-y divide-border">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Nombre</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {loading ? (
                <tr><td colSpan={4} className="text-center py-8">Cargando...</td></tr>
              ) : documents.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8">No hay documentos aún.</td></tr>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default Documents; 