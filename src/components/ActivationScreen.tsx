import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { KeyRound, Loader2, ArrowLeft, Gamepad2, ShoppingBag } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ActivationScreenProps {
  onActivateSuccess: () => void;
  onLogout: () => void;
}

// Simple SHA-256 hashing function for browser
async function sha256(message: string) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export const ActivationScreen: React.FC<ActivationScreenProps> = ({ onActivateSuccess, onLogout }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('يرجى إدخال كود التفعيل');
      return;
    }

    setLoading(true);
    try {
      const codeHash = await sha256(code.trim().toUpperCase());

      // 1. Check if the code exists in the database
      const { data: codesData, error: codesError } = await supabase
        .from('activation_codes')
        .select('*')
        .eq('code_hash', codeHash)
        .single();

      if (codesError || !codesData) {
        throw new Error('الكود غير صحيح');
      }

      // 2. If it is the first time anyone is using it, mark it as used 
      //    so the store owner knows it was activated.
      if (codesData.status === 'unused') {
        const { error: updateCodeError } = await supabase
          .from('activation_codes')
          .update({
            status: 'used',
            used_at: new Date().toISOString(),
          })
          .eq('id', codesData.id);

        if (updateCodeError) throw new Error('حدث خطأ أثناء تفعيل الكود، الرجاء المحاولة مرة أخرى.');
      }
      
      // 3. Always allow access as long as the code is in the database!
      // Save it locally so they don't have to type it on this specific device again
      localStorage.setItem('active_game_code', code.trim().toUpperCase());
      onActivateSuccess();

    } catch (err: any) {
      setError(err.message || 'حدث خطأ ما');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#052e16] p-4 font-sans text-right" dir="rtl">
      <div className="w-full max-w-md my-auto relative">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#0B3B24] rounded-[2rem] p-8 shadow-2xl relative overflow-hidden text-center"
        >
          {/* Hexagon Background Pattern (Subtle) */}
          <div className="absolute inset-0 opacity-5 pointer-events-none" 
               style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M30 0l25.98 15v30L30 60 4.02 45V15z\' fill-opacity=\'1\' fill-rule=\'evenodd\' stroke=\'%23ffffff\' stroke-width=\'1\'/%3E%3C/svg%3E")', backgroundSize: '60px' }}>
          </div>

          <div className="relative z-10">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <img src="/images/PlainGameLogo.PNG" alt="Logo" className="h-20 object-contain" />
            </div>

            <div className="flex justify-center mb-4">
              <Gamepad2 className="w-12 h-12 text-white/90" strokeWidth={1.5} />
            </div>

            {/* Title */}
            <h2 className="text-white text-3xl font-bold mb-4">تفعيل اللعبة</h2>
            <p className="text-[#FFF8E7]/80 text-sm mb-8 leading-relaxed px-4">
              أدخل كود التفعيل الذي حصلت عليه بعد الشراء للبدء في اللعب
            </p>

            {/* Messages */}
            <AnimatePresence>
              {error && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-500/10 border border-red-500/50 text-red-200 text-sm p-3 rounded-xl mb-6 text-center">
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Form */}
            <form onSubmit={handleActivate} className="space-y-4">
              <div>
                <label className="block text-[#FFF8E7] text-sm font-bold mb-2">كود التفعيل</label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <KeyRound className="h-6 w-6 text-[#FFF8E7]/40" />
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full text-center bg-[#1A5D3A]/50 border-none rounded-2xl py-4 px-12 text-[#FFF8E7] placeholder-[#FFF8E7]/30 focus:ring-2 focus:ring-[#FF7F3E] transition-all tracking-[0.3em] font-mono text-xl uppercase"
                    placeholder="XXXXXX"
                    dir="ltr"
                    maxLength={10}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#10b981] hover:bg-[#059669] text-white font-bold text-lg py-4 px-4 rounded-2xl mt-4 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    <span>تفعيل</span>
                    <ArrowLeft className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>

            {/* Store Link Container */}
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col items-center">
              <p className="text-[#FFF8E7]/70 text-sm mb-4 font-medium px-4">
                لم تشتري اللعبة بعد؟ قم بالشراء الآن وبيوصلك كود اللعب فورياً وللأبد
              </p>
              
              {/* Replace URL with user's actual Salla store link later */}
              <a 
                href="https://salla.sa" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full bg-[#06b6d4] hover:bg-[#0891b2] text-white font-bold py-3 px-4 rounded-xl shadow transition-colors flex items-center justify-center gap-2 mb-6"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>اشتري الآن</span>
              </a>

              <button 
                onClick={onLogout}
                className="text-[#FFF8E7]/50 hover:text-white transition-colors text-sm flex items-center gap-1"
              >
                العودة لصفحة الدخول (تسجيل الخروج) <ArrowLeft className="w-4 h-4 ml-1" />
              </button>
            </div>

          </div>
        </motion.div>
      </div>
    </div>
  );
};
