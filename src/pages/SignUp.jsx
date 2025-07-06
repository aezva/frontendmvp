import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Bot } from 'lucide-react';
import { Helmet } from 'react-helmet';
import logoAssistant from '/public/logo-assistant.png';

const SignUp = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) throw error;
      toast({
        title: '¡Cuenta creada! Confirma tu email para continuar',
        description: 'Te hemos enviado un correo de verificación. Por favor, revisa tu bandeja de entrada (y la carpeta de spam) y haz clic en el enlace para activar tu cuenta. No podrás acceder al panel hasta que confirmes tu email.',
      });
      navigate('/onboarding');
    } catch (error) {
      toast({
        title: 'Error en el registro',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Registro - Asistente IA</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background p-0 md:p-4">
        <div className="w-full max-w-4xl bg-card rounded-lg shadow-lg flex flex-col md:flex-row overflow-hidden animate-fade-in">
          {/* Columna izquierda: formulario */}
          <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-10">
            <Card className="w-full max-w-md mx-auto shadow-none border-none">
              <CardHeader className="text-center">
                <Bot className="mx-auto h-12 w-12 text-primary" />
                <CardTitle className="mt-4">Crea tu Cuenta</CardTitle>
                <CardDescription>Empieza a automatizar tus ventas en minutos.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nombre</Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Tu nombre completo"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="tu@email.com"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Contraseña</Label>
                    <Input
                      id="password"
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">La contraseña debe tener al menos 6 caracteres.</p>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear Cuenta'}
                  </Button>
                </form>
                <div className="mt-4 text-center text-sm">
                  ¿Ya tienes una cuenta?{' '}
                  <Link to="/login" className="underline text-primary">
                    Inicia Sesión
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          {/* Columna derecha: imagen */}
          <div className="hidden md:flex w-1/2 bg-muted items-center justify-center p-6 md:p-10">
            <img src="https://cafolvqmbzzqwtmuyvnj.supabase.co/storage/v1/object/public/app-assets//nnialogin.jpg" alt="Imagen Registro NNIA" className="max-w-xs w-full h-auto object-contain rounded-lg shadow" />
          </div>
        </div>
      </div>
    </>
  );
};

export default SignUp;