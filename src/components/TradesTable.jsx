import React from "react";

export default function TradesTable({ trades }) {
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
        {trades?.map((trade) => (
          <tr key={trade.trade_id}>
            <td>{new Date(trade.date).toLocaleString()}</td>
            <td>{trade.asset}</td>
            <td>{trade.side}</td>
            <td>{trade.entry_price}</td>
            <td>{trade.exit_price}</td>
            <td className={trade.realized_pnl >= 0 ? "text-green-400" : "text-red-400"}>
              {trade.realized_pnl}
            </td>
            <td className={trade.result_percentage >= 0 ? "text-green-400" : "text-red-400"}>
              {trade.result_percentage}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
