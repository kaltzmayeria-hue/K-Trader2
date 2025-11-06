// K-Trader2/src/components/TradesTable.jsx

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/customSupabaseClient";
import { computeDerived } from "../lib/tradeMath";

export default function TradesTable() {
  const [trades, setTrades] = useState([]);

  useEffect(() => {
    async function loadTrades() {
      const { data, error } = await supabase
        .from("trades")
        .select("*")
        .order("date", { ascending: false });

      if (error) {
        console.error("Erro ao carregar trades:", error);
        return;
      }

      // Aplica correções de Side, ROI, PnL
      const computed = data.map((t) => computeDerived(t));
      setTrades(computed);
    }

    loadTrades();
  }, []);

  return (
    <div className="p-4 w-full">
      <h2 className="text-xl font-bold mb-4">Histórico de Trades</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm bg-zinc-900 text-gray-200 border border-gray-800">
          <thead>
            <tr className="bg-zinc-800">
              <th className="p-2 border border-gray-700">Ativo</th>
              <th className="p-2 border border-gray-700">Side</th>
              <th className="p-2 border border-gray-700">Entrada</th>
              <th className="p-2 border border-gray-700">Saída</th>
              <th className="p-2 border border-gray-700">QTY</th>
              <th className="p-2 border border-gray-700">PnL</th>
              <th className="p-2 border border-gray-700">ROI (%)</th>
              <th className="p-2 border border-gray-700">Data</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((trade) => (
              <tr key={trade.id} className="border border-gray-700">
                <td className="p-2 border border-gray-700">{trade.asset}</td>
                <td className="p-2 border border-gray-700">
                  <span
                    className={`px-2 py-1 rounded text-black ${
                      trade.side === "Long" ? "bg-green-400" : "bg-red-400"
                    }`}
                  >
                    {trade.side}
                  </span>
                </td>
                <td className="p-2 border border-gray-700">{trade.entry}</td>
                <td className="p-2 border border-gray-700">{trade.exit}</td>
                <td className="p-2 border border-gray-700">{trade.qty}</td>
                <td
                  className={`p-2 border border-gray-700 ${
                    trade.pnl >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {trade.pnl}
                </td>
                <td
                  className={`p-2 border border-gray-700 ${
                    trade.roi >= 0 ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {trade.roi}%
                </td>
                <td className="p-2 border border-gray-700">
                  {new Date(trade.date).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
