import { supabase } from '../lib/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Obtener reservas del cliente
export async function getReservations(clientId) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservations?clientId=${clientId}`);
    const data = await response.json();
    if (data.success) {
      return data.reservations;
    } else {
      throw new Error(data.error || 'Error al obtener reservas');
    }
  } catch (error) {
    console.error('Error fetching reservations:', error);
    throw error;
  }
}

// Crear una nueva reserva
export async function createReservation(reservationData) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reservationData),
    });
    const data = await response.json();
    if (data.success) {
      return data.reservation;
    } else {
      throw new Error(data.error || 'Error al crear reserva');
    }
  } catch (error) {
    console.error('Error creating reservation:', error);
    throw error;
  }
}

// Actualizar una reserva
export async function updateReservation(id, updates) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (data.success) {
      return data.reservation;
    } else {
      throw new Error(data.error || 'Error al actualizar reserva');
    }
  } catch (error) {
    console.error('Error updating reservation:', error);
    throw error;
  }
}

// Eliminar una reserva
export async function deleteReservation(id) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservations/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.success) {
      return true;
    } else {
      throw new Error(data.error || 'Error al eliminar reserva');
    }
  } catch (error) {
    console.error('Error deleting reservation:', error);
    throw error;
  }
}

// Obtener tipos de reserva
export async function getReservationTypes(clientId) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservation-types?clientId=${clientId}`);
    const data = await response.json();
    if (data.success) {
      return data.types;
    } else {
      throw new Error(data.error || 'Error al obtener tipos de reserva');
    }
  } catch (error) {
    console.error('Error fetching reservation types:', error);
    throw error;
  }
}

// Crear tipo de reserva
export async function createReservationType(typeData) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservation-types`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(typeData),
    });
    const data = await response.json();
    if (data.success) {
      return data.type;
    } else {
      throw new Error(data.error || 'Error al crear tipo de reserva');
    }
  } catch (error) {
    console.error('Error creating reservation type:', error);
    throw error;
  }
}

// Actualizar tipo de reserva
export async function updateReservationType(id, updates) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservation-types/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    const data = await response.json();
    if (data.success) {
      return data.type;
    } else {
      throw new Error(data.error || 'Error al actualizar tipo de reserva');
    }
  } catch (error) {
    console.error('Error updating reservation type:', error);
    throw error;
  }
}

// Eliminar tipo de reserva
export async function deleteReservationType(id) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservation-types/${id}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    if (data.success) {
      return data.type;
    } else {
      throw new Error(data.error || 'Error al eliminar tipo de reserva');
    }
  } catch (error) {
    console.error('Error deleting reservation type:', error);
    throw error;
  }
}

// Obtener disponibilidad de reservas
export async function getReservationAvailability(clientId) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservation-availability?clientId=${clientId}`);
    const data = await response.json();
    if (data.success) {
      return data.availability;
    } else {
      throw new Error(data.error || 'Error al obtener disponibilidad');
    }
  } catch (error) {
    console.error('Error fetching reservation availability:', error);
    throw error;
  }
}

// Guardar disponibilidad de reservas
export async function setReservationAvailability(clientId, availability) {
  try {
    const response = await fetch(`${API_URL}/nnia/reservation-availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientId,
        ...availability,
      }),
    });
    const data = await response.json();
    if (data.success) {
      return data.availability;
    } else {
      throw new Error(data.error || 'Error al guardar disponibilidad');
    }
  } catch (error) {
    console.error('Error setting reservation availability:', error);
    throw error;
  }
} 