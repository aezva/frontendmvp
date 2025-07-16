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
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        <h1 className="text-xl font-semibold tracking-tight mb-1">Ajustes de Usuario</h1>
        <p className="text-muted-foreground mb-6">Gestiona tu perfil y la seguridad de tu cuenta.</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          <div className="bg-white/80 border rounded-xl p-6 w-full">
            <h2 className="text-base font-medium text-black mb-4 flex items-center"><User className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Perfil de Usuario</h2>
            {/* Se elimina la sección de foto de perfil y botón de cambiar foto */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="name" className="text-black text-sm font-normal">Nombre</Label>
              <Input id="name" defaultValue={client?.name || ''} className="text-sm font-normal text-gray-500 placeholder-gray-500" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-black text-sm font-normal">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} disabled className="text-sm font-normal text-gray-500 placeholder-gray-500" />
            </div>
          </div>

          <div className="bg-white/80 border rounded-xl p-6 w-full">
            <h2 className="text-base font-medium text-black mb-4 flex items-center"><Lock className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Seguridad</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword" className="text-black text-sm font-normal">Contraseña Actual</Label>
                <Input id="currentPassword" type="password" className="text-sm font-normal text-gray-500 placeholder-gray-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword" className="text-black text-sm font-normal">Nueva Contraseña</Label>
                <Input id="newPassword" type="password" className="text-sm font-normal text-gray-500 placeholder-gray-500" />
              </div>
            </div>
          </div>

          <div className="flex justify-end w-full gap-4">
            <Button type="submit" className="bg-white text-black transition-colors hover:bg-[#ff9c9c] hover:text-black">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Settings;