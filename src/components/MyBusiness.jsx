import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Save, 
  Loader2, 
  Building, 
  MapPin, 
  Clock, 
  Phone, 
  Mail, 
  Globe, 
  Users, 
  Award, 
  FileText,
  Star,
  MessageSquare,
  Settings,
  Info
} from 'lucide-react';
import { Helmet } from 'react-helmet';
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import imageCompression from 'browser-image-compression';

const MyBusiness = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const [businessInfo, setBusinessInfo] = useState({
    business_name: '',
    business_description: '',
    business_type: '',
    business_address: '',
    business_phone: '',
    business_email: '',
    business_website: '',
    business_hours: '',
    business_services: '',
    business_products: '',
    business_slogan: '',
    business_mission: '',
    business_values: '',
    business_social_media: '',
    business_logo_url: '',
    business_banner_url: '',
    business_about: '',
    business_faq: '',
    business_testimonials: '',
    business_team: '',
    business_awards: '',
    business_certifications: '',
    business_policies: '',
    business_contact_info: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [activeTab, setActiveTab] = useState('general'); // State to track the active tab

  useEffect(() => {
    const fetchData = async () => {
      if (!client) return;
      setLoading(true);
      
      try {
        // Obtener información del cliente (incluye datos del onboarding)
        const { data: clientData, error: clientError } = await supabase
          .from('clients')
          .select('*')
          .eq('id', client.id)
          .single();
          
        if (clientError) throw clientError;

        // Obtener información adicional del negocio
        const { data: businessData, error: businessError } = await supabase
          .from('business_info')
          .select('*')
          .eq('client_id', client.id)
          .single();

        // Combinar datos del onboarding con datos adicionales
        const combinedData = {
          business_name: clientData.business_name || '',
          business_description: businessData?.description || '',
          business_type: businessData?.business_type || '',
          business_address: businessData?.address || '',
          business_phone: businessData?.phone || '',
          business_email: businessData?.email || '',
          business_website: businessData?.website || '',
          business_hours: businessData?.opening_hours || '',
          business_services: businessData?.services || '',
          business_products: businessData?.products || '',
          business_slogan: businessData?.slogan || '',
          business_mission: businessData?.mission || '',
          business_values: businessData?.values || '',
          business_social_media: businessData?.social_media || '',
          business_logo_url: businessData?.logo_url || '',
          business_banner_url: businessData?.banner_url || '',
          business_about: businessData?.about || '',
          business_faq: businessData?.faq || '',
          business_testimonials: businessData?.testimonials || '',
          business_team: businessData?.team || '',
          business_awards: businessData?.awards || '',
          business_certifications: businessData?.certifications || '',
          business_policies: businessData?.policies || '',
          business_contact_info: businessData?.contact_info || ''
        };

        setBusinessInfo(combinedData);
      } catch (error) {
        console.error('Error fetching business data:', error);
        toast({ 
          title: 'Error', 
          description: 'No se pudo cargar la información del negocio', 
          variant: 'destructive' 
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [client, toast]);

  const handleInputChange = (field, value) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      console.log('Iniciando guardado de datos del negocio...');
      console.log('Client ID:', client.id);
      console.log('Business data to save:', businessInfo);

      // Actualizar tabla clients solo con business_name (que ya existe)
      const { error: clientError } = await supabase
        .from('clients')
        .update({ 
          business_name: businessInfo.business_name
        })
        .eq('id', client.id);

      if (clientError) {
        console.error('Error updating clients table:', clientError);
        throw clientError;
      }

      console.log('✅ Clients table updated successfully');

      // Actualizar o crear registro en business_info
      const businessDataToSave = {
        client_id: client.id,
        description: businessInfo.business_description,
        business_type: businessInfo.business_type,
        address: businessInfo.business_address,
        phone: businessInfo.business_phone,
        email: businessInfo.business_email,
        website: businessInfo.business_website,
        opening_hours: businessInfo.business_hours,
        services: businessInfo.business_services,
        products: businessInfo.business_products,
        slogan: businessInfo.business_slogan,
        mission: businessInfo.business_mission,
        values: businessInfo.business_values,
        social_media: businessInfo.business_social_media,
        logo_url: businessInfo.business_logo_url,
        banner_url: businessInfo.business_banner_url,
        about: businessInfo.business_about,
        faq: businessInfo.business_faq,
        testimonials: businessInfo.business_testimonials,
        team: businessInfo.business_team,
        awards: businessInfo.business_awards,
        certifications: businessInfo.business_certifications,
        policies: businessInfo.business_policies,
        contact_info: businessInfo.business_contact_info
      };

      console.log('Attempting to upsert business_info with data:', businessDataToSave);

      const { data: businessData, error: businessError } = await supabase
        .from('business_info')
        .upsert(businessDataToSave, { onConflict: 'client_id' })
        .select();

      if (businessError) {
        console.error('Error upserting business_info:', businessError);
        console.error('Error details:', {
          code: businessError.code,
          message: businessError.message,
          details: businessError.details,
          hint: businessError.hint
        });
        throw businessError;
      }

      console.log('✅ Business info upserted successfully:', businessData);

      toast({
        title: "✅ ¡Guardado exitosamente!",
        description: "La información de tu negocio ha sido actualizada y NNIA la usará en sus respuestas.",
      });

    } catch (error) {
      console.error('Error saving business data:', error);
      console.error('Full error object:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      toast({
        title: "Error al guardar",
        description: error.message || 'Error desconocido al guardar los datos',
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoChange = async (e) => {
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
    setUploadingLogo(true);
    try {
      const options = { maxWidthOrHeight: 720, maxSizeMB: 0.5, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);
      const filePath = `${client.id}/logo.jpg`;
      const { error: uploadError } = await supabase.storage.from('public-assets').upload(filePath, compressedFile, { upsert: true, contentType: compressedFile.type });
      if (uploadError) throw uploadError;
      const { data } = await supabase.storage.from('public-assets').createSignedUrl(filePath, 60 * 60 * 24 * 365);
      if (!data?.signedUrl) throw new Error('No se pudo obtener la URL del logo.');
      setBusinessInfo(prev => ({ ...prev, business_logo_url: data.signedUrl }));
      toast({ title: 'Logo actualizado', description: 'El logo del negocio se actualizó correctamente.' });
    } catch (err) {
      toast({ title: 'Error al subir logo', description: err.message || 'Intenta con otra imagen.' });
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        <Helmet>
          <title>Mi Negocio - NNIA</title>
        </Helmet>
        <h1 className="text-xl font-semibold tracking-tight mb-6 flex items-center gap-2"><Building className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} /> Mi Negocio</h1>
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col min-h-0 h-full">
          <div className="relative">
            <div className="flex items-center gap-6 w-full h-12 min-h-[48px] justify-start px-4" style={{alignItems: 'center'}}>
              <span className={`text-base font-light cursor-pointer pb-2 transition-colors select-none ${activeTab === 'general' ? 'text-[#ff9c9c]' : 'text-black hover:text-[#ff9c9c]'}`} onClick={() => setActiveTab('general')}><Building className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />General</span>
              <span className={`text-base font-light cursor-pointer pb-2 transition-colors select-none ${activeTab === 'contact' ? 'text-[#ff9c9c]' : 'text-black hover:text-[#ff9c9c]'}`} onClick={() => setActiveTab('contact')}><Phone className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Contacto</span>
              <span className={`text-base font-light cursor-pointer pb-2 transition-colors select-none ${activeTab === 'services' ? 'text-[#ff9c9c]' : 'text-black hover:text-[#ff9c9c]'}`} onClick={() => setActiveTab('services')}><Settings className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Servicios</span>
              <span className={`text-base font-light cursor-pointer pb-2 transition-colors select-none ${activeTab === 'content' ? 'text-[#ff9c9c]' : 'text-black hover:text-[#ff9c9c]'}`} onClick={() => setActiveTab('content')}><FileText className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Contenido</span>
              <span className={`text-base font-light cursor-pointer pb-2 transition-colors select-none ${activeTab === 'social' ? 'text-[#ff9c9c]' : 'text-black hover:text-[#ff9c9c]'}`} onClick={() => setActiveTab('social')}><Users className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Social</span>
            </div>
            <div className="absolute left-0 right-0 bottom-0 h-px w-full bg-border" />
          </div>
          {/* Aquí va el contenido de cada pestaña, renderizado según activeTab */}
          {activeTab === 'general' && (
            <CardContent className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />
                    Información General del Negocio
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Datos básicos que identifican tu empresa
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-black text-sm font-normal">Nombre del Negocio *</Label>
                      <Input 
                        id="business_name" 
                        value={businessInfo.business_name} 
                        onChange={(e) => handleInputChange('business_name', e.target.value)}
                        placeholder="Ej: Tech Solutions S.A."
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_type">Tipo de Negocio</Label>
                      <Input 
                        id="business_type" 
                        value={businessInfo.business_type} 
                        onChange={(e) => handleInputChange('business_type', e.target.value)}
                        placeholder="Ej: Consultoría IT, Restaurante, etc."
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="business_description">Descripción del Negocio</Label>
                    <Textarea 
                      id="business_description" 
                      rows={3} 
                      value={businessInfo.business_description} 
                      onChange={(e) => handleInputChange('business_description', e.target.value)}
                      placeholder="Describe qué hace tu negocio, a quién sirve y qué lo hace especial..."
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_slogan">Slogan o Tagline</Label>
                    <Input 
                      id="business_slogan" 
                      value={businessInfo.business_slogan} 
                      onChange={(e) => handleInputChange('business_slogan', e.target.value)}
                      placeholder="Ej: 'Soluciones tecnológicas que transforman tu negocio'"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_mission">Misión</Label>
                    <Textarea 
                      id="business_mission" 
                      rows={2} 
                      value={businessInfo.business_mission} 
                      onChange={(e) => handleInputChange('business_mission', e.target.value)}
                      placeholder="¿Cuál es la misión de tu empresa?"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_values">Valores</Label>
                    <Textarea 
                      id="business_values" 
                      rows={2} 
                      value={businessInfo.business_values} 
                      onChange={(e) => handleInputChange('business_values', e.target.value)}
                      placeholder="¿Cuáles son los valores fundamentales de tu empresa?"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          )}

          {activeTab === 'contact' && (
            <CardContent className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />
                    Información de Contacto
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Datos de contacto que NNIA puede compartir con clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="business_phone">Teléfono</Label>
                      <Input 
                        id="business_phone" 
                        value={businessInfo.business_phone} 
                        onChange={(e) => handleInputChange('business_phone', e.target.value)}
                        placeholder="+1 (555) 123-4567"
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_email">Email Público</Label>
                      <Input 
                        id="business_email" 
                        type="email"
                        value={businessInfo.business_email} 
                        onChange={(e) => handleInputChange('business_email', e.target.value)}
                        placeholder="contacto@tuempresa.com"
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_address">Dirección</Label>
                    <Textarea 
                      id="business_address" 
                      rows={2} 
                      value={businessInfo.business_address} 
                      onChange={(e) => handleInputChange('business_address', e.target.value)}
                      placeholder="Dirección completa de tu negocio"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_website">Sitio Web</Label>
                    <Input 
                      id="business_website" 
                      value={businessInfo.business_website} 
                      onChange={(e) => handleInputChange('business_website', e.target.value)}
                      placeholder="https://www.tuempresa.com"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_hours">Horarios de Atención</Label>
                    <Input 
                      id="business_hours" 
                      value={businessInfo.business_hours} 
                      onChange={(e) => handleInputChange('business_hours', e.target.value)}
                      placeholder="Lunes a Viernes: 9:00 AM - 6:00 PM"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_contact_info">Información Adicional de Contacto</Label>
                    <Textarea 
                      id="business_contact_info" 
                      rows={3} 
                      value={businessInfo.business_contact_info} 
                      onChange={(e) => handleInputChange('business_contact_info', e.target.value)}
                      placeholder="Información adicional sobre cómo contactarte, formularios, etc."
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          )}

          {activeTab === 'services' && (
            <CardContent className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />
                    Servicios y Productos
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Lo que ofreces a tus clientes
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_services">Servicios Ofrecidos</Label>
                    <Textarea 
                      id="business_services" 
                      rows={5} 
                      value={businessInfo.business_services} 
                      onChange={(e) => handleInputChange('business_services', e.target.value)}
                      placeholder="Lista detallada de los servicios que ofreces. Uno por línea o separados por comas."
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_products">Productos</Label>
                    <Textarea 
                      id="business_products" 
                      rows={4} 
                      value={businessInfo.business_products} 
                      onChange={(e) => handleInputChange('business_products', e.target.value)}
                      placeholder="Lista de productos que vendes o fabricas"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          )}

          {activeTab === 'content' && (
            <CardContent className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />
                    Contenido del Negocio
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Información adicional que NNIA puede usar
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_about">Sobre Nosotros</Label>
                    <Textarea 
                      id="business_about" 
                      rows={4} 
                      value={businessInfo.business_about} 
                      onChange={(e) => handleInputChange('business_about', e.target.value)}
                      placeholder="Historia de la empresa, experiencia, etc."
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_faq">Preguntas Frecuentes</Label>
                    <Textarea 
                      id="business_faq" 
                      rows={6} 
                      value={businessInfo.business_faq} 
                      onChange={(e) => handleInputChange('business_faq', e.target.value)}
                      placeholder="Preguntas frecuentes y sus respuestas. Formato: P: ¿Pregunta? R: Respuesta"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_testimonials">Testimonios</Label>
                    <Textarea 
                      id="business_testimonials" 
                      rows={4} 
                      value={businessInfo.business_testimonials} 
                      onChange={(e) => handleInputChange('business_testimonials', e.target.value)}
                      placeholder="Testimonios de clientes satisfechos"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_team">Equipo</Label>
                    <Textarea 
                      id="business_team" 
                      rows={3} 
                      value={businessInfo.business_team} 
                      onChange={(e) => handleInputChange('business_team', e.target.value)}
                      placeholder="Información sobre el equipo, experiencia, etc."
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="business_awards">Premios y Reconocimientos</Label>
                      <Textarea 
                        id="business_awards" 
                        rows={3} 
                        value={businessInfo.business_awards} 
                        onChange={(e) => handleInputChange('business_awards', e.target.value)}
                        placeholder="Premios, reconocimientos, certificaciones"
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_certifications">Certificaciones</Label>
                      <Textarea 
                        id="business_certifications" 
                        rows={3} 
                        value={businessInfo.business_certifications} 
                        onChange={(e) => handleInputChange('business_certifications', e.target.value)}
                        placeholder="Certificaciones profesionales, ISO, etc."
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="business_policies">Políticas</Label>
                    <Textarea 
                      id="business_policies" 
                      rows={4} 
                      value={businessInfo.business_policies} 
                      onChange={(e) => handleInputChange('business_policies', e.target.value)}
                      placeholder="Políticas de la empresa, garantías, términos de servicio"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          )}

          {activeTab === 'social' && (
            <CardContent className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />
                    Redes Sociales y Multimedia
                  </CardTitle>
                  <CardDescription className="text-gray-500 text-xs">
                    Enlaces a redes sociales y recursos multimedia
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business_social_media">Redes Sociales</Label>
                    <Textarea 
                      id="business_social_media" 
                      rows={4} 
                      value={businessInfo.business_social_media} 
                      onChange={(e) => handleInputChange('business_social_media', e.target.value)}
                      placeholder="Enlaces a redes sociales: Facebook, Instagram, LinkedIn, Twitter, etc."
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="business_logo_url">URL del Logo</Label>
                      <Input 
                        id="business_logo_url" 
                        value={businessInfo.business_logo_url} 
                        onChange={(e) => handleInputChange('business_logo_url', e.target.value)}
                        placeholder="https://ejemplo.com/logo.png"
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                      <div className="flex flex-col gap-2 mt-2">
                        <label htmlFor="logo-upload">
                          <Button type="button" variant="outline" asChild disabled={uploadingLogo}>
                            <span>{uploadingLogo ? 'Subiendo...' : 'Subir Logo'}</span>
                          </Button>
                        </label>
                        <input id="logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoChange} />
                        <span className="text-xs text-muted-foreground">Máx: 720x720px, 500KB</span>
                        {businessInfo.business_logo_url && (
                          <div className="mt-2">
                            <img 
                              src={businessInfo.business_logo_url} 
                              alt="Logo del negocio" 
                              className="max-w-32 max-h-32 w-auto h-auto rounded-lg object-contain border border-gray-200" 
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_banner_url">URL del Banner</Label>
                      <Input 
                        id="business_banner_url" 
                        value={businessInfo.business_banner_url} 
                        onChange={(e) => handleInputChange('business_banner_url', e.target.value)}
                        placeholder="https://ejemplo.com/banner.png"
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          )}
        </Card>

        {/* Botón de Guardar */}
        <div className="flex justify-end pt-6">
          <Button type="submit" disabled={saving} size="lg">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Guardar Cambios
              </>
            )}
          </Button>
        </div>
      </div>
    </>
  );
};

export default MyBusiness;