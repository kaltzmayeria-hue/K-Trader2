// K-Trader2/src/lib/tradeMath.js

const round2 = (v) => Math.round((Number(v) || 0) * 100) / 100;

/**
 * Normaliza e calcula side/PNL/ROI corretamente.
 * Regras:
 *  - LONG: pnl = (exit - entry) * qty
 *  - SHORT: pnl = (entry - exit) * qty
 *  - ROI (%) = pnl / (entry * qty) * 100
 *  - side detectado pelo PRIMEIRO evento (orders[0].side)
 */
export function computeDerived(trade) {
  // tenta detectar side com base no primeiro evento/execução
  let side = trade.side;
  if ((!side || side === 'Unknown') && Array.isArray(trade.orders) && trade.orders.length) {
    side = trade.orders[0]?.side === 'Buy' ? 'Long' : 'Short';
  }

  // compatibilidade com nomes diferentes
  const entry =
    Number(trade.entry_price ?? trade.entryPrice ?? trade.avgEntryPrice ?? trade.openPrice ?? 0);
  const exit =
    Number(trade.exit_price ?? trade.exitPrice ?? trade.closePrice ?? trade.lastPrice ?? 0);
  const qty = Number(trade.qty ?? trade.size ?? trade.contracts ?? trade.position_qty ?? 0);

  // se por algum motivo não veio side, infere pelo PNL teórico
  if (!side && entry && exit) {
    side = exit > entry ? 'Long' : 'Short';
  }

  // calcula PNL com a fórmula correta para cada lado
  const pnl = side === 'Long' ? (exit - entry) * qty : (entry - exit) * qty;

  // ROI proporcional ao capital comprometido (entry * qty)
  const denom = entry * qty;
  const roi = denom ? (pnl / denom) * 100 : 0;

  return {
    ...trade,
    side,
    pnl: round2(pnl),
    roi: round2(roi),
    entry,
    exit,
    qty,
  };
}
