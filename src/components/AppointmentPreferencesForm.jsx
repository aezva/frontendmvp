import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const APPOINTMENT_TYPES = [
  { value: 'phone', label: 'Llamada Telefónica' },
  { value: 'office', label: 'Visita en Oficina' },
  { value: 'video', label: 'Videollamada' },
];

const WEEKDAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function AppointmentPreferencesForm({ availability, setAvailability, saving, onSave }) {
  const handleAvailabilityChange = (field, value) => {
    setAvailability(prev => ({ ...prev, [field]: value }));
  };

  const handleToggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter(d => d !== day)
        : [...prev.days, day]
    }));
  };

  const handleToggleType = (type) => {
    setAvailability(prev => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter(t => t !== type)
        : [...prev.types, type]
    }));
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label>Días disponibles</Label>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map(day => (
            <Button
              key={day}
              type="button"
              variant="outline"
              className={availability.days.includes(day) ? 'bg-muted text-foreground' : ''}
              onClick={() => handleToggleDay(day)}
            >
              {day}
            </Button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Horarios disponibles</Label>
        <Input
          type="text"
          placeholder="Ej: 09:00-13:00, 15:00-18:00"
          value={availability.hours}
          onChange={e => handleAvailabilityChange('hours', e.target.value)}
        />
        <div className="text-xs text-muted-foreground">Puedes poner varios rangos separados por coma.</div>
      </div>
      <div className="space-y-2">
        <Label>Tipos de cita disponibles</Label>
        <div className="flex flex-wrap gap-2">
          {APPOINTMENT_TYPES.map(type => (
            <Button
              key={type.value}
              type="button"
              variant="outline"
              className={availability.types.includes(type.value) ? 'bg-muted text-foreground' : ''}
              onClick={() => handleToggleType(type.value)}
            >
              {type.label}
            </Button>
          ))}
        </div>
      </div>
      {onSave && (
        <Button
          onClick={onSave}
          disabled={saving}
          className="w-full mt-4 py-3 text-lg font-bold bg-primary text-white hover:bg-primary/90"
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar cambios de disponibilidad'}
        </Button>
      )}
    </div>
  );
} 