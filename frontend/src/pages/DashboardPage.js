import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { Plus, Settings, Trash2, ExternalLink, LogOut, Shield, Smartphone, Globe } from 'lucide-react';
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

export default function DashboardPage() {
  const { user, logout, axiosConfig } = useAuth();
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newApp, setNewApp] = useState({ name: '', url: '', description: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchApps();
  }, []);// eslint-disable-line

  const fetchApps = async () => {
    try {
      const { data } = await axios.get(`${API}/apps`, axiosConfig());
      setApps(data);
    } catch {
      toast.error('Failed to load apps');
    } finally {
      setLoading(false);
    }
  };

  const createApp = async (e) => {
    e.preventDefault();
    if (!newApp.name || !newApp.url) return;
    setCreating(true);
    try {
      const { data } = await axios.post(`${API}/apps`, newApp, axiosConfig());
      setApps(prev => [data, ...prev]);
      setShowCreate(false);
      setNewApp({ name: '', url: '', description: '' });
      toast.success('App created successfully');
      navigate(`/builder/${data.id}`);
    } catch {
      toast.error('Failed to create app');
    } finally {
      setCreating(false);
    }
  };

  const deleteApp = async (appId) => {
    if (!window.confirm('Are you sure you want to delete this app?')) return;
    try {
      await axios.delete(`${API}/apps/${appId}`, axiosConfig());
      setApps(prev => prev.filter(a => a.id !== appId));
      toast.success('App deleted');
    } catch {
      toast.error('Failed to delete app');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]" data-testid="dashboard-page">
      {/* Top Nav */}
      <nav className="nav-glass sticky top-0 z-50 px-4 md:px-8 lg:px-12" data-testid="dashboard-navbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-14">
          <Link to="/" className="font-heading text-lg font-bold tracking-tight text-[#0A0A0A]">
            ELYN<span className="text-[#002FA7]">BUILDER</span>
          </Link>
          <div className="flex items-center gap-4">
            {user?.role === 'admin' && (
              <Link to="/admin" className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-[#002FA7] transition-colors" data-testid="admin-link">
                <Shield className="w-4 h-4" /> Admin
              </Link>
            )}
            <span className="text-sm text-[#52525B] hidden sm:block">{user?.username || user?.email}</span>
            <button onClick={logout} className="flex items-center gap-1.5 text-sm text-[#52525B] hover:text-red-500 transition-colors" data-testid="logout-btn">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-2xl sm:text-3xl tracking-tight font-bold text-[#0A0A0A]">My Apps</h1>
            <p className="text-sm text-[#52525B] mt-1">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm" data-testid="create-app-btn">
            <Plus className="w-4 h-4" /> New App
          </button>
        </div>

        {/* Apps Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="card-base p-6 animate-pulse">
                <div className="h-5 bg-zinc-100 rounded w-2/3 mb-4" />
                <div className="h-4 bg-zinc-100 rounded w-full mb-2" />
                <div className="h-4 bg-zinc-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="card-base p-12 text-center" data-testid="empty-state">
            <Smartphone className="w-12 h-12 text-[#A1A1AA] mx-auto mb-4" />
            <h3 className="font-heading text-lg font-semibold text-[#0A0A0A] mb-2">No apps yet</h3>
            <p className="text-sm text-[#52525B] mb-6">Create your first app to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn-primary text-sm" data-testid="empty-create-btn">
              Create First App
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {apps.map((app) => (
              <div key={app.id} className="card-base p-6 group hover:border-[#002FA7] transition-colors duration-200" data-testid={`app-card-${app.id}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm flex items-center justify-center text-white font-heading font-bold text-sm" style={{ background: app.primary_color || '#002FA7' }}>
                      {app.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-[#0A0A0A] text-base">{app.name}</h3>
                      <span className={`text-xs font-medium uppercase tracking-wider ${
                        app.status === 'generated' ? 'text-green-600' : 'text-[#A1A1AA]'
                      }`}>{app.status}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mb-4 text-sm text-[#52525B]">
                  <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{app.url}</span>
                </div>
                {app.description && (
                  <p className="text-sm text-[#52525B] mb-4 line-clamp-2">{app.description}</p>
                )}
                <div className="flex items-center gap-2 pt-4 border-t border-[#E4E4E7]">
                  <Link to={`/builder/${app.id}`} className="btn-primary text-xs py-2 px-4 flex items-center gap-1.5" data-testid={`edit-app-${app.id}`}>
                    <Settings className="w-3.5 h-3.5" /> Configure
                  </Link>
                  <a href={app.url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-xs py-2 px-3" data-testid={`preview-app-${app.id}`}>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button onClick={() => deleteApp(app.id)} className="ml-auto p-2 text-[#A1A1AA] hover:text-red-500 transition-colors" data-testid={`delete-app-${app.id}`}>
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md" data-testid="create-app-dialog">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl tracking-tight">Create New App</DialogTitle>
            <DialogDescription className="text-sm text-[#52525B]">Transform a website into a mobile app</DialogDescription>
          </DialogHeader>
          <form onSubmit={createApp} className="space-y-4 mt-4">
            <div>
              <label className="label-text block mb-2">App Name</label>
              <input
                value={newApp.name}
                onChange={e => setNewApp(p => ({ ...p, name: e.target.value }))}
                className="input-base"
                placeholder="My Awesome App"
                required
                data-testid="new-app-name-input"
              />
            </div>
            <div>
              <label className="label-text block mb-2">Website URL</label>
              <input
                value={newApp.url}
                onChange={e => setNewApp(p => ({ ...p, url: e.target.value }))}
                className="input-base"
                placeholder="https://example.com"
                required
                data-testid="new-app-url-input"
              />
            </div>
            <div>
              <label className="label-text block mb-2">Description (Optional)</label>
              <textarea
                value={newApp.description}
                onChange={e => setNewApp(p => ({ ...p, description: e.target.value }))}
                className="input-base resize-none"
                rows={3}
                placeholder="Brief description of your app"
                data-testid="new-app-description-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} className="rounded-sm" data-testid="cancel-create-btn">Cancel</Button>
              <Button type="submit" disabled={creating} className="bg-[#002FA7] hover:bg-[#002480] rounded-sm" data-testid="submit-create-btn">
                {creating ? 'Creating...' : 'Create App'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
