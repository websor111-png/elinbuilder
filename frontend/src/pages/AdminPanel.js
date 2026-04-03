import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  Users, Smartphone, Shield, ShieldOff, Trash2, ArrowLeft, 
  BarChart3, LogOut, Ban, CheckCircle 
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import { Button } from '../components/ui/button';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminPanel() {
  const { user, logout, axiosConfig } = useAuth();
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => {
    fetchData();
  }, []); // eslint-disable-line

  const fetchData = async () => {
    try {
      const [statsRes, usersRes, appsRes] = await Promise.all([
        axios.get(`${API}/admin/stats`, axiosConfig()),
        axios.get(`${API}/admin/users`, axiosConfig()),
        axios.get(`${API}/admin/apps`, axiosConfig()),
      ]);
      setStats(statsRes.data);
      setUsers(usersRes.data);
      setApps(appsRes.data);
    } catch {
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleBlock = async (userId, isBlocked) => {
    try {
      await axios.put(`${API}/admin/users/${userId}/${isBlocked ? 'unblock' : 'block'}`, {}, axiosConfig());
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, blocked: !isBlocked } : u));
      toast.success(isBlocked ? 'User unblocked' : 'User blocked');
    } catch {
      toast.error('Action failed');
    }
  };

  const deleteUser = async (userId) => {
    try {
      await axios.delete(`${API}/admin/users/${userId}`, axiosConfig());
      setUsers(prev => prev.filter(u => u._id !== userId));
      setConfirmDelete(null);
      toast.success('User deleted');
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Delete failed');
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAFA]">
      <div className="w-8 h-8 border-2 border-[#002FA7] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="admin-panel">
      {/* Nav */}
      <nav className="nav-glass sticky top-0 z-50 px-4 md:px-8 lg:px-12" data-testid="admin-navbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-[#52525B] hover:text-[#0A0A0A] transition-colors" data-testid="admin-back">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <span className="font-heading font-bold text-[#0A0A0A] text-lg">
              ELYN<span className="text-[#002FA7]">BUILDER</span>
              <span className="text-xs ml-2 px-2 py-0.5 bg-[#002FA7] text-white rounded-sm font-medium uppercase tracking-wider">Admin</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-[#52525B] hidden sm:block">{user?.email}</span>
            <button onClick={logout} className="text-[#52525B] hover:text-red-500 transition-colors" data-testid="admin-logout">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8" data-testid="admin-stats">
            {[
              { label: 'Total Users', value: stats.total_users, icon: Users, color: '#002FA7' },
              { label: 'Total Apps', value: stats.total_apps, icon: Smartphone, color: '#10B981' },
              { label: 'Blocked Users', value: stats.blocked_users, icon: Ban, color: '#EF4444' },
              { label: 'Generated Apps', value: stats.generated_apps, icon: CheckCircle, color: '#F59E0B' },
            ].map((s, i) => (
              <div key={i} className="card-base p-5" data-testid={`stat-${i}`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-sm flex items-center justify-center" style={{ background: `${s.color}15` }}>
                    <s.icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <span className="label-text">{s.label}</span>
                </div>
                <div className="font-heading text-3xl font-bold text-[#0A0A0A] tracking-tight">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="bg-white border border-[#E4E4E7] rounded-sm mb-6 p-1" data-testid="admin-tabs">
            <TabsTrigger value="users" className="rounded-sm text-xs data-[state=active]:bg-[#002FA7] data-[state=active]:text-white" data-testid="admin-tab-users">
              <Users className="w-3.5 h-3.5 mr-1.5" /> Users ({users.length})
            </TabsTrigger>
            <TabsTrigger value="apps" className="rounded-sm text-xs data-[state=active]:bg-[#002FA7] data-[state=active]:text-white" data-testid="admin-tab-apps">
              <Smartphone className="w-3.5 h-3.5 mr-1.5" /> Apps ({apps.length})
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users">
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="users-table">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA]">
                      <th className="text-left p-4 label-text">User</th>
                      <th className="text-left p-4 label-text">Email</th>
                      <th className="text-left p-4 label-text">Role</th>
                      <th className="text-left p-4 label-text">Status</th>
                      <th className="text-left p-4 label-text">Created</th>
                      <th className="text-right p-4 label-text">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(u => (
                      <tr key={u._id} className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#FAFAFA] transition-colors" data-testid={`user-row-${u._id}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#F4F4F5] flex items-center justify-center text-sm font-semibold text-[#52525B]">
                              {(u.username || u.email)?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#0A0A0A]">{u.username || 'N/A'}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#52525B]">{u.email}</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider ${
                            u.role === 'admin' ? 'bg-[#002FA7] text-white' : 'bg-zinc-100 text-zinc-600'
                          }`}>{u.role}</span>
                        </td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-sm font-medium ${
                            u.blocked ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'
                          }`}>{u.blocked ? 'Blocked' : 'Active'}</span>
                        </td>
                        <td className="p-4 text-sm text-[#A1A1AA]">{new Date(u.created_at).toLocaleDateString()}</td>
                        <td className="p-4">
                          {u.role !== 'admin' && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => toggleBlock(u._id, u.blocked)}
                                className={`p-1.5 rounded-sm transition-colors ${u.blocked ? 'text-green-600 hover:bg-green-50' : 'text-amber-600 hover:bg-amber-50'}`}
                                title={u.blocked ? 'Unblock' : 'Block'}
                                data-testid={`toggle-block-${u._id}`}
                              >
                                {u.blocked ? <ShieldOff className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
                              </button>
                              <button
                                onClick={() => setConfirmDelete(u)}
                                className="p-1.5 rounded-sm text-red-500 hover:bg-red-50 transition-colors"
                                title="Delete"
                                data-testid={`delete-user-${u._id}`}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Apps Tab */}
          <TabsContent value="apps">
            <div className="card-base overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full" data-testid="apps-table">
                  <thead>
                    <tr className="border-b border-[#E4E4E7] bg-[#FAFAFA]">
                      <th className="text-left p-4 label-text">App</th>
                      <th className="text-left p-4 label-text">URL</th>
                      <th className="text-left p-4 label-text">User ID</th>
                      <th className="text-left p-4 label-text">Status</th>
                      <th className="text-left p-4 label-text">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {apps.map(a => (
                      <tr key={a.id} className="border-b border-[#E4E4E7] last:border-0 hover:bg-[#FAFAFA] transition-colors" data-testid={`app-row-${a.id}`}>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white text-xs font-bold" style={{ background: a.primary_color || '#002FA7' }}>
                              {a.name?.charAt(0)?.toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-[#0A0A0A]">{a.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#52525B] max-w-48 truncate">{a.url}</td>
                        <td className="p-4 text-xs text-[#A1A1AA] font-mono">{a.user_id?.slice(0, 8)}...</td>
                        <td className="p-4">
                          <span className={`text-xs px-2 py-0.5 rounded-sm font-medium uppercase tracking-wider ${
                            a.status === 'generated' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-zinc-100 text-zinc-500 border border-zinc-200'
                          }`}>{a.status}</span>
                        </td>
                        <td className="p-4 text-sm text-[#A1A1AA]">{new Date(a.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                    {apps.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-sm text-[#A1A1AA]">No apps created yet</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Delete Confirmation */}
      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent className="sm:max-w-md" data-testid="delete-user-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading">Delete User</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{confirmDelete?.username || confirmDelete?.email}</strong>? 
              This will also delete all their apps and data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)} className="rounded-sm" data-testid="cancel-delete-btn">Cancel</Button>
            <Button onClick={() => deleteUser(confirmDelete?._id)} className="bg-red-500 hover:bg-red-600 rounded-sm" data-testid="confirm-delete-btn">
              Delete User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
