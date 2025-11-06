import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown } from 'lucide-react';

const CryptoTicker = () => {
  const [cryptos, setCryptos] = useState([]);

  const fetchCryptoData = async () => {
    try {
      const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=15&page=1&sparkline=false');
      const data = await response.json();
      const formattedData = data.map(coin => ({
        id: coin.id,
        symbol: coin.symbol.toUpperCase(),
        price: coin.current_price,
        change: coin.price_change_percentage_24h,
      }));
      setCryptos(formattedData);
    } catch (error) {
      console.error("Error fetching crypto data:", error);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    const interval = setInterval(fetchCryptoData, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const duplicatedCryptos = [...cryptos, ...cryptos, ...cryptos];

  if (cryptos.length === 0) {
    return (
      <div className="bg-slate-900/50 border-y border-slate-800 py-3 text-center">
        Carregando cotações...
      </div>
    );
  }

  return (
    <div className="bg-slate-900/50 border-y border-slate-800 py-3 overflow-hidden">
      <motion.div
        animate={{ x: [0, -180 * cryptos.length] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        className="flex gap-8 whitespace-nowrap"
      >
        {duplicatedCryptos.map((crypto, idx) => (
          <div key={`${crypto.id}-${idx}`} className="flex items-center gap-3 px-4" style={{ minWidth: '180px' }}>
            <span className="font-bold text-yellow-400">{crypto.symbol}</span>
            <span className="text-white font-semibold">${crypto.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}</span>
            <span className={`flex items-center gap-1 text-sm ${crypto.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {crypto.change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              {Math.abs(crypto.change || 0).toFixed(2)}%
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};

export default CryptoTicker;