import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  Calendar, 
  AlertCircle,
  Check,
  Loader2,
  Crown,
  Star,
  Rocket
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { 
  getCurrentSubscription,
  consumeTokens,
  PLANS,
  TOKEN_PACKS,
  createSubscriptionCheckout,
  createTokenCheckout
} from '@/services/stripeService';
import stripePromise from '@/lib/stripeClient';
import { useLocation, useNavigate } from 'react-router-dom';

const Subscription = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (client) {
      loadSubscription();
    }
  }, [client]);

  useEffect(() => {
    // Mensaje de éxito/error tras el pago
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      toast({
        title: '¡Pago exitoso!',
        description: 'Tu suscripción o compra de tokens se procesó correctamente.',
        variant: 'success'
      });
      // Limpiar la URL
      navigate('/subscription', { replace: true });
      // Recargar la suscripción
      loadSubscription();
    } else if (params.get('canceled')) {
      toast({
        title: 'Pago cancelado',
        description: 'No se completó el pago. Puedes intentarlo de nuevo.',
        variant: 'destructive'
      });
      navigate('/subscription', { replace: true });
    }
  }, [location.search]);

  const loadSubscription = async () => {
    try {
      setLoading(true);
      const data = await getCurrentSubscription(client.id);
      setSubscription(data);
    } catch (error) {
      console.error('Error loading subscription:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la información de suscripción',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (plan) => {
    if (!client) return;
    setProcessing(true);
    try {
      const sessionId = await createSubscriptionCheckout(plan.priceId, client.id);
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo iniciar el pago', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const handleBuyTokens = async (pack) => {
    if (!client) return;
    setProcessing(true);
    try {
      const sessionId = await createTokenCheckout(pack.priceId, client.id);
      const stripe = await stripePromise;
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      toast({ title: 'Error', description: 'No se pudo iniciar la compra de tokens', variant: 'destructive' });
    } finally {
      setProcessing(false);
    }
  };

  const getTokenUsagePercentage = () => {
    if (!subscription) return 0;
    const plan = Object.values(PLANS).find(p => p.name.toLowerCase() === (subscription.plan || '').toLowerCase());
    const totalTokens = plan ? plan.tokens : 10000;
    return ((totalTokens - subscription.tokens_remaining) / totalTokens) * 100;
  };

  const formatTokens = (tokens) => {
    if (tokens >= 1000000) {
      return `${(tokens / 1000000).toFixed(1)}M`;
    } else if (tokens >= 1000) {
      return `${(tokens / 1000).toFixed(0)}K`;
    }
    return tokens.toString();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Plan actual del usuario
  const currentPlan = subscription && Object.values(PLANS).find(p => p.name.toLowerCase() === (subscription.plan || '').toLowerCase());
  // Tokens comprados aparte (rollover)
  const tokensBoughtSeparately = subscription?.tokens_bought_separately || 0;
  const totalTokensAvailable = (subscription?.tokens_remaining || 0) + tokensBoughtSeparately;

  return (
    <>
      <Helmet>
        <title>Suscripción - NNIA</title>
      </Helmet>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Suscripción</h1>
            <p className="text-muted-foreground">Gestiona tu plan y compra tokens adicionales</p>
          </div>
        </div>

        {/* Estado actual de la suscripción */}
        {subscription && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            {/* Plan actual */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <Star className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{currentPlan ? currentPlan.name : 'Plan actual'}</CardTitle>
                      <p className="text-sm text-muted-foreground">{currentPlan ? currentPlan.features[0] : ''}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                    Activo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Tokens restantes del plan:</span>
                    <span className="text-sm text-muted-foreground">
                      {formatTokens(subscription.tokens_remaining)} / {currentPlan ? formatTokens(currentPlan.tokens) : '---'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Renovación:</span>
                    <span className="text-sm text-muted-foreground">Mensual</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">Estado:</span>
                    <span className="text-sm text-muted-foreground capitalize">
                      {subscription.status}
                    </span>
                  </div>
                </div>
                {/* Barra de progreso de tokens */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uso de tokens del plan</span>
                    <span>{getTokenUsagePercentage().toFixed(1)}%</span>
                  </div>
                  <Progress value={getTokenUsagePercentage()} className="h-2" />
                </div>
                {/* Tokens comprados aparte */}
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Tokens comprados aparte</span>
                    <span className="font-medium text-green-600">{formatTokens(tokensBoughtSeparately)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-muted-foreground">Total disponible</span>
                    <span className="font-semibold">{formatTokens(totalTokensAvailable)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Planes disponibles */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Planes disponibles</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(PLANS).map(plan => (
              <Card key={plan.name} className={currentPlan && plan.name === currentPlan.name ? 'border-2 border-primary' : ''}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {plan.name}
                    {currentPlan && plan.name === currentPlan.name && (
                      <Badge variant="secondary">Actual</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">${plan.price} <span className="text-base font-normal text-muted-foreground">/mes</span></div>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-center gap-2"><Check className="h-3 w-3 text-green-600" />{f}</li>
                    ))}
                  </ul>
                  <Button
                    className="w-full mt-2"
                    disabled={processing || (currentPlan && plan.name === currentPlan.name)}
                    onClick={() => handleSubscribe(plan)}
                  >
                    {currentPlan && plan.name === currentPlan.name ? 'Plan actual' : 'Elegir este plan'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Paquetes de tokens */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Comprar tokens adicionales</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(TOKEN_PACKS).map(pack => (
              <Card key={pack.name}>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    {pack.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-2xl font-bold">${pack.price}</div>
                  <div className="text-sm text-muted-foreground">{formatTokens(pack.tokens)} tokens</div>
                  <Button
                    className="w-full mt-2"
                    disabled={processing}
                    onClick={() => handleBuyTokens(pack)}
                  >
                    Comprar
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Subscription;