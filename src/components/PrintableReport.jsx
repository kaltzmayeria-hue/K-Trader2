import React from 'react';

const AIAnalysis = ({ trades }) => {
  const wins = trades.filter(t => parseFloat(t.result_pnl) >= 0 && t.reason);
  const losses = trades.filter(t => parseFloat(t.result_pnl) < 0 && t.reason);

  const commonWords = (tradeList) => {
    const wordCount = {};
    tradeList.forEach(trade => {
      const words = trade.reason.toLowerCase().match(/\b(\w+)\b/g) || [];
      words.forEach(word => {
        if (word.length > 3) {
          wordCount[word] = (wordCount[word] || 0) + 1;
        }
      });
    });
    return Object.entries(wordCount).sort((a, b) => b[1] - a[1]).slice(0, 3).map(e => e[0]);
  };

  const winningWords = commonWords(wins);
  const losingWords = commonWords(losses);

  return (
    <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
      <h3 className="text-xl font-bold text-blue-800 mb-4">Análise de Performance (IA)</h3>
      
      {trades.length > 0 ? (
        <div className="space-y-4 text-sm text-gray-700">
          <p>Analisei os motivos dos seus trades e identifiquei alguns padrões. Use estes insights para aprimorar sua estratégia!</p>
          
          <div>
            <h4 className="font-semibold text-green-700">O que está dando certo:</h4>
            {winningWords.length > 0 ? (
              <p>Seus trades lucrativos frequentemente envolvem os termos: <span className="font-bold">{winningWords.join(', ')}</span>. Parece que estratégias baseadas nesses conceitos estão funcionando bem. Continue a focar e refinar abordagens que envolvam esses padrões.</p>
            ) : (
              <p>Não há dados suficientes nos motivos dos seus trades lucrativos para uma análise aprofundada. Tente detalhar mais suas razões!</p>
            )}
          </div>

          <div>
            <h4 className="font-semibold text-red-700">Pontos de Melhoria:</h4>
            {losingWords.length > 0 ? (
              <p>Trades com prejuízo mencionam com frequência: <span className="font-bold">{losingWords.join(', ')}</span>. Revise as operações com esses motivos. Talvez seja um sinal para ajustar sua estratégia, gerenciar melhor o risco ou evitar certos gatilhos de entrada.</p>
            ) : (
              <p>Não identifiquei padrões claros nos seus trades com prejuízo. Continue registrando os motivos para futuras análises.</p>
            )}
          </div>

          <p className="font-semibold mt-4 text-blue-700">Recomendação: Continue a documentar seus trades com clareza. Quanto mais detalhes você fornecer, mais precisa será a análise para identificar seus pontos fortes e as áreas que precisam de atenção.</p>
        </div>
      ) : (
        <p className="text-center text-gray-500">Sem dados suficientes para gerar uma análise.</p>
      )}
    </div>
  );
};


const PrintableReport = React.forwardRef(({ trades, capital, month }, ref) => {
  const closedTrades = trades.filter(t => t.status === 'Fechado');
  const totalProfit = closedTrades.reduce((sum, trade) => sum + parseFloat(trade.result_pnl || 0), 0);
  const wins = closedTrades.filter(t => parseFloat(t.result_pnl || 0) >= 0).length;
  const losses = closedTrades.length - wins;
  const winRate = closedTrades.length > 0 ? (wins / closedTrades.length) * 100 : 0;
  const initialCapital = capital.initial || 0;
  const finalCapital = initialCapital + totalProfit;
  const growth = initialCapital > 0 ? (totalProfit / initialCapital) * 100 : 0;

  return (
    <div ref={ref} className="p-8 bg-white text-black font-sans">
      <header className="text-center mb-8 border-b pb-4">
        <h1 className="text-3xl font-bold text-gray-800">Relatório de Trades</h1>
        <p className="text-xl font-semibold text-gray-600 capitalize">{month}</p>
        <p className="text-sm text-gray-500 mt-2">Desenvolvido por Kaltz</p>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Resumo do Mês</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Capital Inicial</p>
            <p className="text-2xl font-bold">${initialCapital.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Lucro/Prejuízo</p>
            <p className={`text-2xl font-bold ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${totalProfit.toFixed(2)}
            </p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Capital Final</p>
            <p className="text-2xl font-bold">${finalCapital.toFixed(2)}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Crescimento</p>
            <p className={`text-2xl font-bold ${growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {growth.toFixed(2)}%
            </p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Trades Fechados</p>
            <p className="text-2xl font-bold">{closedTrades.length}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Taxa de Acerto</p>
            <p className="text-2xl font-bold">{winRate.toFixed(2)}%</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Vitórias</p>
            <p className="text-2xl font-bold text-green-600">{wins}</p>
          </div>
          <div className="p-4 bg-gray-100 rounded-lg">
            <p className="text-sm text-gray-600">Derrotas</p>
            <p className="text-2xl font-bold text-red-600">{losses}</p>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Detalhes dos Trades</h2>
        <div className="space-y-4">
          {closedTrades.map(trade => (
            <div key={trade.id} className="p-4 border rounded-lg bg-gray-50">
              <table className="w-full text-sm text-left mb-2">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="p-2">Ativo</th>
                    <th className="p-2">Tipo</th>
                    <th className="p-2">Posição</th>
                    <th className="p-2">Alav.</th>
                    <th className="p-2">Entrada</th>
                    <th className="p-2">Saída</th>
                    <th className="p-2">Lucro/Perda</th>
                    <th className="p-2">ROI</th>
                    <th className="p-2">Data</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2 font-medium">{trade.asset}</td>
                    <td className="p-2">{trade.strategy}</td>
                    <td className="p-2">${parseFloat(trade.position || 0).toFixed(2)}</td>
                    <td className="p-2">{trade.leverage}x</td>
                    <td className="p-2">${parseFloat(trade.entry_price || 0).toFixed(4)}</td>
                    <td className="p-2">${parseFloat(trade.exit_price || 0).toFixed(4)}</td>
                    <td className={`p-2 font-semibold ${parseFloat(trade.result_pnl || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ${parseFloat(trade.result_pnl || 0).toFixed(2)}
                    </td>
                    <td className={`p-2 font-semibold ${parseFloat(trade.result_percentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {parseFloat(trade.result_percentage || 0).toFixed(2)}%
                    </td>
                    <td className="p-2 text-xs">{trade.date}</td>
                  </tr>
                </tbody>
              </table>
              {trade.reason && (
                <div className="mt-2 p-2 bg-yellow-50 border-l-4 border-yellow-300">
                  <p className="text-xs font-semibold text-gray-700">Motivo da Operação:</p>
                  <p className="text-sm text-gray-600 italic">"{trade.reason}"</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {closedTrades.length === 0 && (
          <p className="text-center text-gray-500 mt-8">Nenhum trade fechado para este mês.</p>
        )}
      </section>

      <section>
        <AIAnalysis trades={closedTrades} />
      </section>
    </div>
  );
});

export default PrintableReport;