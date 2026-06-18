import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Truck, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';

export default function Login() {
  const { user, loading, dispatch } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState(searchParams.get('error') || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [view, setView] = useState('login'); // 'login' | 'forgot-password'
  
  const [formData, setFormData] = useState({
    identifier: '',
    email: '',
    employee_number: '',
    password: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to dashboard
  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/login', {
        identifier: formData.identifier,
        password: formData.password
      });
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user });
      navigate('/dashboard');
    } catch (e) {
      const err = e.response?.data?.error;
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Login failed. Please check your credentials.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setIsSubmitting(true);
    try {
      const { data } = await api.post('/auth/forgot-password', {
        email: formData.email,
        employee_number: formData.employee_number
      });
      setSuccessMsg(data.message);
      // Wait a few seconds then switch back to login
      setTimeout(() => {
        setView('login');
        setSuccessMsg('');
        setFormData(prev => ({ ...prev, password: '' })); // clear password
      }, 5000);
    } catch (e) {
      const err = e.response?.data?.error;
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Failed to request password reset.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="absolute top-10 left-10 w-80 h-80 bg-primary-500/20 rounded-full blur-3xl animate-float-1 mix-blend-screen" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary-700/15 rounded-full blur-3xl animate-float-2 mix-blend-screen" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-rose-900/15 rounded-full blur-3xl animate-blob mix-blend-screen" />

      {/* Top Right Logo */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 bg-white rounded-xl shadow-xl p-2.5 z-10 animate-fade-in">
        <img src="/logo.png" alt="CK Birla Group - Orient Paper" className="h-8 md:h-10 object-contain" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-2xl backdrop-blur-sm mb-4">
            <Truck className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Vehicle Requisition Portal
          </h1>

        </div>

        {/* Login Card */}
        <div className="glass-card rounded-2xl p-8 transition-all duration-300">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white mb-1">
              {view === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h2>
            <p className="text-primary-200 text-sm">
              {view === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Enter your details to receive a new password'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-danger-500/20 border border-danger-500/30 rounded-lg">
              <p className="text-sm text-red-200">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
              <p className="text-sm text-emerald-200">{successMsg}</p>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-1">Employee Number / Email ID</label>
                <input
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="EMP001 or you@company.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-primary-200">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setView('forgot-password'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs text-white hover:text-primary-200 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-700 disabled:opacity-70"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-primary-200 mb-4 bg-primary-900/30 p-3 rounded-lg border border-primary-500/20">
                Please provide your registered mail ID and employee number to get a new password.
              </p>
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-1">Email ID</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="you@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary-200 mb-1">Employee Number</label>
                <input
                  type="text"
                  required
                  value={formData.employee_number}
                  onChange={e => setFormData({ ...formData, employee_number: e.target.value })}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/50"
                  placeholder="EMP001"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3.5 bg-white text-primary-700 font-semibold rounded-xl hover:bg-primary-50 transition-colors focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-primary-700 disabled:opacity-70"
              >
                {isSubmitting ? 'Sending Request...' : 'Reset Password'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="inline-flex items-center gap-1 text-sm text-primary-200 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-white/10">
            <div className="flex items-center gap-2 text-primary-200 text-xs">
              <Shield className="w-3.5 h-3.5" />
              <span>Secure Internal Portal Access.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-300/60 text-xs mt-6">
          © {new Date().getFullYear()} Vehicle Requisition Portal.
        </p>
      </div>
    </div>
  );
}
