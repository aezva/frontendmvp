import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Slider } from './ui/slider'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from './ui/use-toast'

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
    offlineMessage: 'Estamos fuera de horario. Te responderemos pronto.'
  })

  const [embedCode, setEmbedCode] = useState('')

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
    
    const code = `<!-- NNIA Widget -->\n<script src=\"https://widgetmvp.vercel.app/nnia-widget.umd.js\"\n  data-business-id=\"${client.id}\"\n  data-api-url=\"${import.meta.env.VITE_API_URL}\"\n  data-position=\"${config.position}\"\n  data-primary-color=\"${config.primaryColor}\"\n  data-background-color=\"${config.backgroundColor}\"\n  data-text-color=\"${config.textColor}\"\n  data-welcome-message=\"${config.welcomeMessage.replace(/"/g, '&quot;')}\"\n  data-auto-open=\"${config.autoOpen}\"\n  data-show-timestamp=\"${config.showTimestamp}\"\n  data-max-messages=\"${config.maxMessages}\">\n</script>`
    
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Configuración del Widget</h1>
        <p className="text-gray-600 mt-2">
          Personaliza la apariencia y comportamiento del widget de chat en tu sitio web.
        </p>
      </div>

      <Tabs defaultValue="appearance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="behavior">Comportamiento</TabsTrigger>
          <TabsTrigger value="schedule">Horarios</TabsTrigger>
          <TabsTrigger value="embed">Integración</TabsTrigger>
        </TabsList>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Posición y Colores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="position">Posición del Widget</Label>
                <select
                  id="position"
                  value={config.position}
                  onChange={(e) => setConfig(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                >
                  {positions.map(pos => (
                    <option key={pos.value} value={pos.value}>
                      {pos.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
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

                <div>
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

                <div>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comportamiento del Widget</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="welcomeMessage">Mensaje de Bienvenida</Label>
                <textarea
                  id="welcomeMessage"
                  value={config.welcomeMessage}
                  onChange={(e) => setConfig(prev => ({ ...prev, welcomeMessage: e.target.value }))}
                  className="w-full p-2 border border-gray-300 rounded-md mt-1"
                  rows="3"
                  placeholder="¡Hola! Soy NNIA, tu asistente virtual..."
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="autoOpen"
                    checked={config.autoOpen}
                    onChange={(e) => setConfig(prev => ({ ...prev, autoOpen: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="autoOpen">Abrir automáticamente al cargar la página</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="showTimestamp"
                    checked={config.showTimestamp}
                    onChange={(e) => setConfig(prev => ({ ...prev, showTimestamp: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="showTimestamp">Mostrar timestamps en los mensajes</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="maxMessages">Máximo de mensajes a mostrar</Label>
                <Slider
                  value={[config.maxMessages]}
                  onValueChange={([value]) => setConfig(prev => ({ ...prev, maxMessages: value }))}
                  max={100}
                  min={10}
                  step={10}
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">{config.maxMessages} mensajes</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Horarios de Disponibilidad</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="scheduleEnabled"
                  checked={config.scheduleEnabled}
                  onChange={(e) => setConfig(prev => ({ ...prev, scheduleEnabled: e.target.checked }))}
                  className="rounded"
                />
                <Label htmlFor="scheduleEnabled">Activar horarios de disponibilidad</Label>
              </div>

              {config.scheduleEnabled && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="offlineMessage">Mensaje fuera de horario</Label>
                    <textarea
                      id="offlineMessage"
                      value={config.offlineMessage}
                      onChange={(e) => setConfig(prev => ({ ...prev, offlineMessage: e.target.value }))}
                      className="w-full p-2 border border-gray-300 rounded-md mt-1"
                      rows="2"
                      placeholder="Estamos fuera de horario. Te responderemos pronto."
                    />
                  </div>

                  <div className="space-y-3">
                    {days.map(day => (
                      <div key={day.key} className="flex items-center space-x-4 p-3 border rounded-lg">
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`${day.key}-enabled`}
                            checked={config.hours[day.key].enabled}
                            onChange={(e) => setConfig(prev => ({
                              ...prev,
                              hours: {
                                ...prev.hours,
                                [day.key]: {
                                  ...prev.hours[day.key],
                                  enabled: e.target.checked
                                }
                              }
                            }))}
                            className="rounded"
                          />
                          <Label htmlFor={`${day.key}-enabled`} className="w-20">{day.label}</Label>
                        </div>
                        
                        {config.hours[day.key].enabled && (
                          <div className="flex items-center space-x-2">
                            <Input
                              type="time"
                              value={config.hours[day.key].start}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                hours: {
                                  ...prev.hours,
                                  [day.key]: {
                                    ...prev.hours[day.key],
                                    start: e.target.value
                                  }
                                }
                              }))}
                              className="w-24"
                            />
                            <span>a</span>
                            <Input
                              type="time"
                              value={config.hours[day.key].end}
                              onChange={(e) => setConfig(prev => ({
                                ...prev,
                                hours: {
                                  ...prev.hours,
                                  [day.key]: {
                                    ...prev.hours[day.key],
                                    end: e.target.value
                                  }
                                }
                              }))}
                              className="w-24"
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="embed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Código de Integración</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Copia este código y pégalo en tu sitio web para integrar el widget de NNIA.
              </p>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label>Código HTML</Label>
                  <Button onClick={copyEmbedCode} size="sm">
                    Copiar Código
                  </Button>
                </div>
                <textarea
                  value={embedCode}
                  readOnly
                  className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
                  rows="12"
                  placeholder="Genera la configuración para ver el código de integración..."
                />
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2">Instrucciones:</h4>
                <ol className="text-blue-700 text-sm space-y-1">
                  <li>1. Copia el código de arriba</li>
                  <li>2. Pégalo justo antes del cierre de la etiqueta &lt;/body&gt; en tu HTML</li>
                  <li>3. El widget aparecerá automáticamente en tu sitio web</li>
                  <li>4. Los cambios en la configuración se reflejarán automáticamente</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-4">
        <Button variant="outline" onClick={loadWidgetConfig}>
          Restaurar
        </Button>
        <Button onClick={saveWidgetConfig} disabled={isLoading}>
          {isLoading ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </div>
    </div>
  )
}

export default WidgetSettings 