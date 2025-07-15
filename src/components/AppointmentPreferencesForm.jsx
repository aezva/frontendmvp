import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

const APPOINTMENT_TYPES = [
  { value: 'office', label: 'Visita en Oficina' },
  { value: 'phone', label: 'Llamada Telefónica' },
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
        <Label className="text-black text-sm font-normal">Días disponibles</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {WEEKDAYS.map(day => (
            <button
              key={day}
              type="button"
              className={`text-sm font-normal select-none cursor-pointer bg-transparent border-none shadow-none outline-none focus:outline-none transition-colors p-0 m-0 ${availability.days.includes(day) ? 'text-[#ff9c9c]' : 'text-gray-500'} hover:text-[#ff9c9c]`}
              style={{ minWidth: 'unset' }}
              onClick={() => handleToggleDay(day)}
            >
              {day}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label className="text-black text-sm font-normal">Horarios disponibles</Label>
        <Input
          type="text"
          placeholder="Ej: 09:00-13:00, 15:00-18:00"
          value={availability.hours}
          onChange={e => handleAvailabilityChange('hours', e.target.value)}
          className="text-sm font-normal text-gray-500 placeholder-gray-500"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-black text-sm font-normal">Tipos de cita disponibles</Label>
        <div className="flex flex-wrap gap-3 mt-1">
          {APPOINTMENT_TYPES.map(type => (
            <button
              key={type.value}
              type="button"
              className={`text-sm font-normal select-none cursor-pointer bg-transparent border-none shadow-none outline-none focus:outline-none transition-colors p-0 m-0 ${availability.types.includes(type.value) ? 'text-[#ff9c9c]' : 'text-gray-500'} hover:text-[#ff9c9c]`}
              style={{ minWidth: 'unset' }}
              onClick={() => handleToggleType(type.value)}
            >
              {type.label}
            </button>
          ))}
        </div>
      </div>
      {onSave && (
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="w-full mt-4 px-6 py-2 rounded-md bg-[#ff9c9c] text-black text-base font-normal transition-none focus:outline-none border-none shadow-none"
          style={{ background: '#ff9c9c' }}
        >
          {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Guardar'}
        </button>
      )}
    </div>
  );
} 