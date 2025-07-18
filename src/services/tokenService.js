import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export class TokenService {
  // Obtener uso de tokens por fuente
  static async getTokenUsageBySource(clientId, monthYear = null) {
    try {
      const params = monthYear ? { monthYear } : {};
      const response = await axios.get(`${API_URL}/nnia/tokens/usage/${clientId}`, { params });
      return response.data.usage;
    } catch (error) {
      console.error('Error getting token usage by source:', error);
      throw error;
    }
  }

  // Obtener resumen de tokens del cliente
  static async getClientTokenSummary(clientId) {
    try {
      const response = await axios.get(`${API_URL}/nnia/tokens/summary/${clientId}`);
      return response.data.summary;
    } catch (error) {
      console.error('Error getting client token summary:', error);
      throw error;
    }
  }

  // Verificar si el cliente tiene tokens suficientes
  static async checkClientTokens(clientId, estimatedTokens) {
    try {
      const response = await axios.post(`${API_URL}/nnia/tokens/check`, {
        clientId,
        estimatedTokens
      });
      return response.data.check;
    } catch (error) {
      console.error('Error checking client tokens:', error);
      throw error;
    }
  }

  // Consumir tokens del cliente
  static async consumeClientTokens(clientId, tokensToConsume, source, conversationId, messageLength, modelUsed = 'gpt-4') {
    try {
      const response = await axios.post(`${API_URL}/nnia/tokens/consume`, {
        clientId,
        tokensToConsume,
        source,
        conversationId,
        messageLength,
        modelUsed
      });
      return response.data.success;
    } catch (error) {
      console.error('Error consuming client tokens:', error);
      throw error;
    }
  }

  // Estimar tokens basado en longitud del mensaje
  static estimateTokens(messageLength) {
    // Estimación aproximada: 1.3 tokens por palabra promedio
    // Una palabra promedio tiene ~4.5racteres
    const estimatedWords = messageLength / 4.5;
    return Math.ceil(estimatedWords * 1.3);
  }

  // Obtener límites de tokens por plan
  static getPlanLimits(plan) {
    const limits = {
      basic: 1000,
      pro: 40000,
      premium:100000
    };
    return limits[plan] || 100;
  }

  // Verificar si el cliente puede usar el servicio
  static async canClientUseService(clientId, estimatedTokens) {
    try {
      const tokenCheck = await this.checkClientTokens(clientId, estimatedTokens);
      return tokenCheck?.has_sufficient_tokens || false;
    } catch (error) {
      console.error('Error checking if client can use service:', error);
      return false;
    }
  }

  // Formatear tokens para mostrar
  static formatTokens(tokens) {
    if (tokens >= 100000) {
      return `${(tokens / 100000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  }

  // Calcular porcentaje de uso
  static calculateUsagePercentage(tokensUsed, planLimit) {
    return Math.min((tokensUsed / planLimit) * 100, 100);
  }
} 