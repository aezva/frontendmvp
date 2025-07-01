import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Camera, Building, PartyPopper, Globe, Upload } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from "@/components/ui/use-toast";
import AppointmentPreferencesForm from './AppointmentPreferencesForm';
import imageCompression from 'browser-image-compression';

const steps = [
  { id: 1, name: 'Perfil de Usuario', fields: ['name', 'businessName'] },
  { id: 2, name: 'Datos del Negocio', fields: ['website', 'services', 'opening_hours'] },
  { id: 3, name: 'Preferencias de Citas' },
  { id: 4, name: 'Widget de Chat' },
  { id: 5, name: 'Finalizar' },
];

const Onboarding = () => {
  const { client, refreshClient } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    website: '',
    services: '',
    opening_hours: '',
  });
  const [availability, setAvailability] = useState({
    days: [],
    hours: '',
    types: ['phone', 'office', 'video'],
  });
  
  // Configuración del widget para el onboarding
  const [widgetConfig, setWidgetConfig] = useState({
    position: 'bottom-right',
    primaryColor: '#ffffff',
    backgroundColor: '#ffffff',
    textColor: '#000000',
    welcomeMessage: '¡Hola! Soy NNIA, tu asistente virtual. ¿En qué puedo ayudarte?',
    autoOpen: false,
    showTimestamp: true,
    maxMessages: 50,
    scheduleEnabled: false,
    timezone: 'America/Mexico_City',
    hours: {
      monday: { start: '09:00', end: '18:00', enabled: true },
      tuesday: { start: '09:00', end: '18:00', enabled: true },
      wednesday: { start: '09:00', end: '18:00', enabled: true },
      thursday: { start: '09:00', end: '18:00', enabled: true },
      friday: { start: '09:00', end: '18:00', enabled: true },
      saturday: { start: '10:00', end: '16:00', enabled: false },
      sunday: { start: '10:00', end: '16:00', enabled: false }
    },
    offlineMessage: 'Estamos fuera de horario. Te responderemos pronto.',
    widgetLogoUrl: null
  });
  
  const [embedCode, setEmbedCode] = useState('');
  const [uploadingWidgetLogo, setUploadingWidgetLogo] = useState(false);

  const next = () => {
    console.log('Next button clicked, current step:', currentStep, 'steps length:', steps.length);
    setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  };
  const prev = () => {
    console.log('Prev button clicked, current step:', currentStep);
    setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  // Función para subir logo del widget (reutilizada de WidgetSettings)
  const handleWidgetLogoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast({ title: 'Archivo inválido', description: 'Solo se permiten imágenes.' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ title: 'Archivo muy grande', description: 'El archivo debe pesar menos de 2MB.' });
      return;
    }
    setUploadingWidgetLogo(true);
    try {
      const options = { maxWidthOrHeight: 720, maxSizeMB: 0.5, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const filePath = `${client.id}/widget-logo.jpg`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, compressedFile, { upsert: true, contentType: compressedFile.type });
      if (uploadError) throw uploadError;
      const { data } = await supabase.storage.from('public-assets').createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (!data?.signedUrl) throw new Error('No se pudo obtener la URL del logo del widget.');
      setWidgetConfig(prev => ({ ...prev, widgetLogoUrl: data.signedUrl }));
      toast({ title: 'Logo del widget actualizado', description: 'La imagen del widget se actualizó correctamente.' });
      generateEmbedCode();
    } catch (err) {
      toast({ title: 'Error al subir imagen', description: err.message || 'Intenta con otra imagen.' });
    } finally {
      setUploadingWidgetLogo(false);
    }
  };

  // Generar código HTML del widget
  const generateEmbedCode = () => {
    if (!client) return;
    
    const code = `<!-- NNIA Widget -->\n<script src="https://widget.iamnnia.com/nnia-widget.umd.js"\n  data-business-id="${client.id}"\n  data-api-url="${import.meta.env.VITE_API_URL}"\n  data-position="${widgetConfig.position}"\n  data-primary-color="${widgetConfig.primaryColor}"\n  data-background-color="${widgetConfig.backgroundColor}"\n  data-text-color="${widgetConfig.textColor}"\n  data-welcome-message="${widgetConfig.welcomeMessage.replace(/"/g, '&quot;')}"\n  data-auto-open="${widgetConfig.autoOpen}"\n  data-show-timestamp="${widgetConfig.showTimestamp}"\n  data-max-messages="${widgetConfig.maxMessages}">\n</script>`;
    
    setEmbedCode(code);
  };

  // Copiar código al portapapeles
  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast({
      title: "Código copiado",
      description: "El código de integración se ha copiado al portapapeles.",
    });
  };

  // Generar código cuando se carga el paso del widget
  React.useEffect(() => {
    console.log('Step changed to:', currentStep);
    if (currentStep === 3 && client) {
      console.log('Generating embed code for step 3');
      generateEmbedCode();
    }
  }, [currentStep, client]);

  const handleComplete = async () => {
    try {
      // 1. Update client table
      const { error: clientError } = await supabase
        .from('clients')
        .update({
          name: formData.name,
          business_name: formData.businessName,
          onboarding_completed: true,
        })
        .eq('id', client.id);
      if (clientError) throw clientError;

      // 2. Create business_info record
      const { error: businessInfoError } = await supabase.from('business_info').insert({
        client_id: client.id,
        website: formData.website,
        services: formData.services,
        opening_hours: formData.opening_hours,
        appointment_days: availability.days.join(','),
        appointment_hours: availability.hours,
        appointment_types: availability.types.join(','),
      });
      if (businessInfoError) throw businessInfoError;

      // 3. Create default assistant_config
      const { error: assistantError } = await supabase
        .from('assistant_config')
        .insert({ client_id: client.id });
      if (assistantError) throw assistantError;
      
      // 4. Create default subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .insert({ client_id: client.id, plan: 'free', status: 'active' });
       if (subError) throw subError;

      // 5. Save widget configuration
      const { error: widgetError } = await supabase
        .from('widget_configs')
        .upsert({ 
          business_id: client.id, 
          config: widgetConfig 
        });
      if (widgetError) throw widgetError;
      
      toast({
        title: "🎉 ¡Bienvenido a Bordo!",
        description: "Tu configuración inicial ha sido guardada.",
      });

      await refreshClient();

    } catch (error) {
      toast({
        title: "Error en el Onboarding",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const renderStepContent = () => {
    console.log('Current step:', currentStep);
    switch (currentStep) {
      case 0:
        return <Step1 formData={formData} handleInputChange={handleInputChange} />;
      case 1:
        return <Step2 formData={formData} handleInputChange={handleInputChange} />;
      case 2:
        return <AppointmentPreferencesForm availability={availability} setAvailability={setAvailability} saving={false} />;
      case 3:
        console.log('Rendering Step4 (Widget)');
        return <Step4 
          widgetConfig={widgetConfig} 
          handleWidgetLogoChange={handleWidgetLogoChange}
          uploadingWidgetLogo={uploadingWidgetLogo}
          embedCode={embedCode}
          copyEmbedCode={copyEmbedCode}
        />;
      case 4:
        return <Step5 />;
      default:
        return null;
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      <Helmet>
        <title>Onboarding - Configura tu Asistente IA</title>
        <meta name="description" content="Completa los pasos para configurar tu asistente de IA personalizado." />
      </Helmet>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-full max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary">Configura tu Asistente IA</h1>
            <p className="text-muted-foreground mt-2">Sigue los pasos para personalizar tu experiencia.</p>
          </div>

          <div className="mb-8">
            <Progress value={progress} className="w-full" />
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{steps[currentStep].name}</span>
              <span>Paso {currentStep + 1} de {steps.length}</span>
            </div>
          </div>

          <Card className="bg-card border-border/40 shadow-lg">
            <CardContent className="p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-between p-8 pt-0">
              <Button variant="outline" onClick={prev} disabled={currentStep === 0}>
                Anterior
              </Button>
              {currentStep < steps.length - 1 ? (
                <Button onClick={next}>Siguiente</Button>
              ) : (
                <Button onClick={handleComplete}>Ir al Panel</Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </>
  );
};

const Step1 = ({ formData, handleInputChange }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center cursor-pointer hover:bg-muted/80 transition-colors">
        <Camera className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">Tu Perfil</h2>
        <p className="text-muted-foreground">Información básica sobre ti y tu negocio.</p>
      </div>
    </div>
    <div className="space-y-4">
      <div>
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" placeholder="Ej: Juan Pérez" value={formData.name} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="businessName">Nombre de tu negocio</Label>
        <Input id="businessName" placeholder="Ej: Tech Solutions S.A." value={formData.businessName} onChange={handleInputChange} />
      </div>
    </div>
  </div>
);

const Step2 = ({ formData, handleInputChange }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
        <Building className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">Tu Negocio</h2>
        <p className="text-muted-foreground">Cuéntanos sobre la empresa que representas.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-4">
      <div>
        <Label htmlFor="website">Sitio web</Label>
        <Input id="website" placeholder="https://www.techsolutions.com" value={formData.website} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="services">Servicios ofrecidos</Label>
        <Textarea id="services" placeholder="Describe brevemente los servicios que ofreces..." value={formData.services} onChange={handleInputChange} />
      </div>
      <div>
        <Label htmlFor="opening_hours">Horarios de atención</Label>
        <Input id="opening_hours" placeholder="Ej: Lunes a Viernes de 9:00 a 18:00" value={formData.opening_hours} onChange={handleInputChange} />
      </div>
    </div>
  </div>
);

const Step4 = ({ widgetConfig, handleWidgetLogoChange, uploadingWidgetLogo, embedCode, copyEmbedCode }) => (
  <div className="space-y-6">
    <div className="flex items-center space-x-4">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
        <Globe className="w-8 h-8 text-muted-foreground" />
      </div>
      <div>
        <h2 className="text-2xl font-semibold">Widget de Chat</h2>
        <p className="text-muted-foreground">Configura tu widget de chat para integrarlo en tu sitio web.</p>
      </div>
    </div>
    
    <div className="space-y-6">
      {/* Logo del Widget */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Logo del Widget</Label>
          <p className="text-sm text-muted-foreground">Sube una imagen para personalizar tu widget (opcional)</p>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="widget-logo-upload">
            <Button type="button" variant="outline" asChild disabled={uploadingWidgetLogo}>
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                {uploadingWidgetLogo ? 'Subiendo...' : 'Subir Imagen'}
              </span>
            </Button>
          </label>
          <input id="widget-logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWidgetLogoChange} />
          <span className="text-xs text-muted-foreground">Máx: 720x720px, 500KB</span>
          {widgetConfig.widgetLogoUrl && (
            <div className="mt-2">
              <img 
                src={widgetConfig.widgetLogoUrl} 
                alt="Logo del widget" 
                className="max-w-32 max-h-32 w-auto h-auto rounded-lg object-contain border border-gray-200" 
              />
            </div>
          )}
        </div>
      </div>

      {/* Vista previa del widget */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Vista Previa</Label>
          <p className="text-sm text-muted-foreground">Así se verá tu widget en tu sitio web</p>
        </div>
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
              {widgetConfig.widgetLogoUrl ? (
                <img src={widgetConfig.widgetLogoUrl} alt="Logo" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="text-sm font-semibold text-gray-600">NNIA</span>
              )}
            </div>
            <div>
              <div className="font-medium text-black">NNIA</div>
              <div className="text-xs text-gray-500">Asistente virtual</div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-gray-200">
            <p className="text-sm text-black">{widgetConfig.welcomeMessage}</p>
          </div>
          <div className="mt-3 flex justify-end">
            <div className="bg-pink-400 text-black px-3 py-1 rounded-full text-sm font-medium">
              Enviar
            </div>
          </div>
        </div>
      </div>

      {/* Código HTML */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Código de Integración</Label>
          <p className="text-sm text-muted-foreground">Copia este código y pégalo en tu sitio web</p>
        </div>
        <div className="relative">
          <textarea
            value={embedCode}
            readOnly
            className="w-full h-32 p-3 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono resize-none"
          />
          <Button 
            onClick={copyEmbedCode}
            className="absolute top-2 right-2"
            size="sm"
          >
            Copiar
          </Button>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">¿Cómo integrar el widget?</h4>
          <ol className="text-sm text-blue-800 space-y-1">
            <li>1. Copia el código HTML de arriba</li>
            <li>2. Pégalo en tu sitio web, justo antes del cierre de la etiqueta &lt;/body&gt;</li>
            <li>3. ¡Listo! El widget aparecerá en tu sitio web</li>
          </ol>
          <p className="text-sm text-blue-700 mt-3">
            <strong>Nota:</strong> Puedes personalizar los colores, posición y mensajes de tu widget en la sección "Configuración del Widget" del panel de cliente.
          </p>
        </div>
      </div>
    </div>
  </div>
);

const Step5 = () => (
  <div className="text-center py-8">
    <PartyPopper className="w-24 h-24 text-primary mx-auto mb-6 animate-bounce" />
    <h2 className="text-3xl font-bold">¡Todo listo!</h2>
    <p className="text-muted-foreground mt-2 max-w-md mx-auto">
      Has completado la configuración inicial. Tu asistente de IA está listo para empezar a trabajar.
    </p>
  </div>
);

export default Onboarding;