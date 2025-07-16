import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { fetchTasks, createTask, updateTask, deleteTask } from '@/services/tasksService';
import { Helmet } from 'react-helmet';
import { Loader2, Edit, Trash2, Check, X, GripVertical, Clock, CheckCircle2, Loader } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const estados = [
  { key: 'pending', label: 'Pendientes', color: 'text-[#ff9c9c]', icon: Clock },
  { key: 'in_progress', label: 'En Progreso', color: 'text-blue-500', icon: Loader2 },
  { key: 'completed', label: 'Completadas', color: 'text-green-500', icon: CheckCircle2 },
];

const estadoColor = {
  pending: 'text-[#ff9c9c]',
  in_progress: 'text-blue-500',
  completed: 'text-green-500',
};

function Tareas() {
  const { client } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTask, setNewTask] = useState('');
  const [editId, setEditId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [dragged, setDragged] = useState(null);
  const [error, setError] = useState(null);
  const [renderError, setRenderError] = useState(null);

  useEffect(() => {
    if (!client) {
      setLoading(false);
      setTasks([]);
      setError('No hay usuario autenticado.');
      return;
    }
    setLoading(true);
    setError(null);
    fetchTasks(client.id)
      .then(data => {
        setTasks(Array.isArray(data) ? data : []);
        setError(null);
      })
      .catch(e => {
        setError('Error al cargar tareas: ' + (e?.message || e));
        setTasks([]);
      })
      .finally(() => setLoading(false));
  }, [client]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newTask.trim()) return;
    const task = await createTask(client.id, { name: newTask, status: 'pending' });
    setTasks((prev) => [...prev, task]);
    setNewTask('');
  };

  const handleEdit = async (id) => {
    if (!editValue.trim()) return;
    const updated = await updateTask(id, { name: editValue });
    setTasks((prev) => prev.map(t => t.id === id ? updated : t));
    setEditId(null);
    setEditValue('');
  };

  const handleDelete = async (id) => {
    await deleteTask(id);
    setTasks((prev) => prev.filter(t => t.id !== id));
  };

  const onDragStart = (e, id) => {
    setDragged(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = async (e, estado) => {
    e.preventDefault();
    if (!dragged) return;
    const task = tasks.find(t => t.id === dragged);
    if (task.status !== estado) {
      const updated = await updateTask(dragged, { status: estado });
      setTasks((prev) => prev.map(t => t.id === dragged ? updated : t));
    }
    setDragged(null);
  };

  const onDragOver = (e) => {
    e.preventDefault();
  };

  // Try/catch visual para el render
  try {
    return (
      <div className="flex flex-col flex-1 min-h-0 h-full w-full">
        <Helmet><title>Tareas - NNIA</title></Helmet>
        <h1 className="text-xl font-semibold tracking-tight mb-6">Tareas</h1>
        <form onSubmit={handleCreate} className="flex gap-2 mb-4">
          <Input
            value={newTask}
            onChange={e => setNewTask(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1 min-w-0"
          />
          <button
            type="submit"
            className="px-6 py-2 rounded-md bg-[#ff9c9c] text-black text-base font-normal transition-none focus:outline-none border-none shadow-none"
            style={{ background: '#ff9c9c' }}
          >
            Crear tarea
          </button>
        </form>
        {loading ? (
          <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
        ) : error ? (
          <div className="text-center text-red-500 py-8">{error}</div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 min-h-0">
            {Array.isArray(estados) && estados.map(({ key, label, color }) => (
              <Card
                key={key}
                className="bg-card/50 backdrop-blur-sm hover:shadow-sm transition-shadow p-4 flex flex-col min-h-0 h-full"
                onDrop={e => onDrop(e, key)}
                onDragOver={onDragOver}
              >
                <h2 className="text-base font-medium text-black mb-4 flex items-center">
                  <estado.icon className="mr-3 h-5 w-5" style={{ color: '#ff9c9c' }} strokeWidth={1.5} />
                  {label}
                </h2>
                <div className="flex flex-col gap-3 min-h-[200px] flex-1">
                  <AnimatePresence>
                    {Array.isArray(tasks) && tasks.filter(t => t.status === key).map(task => (
                      <motion.div
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        draggable
                        onDragStart={e => onDragStart(e, task.id)}
                        className="flex items-center bg-white rounded-lg border px-3 py-2 shadow-sm cursor-move group"
                      >
                        <GripVertical className="mr-2 h-4 w-4 text-gray-300 group-hover:text-gray-400" />
                        {editId === task.id ? (
                          <form onSubmit={e => { e.preventDefault(); handleEdit(task.id); }} className="flex-1 flex gap-2">
                            <Input
                              value={editValue}
                              onChange={e => setEditValue(e.target.value)}
                              className="flex-1 text-sm h-auto py-0"
                              autoFocus
                            />
                            <div className="flex items-center ml-2" style={{gap: '8px'}}>
                              <button type="submit" className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                                <Check className="h-4 w-4 text-[#ff9c9c]" />
                              </button>
                              <button type="button" onClick={() => setEditId(null)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                                <X className="h-4 w-4 text-[#ff9c9c]" />
                              </button>
                            </div>
                          </form>
                        ) : (
                          <>
                            <span className="flex-1 text-sm font-normal text-black truncate">{task.name}</span>
                            <div className="flex gap-2 ml-2">
                              <button onClick={() => { setEditId(task.id); setEditValue(task.name); }} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                                <Edit className="h-4 w-4 text-[#ff9c9c]" />
                              </button>
                              <button onClick={() => handleDelete(task.id)} className="p-0 m-0 bg-transparent border-none shadow-none focus:outline-none active:outline-none">
                                <Trash2 className="h-4 w-4 text-[#ff9c9c]" />
                              </button>
                            </div>
                          </>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  } catch (e) {
    return <div className="text-center text-red-500 py-8">Error inesperado en el render: {e.message || String(e)}</div>;
  }
}

export default Tareas; 