import React, { useState, useEffect } from 'react';
    import { motion } from 'framer-motion';
    import { AlertTriangle } from 'lucide-react';

    const RiskManagement = ({ currentCapital }) => {
      const [bankroll, setBankroll] = useState('0.00');
      const [positionSize, setPositionSize] = useState(100);
      const [leverage, setLeverage] = useState(10);
      const [stopPercent, setStopPercent] = useState(1);

      useEffect(() => {
        const formattedCapital = parseFloat(currentCapital).toFixed(2);
        setBankroll(formattedCapital);
      }, [currentCapital]);

      const calculateRisk = () => {
        const variations = [-1, -2, -3, -4, -5, -6, -7, -8, -9, -10];
        const currentBankroll = parseFloat(bankroll) || 0;
        return variations.map(variation => {
          const percentChange = variation / 100;
          const result = positionSize * leverage * percentChange;
          const percentOfBank = currentBankroll > 0 ? (result / currentBankroll) * 100 : 0;
          return {
            variation: `${variation}%`,
            result: result.toFixed(2),
            percentOfBank: percentOfBank.toFixed(2)
          };
        });
      };
      
      const currentBankroll = parseFloat(bankroll) || 0;
      const riskData = calculateRisk();
      const positionPercent = currentBankroll > 0 ? ((positionSize / currentBankroll) * 100).toFixed(2) : '0.00';
      const effectivePosition = (positionSize * leverage).toFixed(2);
      const stopValue = (positionSize * leverage * (stopPercent / 100)).toFixed(2);

      return (
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Gerenciamento de Risco</h2>
                <p className="text-slate-400 text-sm">Calcule o impacto das variações na sua banca</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Banca total (USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={bankroll}
                  onChange={(e) => setBankroll(e.target.value)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none text-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Tamanho da posição (USD):
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={positionSize}
                  onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none text-lg font-semibold"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Alavancagem (x):
                </label>
                <input
                  type="number"
                  step="1"
                  value={leverage}
                  onChange={(e) => setLeverage(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none text-lg font-semibold"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">
                  Stop por Trade (%):
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={stopPercent}
                  onChange={(e) => setStopPercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none text-lg font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="glass-effect rounded-lg p-4 border-l-4 border-blue-500">
                <div className="text-slate-400 text-sm mb-1">Você está aplicando</div>
                <div className="text-2xl font-bold">{positionPercent}%</div>
                <div className="text-slate-400 text-xs mt-1">da banca</div>
              </div>

              <div className="glass-effect rounded-lg p-4 border-l-4 border-purple-500">
                <div className="text-slate-400 text-sm mb-1">Posição efetiva</div>
                <div className="text-2xl font-bold">${effectivePosition}</div>
                <div className="text-slate-400 text-xs mt-1">com alavancagem {leverage}x</div>
              </div>

              <div className="glass-effect rounded-lg p-4 border-l-4 border-red-500">
                <div className="text-slate-400 text-sm mb-1">Valor do Stop ({stopPercent}%)</div>
                <div className="text-2xl font-bold text-red-400">-${stopValue}</div>
                <div className="text-slate-400 text-xs mt-1">
                  {currentBankroll > 0 ? `${((parseFloat(stopValue) / currentBankroll) * 100).toFixed(2)}% da banca` : '0.00% da banca'}
                </div>
              </div>
            </div>

            <div className="bg-slate-900/30 rounded-lg p-4 mb-6">
              <p className="text-sm text-slate-300 leading-relaxed">
                Para cada <span className="text-yellow-400 font-semibold">1% de variação</span> do mercado, 
                com alavancagem <span className="text-yellow-400 font-semibold">{leverage}x</span>, 
                seu resultado é de <span className="text-yellow-400 font-semibold">
                  {currentBankroll > 0 ? ((positionSize * leverage * 0.01) / currentBankroll * 100).toFixed(2) : '0.00'}%
                </span> da banca (≈ ${(positionSize * leverage * 0.01).toFixed(2)}).
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Variação</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Resultado (USD)</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">% da Banca</th>
                  </tr>
                </thead>
                <tbody>
                  {riskData.map((row, idx) => (
                    <motion.tr
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="py-4 px-4 font-medium">{row.variation}</td>
                      <td className="py-4 px-4 font-semibold text-red-400">
                        ${row.result}
                      </td>
                      <td className="py-4 px-4 font-semibold text-red-400">
                        {row.percentOfBank}%
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      );
    };

    export default RiskManagement;