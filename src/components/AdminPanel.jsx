import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { UserPlus, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const { toast } = useToast();
  const { signUp } = useAuth();

  const fetchUsers = useCallback(async () => {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: "Erro ao buscar usuários", description: error.message, variant: "destructive" });
    } else {
      setUsers(data);
    }
  }, [toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setFormData(user ? { name: user.name, email: user.email, password: '' } : { name: '', email: '', password: '' });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingUser) {
      const { error } = await supabase.from('profiles').update({ name: formData.name }).eq('id', editingUser.id);
      if (error) {
        toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Usuário atualizado com sucesso!" });
        fetchUsers();
        setShowModal(false);
      }
    } else {
      const { error } = await signUp(formData.email, formData.password, { data: { name: formData.name, is_admin: false }});
      if (!error) {
        toast({ title: "Usuário criado com sucesso!" });
        fetchUsers();
        setShowModal(false);
      }
    }
  };

  const handleDelete = async (userId) => {
    const { error } = await supabase.auth.admin.deleteUser(userId);
    if (error) {
      toast({ title: "Erro ao remover usuário", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuário removido com sucesso!" });
      fetchUsers();
    }
  };

  const nonAdminUsers = users.filter(u => !u.is_admin);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-6"
    >
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Gerenciamento de Usuários</h2>
        <Button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="text-left py-3 px-2 text-slate-400 font-medium">Nome</th>
              <th className="text-left py-3 px-2 text-slate-400 font-medium">Email</th>
              <th className="text-left py-3 px-2 text-slate-400 font-medium">Data de Criação</th>
              <th className="text-left py-3 px-2 text-slate-400 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {nonAdminUsers.map(user => (
              <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="py-4 px-2">{user.name}</td>
                <td className="py-4 px-2">{user.email}</td>
                <td className="py-4 px-2">{new Date(user.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="py-4 px-2">
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" onClick={() => handleOpenModal(user)}><Edit className="w-4 h-4" /></Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(user.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
             {nonAdminUsers.length === 0 && (
                <tr>
                    <td colSpan="4" className="text-center py-8 text-slate-400">Nenhum usuário cadastrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="glass-effect border-slate-700">
          <DialogHeader>
            <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nome</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                required
                value={formData.email}
                disabled={!!editingUser}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500 disabled:opacity-50"
              />
            </div>
            {!editingUser && (
              <div>
                <label className="block text-sm font-medium mb-2">Senha</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-lg px-4 py-2 focus:border-yellow-500"
                />
              </div>
            )}
            <Button type="submit" className="w-full bg-yellow-500 hover:bg-yellow-600 text-slate-900">
              {editingUser ? 'Salvar Alterações' : 'Criar Usuário'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default AdminPanel;