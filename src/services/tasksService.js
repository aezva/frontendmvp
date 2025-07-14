import { supabase } from '@/lib/supabaseClient';

export async function fetchTasks(clientId) {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export async function createTask(clientId, task) {
  const { data, error } = await supabase
    .from('tasks')
    .insert([{ ...task, client_id: clientId }])
    .select();
  if (error) throw error;
  return data[0];
}

export async function updateTask(taskId, updates) {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select();
  if (error) throw error;
  return data[0];
}

export async function deleteTask(taskId) {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', taskId);
  if (error) throw error;
  return true;
} 