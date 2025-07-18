import { supabase } from '@/lib/supabaseClient';
import axios from 'axios';

// Configuración de planes y precios (actualizado a modo LIVE)
export const PLANS = {
  starter: {
    name: 'Starter',
    price: 19,
    tokens: 20000,
    priceId: 'price_1Rlr8LGmx15fN3tsakY4AVjH',
    features: ['20K tokens/mes', 'Soporte básico', 'Widget básico']
  },
  pro: {
    name: 'Pro',
    price: 49,
    tokens: 50000,
    priceId: 'price_1Rlr97Gmx15fN3tsINg8pjBW',
    features: ['50K tokens/mes', 'Soporte prioritario', 'Analytics avanzados', 'Integraciones']
  },
  business: {
    name: 'Business',
    price: 99,
    tokens: 150000,
    priceId: 'price_1Rlr9iGmx15fN3tsXAwk7jPS',
    features: ['150K tokens/mes', 'Soporte 24/7', 'API personalizada', 'Onboarding dedicado']
  }
};

export const TOKEN_PACKS = {
  pack_20k: {
    name: '20,000 tokens',
    price: 5,
    tokens: 20000,
    priceId: 'price_1RlrFDGmx15fN3tsGT1dKoI0'
  },
  pack_50k: {
    name: '50,000 tokens',
    price: 10,
    tokens: 50000,
    priceId: 'price_1RlrFjGmx15fN3tsRiGEGlfd'
  },
  pack_150k: {
    name: '150,000 tokens',
    price: 25,
    tokens: 150000,
    priceId: 'price_1RlrHmGmx15fN3tsT4S0pKse'
  }
};

// Obtener suscripción actual del cliente (solo plan gratuito por ahora)
export const getCurrentSubscription = async (clientId) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('client_id', clientId)
      .single();

    if (error) {
      // Si no hay suscripción, retornar null en vez de crear una gratuita
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    throw error;
  }
};

// Consumir tokens (solo verificación local)
export const consumeTokens = async (clientId, messageLength) => {
  try {
    const estimatedTokens = Math.ceil(messageLength * 1.2);
    
    const { data, error } = await supabase
      .from('subscriptions')
      .select('tokens_remaining')
      .eq('client_id', clientId)
      .single();

    if (error) {
      throw error;
    }

    if (data.tokens_remaining < estimatedTokens) {
      throw new Error('Insufficient tokens');
    }

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ 
        tokens_remaining: data.tokens_remaining - estimatedTokens 
      })
      .eq('client_id', clientId);

    if (updateError) {
      throw updateError;
    }

    return {
      tokensUsed: estimatedTokens,
      tokensRemaining: data.tokens_remaining - estimatedTokens
    };
  } catch (error) {
    console.error('Error consuming tokens:', error);
    throw error;
  }
};

// Iniciar checkout de suscripción
export const createSubscriptionCheckout = async (priceId, clientId) => {
  const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/create-checkout-session`, {
    priceId,
    clientId,
    mode: 'subscription'
  });
  return data.sessionId;
};

// Iniciar checkout de compra de tokens
export const createTokenCheckout = async (priceId, clientId) => {
  const { data } = await axios.post(`${import.meta.env.VITE_API_URL}/api/create-checkout-session`, {
    priceId,
    clientId,
    mode: 'payment'
  });
  return data.sessionId;
};

export const cancelSubscription = async (subscriptionId) => {
  throw new Error('Stripe integration temporarily disabled');
};

export const updateSubscription = async (subscriptionId, newPriceId) => {
  throw new Error('Stripe integration temporarily disabled');
};

export const getPaymentHistory = async (clientId) => {
  return []; // Retorna array vacío por ahora
}; 