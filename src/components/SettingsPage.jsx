
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchCredentials = async () => {
      if (!user) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('bybit_api_key, bybit_api_secret')
        .eq('id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        toast({ title: "Erro ao carregar credenciais", description: error.message, variant: "destructive" });
      } else if (data) {
        setApiKey(data.bybit_api_key || '');
        setApiSecret(data.bybit_api_secret || '');
      }
      setLoading(false);
    };

    fetchCredentials();
  }, [user, toast]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ bybit_api_key: apiKey, bybit_api_secret: apiSecret })
      .eq('id', user.id);

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sucesso!", description: "Suas credenciais da Bybit foram salvas." });
    }
    setSaving(false);
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  return (
    <div className="glass-effect rounded-xl p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-bold mb-6">Configurações da API Bybit</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Bybit API Key</label>
          <input 
            type="text" 
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20" 
            placeholder="Sua API Key da Bybit"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Bybit API Secret</label>
          <input 
            type="password"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20" 
            placeholder="••••••••••••••••"
          />
           <p className="text-xs text-slate-500 mt-2">Suas chaves são armazenadas de forma segura e usadas apenas para sincronizar seus trades.</p>
        </div>
        <div className="flex justify-end">
          <Button 
            onClick={handleSave} 
            disabled={saving}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Salvar'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
