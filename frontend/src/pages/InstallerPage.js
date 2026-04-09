import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  CheckCircle, XCircle, Loader2, Database, Shield, 
  Palette, Rocket, ChevronRight, ChevronLeft, Server, Eye, EyeOff
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const STEPS = [
  { id: 'welcome', title: 'Welcome', icon: Rocket },
  { id: 'requirements', title: 'Requirements', icon: Server },
  { id: 'database', title: 'Database', icon: Database },
  { id: 'admin', title: 'Admin Account', icon: Shield },
  { id: 'site', title: 'Site Settings', icon: Palette },
  { id: 'install', title: 'Install', icon: CheckCircle },
];

export default function InstallerPage() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [checks, setChecks] = useState([]);
  const [checksLoading, setChecksLoading] = useState(false);
  const [allChecksOk, setAllChecksOk] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installComplete, setInstallComplete] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [formData, setFormData] = useState({
    db_host: 'localhost',
    db_port: 27017,
    db_name: 'elyn_builder',
    admin_username: '',
    admin_email: '',
    admin_password: '',
    site_name: 'Elyn Builder',
    logo_url: '',
    ai_key: '',
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const runChecks = async () => {
    setChecksLoading(true);
    try {
      const { data } = await axios.get(`${API}/install/check`);
      setChecks(data.checks);
      setAllChecksOk(data.all_ok);
    } catch {
      toast.error('Failed to check requirements');
    } finally {
      setChecksLoading(false);
    }
  };

  const runInstall = async () => {
    if (!formData.admin_username || !formData.admin_email || !formData.admin_password) {
      toast.error('Please fill all admin fields');
      return;
    }
    if (formData.admin_password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setInstalling(true);
    try {
      const { data } = await axios.post(`${API}/install/setup`, formData);
      if (data.success) {
        setInstallComplete(true);
        toast.success('Installation completed!');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Installation failed');
    } finally {
      setInstalling(false);
    }
  };

  useEffect(() => {
    if (currentStep === 1) runChecks();
  }, [currentStep]);

  const canNext = () => {
    switch (currentStep) {
      case 1: return allChecksOk;
      case 3: return formData.admin_username && formData.admin_email && formData.admin_password.length >= 6;
      case 4: return formData.site_name;
      default: return true;
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-4" data-testid="installer-page">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#002FA7]/20 border border-[#002FA7]/30 rounded-sm mb-4">
            <Rocket className="w-3.5 h-3.5 text-[#002FA7]" />
            <span className="text-xs text-[#002FA7] font-semibold uppercase tracking-wider">Installer v1.0</span>
          </div>
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-white tracking-tighter">
            Elyn Builder <span className="text-[#002FA7]">Setup</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-2">Install your App Builder platform in a few simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-1 mb-8" data-testid="install-progress">
          {STEPS.map((step, i) => (
            <React.Fragment key={step.id}>
              <button
                onClick={() => i <= currentStep && setCurrentStep(i)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-all ${
                  i === currentStep 
                    ? 'bg-[#002FA7] text-white' 
                    : i < currentStep
                    ? 'bg-zinc-800 text-[#002FA7] cursor-pointer' 
                    : 'bg-zinc-900 text-zinc-600 cursor-default'
                }`}
                disabled={i > currentStep}
                data-testid={`step-${step.id}`}
              >
                <step.icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{step.title}</span>
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-700" />}
            </React.Fragment>
          ))}
        </div>

        {/* Step Content */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-sm overflow-hidden" data-testid="install-content">
          {/* STEP 0: Welcome */}
          {currentStep === 0 && (
            <div className="p-8 md:p-12 text-center">
              <div className="w-16 h-16 bg-[#002FA7]/10 border border-[#002FA7]/20 rounded-sm flex items-center justify-center mx-auto mb-6">
                <Rocket className="w-8 h-8 text-[#002FA7]" />
              </div>
              <h2 className="font-heading text-2xl font-bold text-white tracking-tight mb-3">
                Welcome to Elyn Builder Installer
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
                This wizard will guide you through the installation process. 
                You'll need to set up your database, create an admin account, and configure your site.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                {[
                  { icon: Database, label: 'Database Setup' },
                  { icon: Shield, label: 'Admin Account' },
                  { icon: Palette, label: 'Customization' },
                ].map((item, i) => (
                  <div key={i} className="bg-zinc-800/50 border border-zinc-800 p-4 rounded-sm text-center">
                    <item.icon className="w-5 h-5 text-[#002FA7] mx-auto mb-2" />
                    <span className="text-xs text-zinc-400">{item.label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-zinc-600">Estimated time: 2-3 minutes</p>
            </div>
          )}

          {/* STEP 1: Requirements */}
          {currentStep === 1 && (
            <div className="p-8">
              <h2 className="font-heading text-xl font-bold text-white tracking-tight mb-2">Server Requirements</h2>
              <p className="text-zinc-500 text-sm mb-6">Checking if your server meets the minimum requirements</p>
              
              {checksLoading ? (
                <div className="flex flex-col items-center py-8">
                  <Loader2 className="w-8 h-8 text-[#002FA7] animate-spin mb-3" />
                  <p className="text-sm text-zinc-400">Checking requirements...</p>
                </div>
              ) : (
                <div className="space-y-2" data-testid="requirements-list">
                  {checks.map((check, i) => (
                    <div key={i} className={`flex items-center justify-between p-3 rounded-sm border ${
                      check.ok ? 'bg-green-950/20 border-green-900/30' : 'bg-red-950/20 border-red-900/30'
                    }`} data-testid={`check-${check.name.toLowerCase().replace(' ', '-')}`}>
                      <div className="flex items-center gap-3">
                        {check.ok ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="text-sm font-medium text-white">{check.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-zinc-500">Required: {check.required}</span>
                        <span className={`text-xs font-mono ${check.ok ? 'text-green-400' : 'text-red-400'}`}>
                          {check.version}
                        </span>
                      </div>
                    </div>
                  ))}
                  {checks.length > 0 && (
                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-zinc-800">
                      <span className="text-sm font-medium text-white">Overall Status</span>
                      <span className={`text-sm font-semibold ${allChecksOk ? 'text-green-400' : 'text-red-400'}`}>
                        {allChecksOk ? 'All checks passed' : 'Some checks failed'}
                      </span>
                    </div>
                  )}
                  <button onClick={runChecks} className="text-xs text-[#002FA7] hover:underline mt-2" data-testid="recheck-btn">
                    Re-check requirements
                  </button>
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Database */}
          {currentStep === 2 && (
            <div className="p-8">
              <h2 className="font-heading text-xl font-bold text-white tracking-tight mb-2">Database Configuration</h2>
              <p className="text-zinc-500 text-sm mb-6">Configure your MongoDB connection</p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Host</label>
                    <input
                      value={formData.db_host}
                      onChange={e => updateField('db_host', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none font-mono"
                      placeholder="localhost"
                      data-testid="db-host-input"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Port</label>
                    <input
                      type="number"
                      value={formData.db_port}
                      onChange={e => updateField('db_port', parseInt(e.target.value))}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none font-mono"
                      placeholder="27017"
                      data-testid="db-port-input"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Database Name</label>
                  <input
                    value={formData.db_name}
                    onChange={e => updateField('db_name', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none font-mono"
                    placeholder="elyn_builder"
                    data-testid="db-name-input"
                  />
                </div>
                <div className="bg-zinc-800/50 border border-zinc-800 rounded-sm p-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">Note:</strong> The database will be created automatically if it doesn't exist. 
                    Make sure MongoDB is running and accessible at the specified host and port.
                    Default connection: <span className="font-mono text-[#002FA7]">mongodb://{formData.db_host}:{formData.db_port}/{formData.db_name}</span>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Admin Account */}
          {currentStep === 3 && (
            <div className="p-8">
              <h2 className="font-heading text-xl font-bold text-white tracking-tight mb-2">Admin Account</h2>
              <p className="text-zinc-500 text-sm mb-6">Create your administrator account</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Username</label>
                  <input
                    value={formData.admin_username}
                    onChange={e => updateField('admin_username', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none"
                    placeholder="Admin"
                    required
                    data-testid="admin-username-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.admin_email}
                    onChange={e => updateField('admin_email', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none"
                    placeholder="admin@yourdomain.com"
                    required
                    data-testid="admin-email-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Password</label>
                  <div className="relative">
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={formData.admin_password}
                      onChange={e => updateField('admin_password', e.target.value)}
                      className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none pr-10"
                      placeholder="Minimum 6 characters"
                      required
                      data-testid="admin-password-input"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      data-testid="toggle-password-btn"
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {formData.admin_password && formData.admin_password.length < 6 && (
                    <p className="text-xs text-red-400 mt-1">Password must be at least 6 characters</p>
                  )}
                </div>
                <div className="bg-zinc-800/50 border border-zinc-800 rounded-sm p-4">
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    <strong className="text-zinc-300">Important:</strong> This will be your main administrator account. 
                    Only you will have access to the Admin Panel. Save these credentials in a safe place.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Site Settings */}
          {currentStep === 4 && (
            <div className="p-8">
              <h2 className="font-heading text-xl font-bold text-white tracking-tight mb-2">Site Settings</h2>
              <p className="text-zinc-500 text-sm mb-6">Customize your platform appearance</p>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Site Name</label>
                  <input
                    value={formData.site_name}
                    onChange={e => updateField('site_name', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none"
                    placeholder="Elyn Builder"
                    data-testid="site-name-input"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">Logo URL (Optional)</label>
                  <input
                    value={formData.logo_url}
                    onChange={e => updateField('logo_url', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none font-mono"
                    placeholder="https://yourdomain.com/logo.png"
                    data-testid="site-logo-input"
                  />
                  <p className="text-xs text-zinc-600 mt-1">Leave empty to use default Elyn logo. You can change this later from Admin Panel.</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-zinc-400 block mb-2">AI API Key (Optional)</label>
                  <input
                    value={formData.ai_key}
                    onChange={e => updateField('ai_key', e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-sm px-3 py-2.5 text-sm focus:border-[#002FA7] outline-none font-mono"
                    placeholder="sk-..."
                    data-testid="ai-key-input"
                  />
                  <p className="text-xs text-zinc-600 mt-1">For AI-powered app building. You can configure this later.</p>
                </div>
                {/* Preview */}
                {(formData.logo_url || formData.site_name) && (
                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-sm p-4">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-3">Preview</p>
                    <div className="bg-white rounded-sm p-3 flex items-center gap-3">
                      {formData.logo_url && (
                        <img src={formData.logo_url} alt="Logo" className="h-8 w-auto object-contain" onError={e => e.target.style.display='none'} />
                      )}
                      <span className="font-heading font-bold text-[#0A0A0A] text-sm">{formData.site_name || 'Elyn Builder'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Install */}
          {currentStep === 5 && (
            <div className="p-8">
              {!installComplete ? (
                <>
                  <h2 className="font-heading text-xl font-bold text-white tracking-tight mb-2">Ready to Install</h2>
                  <p className="text-zinc-500 text-sm mb-6">Review your settings and click Install</p>
                  
                  {/* Summary */}
                  <div className="space-y-3 mb-8">
                    {[
                      { label: 'Database', value: `mongodb://${formData.db_host}:${formData.db_port}/${formData.db_name}` },
                      { label: 'Admin', value: `${formData.admin_username} (${formData.admin_email})` },
                      { label: 'Site Name', value: formData.site_name },
                      { label: 'AI Key', value: formData.ai_key ? 'Configured' : 'Not set (can add later)' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-zinc-800/50 border border-zinc-800 rounded-sm">
                        <span className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">{item.label}</span>
                        <span className="text-sm text-white font-mono">{item.value}</span>
                      </div>
                    ))}
                  </div>
                  
                  <button
                    onClick={runInstall}
                    disabled={installing}
                    className="w-full bg-[#002FA7] hover:bg-[#002480] text-white rounded-sm py-3.5 font-medium text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                    data-testid="run-install-btn"
                  >
                    {installing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Installing...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" /> Install Elyn Builder
                      </>
                    )}
                  </button>
                </>
              ) : (
                <div className="text-center py-8" data-testid="install-success">
                  <div className="w-16 h-16 bg-green-500/10 border border-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="font-heading text-2xl font-bold text-white tracking-tight mb-3">
                    Installation Complete!
                  </h2>
                  <p className="text-zinc-400 text-sm mb-8 max-w-md mx-auto">
                    Elyn Builder has been installed successfully. You can now login with your admin account and start building apps.
                  </p>
                  <div className="bg-zinc-800/50 border border-zinc-800 rounded-sm p-4 max-w-sm mx-auto mb-8">
                    <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-2">Your Admin Credentials</p>
                    <p className="text-sm text-white">Email: <span className="font-mono text-[#002FA7]">{formData.admin_email}</span></p>
                    <p className="text-sm text-white">Password: <span className="font-mono text-[#002FA7]">{'*'.repeat(formData.admin_password.length)}</span></p>
                  </div>
                  <button
                    onClick={() => window.location.href = '/login'}
                    className="bg-[#002FA7] hover:bg-[#002480] text-white rounded-sm px-8 py-3 font-medium text-sm transition-colors"
                    data-testid="go-to-login-btn"
                  >
                    Go to Login
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          {!installComplete && (
            <div className="flex items-center justify-between p-4 border-t border-zinc-800">
              <button
                onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
                disabled={currentStep === 0}
                className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400 transition-colors"
                data-testid="prev-step-btn"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              {currentStep < 5 && (
                <button
                  onClick={() => setCurrentStep(prev => Math.min(5, prev + 1))}
                  disabled={!canNext()}
                  className="flex items-center gap-1.5 text-sm bg-[#002FA7] hover:bg-[#002480] text-white rounded-sm px-4 py-2 disabled:opacity-30 transition-colors"
                  data-testid="next-step-btn"
                >
                  Next <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-zinc-700 mt-6">
          Elyn Builder App iOS v1.0 - Free App Builder Platform
        </p>
      </div>
    </div>
  );
}
