import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

/* ===================== Helpers ===================== */

// Aceita "0,02084" ou "0.02084"
const num = (v) => {
  if (v === null || v === undefined) return NaN;
  const s = String(v).replace(/\s+/g, '').replace(',', '.');
  const n = Number(s);
  return isFinite(n) ? n : NaN;
};

// 2 casas sempre
const fmt2 = (v) => {
  const n = num(v);
  return isFinite(n) ? n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
};

// Mapa correto (lado do FECHAMENTO):
// FECHOU com SELL => era LONG
// FECHOU com BUY  => era SHORT
const fromCloseSide = (side) => {
  if (!side) return null;
  const s = String(side).toUpperCase().trim();
  if (s === 'SELL') return 'LONG';
  if (s === 'BUY') return 'SHORT';
  return null;
};

// Deduz direção com prioridade:
// 1) side (fechamento) => regra acima
// 2) strategy se vier LONG/SHORT/BUY/SELL
// 3) coerência preço x pnl
const inferDirection = ({ side, strategy, entry_price, exit_price, result_pnl }) => {
  // 1) pelo side de fechamento (mais confiável)
  const bySide = fromCloseSide(side);
  if (bySide) return bySide;

  // 2) pelo strategy (se existir)
  if (strategy) {
    const st = String(strategy).toUpperCase();
    if (st === 'LONG' || st === 'SHORT') return st;
    if (st === 'BUY') return 'LONG';
    if (st === 'SELL') return 'SHORT';
  }

  // 3) coerência preço x pnl
  const e = num(entry_price);
  const x = num(exit_price);
  const pnl = num(result_pnl ?? 0);

  if (isFinite(e) && isFinite(x) && e > 0) {
    const d = x - e;
    if (d === 0 || pnl === 0) return 'LONG'; // neutro, assume LONG
    const sameSign = (d > 0 && pnl > 0) || (d < 0 && pnl < 0);
    return sameSign ? 'LONG' : 'SHORT';
  }

  return 'LONG'; // fallback
};

// ROI estilo Bybit: ((exit-entry)/entry) * dir * leverage * 100
const calcROI = (entry, exit, direction, leverage) => {
  const e = num(entry);
  const x = num(exit);
  const lev = isFinite(num(leverage)) ? num(leverage) : 1;

  if (!(isFinite(e) && e > 0 && isFinite(x))) return '-';

  const dir = String(direction).toUpperCase() === 'SHORT' ? -1 : 1;
  const roi = ((x - e) / e) * dir * lev * 100;

  if (!isFinite(roi)) return '-';
  const val = roi.toFixed(2);
  return `${roi >= 0 ? '+' : ''}${val}%`;
};

/* =================== Componente ==================== */

const TradesTable = ({ selectedMonth, trades, onTradeUpdate }) => {
  const { user } = useAuth();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [reasonTrade, setReasonTrade] = useState(null);

  const monthTrades = trades.filter((t) => t.month_year === selectedMonth);

  const handleEditReason = (trade) => {
    setReasonTrade(trade);
    setShowReasonModal(true);
  };

  const handleSaveReason = async () => {
    if (!reasonTrade) return;
    const { error } = await supabase
      .from('trades')
      .update({ reason: reasonTrade.reason })
      .eq('id', reasonTrade.id);
    if (error) {
      toast({ title: 'Erro ao salvar motivo', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Motivo salvo', description: 'Atualizado com sucesso ✅' });
      onTradeUpdate && onTradeUpdate();
      setShowReasonModal(false);
      setReasonTrade(null);
    }
  };

  return (
    <>
      <div className="glass-effect rounded-xl p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-xl font-bold">Histórico de Trades do Mês</h3>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAddModal(true)}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Trade
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Ativo</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Estratégia</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Entrada</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Saída</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Alav.</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">% ROI</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Lucro/Perda</th>
                <th className="py-3 px-2 text-left text-slate-400 font-medium">Data</th>
                <th className="py-3 px-2 text-center text-slate-400 font-medium">Motivo</th>
                <th className="py-3 px-2 text-center text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {monthTrades.map((t) => {
                  const direction = inferDirection({
                    side: t.side,
                    strategy: t.strategy,
                    entry_price: t.entry_price,
                    exit_price: t.exit_price,
                    result_pnl: t.result_pnl,
                  });

                  const roiStr = calcROI(t.entry_price, t.exit_price, direction, t.leverage);
                  const roiPos = roiStr !== '-' && roiStr.startsWith('+');

                  return (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      <td className="py-4 px-2 font-medium">{t.asset}</td>

                      <td className="py-4 px-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${direction === 'LONG'
                              ? 'bg-green-500/20 text-green-400'
                              : 'bg-red-500/20 text-red-400'
                            }`}
                        >
                          {direction}
                        </span>
                      </td>

                      <td className="py-4 px-2">${fmt2(t.entry_price)}</td>
                      <td className="py-4 px-2">{t.exit_price ? `$${fmt2(t.exit_price)}` : '-'}</td>
                      <td className="py-4 px-2">{t.leverage ? `${t.leverage}x` : '-'}</td>

                      <td className={`py-4 px-2 font-semibold ${roiPos ? 'text-green-400' : 'text-red-400'}`}>
                        {roiStr}
                      </td>

                      <td
                        className={`py-4 px-2 font-semibold ${num(t.result_pnl ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}
                      >
                        {t.result_pnl != null ? `$${fmt2(t.result_pnl)}` : '-'}
                      </td>

                      <td className="py-4 px-2 text-xs text-slate-400">
                        {new Date(t.date).toLocaleString('pt-BR')}
                      </td>

                      <td className="py-4 px-2 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditReason(t)}
                          className="hover:bg-slate-700 h-8 w-8"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                      </td>

                      <td className="py-4 px-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="icon" variant="ghost" className="hover:bg-slate-700 h-8 w-8">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="hover:bg-red-900/50 text-red-400 h-8 w-8"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Motivo */}
      <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
        <DialogContent className="glass-effect border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Motivo do Trade</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <textarea
              value={reasonTrade?.reason || ''}
              onChange={(e) => setReasonTrade({ ...reasonTrade, reason: e.target.value })}
              className="w-full min-h-[150px] bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
              placeholder="Descreva o motivo deste trade..."
            />
            <div className="flex gap-3">
              <Button
                onClick={handleSaveReason}
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 font-semibold"
              >
                Salvar
              </Button>
              <Button
                onClick={() => setShowReasonModal(false)}
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

export default TradesTable;
