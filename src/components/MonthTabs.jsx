import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReportModal from '@/components/ReportModal';

const MonthTabs = ({ selectedMonth, onSelectMonth, allTrades, capitalData }) => {
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const currentMonth = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
      if (currentMonth !== selectedMonth) {
        onSelectMonth(currentMonth);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [selectedMonth, onSelectMonth]);

  return (
    <>
      <div className="glass-effect rounded-xl p-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <motion.button
              key={selectedMonth}
              className="px-6 py-2 rounded-lg font-medium transition-all whitespace-nowrap capitalize bg-blue-600 text-white"
            >
              {selectedMonth}
            </motion.button>
          </div>
          
          <Button
            onClick={() => setShowReportModal(true)}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold ml-4"
          >
            <FileText className="w-4 h-4 mr-2" />
            Gerar Relatório
          </Button>
        </div>
      </div>
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        allTrades={allTrades}
        capitalData={capitalData}
      />
    </>
  );
};

export default MonthTabs;