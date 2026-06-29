import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { Truck, Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import api from '../services/api';
import { gsap } from 'gsap';

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
  const [isConfused, setIsConfused] = useState(false);
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Good Morning');
    } else if (hour >= 12 && hour < 17) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  // Mascot and text tracking state
  const [focusedInput, setFocusedInput] = useState(null); // 'identifier' | 'password' | 'email' | 'employee_number' | null
  const [targetPos, setTargetPos] = useState({ x: 0, y: 0 });

  // Playable Drag States
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isFlipping, setIsFlipping] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const identifierRef = useRef(null);
  const passwordRef = useRef(null);
  const emailRef = useRef(null);
  const empNumRef = useRef(null);
  const bubbleRef = useRef(null);
  const cardRef = useRef(null);
  const mascotContainerRef = useRef(null);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return; // Only left click
    e.preventDefault(); // Prevent text selection and default browser dragging
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleTouchStart = (e) => {
    if (e.touches.length !== 1) return;
    e.preventDefault(); // Prevent page scroll / selection on mobile while dragging
    setIsDragging(true);
    const touch = e.touches[0];
    setDragStart({ x: touch.clientX - dragOffset.x, y: touch.clientY - dragOffset.y });
  };

  // Follow the mouse when no input is focused and not dragging
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!focusedInput && !isDragging) {
        setTargetPos({ x: e.clientX, y: e.clientY });
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [focusedInput, isDragging]);

  // Window listeners to handle global dragging & mouse/touch release
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      setDragOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      const startX = dragOffset.x;
      const startY = dragOffset.y;
      const obj = { x: startX, y: startY };
      gsap.to(obj, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.45)",
        onUpdate: () => {
          setDragOffset({ x: obj.x, y: obj.y });
        }
      });
    };

    const handleTouchMove = (e) => {
      if (e.touches.length !== 1) return;
      e.preventDefault(); // Prevent screen scrolling during drag
      const touch = e.touches[0];
      setDragOffset({
        x: touch.clientX - dragStart.x,
        y: touch.clientY - dragStart.y
      });
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      const startX = dragOffset.x;
      const startY = dragOffset.y;
      const obj = { x: startX, y: startY };
      gsap.to(obj, {
        x: 0,
        y: 0,
        duration: 0.6,
        ease: "elastic.out(1, 0.45)",
        onUpdate: () => {
          setDragOffset({ x: obj.x, y: obj.y });
        }
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [isDragging, dragStart]);

  // Speech bubble elastic pop-in and floating loop animation
  useEffect(() => {
    if (bubbleRef.current) {
      gsap.fromTo(bubbleRef.current, 
        { scale: 0, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.8, 
          ease: "elastic.out(1.2, 0.55)",
          transformOrigin: "bottom center"
        }
      );

      const anim = gsap.to(bubbleRef.current, {
        y: "-=3",
        duration: 1.5,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut"
      });

      return () => anim.kill();
    }
  }, [greeting, isDragging]);

  // Page load landing animations (blobs scale, 3D card flip-in, mascot drop-spin-bounce)
  useEffect(() => {
    // 1. Scale up background blobs
    gsap.fromTo(".bg-blob",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 1.5, stagger: 0.15, ease: "power3.out" }
    );

    // 2. Slide up and 3D flip-in login card
    if (cardRef.current) {
      // Set perspective on parent container for 3D depth
      gsap.set(cardRef.current.parentNode, { perspective: 1000 });
      
      gsap.fromTo(cardRef.current,
        { 
          rotationX: -45, 
          rotationY: 15, 
          z: -300, 
          opacity: 0, 
          scale: 0.9 
        },
        { 
          rotationX: 0, 
          rotationY: 0, 
          z: 0, 
          opacity: 1, 
          scale: 1, 
          duration: 1.3, 
          ease: "back.out(1.3)", 
          delay: 0.15 
        }
      );
    }

    // 3. Drop down paper mascot with a 360-spin and landing bounce
    if (mascotContainerRef.current) {
      gsap.fromTo(mascotContainerRef.current,
        { y: -350, rotate: -360, scale: 0.5, opacity: 0 },
        { 
          y: 0, 
          rotate: 0, 
          scale: 1, 
          opacity: 1, 
          duration: 1.25, 
          ease: "bounce.out", 
          delay: 0.65 
        }
      );
    }
  }, []);

  const handleDoubleClick = () => {
    if (isFlipping || isDragging) return;
    setIsFlipping(true);

    const tl = gsap.timeline({
      onComplete: () => {
        setIsFlipping(false);
        gsap.set(mascotContainerRef.current, { rotate: 0 });
      }
    });

    // Backflip animation sequence
    tl.to(mascotContainerRef.current, { scaleY: 0.6, scaleX: 1.3, duration: 0.15, ease: "power1.out" })
      .to(mascotContainerRef.current, { 
        y: -120, 
        rotate: -360, 
        scaleY: 1.25, 
        scaleX: 0.8, 
        duration: 0.55, 
        ease: "power2.out" 
      })
      .to(mascotContainerRef.current, { y: 0, scaleY: 0.7, scaleX: 1.2, duration: 0.25, ease: "power2.in" })
      .to(mascotContainerRef.current, { scaleY: 1, scaleX: 1, duration: 0.2, ease: "elastic.out(1.2, 0.5)" });
  };

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
      dispatch({ type: 'AUTH_SUCCESS', payload: data.user, token: data.accessToken });
      navigate('/dashboard');
    } catch (e) {
      const err = e.response?.data?.error;
      setErrorMsg(typeof err === 'string' ? err : (err?.message || 'Login failed. Please check your credentials.'));
      setIsConfused(true);
      setTimeout(() => setIsConfused(false), 4000);
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
      setIsConfused(true);
      setTimeout(() => setIsConfused(false), 4000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getSpeechBubbleText = () => {
    if (isFlipping) return 'Wheee! Backflip! 🤸‍♂️';
    if (isDragging) return 'Hold on tight! 🎈';
    if (isConfused) return 'Oops! Check it again... 🥺';
    if (focusedInput === 'password') return "Shh! I'm not looking! 🙈";
    if (isHovered) return 'Double click me! 💖';
    return `${greeting}!`;
  };

  return (
    <div className="login-bg flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating decorative elements */}
      <div className="bg-blob absolute top-10 left-10 w-80 h-80 bg-blue-500/25 rounded-full blur-3xl animate-float-1 mix-blend-screen" />
      <div className="bg-blob absolute bottom-10 right-10 w-96 h-96 bg-sky-500/20 rounded-full blur-3xl animate-float-2 mix-blend-screen" />
      <div className="bg-blob absolute top-1/2 left-1/3 w-72 h-72 bg-indigo-500/20 rounded-full blur-3xl animate-blob mix-blend-screen" />

      {/* Top Right Logo */}
      <div className="absolute top-6 right-6 lg:top-8 lg:right-8 bg-white rounded-xl shadow-xl p-2.5 z-10 animate-fade-in">
        <img src="/logo.png" alt="CK Birla Group - Orient Paper" className="h-8 md:h-10 object-contain" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        {/* Logo & Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/15 rounded-2xl backdrop-blur-sm mb-3 ring-2 ring-white/20">
            <img src="/logo-icon.png?v=2" alt="VRTP Logo" className="w-12 h-12 object-contain rounded-xl" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            Vehicle Requisitional and Travel Portal
          </h1>
        </div>

        {/* Login Card */}
        <div ref={cardRef} className="relative bg-white rounded-2xl p-6 shadow-2xl border border-slate-100 transition-all duration-300 login-card mt-3">
          {/* Interactive Mascot in Card Flow */}
          <div 
            ref={mascotContainerRef}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
            onDoubleClick={handleDoubleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${isDragging ? 1.15 : 1})`,
              transition: isDragging ? 'none' : 'transform 0.55s cubic-bezier(0.34, 1.56, 0.64, 1)',
              filter: isDragging ? 'drop-shadow(0 25px 15px rgba(0, 0, 0, 0.15))' : 'none'
            }}
            className="relative w-20 h-24 mx-auto mb-4 select-none cursor-grab active:cursor-grabbing z-30"
          >
            {/* Speech Bubble */}
            {greeting && (
              <div ref={bubbleRef} className="absolute -top-9 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white border border-blue-400/20 text-[10px] font-semibold px-2.5 py-1 rounded-xl shadow-lg whitespace-nowrap z-30">
                {getSpeechBubbleText()}
                <div className="absolute -bottom-[5px] left-1/2 -translate-x-1/2 w-2 h-2 bg-indigo-600 border-r border-b border-blue-400/20 rotate-45" />
              </div>
            )}
            <PaperMascot 
              targetPos={targetPos}
              isPasswordFocused={focusedInput === 'password'}
              isInputFocused={!!focusedInput && focusedInput !== 'password'}
              isConfused={isConfused}
              isDragging={isDragging}
              isFlipping={isFlipping}
              isHovered={isHovered}
            />
          </div>

          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-slate-800 mb-0.5">
              {view === 'login' ? 'Welcome Back' : 'Reset Password'}
            </h2>
            <p className="text-slate-500 text-xs">
              {view === 'login' 
                ? 'Sign in to access your dashboard' 
                : 'Enter your details to receive a new password'}
            </p>
          </div>

          {errorMsg && (
            <div className="mb-4 p-2.5 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 font-medium">{errorMsg}</p>
            </div>
          )}
          {successMsg && (
            <div className="mb-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs text-emerald-700 font-medium">{successMsg}</p>
            </div>
          )}

          {view === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Number / Email ID</label>
                <input
                  ref={identifierRef}
                  type="text"
                  required
                  value={formData.identifier}
                  onChange={e => setFormData({ ...formData, identifier: e.target.value })}
                  onFocus={() => setFocusedInput('identifier')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="EMP001 or you@company.com"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-600">Password</label>
                </div>
                <input
                  ref={passwordRef}
                  type="password"
                  required
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              <p className="text-xs text-slate-600 mb-3 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
                Please provide your registered mail ID and employee number to get a new password.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email ID</label>
                <input
                  ref={emailRef}
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="you@company.com"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Number</label>
                <input
                  ref={empNumRef}
                  type="text"
                  required
                  value={formData.employee_number}
                  onChange={e => setFormData({ ...formData, employee_number: e.target.value })}
                  onFocus={() => setFocusedInput('employee_number')}
                  onBlur={() => setFocusedInput(null)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                  placeholder="EMP001"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 mt-4 px-4 py-2.5 bg-blue-600 text-white font-semibold text-sm rounded-xl hover:bg-blue-700 transition-colors focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-70 shadow-md hover:shadow-lg"
              >
                {isSubmitting ? 'Sending Request...' : 'Reset Password'}
                {!isSubmitting && <ArrowRight className="w-4 h-4" />}
              </button>
              
              <div className="text-center mt-3">
                <button 
                  type="button"
                  onClick={() => { setView('login'); setErrorMsg(''); setSuccessMsg(''); }}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
                </button>
              </div>
            </form>
          )}

          <div className="mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 text-slate-500 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-blue-500" />
              <span>Secure Internal Portal Access.</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-primary-300/60 text-[11px] mt-4">
          © {new Date().getFullYear()} Vehicle Requisitional and Travel Portal.
        </p>
      </div>
    </div>
  );
}

// Interactive SVG Paper Mascot resembling Orient Paper Mills sheets
function PaperMascot({ targetPos, isPasswordFocused, isInputFocused, isConfused, isDragging, isFlipping, isHovered }) {
  const mascotRef = useRef(null);
  const mouthRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });

  // Idea 5: Wind Flutter / Idle Wave
  useEffect(() => {
    if (!mascotRef.current) return;
    const anim = gsap.to(mascotRef.current, {
      rotate: "1.5deg",
      skewX: "1deg",
      y: "-=2",
      duration: 2.2,
      yoyo: true,
      repeat: -1,
      ease: "sine.inOut"
    });
    return () => anim.kill();
  }, []);

  // Idea 3: Mouth Path Morphing
  useEffect(() => {
    if (!mouthRef.current) return;
    
    let targetPath = "M 45 53 Q 50 58 55 53"; // default happy smile
    let fillVal = "none";
    let strokeW = "2";
    
    if (isFlipping || isDragging) {
      targetPath = "M 42 53 Q 50 65 58 53 Z"; // open smile
      fillVal = "#475569";
      strokeW = "1";
    } else if (isPasswordFocused) {
      targetPath = "M 45 55 Q 50 55 55 55"; // flat line
    } else if (isConfused) {
      targetPath = "M 44 54 Q 50 49 56 54"; // wavy/worried line
    } else if (isInputFocused) {
      targetPath = "M 46 54 Q 50 51 54 54"; // surprise mouth arc
    }
    
    gsap.to(mouthRef.current, {
      attr: { d: targetPath },
      fill: fillVal,
      strokeWidth: strokeW,
      duration: 0.35,
      ease: "power2.out"
    });
  }, [isDragging, isPasswordFocused, isConfused, isInputFocused, isFlipping]);



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
        {isDragging || isFlipping ? (
          <>
            {/* Joyful Squinty Eyes (happy arcs) */}
            <path d="M 25 43 Q 35 33 45 43" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 55 43 Q 65 33 75 43" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : isPasswordFocused ? (
          <>
            {/* Cute Closed Eyes (smiling curve) */}
            <path d="M 27 42 Q 35 48 43 42" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M 57 42 Q 65 48 73 42" fill="none" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : isConfused ? (
          <>
            {/* White Sclera background */}
            <circle cx="35" cy="40" r="10" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
            <circle cx="65" cy="40" r="10" fill="white" stroke="#cbd5e1" strokeWidth="1.5" />
            {/* Dizzy X-pupils inside the white circles */}
            <path d="M 31 36 L 39 44 M 39 36 L 31 44" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
            <path d="M 61 36 L 69 44 M 69 36 L 61 44" fill="none" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
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
        <path 
          ref={mouthRef}
          d="M 45 53 Q 50 58 55 53" 
          fill="none" 
          stroke="#475569" 
          strokeWidth="2" 
          strokeLinecap="round" />

        {/* Left Arm */}
        <g style={{ transformOrigin: '5px 70px' }}>
          <path d="M 5 70 L 5 110 A 5 5 0 0 1 -5 110 L -5 70 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        </g>
        
        {/* Right Arm */}
        <g style={{ transformOrigin: '95px 70px' }}>
          <path d="M 95 70 L 95 110 A 5 5 0 0 0 105 110 L 105 70 Z" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}
