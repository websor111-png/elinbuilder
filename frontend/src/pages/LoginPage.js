import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-white flex" data-testid="login-page">
      {/* Left - Form */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-[#0A0A0A] mb-12 block" data-testid="login-logo">
            ELYN<span className="text-[#002FA7]">BUILDER</span>
          </Link>
          
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#0A0A0A] mb-2">Welcome back</h1>
          <p className="text-sm text-[#52525B] mb-8">Sign in to continue building apps</p>

          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-sm" data-testid="login-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="label-text block mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input-base"
                placeholder="your@email.com"
                required
                data-testid="login-email-input"
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
                  placeholder="Enter password"
                  required
                  data-testid="login-password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A1A1AA] hover:text-[#52525B]"
                  data-testid="login-toggle-password"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-sm disabled:opacity-50"
              data-testid="login-submit-btn"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-[#52525B] mt-6 text-center">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#002FA7] font-medium hover:underline" data-testid="login-register-link">
              Create one
            </Link>
          </p>
        </div>
      </div>

      {/* Right - Visual */}
      <div className="hidden lg:flex flex-1 bg-[#F4F4F5] items-center justify-center border-l border-[#E4E4E7]">
        <div className="max-w-md px-12">
          <div className="card-base p-2 mb-6">
            <img
              src="https://images.unsplash.com/photo-1771923082503-0a3381c46cef?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwzfHxkYXNoYm9hcmQlMjB1c2VyJTIwaW50ZXJmYWNlfGVufDB8fHx8MTc3NTIxNTI3N3ww&ixlib=rb-4.1.0&q=85"
              alt="Dashboard Preview"
              className="w-full h-auto rounded-sm"
            />
          </div>
          <blockquote className="font-heading text-lg font-medium text-[#0A0A0A] tracking-tight">
            "Build professional mobile apps from any website in minutes"
          </blockquote>
          <p className="text-sm text-[#52525B] mt-2">Elyn Builder Platform</p>
        </div>
      </div>
    </div>
  );
}
