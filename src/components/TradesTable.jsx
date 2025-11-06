import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  RefreshCw,
  Loader2,
  Image as ImageIcon,
  LineChart,
  FileDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/lib/customSupabaseClient";
import { useAuth } from "@/contexts/SupabaseAuthContext";

/* ===================== HELPERS SÓLIDOS ===================== */

// número seguro
const num = (v) => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

// Pega direção SEM inverter o que veio do banco
// prioridade: t.strategy -> t.side (BUY/SELL) -> mantém como está
const normalizeDir = (raw) => {
  const s = String(raw ?? "").trim().toUpperCase();
  if (s === "LONG" || s === "SHORT") return s;
  if (s === "BUY") return "LONG";
  if (s === "SELL") return "SHORT";
  return s || "-";
};

// Preço com casas certas (cripto < 1 mostra mais casas)
const formatPrice = (v) => {
  const n = num(v);
  const small = Math.abs(n) < 1;
  return n.toLocaleString("pt-BR", {
    minimumFractionDigits: small ? 4 : 2,
    maximumFractionDigits: small ? 6 : 2,
  });
};

// Cálculo PnL “à prova de backend”.
// Se vier realized_pnl, usamos. Se não, calculamos.
const computePnl = (t) => {
  const e = num(t.entry_price);
  const x = num(t.exit_price);
  const position = num(t.position);       // valor em USDT
  const lev = Math.max(1, num(t.leverage || 1));
  const dir = normalizeDir(t.strategy);

  // Se o backend já trouxe, confio nele
  if (t.result_pnl !== undefined && t.result_pnl !== null) {
    const p = num(t.result_pnl);
    if (Number.isFinite(p)) return p;
  }

  // Se não tem saída, não calcula PnL
  if (!(e > 0) || !(x > 0) || !(position > 0)) return null;

  // Fórmula coerente com direção
  // LONG  => (x - e)/e * position * lev
  // SHORT => (e - x)/e * position * lev
  const factor = dir === "SHORT" ? (e - x) : (x - e);
  return (factor / e) * position * lev;
};

// ROI Bybit-like: ROI% = PnL / (position / leverage) * 100
const computeRoi = (t, pnl) => {
  const position = num(t.position);
  const lev = Math.max(1, num(t.leverage || 1));
  if (!(position > 0) || !Number.isFinite(pnl)) return null;
  const margin = position / lev;
  if (!(margin > 0)) return null;
  return (pnl / margin) * 100;
};

const posNegClass = (v) => (num(v) >= 0 ? "text-green-400" : "text-red-400");
const dirBadgeClass = (dir) =>
  normalizeDir(dir) === "LONG"
    ? "bg-green-500/20 text-green-400"
    : "bg-red-500/20 text-red-400";

/* ============== MINI CHART (simplificado) ============== */
const MiniChart = ({ entry, exit, dir }) => {
  const e = num(entry);
  const x = num(exit || entry);
  const isLong = normalizeDir(dir) === "LONG";
  const up = (x - e) * (isLong ? 1 : -1) >= 0;
  const yStart = 20;               // 0..40
  const yEnd = up ? 8 : 32;
  const stroke = up ? "#22c55e" : "#f87171";

  return (
    <svg width="80" height="40" viewBox="0 0 80 40" className="mx-auto">
      <polyline
        points={`5,${yStart} 40,${(yStart + yEnd) / 2} 75,${yEnd}`}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="5" cy={yStart} r="2" fill="#94a3b8" />
      <circle cx="75" cy={yEnd} r="2" fill={stroke} />
    </svg>
  );
};

/* ===================== COMPONENTE ===================== */

const TradesTable = ({ selectedMonth, trades, onTradeUpdate }) => {
  const { user } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [showShotModal, setShowShotModal] = useState(false);
  const [showReport, setShowReport] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [reasonTrade, setReasonTrade] = useState(null);
  const [shotTrade, setShotTrade] = useState(null);

  const [formData, setFormData] = useState({
    asset: "",
    strategy: "LONG",
    position: "",
    leverage: "",
    entry_price: "",
    exit_price: "",
    close_percentage: "",
    status: "Aberto",
    reason: "",
  });

  const monthTrades = useMemo(
    () => trades.filter((t) => t.month_year === selectedMonth),
    [trades, selectedMonth]
  );

  /* ============== AÇÕES BACKEND ============== */

  const resetForm = () => {
    setEditingTrade(null);
    setFormData({
      asset: "",
      strategy: "LONG",
      position: "",
      leverage: "",
      entry_price: "",
      exit_price: "",
      close_percentage: "",
      status: "Aberto",
      reason: "",
    });
  };

  const handleBybitSync = async () => {
    setIsSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("sync-bybit-trades", { method: "POST" });
      if (error) throw error;
      toast({ title: "Sincronização concluída", description: "Dados importados da Bybit ✅" });
      onTradeUpdate && onTradeUpdate();
    } catch (error) {
      toast({ title: "Erro na sincronização", description: error.message, variant: "destructive" });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleEdit = (trade) => {
    setEditingTrade(trade);
    setFormData({
      asset: trade.asset,
      strategy: normalizeDir(trade.strategy) || "LONG",
      position: trade.position || "",
      leverage: trade.leverage || "",
      entry_price: trade.entry_price || "",
      exit_price: trade.exit_price || "",
      close_percentage: trade.close_percentage || "",
      status: trade.status || "Aberto",
      reason: trade.reason || "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("trades").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Trade removido", description: "O trade foi removido com sucesso." });
      onTradeUpdate && onTradeUpdate();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    const payload = {
      ...formData,
      strategy: normalizeDir(formData.strategy),
      month_year: selectedMonth,
      date: editingTrade?.date || new Date().toISOString(),
      user_id: user.id,
      // NÃO seto result_pnl/roi aqui pra não brigar com cálculo do backend
    };

    const { error } = editingTrade
      ? await supabase.from("trades").update(payload).eq("id", editingTrade.id)
      : await supabase.from("trades").insert([payload]);

    if (error) {
      toast({ title: "Erro!", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: `Trade ${editingTrade ? "Atualizado" : "Adicionado"}!`,
        description: "Informações salvas com sucesso!",
      });
      setShowAddModal(false);
      resetForm();
      onTradeUpdate && onTradeUpdate();
    }
  };

  const handleEditReason = (trade) => {
    setReasonTrade(trade);
    setShowReasonModal(true);
  };

  const handleSaveReason = async () => {
    if (!reasonTrade) return;
    const { error } = await supabase
      .from("trades")
      .update({ reason: reasonTrade.reason })
      .eq("id", reasonTrade.id);

    if (error) {
      toast({ title: "Erro ao salvar motivo", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Motivo salvo", description: "Motivo atualizado com sucesso 📝" });
      setShowReasonModal(false);
      setReasonTrade(null);
      onTradeUpdate && onTradeUpdate();
    }
  };

  const handleShot = (trade) => {
    setShotTrade({ ...trade, screenshot_url: trade.screenshot_url || "" });
    setShowShotModal(true);
  };

  const handleSaveShot = async () => {
    if (!shotTrade) return;
    const { error } = await supabase
      .from("trades")
      .update({ screenshot_url: shotTrade.screenshot_url })
      .eq("id", shotTrade.id);

    if (error) {
      toast({ title: "Erro ao salvar print", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Print salvo", description: "URL do screenshot salva com sucesso 📷" });
      setShowShotModal(false);
      setShotTrade(null);
      onTradeUpdate && onTradeUpdate();
    }
  };

  const openReport = (t) => setShowReport(t);

  const printReport = (t) => {
    const pnl = computePnl(t);
    const roi = computeRoi(t, pnl);
    const roiStr = roi == null ? "-" : `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`;
    const w = window.open("", "_blank", "width=900,height=1000");
    const html = `
      <html>
        <head><meta charset="utf-8"><title>Relatório - ${t.asset}</title>
          <style>
            body { font-family: Arial, sans-serif; padding:24px; color:#0f172a }
            .row { display:flex; gap:16px; margin:6px 0 }
            .card { border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-top:12px }
            .badge { padding:4px 10px; border-radius:999px; font-size:12px; font-weight:700; color:#fff; display:inline-block }
            .long { background:#16a34a } .short { background:#dc2626 }
            table { width:100%; border-collapse:collapse; margin-top:16px }
            th,td { padding:10px 8px; border-bottom:1px solid #e2e8f0 }
          </style>
        </head>
        <body>
          <h1>Relatório de Trade</h1>
          <div>Emitido em ${new Date().toLocaleString("pt-BR")}</div>
          <div class="card">
            <div class="row">
              <div><b>Ativo:</b> ${t.asset}</div>
              <div><b>Direção:</b> <span class="badge ${normalizeDir(t.strategy)==="LONG"?"long":"short"}">${normalizeDir(t.strategy)}</span></div>
              <div><b>Alav.:</b> ${t.leverage || "-"}x</div>
            </div>
            <div class="row">
              <div><b>Entrada:</b> $${formatPrice(t.entry_price)}</div>
              <div><b>Saída:</b> ${t.exit_price ? "$" + formatPrice(t.exit_price) : "-"}</div>
              <div><b>ROI:</b> ${roiStr}</div>
              <div><b>Lucro/Perda:</b> ${pnl==null?"-":(pnl>=0?"+":"") + "$" + Math.abs(pnl).toFixed(2)}</div>
            </div>
            <div class="row">
              <div><b>Data:</b> ${new Date(t.date).toLocaleString("pt-BR")}</div>
              <div><b>Status:</b> ${t.status || "-"}</div>
            </div>
            <div class="row"><div style="flex:1"><b>Motivo</b><div>${(t.reason||"-").replace(/\n/g,"<br>")}</div></div></div>
            ${t.screenshot_url ? `<img src="${t.screenshot_url}" style="max-width:100%;border:1px solid #e2e8f0;border-radius:8px;margin-top:8px">` : ""}
          </div>
          <script>window.onload=()=>window.print()</script>
        </body>
      </html>`;
    w.document.open(); w.document.write(html); w.document.close();
  };

  /* ===================== UI ===================== */

  return (
    <>
      <div className="glass-effect rounded-xl p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h3 className="text-xl font-bold">Histórico de Trades do Mês</h3>
          <div className="flex gap-3">
            <Button
              onClick={handleBybitSync}
              variant="outline"
              className="border-blue-500 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300"
              disabled={isSyncing}
            >
              {isSyncing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Sincronizar Bybit
            </Button>
            <Button
              onClick={() => {
                resetForm();
                setShowAddModal(true);
              }}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Novo Trade
            </Button>
          </div>
        </div>

        {/* Tabela corrigida (larguras fixas + nowrap) */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed text-sm">
            <colgroup>
              <col className="w-[10%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[12%]" />
              <col className="w-[8%]" />
              <col className="w-[10%]" />
              <col className="w-[12%]" />
              <col className="w-[14%]" />
              <col className="w-[6%]" />
              <col className="w-[6%]" />
            </colgroup>

            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Ativo</th>
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Estratégia</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Entrada</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Saída</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Alav.</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">% ROI</th>
                <th className="text-right py-3 px-2 text-slate-400 font-medium">Lucro/Perda</th>
                <th className="text-left py-3 px-2 text-slate-400 font-medium">Data</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Gráfico</th>
                <th className="text-center py-3 px-2 text-slate-400 font-medium">Ações</th>
              </tr>
            </thead>

            <tbody>
              <AnimatePresence>
                {monthTrades.map((t) => {
                  const dir = normalizeDir(t.strategy);
                  const pnl = computePnl(t);
                  const roi = computeRoi(t, pnl);
                  const roiStr = roi == null ? "-" : `${roi >= 0 ? "+" : ""}${roi.toFixed(2)}%`;

                  const watermark =
                    dir === "LONG"
                      ? "bg-gradient-to-r from-green-500/10 to-transparent"
                      : "bg-gradient-to-r from-red-500/10 to-transparent";

                  return (
                    <motion.tr
                      key={t.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="relative border-b border-slate-800 hover:bg-slate-800/50"
                    >
                      {/* Marca d'água (não interfere na largura) */}
                      <td colSpan={10} className={`absolute inset-0 pointer-events-none ${watermark}`}>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-5xl font-extrabold tracking-widest opacity-10 select-none" style={{ letterSpacing: "0.25em" }}>
                          {dir}
                        </div>
                      </td>

                      {/* Células */}
                      <td className="py-4 px-2 font-medium relative whitespace-nowrap">{t.asset}</td>

                      <td className="py-4 px-2 relative whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${dirBadgeClass(dir)}`}>{dir}</span>
                      </td>

                      <td className="py-4 px-2 text-right relative whitespace-nowrap">${formatPrice(t.entry_price)}</td>

                      <td className="py-4 px-2 text-right relative whitespace-nowrap">
                        {t.exit_price ? `$${formatPrice(t.exit_price)}` : "-"}
                      </td>

                      <td className="py-4 px-2 text-right relative whitespace-nowrap">{t.leverage ? `${t.leverage}x` : "-"}</td>

                      <td className={`py-4 px-2 text-right font-semibold relative whitespace-nowrap ${posNegClass(roi)}`}>{roiStr}</td>

                      <td className={`py-4 px-2 text-right font-semibold relative whitespace-nowrap ${posNegClass(pnl)}`}>
                        {pnl == null ? "-" : (pnl >= 0 ? "+" : "-") + "$" + Math.abs(pnl).toFixed(2)}
                      </td>

                      <td className="py-4 px-2 text-left text-xs text-slate-400 relative whitespace-nowrap">
                        {new Date(t.date).toLocaleString("pt-BR")}
                      </td>

                      <td className="py-1 px-2 text-center relative whitespace-nowrap">
                        <MiniChart entry={t.entry_price} exit={t.exit_price} dir={dir} />
                      </td>

                      <td className="py-4 px-2 relative whitespace-nowrap">
                        <div className="flex gap-1 justify-center">
                          <Button size="icon" variant="ghost" onClick={() => handleEditReason(t)} className="hover:bg-slate-700 h-8 w-8" title="Motivo">
                            <MessageSquare className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleShot(t)} className="hover:bg-slate-700 h-8 w-8" title="Screenshot URL">
                            <ImageIcon className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => openReport(t)} className="hover:bg-slate-700 h-8 w-8" title="Relatório / PDF">
                            <FileDown className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(t)} className="hover:bg-slate-700 h-8 w-8" title="Editar">
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(t.id)} className="hover:bg-red-900/50 text-red-400 h-8 w-8" title="Excluir">
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

          {monthTrades.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              Nenhum trade registrado neste mês. Adicione manualmente ou sincronize com a Bybit.
            </div>
          )}
        </div>
      </div>

      {/* ===== Modal: Novo/Editar Trade ===== */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="glass-effect border-slate-700 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {editingTrade ? "Editar Trade" : "Novo Trade"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Ativo</label>
                <input
                  type="text"
                  required
                  value={formData.asset}
                  onChange={(e) => setFormData({ ...formData, asset: e.target.value.toUpperCase() })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="BTCUSDT"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Estratégia</label>
                <select
                  value={formData.strategy}
                  onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                  <option value="Buy">Buy</option>
                  <option value="Sell">Sell</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Posição (USD)</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Alavancagem</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.leverage}
                  onChange={(e) => setFormData({ ...formData, leverage: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="10"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Preço Entrada</label>
                <input
                  type="number"
                  step="any"
                  required
                  value={formData.entry_price}
                  onChange={(e) => setFormData({ ...formData, entry_price: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="60000.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-slate-300">Preço Saída</label>
                <input
                  type="number"
                  step="any"
                  value={formData.exit_price}
                  onChange={(e) => setFormData({ ...formData, exit_price: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                  placeholder="61000.00"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-2 text-slate-300">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
                >
                  <option value="Aberto">Aberto</option>
                  <option value="Fechado">Fechado</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
              >
                {editingTrade ? "Atualizar" : "Adicionar"}
              </Button>
              <Button
                type="button"
                onClick={() => setShowAddModal(false)}
                variant="outline"
                className="flex-1 border-slate-700 hover:bg-slate-800"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ===== Motivo ===== */}
      <Dialog open={showReasonModal} onOpenChange={setShowReasonModal}>
        <DialogContent className="glass-effect border-slate-700">
          <DialogHeader><DialogTitle className="text-2xl font-bold">Motivo da Operação</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <textarea
              value={reasonTrade?.reason || ""}
              onChange={(e) => setReasonTrade({ ...reasonTrade, reason: e.target.value })}
              className="w-full min-h-[150px] bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
              placeholder="Descreva o motivo..."
            />
            <div className="flex gap-3">
              <Button onClick={handleSaveReason} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 font-semibold">Salvar</Button>
              <Button onClick={() => setShowReasonModal(false)} variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Screenshot URL ===== */}
      <Dialog open={showShotModal} onOpenChange={setShowShotModal}>
        <DialogContent className="glass-effect border-slate-700">
          <DialogHeader><DialogTitle className="text-2xl font-bold">Screenshot do Trade</DialogTitle></DialogHeader>
          <div className="space-y-4 mt-4">
            <input
              type="url"
              placeholder="Cole a URL da imagem (print)"
              value={shotTrade?.screenshot_url || ""}
              onChange={(e) => setShotTrade({ ...shotTrade, screenshot_url: e.target.value })}
              className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20"
            />
            <div className="flex gap-3">
              <Button onClick={handleSaveShot} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 font-semibold">Salvar</Button>
              <Button onClick={() => setShowShotModal(false)} variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800">Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ===== Relatório ===== */}
      <Dialog open={!!showReport} onOpenChange={(v) => !v && setShowReport(null)}>
        <DialogContent className="glass-effect border-slate-700 max-w-lg">
          <DialogHeader className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Relatório do Trade</DialogTitle>
            <Button size="icon" variant="ghost" onClick={() => setShowReport(null)}><X className="w-4 h-4" /></Button>
          </DialogHeader>
          {showReport && (
            <div className="space-y-4">
              <div className="rounded-lg border border-slate-700 p-4">
                <div className="flex flex-wrap gap-4 text-sm">
                  <div><strong>Ativo:</strong> {showReport.asset}</div>
                  <div>
                    <strong>Direção:</strong>{" "}
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${dirBadgeClass(showReport.strategy)}`}>
                      {normalizeDir(showReport.strategy)}
                    </span>
                  </div>
                  <div><strong>Alav.:</strong> {showReport.leverage || "-"}x</div>
                  <div><strong>Entrada:</strong> ${formatPrice(showReport.entry_price)}</div>
                  <div><strong>Saída:</strong> {showReport.exit_price ? "$" + formatPrice(showReport.exit_price) : "-"}</div>
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={() => printReport(showReport)} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 text-slate-900 font-semibold">
                  <FileDown className="w-4 h-4 mr-2" /> Imprimir / PDF
                </Button>
                <Button onClick={() => setShowReport(null)} variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800">Fechar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TradesTable;
