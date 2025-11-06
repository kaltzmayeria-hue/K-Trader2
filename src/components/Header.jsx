import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const Header = ({ user }) => {
  const [time, setTime] = useState(new Date());
  const [btcPrice, setBtcPrice] = useState('???');

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchBtcPrice = () => {
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd')
        .then(res => res.json())
        .then(data => {
          if (data.bitcoin?.usd) {
            setBtcPrice(data.bitcoin.usd.toLocaleString('en-US'));
          }
        })
        .catch(() => {});
    };
    fetchBtcPrice();
    const priceInterval = setInterval(fetchBtcPrice, 60000); // update every minute
    return () => clearInterval(priceInterval);
  }, []);

  const formatTime = (date) => {
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="relative glass-effect border-b border-slate-800 py-6 overflow-hidden"
    >
      <div 
        className="absolute inset-0 bg-cover bg-center z-0 opacity-10"
        style={{ backgroundImage: `url('https://horizons-cdn.hostinger.com/3e38f764-bc6d-4d97-aa85-6ff9b4d0676f/4d6f8ee5660df3f208561780a9e3a83a.png')`}}
      ></div>
      <div className="relative max-w-[1600px] mx-auto px-4 z-10">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-5xl font-bold tracking-tight">{formatTime(time)}</div>
              <div className="text-slate-400 text-sm mt-1 capitalize">{formatDate(time)}</div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 px-6 py-3 rounded-lg gold-glow text-center"
            >
              <div className="text-slate-900 font-bold text-lg">BTC: ${btcPrice}</div>
            </motion.div>
            <div className="text-right">
              <div className="text-sm text-slate-400">Bem-vindo,</div>
              <div className="font-semibold">{user?.name}</div>
            </div>
          </div>
        </div>
        
        <div className="text-right mt-2">
          <span className="text-xs text-slate-500">Developed by Kaltz</span>
        </div>
      </div>
    </motion.header>
  );
};

export default Header;