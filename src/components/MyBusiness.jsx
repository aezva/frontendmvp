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
        <h1 className="text-xl font-semibold tracking-tight mb-6">Mi Negocio</h1>
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col h-full pt-0 pb-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full w-full">
            <div className="w-full flex px-6">
              <TabsList className="flex items-center gap-6 h-12 min-h-[48px] justify-start bg-transparent rounded-none border-none shadow-none w-full" style={{ alignItems: 'center', background: 'transparent', padding: 0, boxShadow: 'none', borderBottom: 'none' }}>
              <TabsTrigger value="general" className="text-base font-medium text-black pb-2 flex items-center gap-1 bg-transparent border-none shadow-none px-0 py-0 m-0 data-[state=active]:text-[#ff9c9c] data-[state=inactive]:text-black" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
                <Building className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />General
              </TabsTrigger>
              <TabsTrigger value="contact" className="text-base font-medium text-black pb-2 flex items-center gap-1 bg-transparent border-none shadow-none px-0 py-0 m-0 data-[state=active]:text-[#ff9c9c] data-[state=inactive]:text-black" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
                <Phone className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Contacto
              </TabsTrigger>
              <TabsTrigger value="services" className="text-base font-medium text-black pb-2 flex items-center gap-1 bg-transparent border-none shadow-none px-0 py-0 m-0 data-[state=active]:text-[#ff9c9c] data-[state=inactive]:text-black" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
                <Settings className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Servicios
              </TabsTrigger>
              <TabsTrigger value="content" className="text-base font-medium text-black pb-2 flex items-center gap-1 bg-transparent border-none shadow-none px-0 py-0 m-0 data-[state=active]:text-[#ff9c9c] data-[state=inactive]:text-black" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
                <FileText className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Contenido
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="h-px w-full bg-border" style={{margin: 0, borderRadius: 0}} />
            <div className="flex-1 flex flex-col w-full px-6">
              {/* General */}
              <TabsContent value="general" className="flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-6 mt-4">
                  <div className="grid grid-cols-1 gap-6 mt-0">
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
                </form>
              </TabsContent>
              {/* Contacto */}
              <TabsContent value="contact" className="flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-6 mt-4">
                  <div className="grid grid-cols-1 gap-6 mt-0">
                    <div className="space-y-2">
                      <Label htmlFor="business_phone">Teléfono</Label>
                      <Input 
                        id="business_phone" 
                        value={businessInfo.business_phone} 
                        onChange={(e) => handleInputChange('business_phone', e.target.value)}
                        placeholder="Ej: +34 600 000 000"
                        className="text-sm font-normal text-gray-500 placeholder-gray-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="business_email">Email</Label>
                      <Input 
                        id="business_email" 
                        value={businessInfo.business_email} 
                        onChange={(e) => handleInputChange('business_email', e.target.value)}
                        placeholder="Ej: contacto@empresa.com"
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
                      placeholder="Ej: www.miempresa.com"
                      className="text-sm font-normal text-gray-500 placeholder-gray-500"
                    />
                  </div>

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
                </form>
              </TabsContent>
              {/* Servicios */}
              <TabsContent value="services" className="flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-6 mt-4">
                  <div className="grid grid-cols-1 gap-6 mt-0">
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
                  </div>
                </form>
              </TabsContent>
              {/* Contenido */}
              <TabsContent value="content" className="flex flex-col">
                <form onSubmit={handleSubmit} className="flex flex-col space-y-6 mt-4">
                  <div className="grid grid-cols-1 gap-6 mt-0">
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
                </form>
              </TabsContent>
            </div>
          </Tabs>
          <div className="flex justify-end w-full mt-auto pt-6 pr-6">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 rounded-md bg-[#ff9c9c] text-black text-base font-normal transition-none focus:outline-none border-none shadow-none"
              style={{ background: '#ff9c9c' }}
            >
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </Card>
      </div>
    </>
  );
};

export default MyBusiness;