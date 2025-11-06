import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const UserProfile = ({ user, onUserUpdate }) => {
  const { user: authUser } = useAuth();
  const [name, setName] = useState(user.name);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const handleProfileSave = async () => {
    if (!authUser) return;
    setIsSavingProfile(true);

    const { data, error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', authUser.id)
      .select()
      .single();

    if (error) {
      toast({ title: "Erro ao atualizar perfil", description: error.message, variant: "destructive" });
    } else {
      onUserUpdate(data);
      toast({ title: "Perfil atualizado com sucesso!" });
    }
    setIsSavingProfile(false);
  };

  const handlePasswordUpdate = async () => {
    if (password !== confirmPassword) {
      toast({ title: "As senhas não coincidem!", variant: "destructive" });
      return;
    }
    if (!password) {
      toast({ title: "Senha em branco", description: "Por favor, insira uma nova senha.", variant: "destructive" });
      return;
    }

    setIsSavingPassword(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      toast({ title: "Erro ao atualizar senha", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Senha atualizada com sucesso!" });
      setPassword('');
      setConfirmPassword('');
    }
    setIsSavingPassword(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-8 max-w-2xl mx-auto"
    >
      <h2 className="text-2xl font-bold mb-6">Meu Perfil</h2>
      
      <div className="space-y-6 border-b border-slate-700 pb-8 mb-8">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Email (não pode ser alterado)</label>
          <input
            type="email"
            value={user.email}
            disabled
            className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-400 cursor-not-allowed"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Nome</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
          />
        </div>
        <Button
          onClick={handleProfileSave}
          disabled={isSavingProfile}
          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3"
        >
          {isSavingProfile ? 'Salvando...' : 'Salvar Nome'}
        </Button>
      </div>

      <h3 className="text-xl font-bold mb-6">Alterar Senha</h3>
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Nova Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Digite sua nova senha"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2 text-slate-300">Confirmar Nova Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirme a nova senha"
            className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-3 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-500/20 transition-all outline-none"
          />
        </div>
        <Button
          onClick={handlePasswordUpdate}
          disabled={isSavingPassword}
          className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-slate-900 font-semibold py-3"
        >
          {isSavingPassword ? 'Salvando...' : 'Alterar Senha'}
        </Button>
      </div>
    </motion.div>
  );
};

export default UserProfile;