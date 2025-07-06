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
      <div className="min-h-screen flex flex-col justify-center items-center" style={{ background: '#F4F4F5' }}>
        {/* Logo NNIA */}
        <div className="w-full flex justify-center md:justify-start items-center absolute top-0 left-0 p-4 z-10">
          <span className="font-alata text-2xl tracking-[0.19em] text-black select-none mx-auto md:mx-0">NNIA</span>
        </div>
        <div className="flex-1 w-full flex flex-col items-center justify-center p-5 md:p-4">
          {/* Logo NNIA fuera de la columna */}
          <div className="w-full flex justify-center mb-6 md:hidden">
            <span className="font-alata text-2xl tracking-[0.19em] text-black select-none">NNIA</span>
          </div>
          <div className="w-full max-w-4xl bg-card rounded-lg shadow-lg flex flex-col md:flex-row overflow-hidden animate-fade-in">
            {/* Columna izquierda: formulario */}
            <div className="w-full md:w-1/2 flex items-center justify-center py-6 md:py-0 px-6 md:px-10 border-b-0 md:border-r md:border-input">
              <Card className="w-full max-w-md mx-auto shadow-none border-none">
                <CardHeader className="text-center px-6 md:px-10 py-0 mb-6">
                  <Bot className="mx-auto h-12 w-12 text-primary" />
                  <CardTitle className="mt-4 text-xl font-inter font-semibold">Crea tu Cuenta</CardTitle>
                  <CardDescription className="font-inter">Comienza a impulsar tu negocio con NNIA.</CardDescription>
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
                        className="placeholder-[#ff9c9c]"
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
                      <p className="text-xs text-muted-foreground text-center">Mínimo 8 caracteres, con número, mayúscula y minúscula.</p>
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Crear Cuenta'}
                    </Button>
                  </form>
                  {/* Nuevo botón de login bien hecho */}
                  <div className="w-full flex justify-center mt-2 pt-[15px]">
                    <Link to="/login" className="text-sm font-normal transition-colors" style={{ color: '#ff9c9c', textDecoration: 'none', padding: 0, background: 'none', border: 'none', boxShadow: 'none' }}>
                      ¿Ya tienes una cuenta? Inicia sesión.
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Columna derecha: imagen */}
            <div className="flex w-full md:w-1/2 bg-muted items-start justify-center p-0 h-[25vh] md:h-full">
              <img src="https://cafolvqmbzzqwtmuyvnj.supabase.co/storage/v1/object/public/app-assets//nnialogin.jpg" alt="Imagen Registro NNIA" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        {/* Aviso legal */}
        <div className="w-full flex justify-center mt-6 mb-4">
          <p className="text-xs text-muted-foreground text-center w-[95%] max-w-2xl md:w-[70%] md:max-w-3xl">
            Al hacer clic en <span className="font-semibold">Crear Cuenta</span>, aceptas nuestros{' '}
            <span className="font-medium" style={{ color: '#ff9c9c' }}>Términos de Servicio</span> y{' '}
            <span className="font-medium" style={{ color: '#ff9c9c' }}>Política de Privacidad</span>.
          </p>
        </div>
      </div>
    </>
  );
};

export default SignUp;