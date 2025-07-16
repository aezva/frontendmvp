import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Slider } from './ui/slider'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ui/use-toast'
import imageCompression from 'browser-image-compression';
import { supabase } from '../lib/supabaseClient';
import { Palette, Settings, Clock, Code } from 'lucide-react';

const WidgetSettings = () => {
  const { client } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [config, setConfig] = useState({
    // Apariencia
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    
    // Comportamiento
    welcomeMessage: '¡Hola! Soy NNIA, tu asistente virtual. ¿En qué puedo ayudarte?',
    autoOpen: false,
    showTimestamp: true,
    maxMessages: 50,
    
    // Horarios
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
  })

  const [embedCode, setEmbedCode] = useState('')
  const [uploadingWidgetLogo, setUploadingWidgetLogo] = useState(false)
  const [activeTab, setActiveTab] = useState('appearance');

  useEffect(() => {
    loadWidgetConfig()
  }, [client])

  const loadWidgetConfig = async () => {
    if (!client) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nnia/widget/config/${client.id}`)
      
      if (response.ok) {
        const data = await response.json()
        setConfig(prev => ({ ...prev, ...data }))
        setTimeout(() => generateEmbedCode(), 100)
      }
    } catch (error) {
      console.error('Error al cargar configuración del widget:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const saveWidgetConfig = async () => {
    if (!client) return
    
    try {
      setIsLoading(true)
      const response = await fetch(`${import.meta.env.VITE_API_URL}/nnia/widget/config/${client.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config)
      })

      if (response.ok) {
        toast({
          title: "Configuración guardada",
          description: "Los cambios del widget se han guardado correctamente.",
        })
        generateEmbedCode()
      } else {
        throw new Error('Error al guardar configuración')
      }
    } catch (error) {
      console.error('Error al guardar configuración:', error)
      toast({
        title: "Error",
        description: "No se pudo guardar la configuración del widget.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const generateEmbedCode = () => {
    if (!client) return
    
    const code = `<!-- NNIA Widget -->\n<script src=\"https://widget.iamnnia.com/nnia-widget.umd.js\"\n  data-business-id=\"${client.id}\"\n  data-api-url=\"${import.meta.env.VITE_API_URL}\"\n  data-position=\"${config.position}\"\n  data-primary-color=\"${config.primaryColor}\"\n  data-background-color=\"${config.backgroundColor}\"\n  data-text-color=\"${config.textColor}\"\n  data-welcome-message=\"${config.welcomeMessage.replace(/"/g, '&quot;')}\"\n  data-auto-open=\"${config.autoOpen}\"\n  data-show-timestamp=\"${config.showTimestamp}\"\n  data-max-messages=\"${config.maxMessages}\">\n</script>`
    
    setEmbedCode(code)
  }

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode)
    toast({
      title: "Código copiado",
      description: "El código de integración se ha copiado al portapapeles.",
    })
  }

  const positions = [
    { value: 'bottom-right', label: 'Inferior Derecha' },
    { value: 'bottom-left', label: 'Inferior Izquierda' },
    { value: 'bottom-center', label: 'Inferior Centro' },
    { value: 'top-right', label: 'Superior Derecha' },
    { value: 'top-left', label: 'Superior Izquierda' },
    { value: 'top-center', label: 'Superior Centro' }
  ]

  const days = [
    { key: 'monday', label: 'Lunes' },
    { key: 'tuesday', label: 'Martes' },
    { key: 'wednesday', label: 'Miércoles' },
    { key: 'thursday', label: 'Jueves' },
    { key: 'friday', label: 'Viernes' },
    { key: 'saturday', label: 'Sábado' },
    { key: 'sunday', label: 'Domingo' }
  ]

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
      setConfig(prev => ({ ...prev, widgetLogoUrl: data.signedUrl }));
      toast({ title: 'Logo del widget actualizado', description: 'La imagen del widget se actualizó correctamente.' });
    } catch (err) {
      toast({ title: 'Error al subir imagen', description: err.message || 'Intenta con otra imagen.' });
    } finally {
      setUploadingWidgetLogo(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <h1 className="text-xl font-semibold tracking-tight mb-1">Configuración del Widget</h1>
      <p className="text-muted-foreground mb-6">Personaliza la apariencia y comportamiento del widget de chat en tu sitio web.</p>
      <Card className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow flex flex-col h-full pt-0 pb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col h-full w-full">
          <div className="w-full flex px-6">
            <TabsList className="flex items-center gap-6 h-12 min-h-[48px] justify-start bg-transparent rounded-none border-none shadow-none w-full" style={{ alignItems: 'center', background: 'transparent', padding: 0, boxShadow: 'none', borderBottom: 'none' }}>
              <TabsTrigger value="appearance" className="text-base font-medium text-black pb-2 flex items-center gap-1 bg-transparent border-none shadow-none px-0 py-0 m-0 data-[state=active]:text-[#ff9c9c] data-[state=inactive]:text-black" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
                <Palette className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Apariencia
              </TabsTrigger>
              <TabsTrigger value="embed" className="text-base font-medium text-black pb-2 flex items-center gap-1 bg-transparent border-none shadow-none px-0 py-0 m-0 data-[state=active]:text-[#ff9c9c] data-[state=inactive]:text-black" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0, margin: 0 }}>
                <Code className="h-5 w-5 inline mr-1" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />Integración
              </TabsTrigger>
            </TabsList>
          </div>
          <div className="h-px w-full bg-border" style={{margin: 0, borderRadius: 0}} />
          <div className="flex-1 flex flex-col w-full px-6">
            <TabsContent value="appearance" className="flex flex-col">
              <form className="flex flex-col space-y-6 mt-4" onSubmit={e => { e.preventDefault(); saveWidgetConfig(); }}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-0">
                  {/* Elimino el campo de posición del widget */}
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Color Principal</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.primaryColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.primaryColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="backgroundColor">Color de Fondo</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="backgroundColor"
                        type="color"
                        value={config.backgroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.backgroundColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, backgroundColor: e.target.value }))}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="textColor">Color del Texto</Label>
                    <div className="flex items-center space-x-2 mt-1">
                      <Input
                        id="textColor"
                        type="color"
                        value={config.textColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                        className="w-16 h-10"
                      />
                      <Input
                        value={config.textColor}
                        onChange={(e) => setConfig(prev => ({ ...prev, textColor: e.target.value }))}
                        placeholder="#1f2937"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Logo del Widget</Label>
                  <div className="flex flex-col gap-2">
                    <label htmlFor="widget-logo-upload">
                      <Button type="button" variant="outline" asChild disabled={uploadingWidgetLogo}>
                        <span>{uploadingWidgetLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
                      </Button>
                    </label>
                    <input id="widget-logo-upload" type="file" accept="image/*" style={{ display: 'none' }} onChange={handleWidgetLogoChange} />
                    <span className="text-xs text-muted-foreground">Máx: 720x720px, 500KB</span>
                    {config.widgetLogoUrl && (
                      <div className="mt-2">
                        <img 
                          src={config.widgetLogoUrl} 
                          alt="Logo del widget" 
                          className="max-w-32 max-h-32 w-auto h-auto rounded-lg object-contain border border-gray-200" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="embed" className="flex flex-col">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                {/* Columna izquierda: Código HTML */}
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-2 w-full">
                    <Label>Código HTML</Label>
                    <button
                      type="button"
                      onClick={copyEmbedCode}
                      className="text-[#ff9c9c] text-base font-normal transition-none focus:outline-none border-none shadow-none bg-transparent p-0 m-0"
                      style={{ background: 'transparent', border: 'none', padding: 0, margin: 0 }}
                    >
                      Copiar código
                    </button>
                  </div>
                  <div className="flex flex-col items-start w-full">
                    <div className="w-full flex flex-row items-start justify-start gap-4">
                      <pre className="flex-1 bg-gray-100 rounded-md p-4 text-xs overflow-x-auto select-all border border-gray-200 min-h-[160px] lg:min-h-[220px]" style={{ fontFamily: 'monospace', margin: 0 }}>{embedCode}</pre>
                    </div>
                  </div>
                </div>
                
                {/* Columna derecha: Video tutorial e instrucciones */}
                <div className="flex flex-col space-y-6">
                  {/* Espacio para video tutorial */}
                  <div className="space-y-2">
                    <Label>Video Tutorial</Label>
                    <div className="bg-gray-100 rounded-md p-8 border border-gray-200 flex items-center justify-center">
                      <p className="text-gray-500 text-sm">Video tutorial próximamente</p>
                    </div>
                  </div>
                  
                  {/* Instrucciones rápidas */}
                  <div className="bg-white border border-border rounded-lg p-4">
                    <Label className="mb-2 text-black">Instrucciones Rápidas</Label>
                    <ol className="text-sm text-black space-y-1">
                      <li>1. Copia el código HTML de la izquierda</li>
                      <li>2. Pega el código en tu sitio web antes del cierre de &lt;/body&gt;</li>
                      <li>3. El widget aparecerá automáticamente en tu página</li>
                      <li>4. Los visitantes podrán chatear con tu asistente NNIA</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>
          </div>
        </Tabs>
        {activeTab === 'appearance' && (
          <div className="flex justify-end w-full mt-auto pt-6 pr-6">
            <button
              type="button"
              onClick={saveWidgetConfig}
              className="px-6 py-2 rounded-md bg-[#ff9c9c] text-black text-base font-normal transition-none focus:outline-none border-none shadow-none"
              style={{ background: '#ff9c9c' }}
              disabled={isLoading}
            >
              Guardar
            </button>
          </div>
        )}
      </Card>
    </div>
  )
}

export default WidgetSettings 