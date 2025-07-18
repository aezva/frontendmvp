import React, { useState, useEffect } fromreact';
import { Card, CardContent, CardHeader, CardTitle } from @/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from @/components/ui/badge;
import { 
  Zap, 
  MessageSquare, 
  Globe,
  TrendingUp,
  AlertCircle,
  Loader2
} from 'lucide-react;
import { motion } fromframer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { TokenService } from@/services/tokenService';
import { useToast } from@/components/ui/use-toast';

const TokenStats = () => [object Object]  const { client } = useAuth();
  const { toast } = useToast();
  const [tokenSummary, setTokenSummary] = useState(null);
  const [tokenUsage, setTokenUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentMonth] = useState(new Date().toISOString().slice(0 7YY-MM

  useEffect(() =>[object Object]    if (client)[object Object]     loadTokenData();
    }
  }, [client]);

  const loadTokenData = async () =>[object Object]   try [object Object]   setLoading(true);
      const [summary, usage] = await Promise.all([
        TokenService.getClientTokenSummary(client.id),
        TokenService.getTokenUsageBySource(client.id, currentMonth)
      ]);
      
      setTokenSummary(summary);
      setTokenUsage(usage);
    } catch (error) {
      console.error('Error loading token data:', error);
      toast([object Object]     title: 'Error',
        description: 'No se pudieron cargar las estadísticas de tokens,
        variant: 'destructive'
      });
    } finally [object Object]  setLoading(false);
    }
  };

  const getUsagePercentage = () => {
    if (!tokenSummary) return0   const planLimit = TokenService.getPlanLimits(tokenSummary.plan);
    return TokenService.calculateUsagePercentage(tokenSummary.tokens_used_this_month, planLimit);
  };

  const getUsageColor = (percentage) => {
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 75eturn 'text-yellow-600;
    return text-green-60
  };

  const getUsageIcon = (percentage) => {
    if (percentage >=90eturn <AlertCircle className=h-4 w-4text-red-600    if (percentage >=75) return <TrendingUp className="h-4-4ext-yellow-60 />;
    return <Zap className="h-4w-4text-green-60 />; };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3>        <CardTitle className="text-sm font-medium">Estadísticas de Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className=flex items-center justify-center h-20           <Loader2 className="h-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!tokenSummary) {
    return (
      <Card className="w-full">
        <CardHeader className="pb-3>        <CardTitle className="text-sm font-medium">Estadísticas de Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            <AlertCircle className="h-8 w-8 mx-auto mb-2 />
            <p className="text-sm">No se pudieron cargar las estadísticas</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = getUsagePercentage();
  const usageColor = getUsageColor(usagePercentage);
  const usageIcon = getUsageIcon(usagePercentage);

  return (
    <motion.div
      initial={{ opacity:00}
      animate=[object Object]{ opacity: 1, y: 0 }}
      transition={{ duration: 05
    >
      <Card className="w-full">
        <CardHeader className="pb-3>        <CardTitle className="text-sm font-medium flex items-center gap-2>
            <Zap className="h-4 w-4
            Estadísticas de Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4
   [object Object]/* Resumen General */}
          <div className="space-y-3>
            <div className=flex items-center justify-between>             <span className="text-sm font-medium">Plan Actual</span>
              <Badge variant="secondary" className="capitalize>
                {tokenSummary.plan}
              </Badge>
            </div>
            
            <div className=flex items-center justify-between>             <span className="text-sm font-medium">Tokens Disponibles</span>
              <span className={`text-sm font-semibold ${usageColor}`}>
                {TokenService.formatTokens(tokenSummary.total_tokens_available)}
              </span>
            </div>

            <div className=flex items-center justify-between>             <span className="text-sm font-medium">Uso del Mes</span>
              <div className=flex items-center gap-2>
                {usageIcon}
                <span className={`text-sm font-semibold ${usageColor}`}>
                  {TokenService.formatTokens(tokenSummary.tokens_used_this_month)}
                </span>
              </div>
            </div>
          </div>

          {/* Barra de Progreso */}
          <div className="space-y-2>
            <div className=flex items-center justify-between text-xs text-muted-foreground>             <span>Uso del Plan</span>
              <span>{usagePercentage.toFixed(1)}%</span>
            </div>
            <Progress value={usagePercentage} className=h-2/>
          </div>

          {/* Uso por Fuente */}
          {tokenUsage.length > 0&& (
            <div className="space-y-3>
              <h4 className="text-sm font-medium>Uso por Fuente</h4              <div className="space-y-2>
                {tokenUsage.map((usage, index) => (
                  <div key={index} className=flex items-center justify-between text-sm">
                    <div className=flex items-center gap-2">
                     [object Object]usage.source === 'widget' ? (
                        <Globe className=h-3 w-3 text-blue-600" />
                      ) : (
                        <MessageSquare className="h-3w-3ext-green-600" />
                      )}
                      <span className="capitalize">
                       [object Object]usage.source === widget' ?Widget' : 'Panel'}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {TokenService.formatTokens(usage.tokens_used)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                    [object Object]usage.conversation_count} conversaciones
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tokens Comprados */}
          {tokenSummary.tokens_bought_separately > 0&& (
            <div className="pt-2 border-t>              <div className=flex items-center justify-between text-sm>
                <span className="text-muted-foreground>Tokens Comprados</span>
                <span className="font-medium text-green-600">
                  {TokenService.formatTokens(tokenSummary.tokens_bought_separately)}
                </span>
              </div>
            </div>
          )}

          {/* Advertencia si está cerca del límite */}
        [object Object]usagePercentage >= 75&& (
            <div className="p-3 bg-yellow-50rder border-yellow-200lg>              <div className=flex items-center gap-2text-yellow-800>
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                [object Object]usagePercentage >= 90 
                    ?¡Casi sin tokens!' 
                    : 'Uso alto de tokens'
                  }
                </span>
              </div>
              <p className="text-xs text-yellow-700 mt-1>
              [object Object]usagePercentage >= 90 
                  ?Considera actualizar tu plan o comprar tokens adicionales.'
                  : 'Estás usando muchos tokens este mes.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TokenStats; 