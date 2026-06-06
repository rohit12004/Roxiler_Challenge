import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Eye, EyeOff, Sparkles, Check, X } from 'lucide-react';
import storeRatingHero from '../assets/store_rating_hero.png';

const RoxilerLogo = () => (
  <div className="flex items-center gap-2">
    <div className="flex items-center justify-center w-8 h-8 bg-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20">
      <Sparkles size={16} className="animate-pulse" />
    </div>
    <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">Roxiler</span>
  </div>
);

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('user');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password rules status
  const [pwdLengthValid, setPwdLengthValid] = useState(false);
  const [pwdUpperValid, setPwdUpperValid] = useState(false);
  const [pwdSpecialValid, setPwdSpecialValid] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Handle live password validation updates
  useEffect(() => {
    setPwdLengthValid(password.length >= 8 && password.length <= 16);
    setPwdUpperValid(/[A-Z]/.test(password));
    setPwdSpecialValid(/[^a-zA-Z0-9]/.test(password));
  }, [password]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Custom validations matching backend
    if (name.length < 20 || name.length > 60) {
      setError('Name must be between 20 and 60 characters long.');
      return;
    }

    if (!pwdLengthValid || !pwdUpperValid || !pwdSpecialValid) {
      setError('Password does not meet all complexity requirements.');
      return;
    }

    if (address.length > 400) {
      setError('Address must not exceed 400 characters.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await register(name, email, password, address, role);
      setSuccess('Account created successfully! Redirecting to login page...');
      
      // Auto redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen grid grid-cols-1 lg:grid-cols-2 bg-slate-50 overflow-hidden">
      {/* Left Column - Auth Form */}
      <div className="flex flex-col justify-between p-5 sm:p-8 lg:py-10 lg:px-16 bg-white h-full overflow-y-auto scrollbar-thin">
        {/* Brand Logo */}
        <div className="flex items-center">
          <RoxilerLogo />
        </div>

        {/* Center Container */}
        <div className="w-full max-w-sm mx-auto my-auto py-3">
          <div className="mb-4 text-center lg:text-left">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Create Account
            </h1>
            <p className="mt-1 text-slate-500 text-xs">
              Sign up to get access to stores and ratings.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-2.5 text-xs text-red-600 font-semibold animate-pulse">
                ⚠️ {error}
              </div>
            )}
            
            {success && (
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 font-semibold">
                🎉 {success}
              </div>
            )}

            {/* Name */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="name" className="text-xs font-semibold text-slate-700">Full Name</Label>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${name.length >= 20 && name.length <= 60 ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {name.length}/20 chars min
                </span>
              </div>
              <Input
                id="name"
                placeholder="Your Name (e.g. Rohit Kalvankar)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full h-10 border-slate-200 rounded-xl focus-visible:ring-blue-600 text-slate-800 text-xs"
              />
              {name && name.length < 20 && (
                <p className="text-[10px] text-amber-600 font-semibold flex items-center gap-1 pl-1">
                  ⚠️ Must be at least 20 characters (current: {name.length}).
                </p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-1">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full h-10 border-slate-200 rounded-xl focus-visible:ring-blue-600 text-slate-800 text-xs"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <Label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</Label>
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

              {/* Password strength indicators */}
              <div className="grid grid-cols-3 gap-1.5 mt-1.5 p-2 bg-slate-50 border border-slate-100 rounded-xl text-[10px]">
                <div className="flex items-center gap-1 font-semibold justify-center py-0.5 rounded-lg border border-slate-200/50 bg-white">
                  {pwdLengthValid ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={pwdLengthValid ? "text-slate-700" : "text-slate-400"}>8-16 chars</span>
                </div>
                <div className="flex items-center gap-1 font-semibold justify-center py-0.5 rounded-lg border border-slate-200/50 bg-white">
                  {pwdUpperValid ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={pwdUpperValid ? "text-slate-700" : "text-slate-400"}>1 Upper</span>
                </div>
                <div className="flex items-center gap-1 font-semibold justify-center py-0.5 rounded-lg border border-slate-200/50 bg-white">
                  {pwdSpecialValid ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />}
                  <span className={pwdSpecialValid ? "text-slate-700" : "text-slate-400"}>1 Special</span>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label htmlFor="address" className="text-xs font-semibold text-slate-700">Address</Label>
                <span className="text-[10px] text-slate-400 font-bold">
                  {address.length}/400 max
                </span>
              </div>
              <textarea
                id="address"
                placeholder="123 Developer Street, Coding City, 416512"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                rows={1}
                maxLength={400}
                className="flex w-full rounded-xl border border-slate-200 bg-background px-3 py-1.5 text-xs ring-offset-background placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none text-slate-800 min-h-[44px] max-h-[50px]"
              />
            </div>

            <Button
              type="submit"
              disabled={loading || name.length < 20 || !pwdLengthValid || !pwdUpperValid || !pwdSpecialValid}
              className="w-full h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all duration-150 flex items-center justify-center gap-2 mt-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  Registering...
                </>
              ) : (
                'Sign Up'
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-xs text-center text-slate-500 py-1 mt-2">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Sign In
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
