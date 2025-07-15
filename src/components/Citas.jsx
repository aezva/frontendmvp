import React, { useEffect, useState } from 'react';
import { Loader2, Pencil, Trash2, CheckCircle2, XCircle, Clock } from 'lucide-react';
import AppointmentPreferencesForm from './AppointmentPreferencesForm';
import { fetchAppointments, fetchAvailability, saveAvailability, updateAppointment, deleteAppointment } from '@/services/appointmentsService';
import { useAuth } from '@/contexts/AuthContext';

const DEFAULT_AVAILABILITY = { days: [], hours: '', types: ['phone', 'office', 'video'] };
const STATUS_LABELS = {
  pending: { label: 'Pendiente', icon: <Clock className="inline mr-1 text-yellow-500" size={18} /> },
  completed: { label: 'Completada', icon: <CheckCircle2 className="inline mr-1 text-green-600" size={18} /> },
  cancelled: { label: 'No realizada', icon: <XCircle className="inline mr-1 text-red-500" size={18} /> },
};

function groupByStatus(appointments) {
  return appointments.reduce((acc, appt) => {
    const status = appt.status || 'pending';
    if (!acc[status]) acc[status] = [];
    acc[status].push(appt);
    return acc;
  }, {});
}

// Definir los estados de las citas y sus etiquetas
const estadosCita = [
  { key: 'pending', label: 'Próximas', color: 'text-[#ff9c9c]' },
  { key: 'no_show', label: 'No Realizadas', color: 'text-yellow-500' },
  { key: 'completed', label: 'Exitosas', color: 'text-green-500' },
];

export default function Citas() {
  const { client, loading: authLoading } = useAuth();
  const [availability, setAvailability] = useState(DEFAULT_AVAILABILITY);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // cita en edición
  const [editData, setEditData] = useState({});
  const [deleting, setDeleting] = useState(null); // cita a eliminar

  // Lógica de drag & drop para citas
  const [draggedCita, setDraggedCita] = useState(null);
  const onDragStartCita = (e, id) => {
    setDraggedCita(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const onDropCita = async (e, estado) => {
    e.preventDefault();
    if (!draggedCita) return;
    const cita = appointments.find(c => c.id === draggedCita);
    if (cita.status !== estado) {
      // Aquí deberías llamar a tu servicio para actualizar el estado de la cita
      // await updateAppointmentStatus(draggedCita, estado);
      setAppointments(prev => prev.map(c => c.id === draggedCita ? { ...c, status: estado } : c));
    }
    setDraggedCita(null);
  };

  useEffect(() => {
    if (!client) return;
    setLoading(true);
    Promise.all([
      fetchAppointments(client.id),
      fetchAvailability(client.id)
    ])
      .then(([appts, avail]) => {
        setAppointments(Array.isArray(appts) ? appts : []);
        setAvailability(avail || DEFAULT_AVAILABILITY);
        setError(null);
      })
      .catch(() => {
        setAppointments([]);
        setError('No se pudo cargar la información de citas');
      })
      .finally(() => setLoading(false));
  }, [client]);

  const handleSave = async () => {
    if (!client) return;
    setSaving(true);
    try {
      await saveAvailability({ ...availability, clientId: client.id });
      setError(null);
    } catch {
      setError('No se pudo guardar la disponibilidad');
    }
    setSaving(false);
  };

  const handleEdit = (appt) => {
    setEditing(appt.id);
    setEditData({ ...appt });
  };

  const handleEditChange = (field, value) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleEditSave = async () => {
    try {
      const updated = await updateAppointment(editing, editData);
      setAppointments(appts => appts.map(a => a.id === editing ? updated : a));
      setEditing(null);
    } catch {
      setError('No se pudo actualizar la cita');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteAppointment(deleting);
      setAppointments(appts => appts.filter(a => a.id !== deleting));
      setDeleting(null);
    } catch {
      setError('No se pudo eliminar la cita');
    }
  };

  const handleStatusChange = async (appt, newStatus) => {
    try {
      const updated = await updateAppointment(appt.id, { status: newStatus });
      setAppointments(appts => appts.map(a => a.id === appt.id ? updated : a));
    } catch {
      setError('No se pudo cambiar el estado');
    }
  };

  if (authLoading || !client) {
    return <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Cargando...</div>;
  }

  const grouped = groupByStatus(appointments);

  return (
    <div className="flex flex-col flex-1 min-h-0 h-full w-full">
      <h1 className="text-xl font-semibold tracking-tight mb-6">Citas</h1>
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />Cargando...</div>
      )}
      {error && (
        null
      )}
      <div className="flex flex-1 gap-6 min-h-0">
        {/* Columna izquierda: Preferencias/configuración */}
        <div className="w-full md:w-1/3 flex flex-col min-h-0 h-full">
          <section className="flex flex-col flex-1 bg-white/80 border rounded-xl p-6 h-full">
            <h2 className="text-base font-medium text-black mb-4">Configura tu Disponibilidad</h2>
            <AppointmentPreferencesForm
              availability={availability}
              setAvailability={setAvailability}
              saving={saving}
              onSave={handleSave}
            />
          </section>
        </div>
        {/* Columna derecha: Lista de citas */}
        <div className="w-full md:w-2/3 flex flex-col min-h-0 h-full">
          <section className="flex flex-col flex-1 bg-white/80 border rounded-xl p-6 h-full min-h-0">
            <h2 className="text-base font-medium text-black mb-4">Citas Agendadas</h2>
            <div className="flex flex-col gap-6 min-h-0 flex-1">
              {estadosCita.map(({ key, label, color }) => (
                <div key={key} className="flex-1 flex flex-col min-h-[120px]">
                  <div className="mb-2 text-black text-sm font-normal">{label}</div>
                  <div
                    className="flex flex-col gap-3 min-h-[60px] flex-1"
                    onDrop={e => onDropCita(e, key)}
                    onDragOver={e => e.preventDefault()}
                    style={{ minHeight: '60px' }}
                  >
                    {appointments.filter(c => c.status === key).map(cita => (
                      <div
                        key={cita.id}
                        draggable
                        onDragStart={e => onDragStartCita(e, cita.id)}
                        className="flex items-center bg-white rounded-lg border px-3 py-2 shadow-sm cursor-move group"
                      >
                        <span className="flex-1 text-sm font-normal text-black truncate">{cita.name} - {cita.date} {cita.time}</span>
                        <span className="ml-2 text-xs text-gray-400">{cita.type}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
      {/* Modal de confirmación de eliminación */}
      {deleting && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
            <h3 className="text-lg font-bold mb-4">¿Eliminar cita?</h3>
            <p className="mb-4">Esta acción no se puede deshacer.</p>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 bg-gray-300 rounded" onClick={() => setDeleting(null)}>Cancelar</button>
              <button className="px-4 py-2 bg-red-600 text-white rounded" onClick={handleDelete}>Eliminar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 