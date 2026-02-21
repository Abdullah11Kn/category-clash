import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, ArrowLeft, Loader2, KeyRound } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'SIGN_IN' | 'SIGN_UP' | 'FORGOT_PASSWORD' | 'VERIFY_OTP';

interface AuthScreenProps {
  onAuthSuccess: () => void;
  onDevBypass?: () => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onAuthSuccess, onDevBypass }) => {
  const [mode, setMode] = useState<AuthMode>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setError(null);
    setMessage(null);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();
    setLoading(true);

    try {
      if (mode === 'SIGN_UP') {
        if (password !== confirmPassword) {
          throw new Error('كلمات المرور غير متطابقة');
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage('تم إنشاء الحساب بنجاح. يرجى التحقق من بريدك الإلكتروني لإدخال رمز التفعيل.');
        setMode('VERIFY_OTP');
      } else if (mode === 'SIGN_IN') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onAuthSuccess();
      } else if (mode === 'FORGOT_PASSWORD') {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.');
        setMode('SIGN_IN');
      } else if (mode === 'VERIFY_OTP') {
        const { error } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'signup',
        });
        if (error) throw error;
        setMessage('تم تأكيد الحساب بنجاح! جاري تسجيل الدخول...');
        // Auto-login after verification? Or require them to login manually?
        // Usually verifyOtp logs them in and fires auth state change.
        onAuthSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearMessages();
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#052e16] p-4 font-sans text-right" dir="rtl">
      <div className="w-full max-w-md my-auto relative">
        {/* Main Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0B3B24] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden"
        >
          {/* Hexagon Background Pattern (Subtle) */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l25.98 15v30L30 60 4.02 45V15z\' fill-opacity=\'1\' fill-rule=\'evenodd\' stroke=\'%23ffffff\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '60px' }}>
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <img src="/images/PlainGameLogo.PNG" alt="Logo" className="h-24 object-contain" />
            </div>

            {/* Title */}
            <h2 className="text-white text-2xl font-bold text-center mb-6">
              {mode === 'SIGN_IN' && 'تسجيل الدخول'}
              {mode === 'SIGN_UP' && 'إنشاء حساب جديد'}
              {mode === 'FORGOT_PASSWORD' && 'نسيت كلمة المرور؟'}
              {mode === 'VERIFY_OTP' && 'تأكيد البريد الإلكتروني'}
            </h2>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl mb-4 text-center">
                  {error}
                </motion.div>
              )}
              {message && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-green-500/10 border border-green-500/50 text-green-200 text-sm p-3 rounded-xl mb-4 text-center">
                  {message}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleAuth} className="space-y-4">
              
              {mode !== 'VERIFY_OTP' && (
                <div>
                  <label className="block text-[#FFF8E7] text-sm font-medium mb-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-[#FFF8E7]/40" />
                    </div>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-[#1A5D3A]/50 border-none rounded-2xl py-3 pl-4 pr-10 text-[#FFF8E7] placeholder-[#FFF8E7]/30 focus:ring-2 focus:ring-[#FF7F3E] transition-all"
                      placeholder="example@email.com"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {(mode === 'SIGN_IN' || mode === 'SIGN_UP') && (
                <div>
                  <label className="block text-[#FFF8E7] text-sm font-medium mb-1">كلمة المرور</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#FFF8E7]/40" />
                    </div>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-[#1A5D3A]/50 border-none rounded-2xl py-3 pl-4 pr-10 text-[#FFF8E7] placeholder-[#FFF8E7]/30 focus:ring-2 focus:ring-[#FF7F3E] transition-all tracking-widest"
                      placeholder="********"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {mode === 'SIGN_UP' && (
                <div>
                  <label className="block text-[#FFF8E7] text-sm font-medium mb-1">تأكيد كلمة المرور</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-[#FFF8E7]/40" />
                    </div>
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#1A5D3A]/50 border-none rounded-2xl py-3 pl-4 pr-10 text-[#FFF8E7] placeholder-[#FFF8E7]/30 focus:ring-2 focus:ring-[#FF7F3E] transition-all tracking-widest"
                      placeholder="********"
                      dir="ltr"
                    />
                  </div>
                </div>
              )}

              {mode === 'VERIFY_OTP' && (
                <div>
                  <label className="block text-[#FFF8E7] text-sm font-medium mb-1 text-center">أدخل الرمز المرسل إلى بريدك</label>
                  <div className="relative">
                     <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <KeyRound className="h-5 w-5 text-[#FFF8E7]/40" />
                    </div>
                    <input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full text-center bg-[#1A5D3A]/50 border-none rounded-2xl py-3 px-10 text-[#FFF8E7] placeholder-[#FFF8E7]/30 focus:ring-2 focus:ring-[#FF7F3E] transition-all tracking-widest text-lg"
                      placeholder="123456"
                      dir="ltr"
                      maxLength={6}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-l from-[#FF7F3E] to-[#FF9059] text-white font-bold py-3 px-4 rounded-2xl mt-4 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  <>
                    <span>
                      {mode === 'SIGN_IN' && 'دخول'}
                      {mode === 'SIGN_UP' && 'إنشاء حساب'}
                      {mode === 'FORGOT_PASSWORD' && 'إرسال رابط الاستعادة'}
                      {mode === 'VERIFY_OTP' && 'تحقق من الرمز'}
                    </span>
                    <ArrowLeft className="w-5 h-5" />
                  </>
                )}
              </button>
            </form>

            {/* Social Login Divider */}
            {mode !== 'VERIFY_OTP' && mode !== 'FORGOT_PASSWORD' && (
               <div className="mt-8 mb-6 relative">
                 <div className="absolute inset-0 flex items-center">
                   <div className="w-full border-t border-white/10"></div>
                 </div>
                 <div className="relative flex justify-center text-sm">
                   <span className="px-2 bg-[#0B3B24] text-white/50">أو</span>
                 </div>
               </div>
            )}

            {/* Google Sign In */}
            {mode !== 'VERIFY_OTP' && mode !== 'FORGOT_PASSWORD' && (
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full bg-white text-gray-800 font-bold py-3 px-4 rounded-2xl shadow hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                الدخول بواسطة حساب جوجل
              </button>
            )}

            {/* Dev Bypass */}
            {onDevBypass && (
              <button
                type="button"
                onClick={onDevBypass}
                className="w-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 font-bold py-3 px-4 rounded-2xl shadow hover:bg-yellow-500/20 transition-all flex items-center justify-center gap-2 mb-6"
              >
                تجاوز الدخول (للمطورين)
              </button>
            )}

            {/* Bottom Links */}
            <div className="flex justify-between items-center text-sm text-[#FFF8E7]/60 mt-4 px-2">
              {mode === 'SIGN_IN' && (
                <>
                  <button onClick={() => { clearMessages(); setMode('SIGN_UP'); }} className="hover:text-white transition-colors">
                    إنشاء حساب جديد
                  </button>
                  <span className="text-white/20">|</span>
                  <button onClick={() => { clearMessages(); setMode('FORGOT_PASSWORD'); }} className="hover:text-white transition-colors">
                    نسيت كلمة المرور؟
                  </button>
                </>
              )}
              {mode === 'SIGN_UP' && (
                <div className="w-full text-center">
                  <button onClick={() => { clearMessages(); setMode('SIGN_IN'); }} className="hover:text-white transition-colors">
                    لديك حساب بالفعل؟ سجل دخول
                  </button>
                </div>
              )}
              {mode === 'FORGOT_PASSWORD' && (
                <div className="w-full flex justify-center">
                  <button onClick={() => { clearMessages(); setMode('SIGN_IN'); }} className="hover:text-white transition-colors flex items-center gap-1">
                    العودة لتسجيل الدخول <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
              {mode === 'VERIFY_OTP' && (
                <div className="w-full text-center space-y-2 flex flex-col items-center">
                  <button onClick={() => handleAuth} className="hover:text-white transition-colors text-sm">
                    لم تستلم الرمز؟ إعادة الإرسال
                  </button>
                  <button onClick={() => { clearMessages(); setMode('SIGN_IN'); }} className="hover:text-white transition-colors flex items-center gap-1 mt-2">
                    العودة لتسجيل الدخول <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
