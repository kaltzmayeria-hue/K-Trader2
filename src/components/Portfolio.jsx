import React, { useState, useEffect } from 'react';
    import { motion, AnimatePresence } from 'framer-motion';
    import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
    import { Plus, Trash2, Loader2, DollarSign, Activity, TrendingUp } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { toast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';
    import { useAuth } from '@/contexts/SupabaseAuthContext';

    const COLORS = ['#FFC107', '#03A9F4', '#4CAF50', '#F44336', '#9C27B0', '#3F51B5', '#00BCD4'];

    const Portfolio = () => {
      const { user } = useAuth();
      const [assets, setAssets] = useState([]);
      const [showAddModal, setShowAddModal] = useState(false);
      const [isSubmitting, setIsSubmitting] = useState(false);
      const [newAsset, setNewAsset] = useState({ symbol: '', amount: '' });
      const [loading, setLoading] = useState(true);
      const [totalValue, setTotalValue] = useState(0);

      const fetchPortfolio = async () => {
        if (!user) return;
        setLoading(true);

        const { data, error } = await supabase
          .from('portfolio')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          toast({ title: 'Erro ao buscar portfólio', description: error.message, variant: 'destructive' });
          setLoading(false);
          return;
        }

        if (data.length > 0) {
          const ids = data.map(asset => asset.asset_id).join(',');
          try {
            const priceRes = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`);
            const priceData = await priceRes.json();
            
            let currentTotalValue = 0;
            const updatedAssets = data.map(asset => {
              const marketData = priceData[asset.asset_id];
              const value = marketData ? marketData.usd * asset.amount : 0;
              currentTotalValue += value;
              return {
                ...asset,
                current_price: marketData ? marketData.usd : 0,
                price_change_24h: marketData ? marketData.usd_24h_change : 0,
                value: value,
              };
            });
            
            setAssets(updatedAssets);
            setTotalValue(currentTotalValue);

          } catch (e) {
            toast({ title: 'Erro ao buscar preços', description: 'Não foi possível obter os preços das moedas.', variant: 'destructive' });
          }
        } else {
            setAssets([]);
            setTotalValue(0);
        }
        
        setLoading(false);
      };
      
      useEffect(() => {
        fetchPortfolio();
      }, [user]);

      const handleAddAsset = async (e) => {
        e.preventDefault();
        if (!user) return;
        setIsSubmitting(true);
        const symbol = newAsset.symbol.trim().toLowerCase();

        try {
            const coinListRes = await fetch('https://api.coingecko.com/api/v3/coins/list');
            const coinList = await coinListRes.json();
            const coin = coinList.find(c => c.symbol === symbol);

            if (!coin) {
                toast({ title: 'Ativo não encontrado', description: 'Verifique o símbolo da criptomoeda.', variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }

            const existingAsset = assets.find(a => a.asset_id === coin.id);
            if (existingAsset) {
                toast({ title: 'Ativo já existe', description: 'Este ativo já está em seu portfólio.', variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }
            
            const { error } = await supabase.from('portfolio').insert({
                user_id: user.id,
                asset_id: coin.id,
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                amount: parseFloat(newAsset.amount)
            });

            if (error) throw error;
            
            toast({ title: 'Ativo Adicionado!', description: `${coin.name} foi adicionado ao seu portfólio.` });
            setShowAddModal(false);
            setNewAsset({ symbol: '', amount: '' });
            fetchPortfolio();

        } catch (error) {
            toast({ title: 'Erro ao adicionar ativo', description: error.message, variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
      };

      const handleDeleteAsset = async (id) => {
        const { error } = await supabase.from('portfolio').delete().eq('id', id);
        if (error) {
          toast({ title: "Erro ao remover ativo", description: error.message, variant: "destructive" });
        } else {
          toast({ title: "Ativo Removido", description: "O ativo foi removido com sucesso!" });
          fetchPortfolio();
        }
      };
      
      const chartData = assets
        .filter(asset => asset.value > 0)
        .map(asset => ({ name: asset.symbol, value: asset.value }));


      return (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h2 className="text-3xl font-bold">Meu Portfólio</h2>
                <p className="text-slate-400">Acompanhe seus ativos de criptomoedas.</p>
              </div>
              <Button onClick={() => setShowAddModal(true)} className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold">
                <Plus className="w-4 h-4 mr-2" /> Adicionar Ativo
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                     <DollarSign className="w-6 h-6 text-yellow-400" />
                    <h3 className="text-xl font-bold">Valor Total do Portfólio</h3>
                  </div>
                  <p className="text-4xl font-extrabold text-yellow-400">
                    ${totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="glass-effect rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Activity className="w-6 h-6 text-blue-400" />
                    <h3 className="text-xl font-bold">Meus Ativos</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="text-left py-3 px-2 text-slate-400 font-medium">Ativo</th>
                          <th className="text-left py-3 px-2 text-slate-400 font-medium">Quantidade</th>
                          <th className="text-left py-3 px-2 text-slate-400 font-medium">Preço (USD)</th>
                          <th className="text-left py-3 px-2 text-slate-400 font-medium">Variação 24h</th>
                          <th className="text-left py-3 px-2 text-slate-400 font-medium">Valor (USD)</th>
                          <th className="text-left py-3 px-2 text-slate-400 font-medium">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        <AnimatePresence>
                          {assets.map((asset) => (
                            <motion.tr
                              key={asset.id}
                              layout
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              className="border-b border-slate-800 hover:bg-slate-800/50"
                            >
                              <td className="py-4 px-2">
                                <div className="flex items-center gap-3">
                                  <span className="font-bold text-base">{asset.symbol}</span>
                                  <span className="text-slate-400 text-xs">{asset.name}</span>
                                </div>
                              </td>
                              <td className="py-4 px-2">{asset.amount}</td>
                              <td className="py-4 px-2">${asset.current_price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</td>
                              <td className={`py-4 px-2 font-semibold ${asset.price_change_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {asset.price_change_24h.toFixed(2)}%
                              </td>
                              <td className="py-4 px-2 font-bold">${asset.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="py-4 px-2">
                                <Button size="sm" variant="ghost" onClick={() => handleDeleteAsset(asset.id)} className="hover:bg-red-900/50 text-red-400">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </td>
                            </motion.tr>
                          ))}
                        </AnimatePresence>
                      </tbody>
                    </table>
                     {loading && (
                        <div className="text-center py-12 text-slate-400">
                          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                          <p className="mt-2">Carregando ativos...</p>
                        </div>
                      )}
                      {!loading && assets.length === 0 && (
                        <div className="text-center py-12 text-slate-400">
                          Seu portfólio está vazio. Adicione um ativo para começar.
                        </div>
                      )}
                  </div>
                </div>
              </div>

              <div className="glass-effect rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                    <TrendingUp className="w-6 h-6 text-purple-400" />
                    <h3 className="text-xl font-bold">Distribuição</h3>
                </div>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8">
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(30, 41, 59, 0.9)', 
                          borderColor: '#334155',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value) => `$${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                 <div className="mt-4 space-y-2">
                    {chartData.map((entry, index) => (
                      <div key={`legend-${index}`} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                          <span>{entry.name}</span>
                        </div>
                        <span className="font-semibold">
                          {((entry.value / totalValue) * 100).toFixed(2)}%
                        </span>
                      </div>
                    ))}
                  </div>
              </div>
            </div>
          </motion.div>

          <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
            <DialogContent className="glass-effect border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold">Adicionar Ativo ao Portfólio</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddAsset} className="space-y-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Símbolo do Ativo</label>
                  <input
                    type="text"
                    required
                    value={newAsset.symbol}
                    onChange={(e) => setNewAsset({ ...newAsset, symbol: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
                    placeholder="ex: BTC, ETH, SOL"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 text-slate-300">Quantidade</label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={newAsset.amount}
                    onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
                    placeholder="0.00"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <Button type="submit" disabled={isSubmitting} className="flex-1 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold">
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Adicionar'}
                  </Button>
                  <Button type="button" onClick={() => setShowAddModal(false)} variant="outline" className="flex-1 border-slate-700 hover:bg-slate-800">
                    Cancelar
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </>
      );
    };

    export default Portfolio;