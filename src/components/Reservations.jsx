import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useToast } from './ui/use-toast';
import { 
  getReservations, 
  getReservationTypes, 
  getReservationAvailability,
  createReservation,
  updateReservation,
  deleteReservation,
  createReservationType,
  updateReservationType,
  deleteReservationType,
  setReservationAvailability
} from '../services/reservationsService';

// Componente para mostrar una reserva individual
function ReservationCard({ reservation, onEdit, onDelete }) {
  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (time) => {
    return time.substring(0, 5); // Formato HH:MM
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-lg">{reservation.name}</h3>
            <p className="text-gray-600">{reservation.email}</p>
          </div>
          <Badge className={getStatusColor(reservation.status)}>
            {reservation.status === 'confirmed' ? 'Confirmada' : 
             reservation.status === 'pending' ? 'Pendiente' : 
             reservation.status === 'cancelled' ? 'Cancelada' : reservation.status}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div>
            <p className="text-sm text-gray-500">Tipo de Reserva</p>
            <p className="font-medium">{reservation.reservation_type}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Personas</p>
            <p className="font-medium">{reservation.people_count || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Fecha</p>
            <p className="font-medium">{formatDate(reservation.date)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Hora</p>
            <p className="font-medium">{formatTime(reservation.time)}</p>
          </div>
        </div>

        {reservation.special_requests && (
          <div className="mb-3">
            <p className="text-sm text-gray-500">Pedidos Especiales</p>
            <p className="text-sm">{reservation.special_requests}</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onEdit(reservation)}
          >
            Editar
          </Button>
          <Button 
            variant="destructive" 
            size="sm"
            onClick={() => onDelete(reservation.id)}
          >
            Eliminar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Componente para gestionar tipos de reserva
function ReservationTypes({ clientId, types, onRefresh }) {
  const [newType, setNewType] = useState({ name: '', description: '', capacity: 1 });
  const [editingType, setEditingType] = useState(null);
  const { toast } = useToast();

  const handleCreateType = async () => {
    try {
      await createReservationType({
        ...newType,
        client_id: clientId,
        is_active: true
      });
      setNewType({ name: '', description: '', capacity: 1 });
      onRefresh();
      toast({
        title: "Tipo de reserva creado",
        description: "El nuevo tipo de reserva se ha creado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUpdateType = async () => {
    try {
      await updateReservationType(editingType.id, editingType);
      setEditingType(null);
      onRefresh();
      toast({
        title: "Tipo de reserva actualizado",
        description: "El tipo de reserva se ha actualizado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteType = async (id) => {
    try {
      await deleteReservationType(id);
      onRefresh();
      toast({
        title: "Tipo de reserva eliminado",
        description: "El tipo de reserva se ha eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Crear nuevo tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Añadir Nuevo Tipo de Reserva</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Nombre (ej: Mesa para 4)"
              value={newType.name}
              onChange={(e) => setNewType({ ...newType, name: e.target.value })}
              className="border rounded-md p-2"
            />
            <input
              type="text"
              placeholder="Descripción"
              value={newType.description}
              onChange={(e) => setNewType({ ...newType, description: e.target.value })}
              className="border rounded-md p-2"
            />
            <input
              type="number"
              placeholder="Capacidad"
              value={newType.capacity}
              onChange={(e) => setNewType({ ...newType, capacity: parseInt(e.target.value) || 1 })}
              className="border rounded-md p-2"
            />
          </div>
          <Button 
            onClick={handleCreateType}
            disabled={!newType.name}
            className="mt-4"
          >
            Añadir Tipo
          </Button>
        </CardContent>
      </Card>

      {/* Lista de tipos existentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {types.map((type) => (
          <Card key={type.id}>
            <CardContent className="p-4">
              {editingType?.id === type.id ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editingType.name}
                    onChange={(e) => setEditingType({ ...editingType, name: e.target.value })}
                    className="border rounded-md p-2 w-full"
                  />
                  <input
                    type="text"
                    value={editingType.description}
                    onChange={(e) => setEditingType({ ...editingType, description: e.target.value })}
                    className="border rounded-md p-2 w-full"
                  />
                  <input
                    type="number"
                    value={editingType.capacity}
                    onChange={(e) => setEditingType({ ...editingType, capacity: parseInt(e.target.value) || 1 })}
                    className="border rounded-md p-2 w-full"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleUpdateType}>Guardar</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingType(null)}>Cancelar</Button>
                  </div>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold">{type.name}</h3>
                  <p className="text-sm text-gray-600">{type.description}</p>
                  <p className="text-sm text-gray-500">Capacidad: {type.capacity}</p>
                  <div className="flex gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setEditingType(type)}
                    >
                      Editar
                    </Button>
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => handleDeleteType(type.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Componente para configurar disponibilidad
function ReservationAvailability({ clientId, availability, onRefresh }) {
  const [config, setConfig] = useState({
    days: [],
    hours: '',
    advance_booking_days: 30
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const daysOfWeek = [
    { value: 'monday', label: 'Lunes' },
    { value: 'tuesday', label: 'Martes' },
    { value: 'wednesday', label: 'Miércoles' },
    { value: 'thursday', label: 'Jueves' },
    { value: 'friday', label: 'Viernes' },
    { value: 'saturday', label: 'Sábado' },
    { value: 'sunday', label: 'Domingo' }
  ];

  // Solo actualiza el estado local si la disponibilidad realmente cambia
  useEffect(() => {
    if (!availability) return;
    setConfig(prev => {
      // Compara si hay cambios reales
      const daysEqual = Array.isArray(availability.days) && Array.isArray(prev.days) &&
        availability.days.length === prev.days.length &&
        availability.days.every((d, i) => d === prev.days[i]);
      if (
        daysEqual &&
        availability.hours === prev.hours &&
        availability.advance_booking_days === prev.advance_booking_days
      ) {
        return prev;
      }
      return {
        days: availability.days || [],
        hours: availability.hours || '',
        advance_booking_days: availability.advance_booking_days || 30
      };
    });
  }, [availability]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await setReservationAvailability(clientId, {
        days: config.days.join(','),
        hours: config.hours,
        advance_booking_days: config.advance_booking_days
      });
      // Actualiza el estado local con lo que devuelve el backend
      setConfig({
        days: saved.days || [],
        hours: saved.hours || '',
        advance_booking_days: saved.advance_booking_days || 30
      });
      onRefresh();
      toast({
        title: "Disponibilidad guardada",
        description: "La configuración de disponibilidad se ha guardado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDay = (day) => {
    setConfig(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Disponibilidad de Reservas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Días de la semana */}
        <div>
          <h3 className="font-semibold mb-3">Días disponibles</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {daysOfWeek.map((day) => (
              <label key={day.value} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={config.days.includes(day.value)}
                  onChange={() => toggleDay(day.value)}
                  className="rounded"
                  disabled={isSaving}
                />
                <span>{day.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Horarios */}
        <div>
          <h3 className="font-semibold mb-3">Horarios disponibles</h3>
          <textarea
            value={config.hours}
            onChange={(e) => setConfig({ ...config, hours: e.target.value })}
            placeholder="Ej: 12:00-15:00, 19:00-23:00"
            className="w-full border rounded-md p-2 h-20"
            disabled={isSaving}
          />
          <p className="text-sm text-gray-500 mt-1">
            Formato: HH:MM-HH:MM, HH:MM-HH:MM (separar múltiples horarios con comas)
          </p>
        </div>

        {/* Días de anticipación */}
        <div>
          <h3 className="font-semibold mb-3">Días de anticipación para reservas</h3>
          <input
            type="number"
            value={config.advance_booking_days}
            onChange={(e) => setConfig({ ...config, advance_booking_days: parseInt(e.target.value) || 30 })}
            className="border rounded-md p-2 w-32"
            min="1"
            max="365"
            disabled={isSaving}
          />
          <p className="text-sm text-gray-500 mt-1">
            Número de días con anticipación que se pueden hacer reservas
          </p>
        </div>

        <Button onClick={handleSave} className="w-full" disabled={isSaving}>
          {isSaving ? 'Guardando...' : 'Guardar Configuración'}
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente principal
export default function Reservations() {
  const { user, client } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [types, setTypes] = useState([]);
  const [availability, setAvailability] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingReservation, setEditingReservation] = useState(null);
  const { toast } = useToast();

  const clientId = client?.id;

  const loadData = async () => {
    if (!clientId) return;
    
    try {
      setLoading(true);
      const [reservationsData, typesData, availabilityData] = await Promise.all([
        getReservations(clientId).catch(() => []),
        getReservationTypes(clientId).catch(() => []),
        getReservationAvailability(clientId).catch(() => ({ days: [], hours: '', advance_booking_days: 30 }))
      ]);
      
      setReservations(Array.isArray(reservationsData) ? reservationsData : []);
      setTypes(Array.isArray(typesData) ? typesData : []);
      setAvailability(availabilityData || { days: [], hours: '', advance_booking_days: 30 });
    } catch (error) {
      console.error('Error loading data:', error);
      setReservations([]);
      setTypes([]);
      setAvailability({ days: [], hours: '', advance_booking_days: 30 });
      toast({
        title: "Error de conexión",
        description: "No se pudieron cargar los datos. Verifica que el backend esté funcionando.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clientId]);

  const handleDeleteReservation = async (id) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta reserva?')) return;
    
    try {
      await deleteReservation(id);
      await loadData();
      toast({
        title: "Reserva eliminada",
        description: "La reserva se ha eliminado correctamente.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEditReservation = (reservation) => {
    setEditingReservation(reservation);
    // Aquí podrías abrir un modal o navegar a una página de edición
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Cargando reservas...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reservas</h1>
        <p className="text-gray-600">Gestiona las reservas de tu negocio</p>
      </div>

      <Tabs defaultValue="reservations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="reservations">Reservas ({reservations.length})</TabsTrigger>
          <TabsTrigger value="types">Tipos de Reserva ({types.length})</TabsTrigger>
          <TabsTrigger value="availability">Disponibilidad</TabsTrigger>
        </TabsList>

        <TabsContent value="reservations" className="space-y-4">
          {reservations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p style={{ color: '#ff9c9c' }}>No hay reservas pendientes</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {reservations.map((reservation) => (
                <ReservationCard
                  key={reservation.id}
                  reservation={reservation}
                  onEdit={handleEditReservation}
                  onDelete={handleDeleteReservation}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="types">
          <ReservationTypes 
            clientId={clientId}
            types={types}
            onRefresh={loadData}
          />
        </TabsContent>

        <TabsContent value="availability">
          <ReservationAvailability
            clientId={clientId}
            availability={availability}
            onRefresh={loadData}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
} 