import { useState, useRef, useEffect } from 'react';
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

  // Mascot and text tracking state
  const [focusedInput, setFocusedInput] = useState(null); // 'identifier' | 'password' | 'email' | 'employee_number' | null
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);
  const empNumRef = useRef(null);

  // Follow the mouse when no input is focused
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!focusedInput) {
        setTargetPos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusedInput]);

  // Recalculate target coordinates for caret tracking on focus/input changes
  useEffect(() => {
    if (!focusedInput) return;

    let activeRef = null;
    let textLength = 0;

    if (focusedInput === 'identifier') {
      activeRef = identifierRef;
      textLength = formData.identifier.length;
    } else if (focusedInput === 'email') {
      activeRef = emailRef;
      textLength = formData.email.length;
    } else if (focusedInput === 'employee_number') {
      activeRef = empNumRef;
      textLength = formData.employee_number.length;
    } else if (focusedInput === 'password') {
      activeRef = passwordRef;
      textLength = formData.password.length;
    }

    if (activeRef && activeRef.current) {
      const rect = activeRef.current.getBoundingClientRect();
      const charWidth = 7.5;
      const paddingLeft = 16;
      const caretOffset = Math.min(textLength * charWidth, rect.width - paddingLeft * 2);

      setTargetPos({
        x: rect.left + paddingLeft + caretOffset,
        y: rect.top + rect.height / 2
      });
    }
  }, [focusedInput, formData, view]);

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
      <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-float-1 mix-blend-screen" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-float-2 mix-blend-screen" />
      <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-blob mix-blend-screen" />

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
        <div className="relative bg-white rounded-2xl p-8 shadow-2xl border border-slate-100 transition-all duration-300 login-card mt-12">
          {/* Interactive Mascot in Card Flow */}
          <div className="w-24 h-28 mx-auto mb-6 pointer-events-none select-none">
            <PaperMascot 
              targetPos={targetPos}
              isPasswordFocused={focusedInput === 'password'}
              isInputFocused={!!focusedInput && focusedInput !== 'password'}
            />
          </div>

          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">
              {view === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 text-sm">
              {view === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Enter your details to receive a new password'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 font-medium">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-sm text-emerald-700 font-medium">{successMsg}</p>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Number / Email ID</label>
                <input
                  ref={identifierRef}
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                  onFocus={() => setFocusedInput('identifier')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="EMP001 or you@company.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-slate-700">Password</label>
                  <button 
                    type="button"
                    onClick={() => { setView('forgot-password'); setErrorMsg(''); setSuccessMsg(''); }}
                    className="text-xs text-blue-600 hover:text-blue-800 transition-colors font-medium"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  ref={passwordRef}
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-sm text-slate-600 mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                Please provide your registered mail ID and employee number to get a new password.
              </p>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Email ID</label>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="you@company.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employee Number</label>
                <input
                  ref={empNumRef}
                  type="text"
                  required
                  value={formData.employee_number}
                  onChange={e => setFormData({ ...formData, employee_number: e.target.value })}
                  onFocus={() => setFocusedInput('employee_number')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="EMP001"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-6 px-4 py-3.5 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? 'Sending Request...' : 'Reset Password'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
              
              <div className="text-center mt-4">
                <button 
                  type="button"
                  onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 pt-5 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-xs">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
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

// Interactive SVG Paper Mascot resembling Orient Paper Mills sheets
function PaperMascot({ targetPos, isPasswordFocused, isInputFocused }) {
  const mascotRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!mascotRef.current) return;
    
    const rect = mascotRef.current.getBoundingClientRect();
    const mascotCenterX = rect.left + rect.width / 2;
    const mascotCenterY = rect.top + rect.height / 2;
    
    const dx = targetPos.x - mascotCenterX;
    const dy = targetPos.y - mascotCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    
    const maxLimit = 6; // Limit pupil displacement inside sclera
    if (dist === 0) {
      setPupilOffset({ x: 0, y: 0 });
    } else {
      const scale = Math.min(dist / 120, 1) * maxLimit;
      setPupilOffset({
        x: (dx / dist) * scale,
        y: (dy / dist) * scale
      });
    }
  }, [targetPos]);

  return (
    <div ref={mascotRef} className="w-full h-full drop-shadow-md">
      <svg viewBox="0 0 100 120" className="w-full h-full overflow-visible">
        {/* Paper Shadow */}
        <defs>
          <filter id="paper-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.12" />
          </filter>
        </defs>

        {/* Paper Body (Rounded sheet with folded top-right corner) */}
        <path 
          d="M 12 5 H 78 L 95 22 V 110 A 5 5 0 0 1 90 115 H 10 A 5 5 0 0 1 5 110 V 12 A 7 7 0 0 1 12 5 Z" 
          fill="#f8fafc" 
          stroke="#cbd5e1" 
          strokeWidth="1.5"
          filter="url(#paper-shadow)"
        />

        {/* Lined Paper Margins & Rules */}
        {/* Red margin line */}
        <line x1="22" y1="5" x2="22" y2="115" stroke="#fca5a5" strokeWidth="1" strokeDasharray="3 2" />
        
        {/* Blue ruled lines */}
        <line x1="25" y1="65" x2="88" y2="65" stroke="#bae6fd" strokeWidth="1" />
        <line x1="25" y1="80" x2="88" y2="80" stroke="#bae6fd" strokeWidth="1" />
        <line x1="25" y1="95" x2="88" y2="95" stroke="#bae6fd" strokeWidth="1" />

        {/* Folded flap */}
        <path d="M 78 5 H 95 V 22 Z" fill="#cbd5e1" />
        <path 
          d="M 78 5 L 78 22 L 95 22 Z" 
          fill="#f1f5f9" 
          stroke="#cbd5e1" 
          strokeWidth="1" 
        />

        {/* Eyes */}
        {isPasswordFocused ? (
          <>
            {/* Cute Closed Eyes (smiling curve) */}
            <path d="M 27 42 Q 35 48 43 42" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 57 42 Q 65 48 73 42" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : (
          <>
            {/* White Sclera */}
            <circle cx="35" cy="40" r="10" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="65" cy="40" r="10" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
            
            {/* Pupils */}
            <circle cx={35 + pupilOffset.x} cy={40 + pupilOffset.y} r="4.5" fill="#0f172a" />
            <circle cx={65 + pupilOffset.x} cy={40 + pupilOffset.y} r="4.5" fill="#0f172a" />
            
            {/* Shine Highlight */}
            <circle cx={35 + pupilOffset.x - 1.5} cy={40 + pupilOffset.y - 1.5} r="1.2" fill="white" />
            <circle cx={65 + pupilOffset.x - 1.5} cy={40 + pupilOffset.y - 1.5} r="1.2" fill="white" />
          </>
        )}

        {/* Mouth */}
        {isPasswordFocused ? (
          <line x1="46" y1="55" x2="54" y2="55" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        ) : isInputFocused ? (
          <circle cx="50" cy="54" r="3.5" fill="none" stroke="#475569" strokeWidth="2" />
        ) : (
          <path d="M 45 53 Q 50 58 55 53" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
        )}

        {/* Left Arm */}
        <g 
          style={{ 
            transformOrigin: '5px 70px', 
            transform: isPasswordFocused ? 'rotate(-135deg)' : 'rotate(0deg)',
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' 
          }}
        >
          <path d="M 5 70 L 5 110 A 5 5 0 0 1 -5 110 L -5 70 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        </g>
        
        {/* Right Arm */}
        <g 
          style={{ 
            transformOrigin: '95px 70px', 
            transform: isPasswordFocused ? 'rotate(135deg)' : 'rotate(0deg)',
            transition: 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)' 
          }}
        >
          <path d="M 95 70 L 95 110 A 5 5 0 0 0 105 110 L 105 70 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}
