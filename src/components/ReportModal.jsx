import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useReactToPrint } from 'react-to-print';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import PrintableReport from '@/components/PrintableReport';

const ReportModal = ({ isOpen, onClose, allTrades, capitalData }) => {
  const availableMonths = useMemo(() => {
    const months = new Set(allTrades.map(trade => trade.month_year));
    return Array.from(months);
  }, [allTrades]);

  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    if (isOpen && availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [isOpen, availableMonths, selectedMonth]);

  const reportRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => reportRef.current,
    documentTitle: `Relatorio-Trades-${selectedMonth?.replace(' ', '-')}`,
  });

  const reportTrades = allTrades.filter(trade => trade.month_year === selectedMonth);
  const reportCapital = capitalData[selectedMonth] || { initial: 0 };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-slate-700 max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Gerar Relatório Mensal</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <div className="flex items-center gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2 text-slate-300">Selecione o Mês</label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none capitalize"
              >
                {availableMonths.length > 0 ? (
                  availableMonths.map(month => (
                    <option key={month} value={month} className="capitalize">{month}</option>
                  ))
                ) : (
                  <option disabled>Nenhum mês disponível</option>
                )}
              </select>
            </div>
            <Button
              onClick={handlePrint}
              disabled={!selectedMonth}
              className="self-end bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Relatório
            </Button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto p-2 bg-slate-900/50 rounded-lg">
            {selectedMonth ? (
                <PrintableReport ref={reportRef} trades={reportTrades} capital={reportCapital} month={selectedMonth} />
            ) : (
                <div className="text-center py-20 text-slate-400">
                    Selecione um mês para visualizar o relatório.
                </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ReportModal;