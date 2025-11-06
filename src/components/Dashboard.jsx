
import React, { useState, useEffect, useMemo, useCallback } from 'react';
    import { useAuth } from '@/contexts/SupabaseAuthContext';
    import Header from '@/components/Header';
    import CryptoTicker from '@/components/CryptoTicker';
    import TradesTable from '@/components/TradesTable';
    import CapitalCards from '@/components/CapitalCards';
    import RiskManagement from '@/components/RiskManagement';
    import MonthTabs from '@/components/MonthTabs';
    import AdminPanel from '@/components/AdminPanel';
    import UserProfile from '@/components/UserProfile';
    import SettingsPage from '@/components/SettingsPage';
    import SitesModal from '@/components/SitesModal';
    import Portfolio from '@/components/Portfolio';
    import { LogOut, Shield, UserCircle, Globe, BarChart2, Eye, Briefcase, RefreshCw, Loader2, Settings } from 'lucide-react';
    import { Button } from '@/components/ui/button';
    import { useToast } from '@/components/ui/use-toast';
    import { supabase } from '@/lib/customSupabaseClient';

    const getCurrentMonthYear = () => {
      return new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
    };

    const Dashboard = () => {
      const { user, session, signOut } = useAuth();
      const [profile, setProfile] = useState(null);
      const [trades, setTrades] = useState([]);
      const [capitalData, setCapitalData] = useState({});
      const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthYear());
      const [activeView, setActiveView] = useState('trades');
      const [isSitesModalOpen, setIsSitesModalOpen] = useState(false);
      const [loading, setLoading] = useState(true);
      const [isSyncing, setIsSyncing] = useState(false);
      const { toast } = useToast();

      const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) console.error("Profile fetch error:", profileError);
        else setProfile(profileData);

        const { data: tradesData, error: tradesError } = await supabase
          .from('trades')
          .select('*')
          .eq('user_id', user.id)
          .order('date', { ascending: false });

        if (tradesError) console.error("Trades fetch error:", tradesError);
        else setTrades(tradesData);

        const { data: capital, error: capitalError } = await supabase
          .from('capital')
          .select('*')
          .eq('user_id', user.id);
        
        if (capitalError) {
          console.error("Capital fetch error:", capitalError);
        } else {
          const capitalObject = capital.reduce((acc, item) => {
            acc[item.month_year] = { initial: item.initial_capital };
            return acc;
          }, {});
          setCapitalData(capitalObject);
        }
        
        setLoading(false);
      }, [user]);

      useEffect(() => {
        fetchData();
      }, [fetchData]);

      const handleBybitSync = async () => {
        if (!session) {
            toast({ title: "Erro de Autenticação", description: "Sessão não encontrada. Por favor, faça login novamente.", variant: "destructive" });
            return;
        }
        setIsSyncing(true);
        try {
          const { data, error } = await supabase.functions.invoke('bybit-sync', {
            headers: {
              Authorization: `Bearer ${session.access_token}`
            }
          });
          
          if (error) throw error;
    
          toast({
            title: "Sincronização Concluída!",
            description: data.message || "Seus trades foram importados.",
          });
          fetchData(); // Refresh data
        } catch (error) {
           const errorMessage = error.context?.json?.()?.error || error.message || "Não foi possível conectar com a Bybit. Verifique suas credenciais em Configurações.";
          toast({
            title: "Erro na Sincronização",
            description: errorMessage,
            variant: "destructive",
          });
        } finally {
          setIsSyncing(false);
        }
      };

      const onUserUpdate = (updatedProfile) => {
        setProfile(updatedProfile);
        fetchData(); 
      };
      
      const currentCapital = useMemo(() => {
        const monthTrades = trades.filter(t => t.month_year === selectedMonth);
        const totalProfit = monthTrades.reduce((sum, trade) => {
          if (trade.status === 'Fechado') {
            return sum + (parseFloat(trade.result_pnl) || 0);
          }
          return sum;
        }, 0);
        const currentMonthCapital = capitalData[selectedMonth] || { initial: 0 };
        return parseFloat(currentMonthCapital.initial) + totalProfit;
      }, [trades, selectedMonth, capitalData]);

      if (loading || !profile) {
        return <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center"><p>Carregando dashboard...</p></div>;
      }

      const renderContent = () => {
        switch (activeView) {
          case 'risk':
            return <RiskManagement currentCapital={currentCapital} />;
          case 'portfolio':
            return <Portfolio />;
          case 'settings':
            return <SettingsPage />;
          case 'admin':
            return profile.is_admin ? <AdminPanel /> : <p>Acesso negado.</p>;
          case 'profile':
            return <UserProfile user={profile} onUserUpdate={onUserUpdate} />;
          case 'trades':
          default:
            return (
              <>
                <CapitalCards 
                  selectedMonth={selectedMonth} 
                  trades={trades}
                  capitalData={capitalData}
                  onCapitalUpdate={fetchData}
                />
                <MonthTabs 
                  selectedMonth={selectedMonth} 
                  onSelectMonth={setSelectedMonth}
                  allTrades={trades}
                  capitalData={capitalData}
                />
                <TradesTable 
                  selectedMonth={selectedMonth} 
                  trades={trades}
                  onTradeUpdate={fetchData}
                />
              </>
            );
        }
      };

      return (
        <>
          <div className="min-h-screen pb-8">
            <Header user={profile} />
            <CryptoTicker />
            
            <div className="max-w-[1600px] mx-auto px-4 mt-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">
                  {activeView === 'trades' && 'Controle de Trades'}
                  {activeView === 'risk' && 'Gerenciamento de Risco'}
                  {activeView === 'portfolio' && 'Portfólio de Ativos'}
                  {activeView === 'profile' && 'Meu Perfil'}
                  {activeView === 'settings' && 'Configurações'}
                  {activeView === 'admin' && 'Painel Administrativo'}
                </h1>
                <div className="flex flex-wrap gap-3 justify-end">
                   <Button
                    onClick={handleBybitSync}
                    variant="outline"
                    className="border-blue-500 text-blue-400 hover:bg-blue-900/50 hover:text-blue-300"
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Sincronizar Bybit
                  </Button>
                   <Button
                    onClick={() => setActiveView('trades')}
                    variant="outline"
                    className={`border-slate-700 hover:bg-slate-800 ${activeView === 'trades' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Trades
                  </Button>
                   <Button
                    onClick={() => setActiveView('risk')}
                    variant="outline"
                    className={`border-slate-700 hover:bg-slate-800 ${activeView === 'risk' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    Gerenciamento
                  </Button>
                   <Button
                    onClick={() => setActiveView('portfolio')}
                    variant="outline"
                    className={`border-slate-700 hover:bg-slate-800 ${activeView === 'portfolio' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    <Briefcase className="w-4 h-4 mr-2" />
                    Portfólio
                  </Button>
                  <Button
                    onClick={() => setActiveView('settings')}
                    variant="outline"
                    className={`border-slate-700 hover:bg-slate-800 ${activeView === 'settings' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Configurações
                  </Button>
                  {profile && profile.is_admin && (
                    <Button
                      onClick={() => setActiveView('admin')}
                      variant="outline"
                      className={`border-slate-700 hover:bg-slate-800 ${activeView === 'admin' ? 'bg-slate-800 text-white' : ''}`}
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Painel Admin
                    </Button>
                  )}
                  <Button
                    onClick={() => setActiveView('profile')}
                    variant="outline"
                    className={`border-slate-700 hover:bg-slate-800 ${activeView === 'profile' ? 'bg-slate-800 text-white' : ''}`}
                  >
                    <UserCircle className="w-4 h-4 mr-2" />
                    Meu Perfil
                  </Button>
                  <Button
                    onClick={() => setIsSitesModalOpen(true)}
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    <Globe className="w-4 h-4 mr-2" />
                    SITES
                  </Button>
                  <Button
                    onClick={signOut}
                    variant="outline"
                    className="border-slate-700 hover:bg-slate-800"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair
                  </Button>
                </div>
              </div>
              {renderContent()}
            </div>
          </div>
          <SitesModal isOpen={isSitesModalOpen} onClose={() => setIsSitesModalOpen(false)} />
        </>
      );
    };

    export default Dashboard;
