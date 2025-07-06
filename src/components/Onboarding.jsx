import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { User, Building2, Calendar, MessageCircle, CheckCircle } from 'lucide-react';
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
  { id: 3, name: 'Gestión de Servicios' },
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
  const [serviceType, setServiceType] = useState(''); // 'appointments' o 'reservations'
  const [appointmentsConfig, setAppointmentsConfig] = useState({
    days: [],
    hours: '',
    types: [],
  });
  const [reservationsConfig, setReservationsConfig] = useState({
    days: [],
    hours: '',
    types: [],
    advance_booking_days: 30,
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

  const next = () => setCurrentStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
  const prev = () => setCurrentStep((prev) => (prev > 0 ? prev - 1 : prev));

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
    const businessId = client?.id || 'temp-id';
    
    const code = `<!-- NNIA Widget -->\n<script src="https://widget.iamnnia.com/nnia-widget.umd.js"\n  data-business-id="${businessId}"\n  data-api-url="${import.meta.env.VITE_API_URL}"\n  data-position="${widgetConfig.position}"\n  data-primary-color="${widgetConfig.primaryColor}"\n  data-background-color="${widgetConfig.backgroundColor}"\n  data-text-color="${widgetConfig.textColor}"\n  data-welcome-message="${widgetConfig.welcomeMessage.replace(/"/g, '&quot;')}"\n  data-auto-open="${widgetConfig.autoOpen}"\n  data-show-timestamp="${widgetConfig.showTimestamp}"\n  data-max-messages="${widgetConfig.maxMessages}">\n</script>`;
    
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
    if (currentStep === 3) {
      generateEmbedCode();
    }
  }, [currentStep]);

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

      // 6. Save appointments configuration to business_info
      if (appointmentsConfig.days.length > 0 || appointmentsConfig.hours || appointmentsConfig.types.length > 0) {
        const { error: appointmentsError } = await supabase
          .from('business_info')
          .update({
            appointment_days: appointmentsConfig.days.join(','),
            appointment_hours: appointmentsConfig.hours,
            appointment_types: appointmentsConfig.types.join(',')
          })
          .eq('client_id', client.id);
        if (appointmentsError) throw appointmentsError;
      }

      // 7. Save reservations configuration to reservation_availability
      if (reservationsConfig.days.length > 0 || reservationsConfig.hours || reservationsConfig.types.length > 0) {
        const { error: reservationsError } = await supabase
          .from('reservation_availability')
          .upsert({
            client_id: client.id,
            days: reservationsConfig.days.join(','),
            hours: reservationsConfig.hours,
            advance_booking_days: reservationsConfig.advance_booking_days
          });
        if (reservationsError) throw reservationsError;
      }

      // 8. Save reservation types to reservation_types
      if (reservationsConfig.types.length > 0) {
        const reservationTypesToSave = reservationsConfig.types.map(type => ({
          client_id: client.id,
          name: type,
          is_active: true
        }));
        
        const { error: reservationTypesError } = await supabase
          .from('reservation_types')
          .upsert(reservationTypesToSave);
        if (reservationTypesError) throw reservationTypesError;
      }
      
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
    switch (currentStep) {
      case 0:
        return <Step1 formData={formData} handleInputChange={handleInputChange} />;
      case 1:
        return <Step2 formData={formData} handleInputChange={handleInputChange} />;
      case 2:
        return (
          <div className="flex-1 flex flex-col justify-center space-y-12">
            <div className="flex items-center space-x-6">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Calendar className="w-5 h-5" style={{ color: '#ff9c9c' }} />
              </div>
              <div>
                <h2 className="text-xl font-inter font-semibold text-black">Gestión de Servicios</h2>
                <p className="text-muted-foreground">Configura qué tipo de servicios gestionas y tu disponibilidad.</p>
              </div>
            </div>
            <div>
              <ServiceManagementForm 
                serviceType={serviceType}
                setServiceType={setServiceType}
                appointmentsConfig={appointmentsConfig}
                setAppointmentsConfig={setAppointmentsConfig}
                reservationsConfig={reservationsConfig}
                setReservationsConfig={setReservationsConfig}
              />
            </div>
          </div>
        );
      case 3:
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
      <div className="min-h-screen flex flex-col items-center justify-center p-4 font-sans" style={{ background: '#F4F4F5' }}>
        {/* Logo NNIA */}
        <div className="w-full flex justify-center md:justify-start items-center absolute top-0 left-0 p-4 z-10">
          <span className="font-alata text-2xl tracking-[0.19em] text-black select-none mx-auto md:mx-0">NNIA</span>
        </div>
        <div className="w-full max-w-4xl mx-auto h-[700px] flex flex-col">
          <div className="mb-8 text-center">
            <h1 className="text-xl font-inter font-semibold text-black">Entrena a NNIA</h1>
            <p className="text-muted-foreground mt-2 font-inter">Llena todos los datos para obtener mejores resultados.</p>
          </div>

          <div className="mb-8">
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white">
              <div 
                className="h-full bg-pink-400 transition-all duration-300 ease-out"
                style={{ 
                  width: `${progress}%`,
                  backgroundColor: '#ff9c9c'
                }}
              />
            </div>
            <div className="flex justify-between mt-2 text-sm text-muted-foreground">
              <span>{steps[currentStep].name}</span>
              <span>Paso {currentStep + 1} de {steps.length}</span>
            </div>
          </div>

          <Card className="bg-card border-border/40 shadow-lg flex-1 flex flex-col">
            <CardContent className="p-10 flex-1 flex flex-col">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ duration: 0.3 }}
                  className="flex-1 flex flex-col"
                >
                  {renderStepContent()}
                </motion.div>
              </AnimatePresence>
            </CardContent>
            <CardFooter className="flex justify-between p-10 pt-0">
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
  <div className="flex-1 flex flex-col justify-center space-y-12">
    <div className="flex items-center space-x-6">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <User className="w-5 h-5" style={{ color: '#ff9c9c' }} />
      </div>
      <div>
        <h2 className="text-xl font-inter font-semibold text-black">Tu Perfil</h2>
        <p className="text-muted-foreground">Información básica sobre ti y tu negocio.</p>
      </div>
    </div>
    <div className="space-y-8">
      <div className="space-y-2">
        <Label htmlFor="name">Nombre completo</Label>
        <Input id="name" placeholder="Ej: Juan Pérez" value={formData.name} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="businessName">Nombre de tu negocio</Label>
        <Input id="businessName" placeholder="Ej: Tech Solutions S.A." value={formData.businessName} onChange={handleInputChange} />
      </div>
    </div>
  </div>
);

const Step2 = ({ formData, handleInputChange }) => (
  <div className="flex-1 flex flex-col justify-center space-y-12">
    <div className="flex items-center space-x-6">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Building2 className="w-5 h-5" style={{ color: '#ff9c9c' }} />
      </div>
      <div>
        <h2 className="text-xl font-inter font-semibold text-black">Tu Negocio</h2>
        <p className="text-muted-foreground">Cuéntanos sobre la empresa que representas.</p>
      </div>
    </div>
    <div className="grid grid-cols-1 gap-8">
      <div className="space-y-2">
        <Label htmlFor="website">Sitio web</Label>
        <Input id="website" placeholder="https://www.techsolutions.com" value={formData.website} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="services">Servicios ofrecidos</Label>
        <Textarea id="services" placeholder="Describe brevemente los servicios que ofreces..." value={formData.services} onChange={handleInputChange} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="opening_hours">Horarios de atención</Label>
        <Input id="opening_hours" placeholder="Ej: Lunes a Viernes de 9:00 a 18:00" value={formData.opening_hours} onChange={handleInputChange} />
      </div>
    </div>
  </div>
);

const Step4 = ({ widgetConfig, handleWidgetLogoChange, uploadingWidgetLogo, embedCode, copyEmbedCode }) => (
  <div className="flex-1 flex flex-col justify-center space-y-12">
    <div className="flex items-center space-x-6">
      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <MessageCircle className="w-5 h-5" style={{ color: '#ff9c9c' }} />
      </div>
      <div>
        <h2 className="text-xl font-inter font-semibold text-black">Widget de Chat</h2>
        <p className="text-muted-foreground">Configura tu widget de chat para integrarlo en tu sitio web.</p>
      </div>
    </div>
    
    {/* Layout de dos columnas */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Columna izquierda: Código de integración */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-lg font-medium">Código de Integración</Label>
            <p className="text-sm text-muted-foreground">Copia este código y pégalo en tu sitio web</p>
          </div>
          <Button 
            onClick={copyEmbedCode}
            size="sm"
          >
            Copiar
          </Button>
        </div>
        
        <textarea
          value={embedCode}
          readOnly
          className="w-full h-32 p-3 bg-gray-100 border border-gray-300 rounded-md text-sm font-mono resize-none"
        />
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-1 text-sm">Instrucciones rápidas:</h4>
          <ol className="text-xs text-blue-800 space-y-0.5">
            <li>1. Copia el código HTML</li>
            <li>2. Pégalo antes de &lt;/body&gt; en tu sitio web</li>
            <li>3. ¡Listo! El widget aparecerá automáticamente</li>
          </ol>
        </div>
      </div>
      
      {/* Columna derecha: Video de instrucciones (wireframe) */}
      <div className="space-y-4">
        <div>
          <Label className="text-lg font-medium">Video de Instrucciones</Label>
          <p className="text-sm text-muted-foreground">Aprende a integrar el widget paso a paso</p>
        </div>
        
        {/* Wireframe del video */}
        <div className="w-full h-48 bg-gray-200 border-2 border-dashed border-gray-400 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center mx-auto mb-2">
              <svg className="w-8 h-8 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
            <p className="text-sm font-medium">Video de Instrucciones</p>
            <p className="text-xs">Próximamente</p>
          </div>
        </div>
        
        <div className="text-xs text-muted-foreground">
          <strong>Nota:</strong> Personaliza colores, posición y mensajes en "Configuración del Widget" del panel.
        </div>
      </div>
    </div>
  </div>
);

const ServiceManagementForm = ({ serviceType, setServiceType, appointmentsConfig, setAppointmentsConfig, reservationsConfig, setReservationsConfig }) => {
  const handleServiceTypeChange = (type) => {
    setServiceType(type);
  };

  const handleAvailabilityChange = (field, value) => {
    if (serviceType === 'appointments') {
      setAppointmentsConfig(prev => ({ ...prev, [field]: value }));
    } else if (serviceType === 'reservations') {
      setReservationsConfig(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleToggleDay = (day) => {
    if (serviceType === 'appointments') {
      setAppointmentsConfig(prev => ({
        ...prev,
        days: prev.days.includes(day)
          ? prev.days.filter(d => d !== day)
          : [...prev.days, day]
      }));
    } else if (serviceType === 'reservations') {
      setReservationsConfig(prev => ({
        ...prev,
        days: prev.days.includes(day)
          ? prev.days.filter(d => d !== day)
          : [...prev.days, day]
      }));
    }
  };

  const handleToggleType = (type) => {
    if (serviceType === 'appointments') {
      setAppointmentsConfig(prev => ({
        ...prev,
        types: prev.types.includes(type)
          ? prev.types.filter(t => t !== type)
          : [...prev.types, type]
      }));
    } else if (serviceType === 'reservations') {
      setReservationsConfig(prev => ({
        ...prev,
        types: prev.types.includes(type)
          ? prev.types.filter(t => t !== type)
          : [...prev.types, type]
      }));
    }
  };

  const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  
  const APPOINTMENT_TYPES = [
    { value: 'phone', label: 'Llamada Telefónica' },
    { value: 'office', label: 'Visita en Oficina' },
    { value: 'video', label: 'Videollamada' },
  ];

  const RESERVATION_TYPES = [
    { value: 'table', label: 'Mesa' },
    { value: 'room', label: 'Habitación' },
    { value: 'service', label: 'Servicio' },
  ];

  return (
    <div className="space-y-8">
      {/* Selector de tipo de servicio */}
      <div className="space-y-4">
        <Label className="text-lg font-medium">¿Qué tipo de servicio gestionas?</Label>
        <div className="flex flex-wrap gap-3">
          <Button
            type="button"
            variant="outline"
            className={serviceType === 'appointments' ? 'bg-muted text-foreground' : ''}
            onClick={() => handleServiceTypeChange('appointments')}
          >
            Citas (consultas, asesorías, bufetes)
          </Button>
          <Button
            type="button"
            variant="outline"
            className={serviceType === 'reservations' ? 'bg-muted text-foreground' : ''}
            onClick={() => handleServiceTypeChange('reservations')}
          >
            Reservas (restaurantes, hoteles, salones)
          </Button>
        </div>
      </div>

      {/* Configuración específica según el tipo seleccionado */}
      {serviceType && (
        <div className="space-y-6">
          {/* Días disponibles */}
          <div className="space-y-2">
            <Label>Días disponibles</Label>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map(day => (
                <Button
                  key={day}
                  type="button"
                  variant="outline"
                  className={(serviceType === 'appointments' ? appointmentsConfig.days : reservationsConfig.days).includes(day) ? 'bg-muted text-foreground' : ''}
                  onClick={() => handleToggleDay(day)}
                >
                  {day}
                </Button>
              ))}
            </div>
          </div>

          {/* Horarios disponibles */}
          <div className="space-y-2">
            <Label>Horarios disponibles</Label>
            <Input
              type="text"
              placeholder="Ej: 09:00-13:00, 15:00-18:00"
              value={serviceType === 'appointments' ? appointmentsConfig.hours : reservationsConfig.hours}
              onChange={e => handleAvailabilityChange('hours', e.target.value)}
            />
            <div className="text-xs text-muted-foreground">Puedes poner varios rangos separados por coma.</div>
          </div>

          {/* Tipos específicos según el servicio */}
          <div className="space-y-2">
            <Label>
              {serviceType === 'appointments' ? 'Tipos de cita disponibles' : 'Tipos de reserva disponibles'}
            </Label>
            <div className="flex flex-wrap gap-2">
              {(serviceType === 'appointments' ? APPOINTMENT_TYPES : RESERVATION_TYPES).map(type => (
                <Button
                  key={type.value}
                  type="button"
                  variant="outline"
                  className={(serviceType === 'appointments' ? appointmentsConfig.types : reservationsConfig.types).includes(type.value) ? 'bg-muted text-foreground' : ''}
                  onClick={() => handleToggleType(type.value)}
                >
                  {type.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Campo adicional para reservas */}
          {serviceType === 'reservations' && (
            <div className="space-y-2">
              <Label>Días de anticipación para reservas</Label>
              <Input
                type="number"
                placeholder="Ej: 30"
                value={reservationsConfig.advance_booking_days || ''}
                onChange={e => handleAvailabilityChange('advance_booking_days', parseInt(e.target.value) || 30)}
                min="1"
                max="365"
              />
              <div className="text-xs text-muted-foreground">Número de días con anticipación que se pueden hacer reservas (1-365 días).</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const Step5 = () => (
  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-8">
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
      <CheckCircle className="w-5 h-5" style={{ color: '#ff9c9c' }} />
    </div>
    <div className="space-y-4">
      <h2 className="text-xl font-inter font-semibold text-black">¡Todo listo!</h2>
      <p className="text-muted-foreground max-w-md mx-auto">
        Has completado la configuración inicial. Tu asistente de IA está listo para empezar a trabajar.
      </p>
    </div>
  </div>
);

export default Onboarding;