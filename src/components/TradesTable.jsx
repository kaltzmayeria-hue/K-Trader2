import React from "react";

export default function TradesTable({ trades }) {

  const formatSide = (trade) => {
    // Se a corretora mandou inverso, vamos corrigir aqui
    if (!trade.side) return "-";
    const side = trade.side.toUpperCase();
    if (side === "SELL") return "SHORT";
    if (side === "BUY") return "LONG";
    return side;
  };

  const calcPNL = (trade) => {
    // Garantir número
    const pnl = Number(trade.realized_pnl || trade.result_pnl || 0);
    return pnl;
  };

  const calcROI = (trade) => {
    const roi = Number(trade.result_percentage || 0);
    return roi;
  };

  return (
    <table className="w-full text-sm text-left">
      <thead>
        <tr>
          <th>Data</th>
          <th>Ativo</th>
          <th>Side</th>
          <th>Preço Entrada</th>
          <th>Preço Saída</th>
          <th>PNL</th>
          <th>ROI (%)</th>
        </tr>
      </thead>
      <tbody>
        {trades?.map((trade) => {
          const pnl = calcPNL(trade);
          const roi = calcROI(trade);
          const side = formatSide(trade);

          return (
            <tr key={trade.trade_id}>
              <td>{new Date(trade.date).toLocaleString()}</td>
              <td>{trade.asset}</td>
              <td>{side}</td>
              <td>{trade.entry_price}</td>
              <td>{trade.exit_price}</td>

              <td className={pnl >= 0 ? "text-green-400" : "text-red-400"}>
                {pnl.toFixed(4)}
              </td>

              <td className={roi >= 0 ? "text-green-400" : "text-red-400"}>
                {roi.toFixed(2)}%
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
