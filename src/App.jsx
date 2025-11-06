
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import LoginPage from '@/components/LoginPage';
import Dashboard from '@/components/Dashboard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';

function App() {
  const { user, session, loading } = useAuth();
  const [showCapitalModal, setShowCapitalModal] = useState(false);
  const [initialCapital, setInitialCapital] = useState('');
  const [currentMonthYear, setCurrentMonthYear] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    const checkCapital = async () => {
      if (user) {
        const monthYear = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
        setCurrentMonthYear(monthYear);

        const { data, error } = await supabase
          .from('capital')
          .select('initial_capital')
          .eq('user_id', user.id)
          .eq('month_year', monthYear)
          .single();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
          console.error("Error fetching capital:", error);
        }

        if (!data) {
          setShowCapitalModal(true);
        }
      }
    };
    checkCapital();
  }, [user]);

  const handleSaveInitialCapital = async () => {
    const newInitial = parseFloat(initialCapital) || 0;
    if (!user || newInitial <= 0) {
      toast({ title: "Valor inválido", description: "Por favor, insira um capital inicial válido.", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('capital')
      .insert({
        user_id: user.id,
        month_year: currentMonthYear,
        initial_capital: newInitial
      });

    if (error) {
      toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Capital Definido! 💰",
        description: "O capital inicial para este mês foi salvo com sucesso!"
      });
      setShowCapitalModal(false);
      setInitialCapital('');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>K-TRADER - Controle de Trades</title>
        <meta name="description" content="Sistema profissional de controle e gerenciamento de trades de criptomoedas" />
      </Helmet>
      
      <div className="min-h-screen">
        {!session ? <LoginPage /> : <Dashboard userProfile={user} />}
      </div>

      <Dialog open={showCapitalModal} onOpenChange={setShowCapitalModal}>
        <DialogContent className="glass-effect border-slate-700" onInteractOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Definir Capital Inicial do Mês</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <p className="text-slate-300">Por favor, informe o seu capital inicial para o mês de <span className="font-bold text-yellow-400 capitalize">{currentMonthYear}</span>.</p>
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Capital Inicial (USD)
              </label>
              <input
                type="number"
                step="0.01"
                value={initialCapital}
                onChange={(e) => setInitialCapital(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
                placeholder="0.00"
              />
            </div>
            <Button
              onClick={handleSaveInitialCapital}
              className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
            >
              Salvar Capital
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default App;
