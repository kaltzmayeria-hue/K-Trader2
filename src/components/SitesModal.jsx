import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RefreshCw, TrendingUp, TrendingDown, ArrowUp, ArrowDown, ArrowRight, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const SitesModal = ({ isOpen, onClose }) => {
  const [coinData, setCoinData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('24h');

  const fetchCoinData = async () => {
    setLoading(true);
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=1h,24h,7d');
      if (!response.ok) {
        throw new Error('Failed to fetch data from CoinGecko');
      }
      const data = await response.json();
      setCoinData(data);
      toast({ title: "Dados de Cripto Atualizados! 📈" });
    } catch (error) {
      toast({ title: "Erro ao buscar dados", description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      fetchCoinData();
    }
  }, [isOpen]);

  const periodKey = `price_change_percentage_${period}_in_currency`;
  
  const sortedCoins = [...coinData]
    .filter(coin => coin[periodKey] !== null && coin[periodKey] !== undefined)
    .sort((a, b) => b[periodKey] - a[periodKey]);

  const topGainers = sortedCoins.slice(0, 50);
  const topLosers = sortedCoins.slice(-50).reverse();

  const allListedCoins = [...topGainers, ...topLosers];
  const bullishCount = allListedCoins.filter(c => c[periodKey] > 0).length;
  const bearishCount = allListedCoins.filter(c => c[periodKey] < 0).length;
  const totalCount = bullishCount + bearishCount;
  const bullishPercent = totalCount > 0 ? (bullishCount / totalCount) * 100 : 0;
  const bearishPercent = totalCount > 0 ? (bearishCount / totalCount) * 100 : 0;

  const refreshIframe = (iframeId) => {
    const iframe = document.getElementById(iframeId);
    if (iframe) {
      iframe.src = iframe.src; // Reloads the iframe
      toast({ title: "Calendário econômico atualizado! 📅" });
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }}
            exit={{ opacity: 0, scale: 0.9, y: 50 }}
            className="glass-effect rounded-2xl p-6 w-full max-w-7xl max-h-[90vh] overflow-y-auto border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Sites & Informações de Mercado</h2>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-6 h-6" />
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="glass-effect p-4 rounded-lg flex flex-col">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><CalendarDays className="w-5 h-5" />Eventos Econômicos (EUA)</h3>
                  <Button size="sm" onClick={() => refreshIframe('economicCalendarIframe')}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Atualizar
                  </Button>
                </div>
                <div className="flex-grow relative" style={{ height: '450px' }}>
                  <iframe
                    id="economicCalendarIframe"
                    src="https://sslecal2.investing.com?ecoDay=7&columns=exc_currency,exc_importance,exc_actual,exc_forecast,exc_previous&importance=2,3&countries=5"
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    allowTransparency="true"
                    title="Calendário Econômico"
                    className="absolute inset-0 w-full h-full border-none rounded-md"
                  ></iframe>
                </div>
              </div>

              <div className="glass-effect p-4 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-semibold text-lg">Ranking de Criptomoedas</h3>
                   <div className="flex gap-2">
                     <Button size="sm" onClick={fetchCoinData}>
                       <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar Moedas
                     </Button>
                     {['1h', '24h', '7d'].map(p => (
                       <Button key={p} size="sm" variant={period === p ? 'default' : 'outline'} onClick={() => setPeriod(p)}>
                         {p}
                       </Button>
                     ))}
                   </div>
                 </div>

                <div className="my-4">
                  <h4 className="text-sm font-semibold mb-2">Sentimento de Mercado (Top 100)</h4>
                  <div className="w-full bg-slate-800 rounded-full h-6 flex overflow-hidden">
                    <div style={{ width: `${bullishPercent}%` }} className="bg-green-500 h-full flex items-center justify-center text-xs font-bold text-slate-900 transition-all duration-500">
                       {bullishPercent > 10 && `${bullishPercent.toFixed(0)}% Bull`}
                    </div>
                    <div style={{ width: `${bearishPercent}%` }} className="bg-red-500 h-full flex items-center justify-center text-xs font-bold text-slate-900 transition-all duration-500">
                       {bearishPercent > 10 && `${bearishPercent.toFixed(0)}% Bear`}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[45vh] overflow-y-auto pr-2">
                  <div>
                    <h4 className="font-bold text-green-400 mb-2 flex items-center"><TrendingUp className="w-5 h-5 mr-2" /> Top 50 Altas</h4>
                    {topGainers.map(coin => <CoinRow key={coin.id} coin={coin} periodKey={periodKey} />)}
                  </div>
                  <div>
                    <h4 className="font-bold text-red-400 mb-2 flex items-center"><TrendingDown className="w-5 h-5 mr-2" /> Top 50 Baixas</h4>
                    {topLosers.map(coin => <CoinRow key={coin.id} coin={coin} periodKey={periodKey} />)}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const CoinRow = ({ coin, periodKey }) => {
  const priceChange = coin[periodKey] || 0;
  const priceColor = priceChange > 0 ? 'text-green-400' : priceChange < 0 ? 'text-red-400' : 'text-slate-400';
  const Icon = priceChange > 0 ? ArrowUp : priceChange < 0 ? ArrowDown : ArrowRight;

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="grid grid-cols-3 items-center text-sm p-1.5 rounded-md hover:bg-slate-800/50 gap-2">
            <div className="flex items-center gap-2 overflow-hidden col-span-1">
              <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full flex-shrink-0" />
              <span className="text-slate-400 uppercase font-bold truncate">{coin.symbol}</span>
            </div>
            <span className="font-mono text-right truncate">
                ${coin.current_price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
            </span>
            <span className={`font-semibold ${priceColor} flex items-center justify-end`}>
              <Icon className="w-3 h-3 mr-1 flex-shrink-0" />
              {priceChange.toFixed(2)}%
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-slate-800 border-slate-700 text-white">
          <p>{coin.name}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default SitesModal;