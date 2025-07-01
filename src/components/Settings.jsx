import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, LogOut, User, Lock, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Helmet } from 'react-helmet';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import imageCompression from 'browser-image-compression';
import { supabase } from '@/lib/supabaseClient';

const Settings = () => {
  const { user, client, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    toast({
      title: "🚧 ¡Función en construcción!",
      description: "La actualización de perfil estará disponible pronto.",
    });
  };

  const handleLogout = async () => {
    setLoading(true);
    const { error } = await signOut();
    if (error) {
      toast({ title: 'Error al cerrar sesión', description: error.message, variant: 'destructive' });
      setLoading(false);
    } else {
      navigate('/login');
      toast({ title: 'Has cerrado sesión exitosamente.' });
    }
  };
  
  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Validar tipo
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Archivo inválido', description: 'Solo se permiten imágenes.' });
      return;
    }
    // Validar tamaño (máx 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'El archivo debe pesar menos de 2MB.' });
      return;
    }
    setUploading(true);
    try {
      // Redimensionar a 720x720 px máx
      const options = { maxWidthOrHeight: 720, maxSizeMB: 0.5, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      // Subir a Supabase Storage
      const filePath = `${client.id}/profile.jpg`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, compressedFile, { upsert: true, contentType: compressedFile.type });
      if (uploadError) throw uploadError;
      // Obtener URL firmada (válida por 1 año)
      const { data } = await supabase.storage.from('public-assets').createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (!data?.signedUrl) throw new Error('No se pudo obtener la URL de la imagen.');
      // Actualizar perfil
      const { error: updateError } = await supabase.from('clients').update({ profile_image_url: data.signedUrl }).eq('id', client.id);
      if (updateError) throw updateError;
      toast({ title: 'Imagen actualizada', description: 'Tu foto de perfil se actualizó correctamente.' });
      window.location.reload();
    } catch (err) {
      toast({ title: 'Error al subir imagen', description: err.message || 'Intenta con otra imagen.' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Ajustes - Asistente IA</title>
      </Helmet>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ajustes de Usuario</h1>
          <p className="text-muted-foreground">Gestiona tu perfil y la seguridad de tu cuenta.</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center"><User className="mr-3 h-6 w-6 text-primary" />Perfil de Usuario</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={client?.profile_image_url} />
                  <AvatarFallback>{getInitials(client?.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-2">
                  <label htmlFor="profile-image-upload">
                    <Button type="button" variant="outline" asChild disabled={uploading}>
                      <span>{uploading ? 'Subiendo...' : 'Cambiar Foto'}</span>
                    </Button>
                  </label>
                  <input id="profile-image-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                  <span className="text-xs text-muted-foreground">Máx: 720x720px, 500KB</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Nombre</Label>
                <Input id="name" defaultValue={client?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-8 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center"><Lock className="mr-3 h-6 w-6 text-primary" />Seguridad</CardTitle>
              <CardDescription>Cambia tu contraseña.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña Actual</Label>
                <Input id="currentPassword" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva Contraseña</Label>
                <Input id="newPassword" type="password" />
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 flex justify-between items-center">
            <Button type="button" variant="destructive" onClick={handleLogout} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <LogOut className="mr-2 h-4 w-4" />}
              Cerrar Sesión
            </Button>
            <Button type="submit">
              <Save className="mr-2 h-4 w-4" />
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Settings;