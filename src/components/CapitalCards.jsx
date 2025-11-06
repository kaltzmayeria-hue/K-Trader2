import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const CapitalCards = ({ selectedMonth, trades, capitalData, onCapitalUpdate }) => {
  const { user } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [monthData, setMonthData] = useState({ initial: 0, inUse: 0, available: 0, current: 0, profit: 0 });

  useEffect(() => {
    const monthTrades = trades.filter(t => t.month_year === selectedMonth);
    
    const totalProfit = monthTrades.reduce((sum, trade) => {
      if (trade.status === 'Fechado') {
        return sum + (parseFloat(trade.result_pnl) || 0);
      }
      return sum;
    }, 0);

    const inUse = monthTrades.reduce((sum, trade) => {
      if (trade.status === 'Aberto') {
        return sum + (parseFloat(trade.position) || 0);
      }
      return sum;
    }, 0);

    const currentMonthCapital = capitalData[selectedMonth] || { initial: 0 };
    const current = currentMonthCapital.initial + totalProfit;
    const available = current - inUse;
    
    setMonthData({
      initial: currentMonthCapital.initial,
      inUse,
      available,
      current,
      profit: totalProfit
    });

  }, [selectedMonth, trades, capitalData]);

  const handleEditCapital = () => {
    setEditValue(monthData.initial?.toString() || '0');
    setShowEditModal(true);
  };

  const handleSaveCapital = async () => {
    if (!user) {
      toast({ title: "Erro", description: "Usuário não autenticado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const newInitial = parseFloat(editValue) || 0;
    
    const { data, error } = await supabase
      .from('capital')
      .upsert({ 
        user_id: user.id, 
        month_year: selectedMonth, 
        initial_capital: newInitial 
      }, { onConflict: 'user_id, month_year' });

    if (error) {
      toast({ title: "Erro ao atualizar capital", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: "Capital Atualizado! 💰",
        description: "O capital inicial foi atualizado com sucesso!"
      });
      onCapitalUpdate(); 
      setShowEditModal(false);
    }
    setIsSubmitting(false);
  };

  const profitPercent = monthData.initial > 0 ? ((monthData.profit / monthData.initial) * 100) : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-effect rounded-xl p-6 border-l-4 border-yellow-500"
        >
          <div className="flex justify-between items-start mb-2">
            <div className="text-slate-400 text-sm">Capital Inicial</div>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleEditCapital}
              className="h-8 w-8 hover:bg-slate-800"
            >
              <Edit2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="text-3xl font-bold">${monthData.initial.toFixed(2)}</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-effect rounded-xl p-6 border-l-4 border-blue-500"
        >
          <div className="text-slate-400 text-sm mb-2">Capital em Uso</div>
          <div className="text-3xl font-bold">${monthData.inUse.toFixed(2)}</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-effect rounded-xl p-6 border-l-4 border-green-500"
        >
          <div className="text-slate-400 text-sm mb-2">Capital Disponível</div>
          <div className="text-3xl font-bold">${monthData.available.toFixed(2)}</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className="glass-effect rounded-xl p-6 border-l-4 border-purple-500"
        >
          <div className="text-slate-400 text-sm mb-2">Capital Atual</div>
          <div className="text-3xl font-bold">${monthData.current.toFixed(2)}</div>
        </motion.div>

        <motion.div
          whileHover={{ scale: 1.02 }}
          className={`glass-effect rounded-xl p-6 border-l-4 ${monthData.profit >= 0 ? 'border-green-500' : 'border-red-500'}`}
        >
          <div className="text-slate-400 text-sm mb-2">Lucro/Perda Acumulado</div>
          <div className={`text-3xl font-bold ${monthData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ${monthData.profit.toFixed(2)}
          </div>
          <div className={`text-sm mt-1 ${monthData.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {profitPercent >= 0 ? '+' : ''}{profitPercent.toFixed(2)}%
          </div>
        </motion.div>
      </div>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="glass-effect border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Editar Capital Inicial</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">
                Capital Inicial (USD) para {selectedMonth}
              </label>
              <input
                type="number"
                step="0.01"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
                placeholder="0.00"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleSaveCapital}
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
              >
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Salvar'}
              </Button>
              <Button
                onClick={() => setShowEditModal(false)}
                variant="outline"
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default CapitalCards;