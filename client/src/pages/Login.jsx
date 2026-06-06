import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Eye, EyeOff, Sparkles } from 'lucide-react';
import storeRatingHero from '../assets/store_rating_hero.png';

const RoxilerLogo = () => (
  <div className="flex items-center gap-2">
    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20">
      <Sparkles size={16} className="animate-pulse" />
    </div>
    <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Roxiler</span>
  </div>
);

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'owner') {
        navigate('/owner');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 overflow-hidden">
      {/* Left Column - Auth Form */}
      <div className="flex flex-col justify-between p-6 sm:p-10 lg:py-12 lg:px-16 bg-white h-full overflow-hidden">
        {/* Brand Logo */}
        <div className="flex items-center">
          <RoxilerLogo />
        </div>

        {/* Center Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-4">
          <div className="mb-6 text-center lg:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Welcome Back
            </h1>
            <p className="mt-2 text-slate-500 text-xs">
              Enter your email and password to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-600 font-semibold animate-pulse">
                ⚠️ {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="sellostore@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 border-slate-200 rounded-xl focus-visible:ring-blue-600 text-slate-800 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full h-10 pr-10 border-slate-200 rounded-xl focus-visible:ring-blue-600 text-slate-800 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>


            <Button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all duration-150 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Logging in...
                </>
              ) : (
                'Log In'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-xs text-center text-slate-500 py-2">
          Don't Have An Account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register Now.
          </Link>
        </div>
      </div>

      {/* Right Column - Marketing Background and Dashboard Preview */}
      <div className="hidden lg:flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white relative overflow-hidden h-full">
        {/* Decorative Grid Overlay */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 w-full max-w-sm mb-6 text-center lg:text-left">
          <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl leading-tight">
            Effortlessly manage your team and operations.
          </h2>
          <p className="mt-2.5 text-blue-100 text-xs leading-relaxed">
            Log in to access your CRM dashboard and manage your team.
          </p>
        </div>

        {/* Dashboard Mockup Display */}
        <div className="relative z-10 w-full flex justify-center scale-90 xl:scale-95 transition-transform duration-300">
          <img
            src={storeRatingHero}
            alt="Store Ratings and Reviews Preview"
            className="rounded-2xl shadow-2xl border border-white/10 max-h-[420px] object-cover"
          />
        </div>
      </div>
    </div>
  );
};



