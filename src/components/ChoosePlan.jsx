import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { PLANS, createSubscriptionCheckout } from '@/services/stripeService';
import stripePromise from '@/lib/stripeClient';
import { useLocation, useNavigate } from 'react-router-dom';

const ChoosePlan = () => {
  const { client } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    // Mensaje de éxito tras el pago
    const params = new URLSearchParams(location.search);
    if (params.get('success')) {
      toast({
        title: '¡Pago exitoso!',
        description: 'Tu suscripción se activó correctamente. Ahora puedes continuar con la configuración.',
        variant: 'success'
      });
      navigate('/onboarding', { replace: true });
    } else if (params.get('canceled')) {
      toast({
        title: 'Pago cancelado',
        description: 'No se completó el pago. Debes elegir un plan para continuar.',
        variant: 'destructive'
      });
      navigate('/choose-plan', { replace: true });
    }
  }, [location.search, navigate, toast]);

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

  return (
    <>
      <Helmet>
        <title>Elige tu plan - NNIA</title>
      </Helmet>
      <div className="space-y-8 max-w-3xl mx-auto mt-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Elige tu plan</h1>
            <p className="text-muted-foreground">Debes suscribirte para continuar. Elige el plan que mejor se adapte a tu negocio.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {Object.values(PLANS).map(plan => (
            <Card key={plan.name}>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  {plan.name}
                  <Badge variant="secondary">Nuevo</Badge>
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
                  disabled={processing}
                  onClick={() => handleSubscribe(plan)}
                >
                  Elegir este plan
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
        {processing && (
          <div className="flex justify-center items-center mt-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2 text-muted-foreground">Redirigiendo a Stripe...</span>
          </div>
        )}
      </div>
    </>
  );
};

export default ChoosePlan; 