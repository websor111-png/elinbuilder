import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Smartphone, Zap, Shield, Upload, Bot, Globe } from 'lucide-react';

const features = [
  { icon: Globe, title: "Website to App", desc: "Transform any website into a native mobile application with one click" },
  { icon: Bot, title: "AI Assistant", desc: "Let AI help you optimize and configure your mobile app automatically" },
  { icon: Smartphone, title: "Android & iOS", desc: "Generate both Android and iOS apps from a single WebView project" },
  { icon: Upload, title: "Google Play Upload", desc: "Upload your app directly to Google Play Console via API" },
  { icon: Zap, title: "Instant Build", desc: "Generate production-ready app code in seconds, not hours" },
  { icon: Shield, title: "100% Free", desc: "All features are completely free. No hidden fees, no subscriptions" },
];

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="nav-glass fixed top-0 w-full z-50 px-4 md:px-8 lg:px-12" data-testid="navbar">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16">
          <Link to="/" className="font-heading text-xl font-bold tracking-tight text-[#0A0A0A]" data-testid="logo">
            ELYN<span className="text-[#002FA7]">BUILDER</span>
          </Link>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-primary text-sm" data-testid="go-dashboard-btn">Dashboard</Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm" data-testid="login-btn">Login</Link>
                <Link to="/register" className="btn-primary text-sm" data-testid="register-btn">Get Started</Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 md:pt-40 md:pb-32 px-4 md:px-8 lg:px-12" data-testid="hero-section">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="animate-fade-in-up">
              <div className="label-text mb-6">APP BUILDER PLATFORM</div>
              <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl tracking-tighter leading-none font-bold text-[#0A0A0A] mb-6">
                Build Mobile Apps<br />
                <span className="text-[#002FA7]">From Any Website</span>
              </h1>
              <p className="text-base md:text-lg text-[#52525B] leading-relaxed mb-10 max-w-lg">
                Transform your website into a professional Android & iOS application. 
                AI-powered configuration, instant generation, and direct Google Play upload.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link to="/register" className="btn-primary text-base px-8 py-3" data-testid="hero-cta-btn">
                  Start Building Free
                </Link>
                <a href="#features" className="btn-secondary text-base px-8 py-3" data-testid="hero-features-btn">
                  See Features
                </a>
              </div>
            </div>
            <div className="animate-fade-in-up hidden lg:block" style={{ animationDelay: '0.15s' }}>
              <div className="relative">
                <div className="card-base p-2 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1767449441925-737379bc2c4d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA0MTJ8MHwxfHNlYXJjaHw0fHxtb2Rlcm4lMjBtb2JpbGUlMjBhcHAlMjB1c2VyJTIwaW50ZXJmYWNlJTIwc21hcnRwaG9uZSUyMG1vY2t1cHN8ZW58MHx8fHwxNzc1MjE1MjYyfDA&ixlib=rb-4.1.0&q=85"
                    alt="App Builder Interface"
                    className="w-full h-auto rounded-sm"
                  />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-[#002FA7] text-white p-4 rounded-sm">
                  <div className="font-heading font-bold text-2xl">100%</div>
                  <div className="text-xs uppercase tracking-widest opacity-80">Free</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-[#F4F4F5] border-y border-[#E4E4E7]">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: "WebView", label: "Technology" },
              { val: "Android", label: "& iOS" },
              { val: "AI", label: "Powered" },
              { val: "Free", label: "Forever" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="font-heading text-2xl md:text-3xl font-bold text-[#0A0A0A] tracking-tight">{s.val}</div>
                <div className="text-sm text-[#52525B] mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 md:py-32 px-4 md:px-8 lg:px-12" data-testid="features-section">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="label-text mb-4">FEATURES</div>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight leading-none font-bold text-[#0A0A0A]">
              Everything You Need
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div 
                key={i} 
                className="card-base p-6 md:p-8 group hover:border-[#002FA7] transition-colors duration-200"
                data-testid={`feature-card-${i}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                <div className="w-10 h-10 flex items-center justify-center bg-[#F4F4F5] border border-[#E4E4E7] rounded-sm mb-5 group-hover:bg-[#002FA7] group-hover:border-[#002FA7] transition-colors duration-200">
                  <f.icon className="w-5 h-5 text-[#0A0A0A] group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="font-heading text-lg font-semibold text-[#0A0A0A] mb-2">{f.title}</h3>
                <p className="text-sm text-[#52525B] leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-32 bg-[#0A0A0A] text-white px-4 md:px-8 lg:px-12" data-testid="how-it-works-section">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <div className="label-text text-[#A1A1AA] mb-4">HOW IT WORKS</div>
            <h2 className="font-heading text-3xl sm:text-4xl tracking-tight leading-none font-bold">
              Three Simple Steps
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Enter URL", desc: "Paste your website URL and give your app a name" },
              { step: "02", title: "Configure", desc: "Customize colors, icons, permissions with AI assistance" },
              { step: "03", title: "Generate", desc: "Download your app or upload directly to Google Play" },
            ].map((s, i) => (
              <div key={i} className="border border-zinc-800 p-8 rounded-sm" data-testid={`step-${i}`}>
                <div className="font-heading text-5xl font-bold text-[#002FA7] mb-4">{s.step}</div>
                <h3 className="font-heading text-xl font-semibold mb-3">{s.title}</h3>
                <p className="text-zinc-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 md:py-32 px-4 md:px-8 lg:px-12" data-testid="cta-section">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl sm:text-4xl tracking-tight leading-none font-bold text-[#0A0A0A] mb-6">
            Ready to Build Your App?
          </h2>
          <p className="text-[#52525B] text-base md:text-lg mb-10">
            Start converting your website into a mobile app today. It's free, fast, and professional.
          </p>
          <Link to="/register" className="btn-primary text-base px-10 py-3.5" data-testid="cta-btn">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#E4E4E7] py-8 px-4 md:px-8 lg:px-12" data-testid="footer">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-heading font-bold text-sm text-[#0A0A0A]">
            ELYN<span className="text-[#002FA7]">BUILDER</span>
          </div>
          <p className="text-xs text-[#A1A1AA]">Elyn Builder App iOS. 100% Free Platform.</p>
        </div>
      </footer>
    </div>
  );
}
