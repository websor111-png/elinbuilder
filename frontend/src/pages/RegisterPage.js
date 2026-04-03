import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    const result = await register(username, email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex" data-testid="register-page">
      {/* Left - Visual */}
      <div className="hidden lg:flex flex-1 bg-[#0A0A0A] items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-64 h-64 border border-[#002FA7] rotate-12" />
          <div className="absolute bottom-20 right-20 w-48 h-48 border border-[#002FA7] -rotate-6" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border border-[#002FA7] rotate-45" />
        </div>
        <div className="relative z-10 max-w-sm px-12 text-white">
          <div className="font-heading text-4xl font-bold tracking-tighter leading-none mb-6">
            ELYN<span className="text-[#002FA7]">BUILDER</span>
          </div>
          <p className="text-zinc-400 text-base leading-relaxed mb-8">
            Create professional Android & iOS applications from any website. AI-powered, free forever.
          </p>
          <div className="flex gap-6">
            <div>
              <div className="font-heading text-2xl font-bold text-[#002FA7]">AI</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Powered</div>
            </div>
            <div>
              <div className="font-heading text-2xl font-bold text-[#002FA7]">Free</div>
              <div className="text-xs text-zinc-500 uppercase tracking-wider">Forever</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-[#0A0A0A] mb-12 block lg:hidden" data-testid="register-logo">
            ELYN<span className="text-[#002FA7]">BUILDER</span>
          </Link>

          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0A0A0A] mb-2">Create account</h1>
          <p className="text-sm text-[#52525B] mb-8">Start building apps for free</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text block mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                className="input-base"
                placeholder="Your name"
                required
                data-testid="register-username-input"
              />
            </div>
            <div>
              <label className="label-text block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base"
                placeholder="your@email.com"
                required
                data-testid="register-email-input"
              />
            </div>
            <div>
              <label className="label-text block mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input-base pr-10"
                  placeholder="Min 6 characters"
                  required
                  data-testid="register-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#52525B]"
                  data-testid="register-toggle-password"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50"
              data-testid="register-submit-btn"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-sm text-[#52525B] mt-6 text-center">
            Already have an account?{' '}
            <Link to="/login" className="text-[#002FA7] font-medium hover:underline" data-testid="register-login-link">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
