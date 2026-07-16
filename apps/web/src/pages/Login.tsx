import React, { useState } from 'react';
import { auth } from '../config/supabase';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

const Login: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      navigate('/');
    } catch (err: any) {
      showToast(err.message || 'Google Sign-In failed', 'error');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      showToast('Please enter your email address first', 'warning');
      return;
    }
    try {
      const { error } = await auth.resetPasswordForEmail(email);
      if (error) throw error;
      showToast('Password reset email sent! Check your inbox.', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to send reset email', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isSignUp) {
        const { error } = await auth.signUp({ email, password });
        if (error) throw error;
      } else {
        const { error } = await auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
      showToast(err.message || 'Authentication failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-stone-50 text-stone-900 font-sans">
      {/* Left Column: Image & Welcome text (hidden on small screens) */}
      <div className="hidden lg:flex w-1/2 relative bg-emerald-900 overflow-hidden items-center justify-center">
        <img 
          src="/bg-agriculture.png" 
          alt="Agriculture Field" 
          className="absolute inset-0 w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-emerald-900/90 via-emerald-900/40 to-transparent" />
        <div className="relative z-10 p-12 text-center max-w-xl">
          <div className="inline-flex items-center justify-center p-4 bg-white/20 backdrop-blur-md rounded-3xl mb-8 shadow-2xl">
            <img src="/logo.png" alt="PlantPulse Logo" className="w-20 h-20 object-contain" />
          </div>
          <h1 className="text-5xl font-extrabold text-white mb-6 drop-shadow-lg tracking-tight">
            Empowering Farmers with AI
          </h1>
          <p className="text-xl text-emerald-50 font-medium drop-shadow-md leading-relaxed">
            Instantly diagnose plant diseases and get expert treatment advice tailored for your crops.
          </p>
        </div>
      </div>

      {/* Right Column: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-24 relative">
        {/* Mobile-only background overlay */}
        <div className="absolute inset-0 z-0 lg:hidden overflow-hidden">
          <img 
            src="/bg-agriculture.png" 
            alt="Agriculture Field" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-stone-50/90" />
        </div>

        <div className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-md lg:bg-transparent lg:backdrop-blur-none p-8 lg:p-0 rounded-3xl shadow-xl lg:shadow-none border border-stone-200/50 lg:border-none">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center shadow-lg bg-emerald-100 overflow-hidden border-4 border-white">
              <img src="/logo.png" alt="PlantPulse Logo" className="w-14 h-14 object-contain" />
            </div>
          </div>
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-800 mb-3 tracking-tight text-center lg:text-left">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-stone-500 mb-10 text-center lg:text-left text-lg">
            {isSignUp ? 'Join our community of farmers.' : 'Sign in to access your farm data.'}
          </p>

          {error && (
            <div className="mb-8 p-4 bg-red-50 text-red-700 border border-red-200 rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Email Address</label>
              <input
                type="email"
                required
                className="w-full px-5 py-4 bg-white border-2 border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg"
                placeholder="farmer@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-bold text-stone-700">Password</label>
                {!isSignUp && (
                  <button 
                    type="button" 
                    onClick={handleForgotPassword}
                    className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                className="w-full px-5 py-4 bg-white border-2 border-stone-200 rounded-2xl text-stone-900 placeholder-stone-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all text-lg"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="space-y-4 pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center text-lg"
              >
                {isLoading ? (
                  <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isSignUp ? 'Sign Up' : 'Sign In'
                )}
              </button>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-stone-200"></div>
                <span className="flex-shrink-0 mx-4 text-sm font-bold text-stone-400 uppercase tracking-wider">Or</span>
                <div className="flex-grow border-t border-stone-200"></div>
              </div>
              
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-4 bg-white border-2 border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300 font-bold rounded-2xl transition-all transform hover:-translate-y-1 active:translate-y-0 disabled:opacity-70 disabled:hover:translate-y-0 flex justify-center items-center gap-3 text-lg shadow-sm"
              >
                <svg className="w-6 h-6" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            </div>
          </form>

          <div className="mt-10 text-center text-lg font-medium text-stone-500">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button 
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors underline decoration-emerald-600/30 underline-offset-4"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
