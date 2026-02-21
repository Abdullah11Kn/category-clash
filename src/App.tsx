import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Home, 
  User, 
  Gamepad2, 
  Heart, 
  Plus,
  Minus,
  Loader2,
} from 'lucide-react';
import { CATEGORIES, Category } from './data/gameData';
import { AuthScreen } from './components/AuthScreen';
import { ActivationScreen } from './components/ActivationScreen';
import { supabase } from './lib/supabase';
import { Session } from '@supabase/supabase-js';

// --- Types ---

type GameState = 
  | 'CATEGORY_SELECT'
  | 'PLAYER_SETUP'
  | 'ROLE_REVEAL_PROMPT'
  | 'ROLE_REVEAL_INFO'
  | 'QUESTIONS_INTRO'
  | 'QUESTIONS_ROUND'
  | 'ASK_ANYONE'
  | 'VOTING_SELECT'
  | 'IMPOSTER_REVEAL'
  | 'IMPOSTER_GUESS'
  | 'GUESS_RESULT'
  | 'LEADERBOARD';

interface Player {
  id: number;
  name: string;
  score: number;
  isImposter: boolean;
  vote?: number; // ID of the player they voted for
}

// --- Components ---

// 1. Category Selection
const CategorySelection = ({ onSelect }: { onSelect: (cat: Category) => void }) => {
  return (
    <div className="flex-1 p-4 pb-8">

      {/* Grid */}
      <div className="grid grid-cols-2 gap-4">
        {CATEGORIES.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onSelect(category)}
            className="bg-[#FFF8E7] rounded-3xl overflow-hidden shadow-lg border-4 border-[#FFF8E7] relative group cursor-pointer hover:scale-[1.02] transition-transform"
          >
            {/* Icons */}
            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <button className="p-1.5 bg-white/50 rounded-full hover:bg-white text-red-400 transition-colors">
                <Heart className="w-4 h-4" />
              </button>
            </div>

            {/* Image Area */}
            <div className="h-56 w-full bg-gray-200 relative">
              <img 
                src={category.image} 
                alt={category.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
            </div>

            {/* Wavy Separator */}
            <div className="relative h-4 bg-[#FF7F3E] -mt-1">
               <svg className="absolute bottom-full w-full h-3 text-[#FF7F3E]" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
                 <path d="M321.39 56.44c58-10.79 114.16-30.13 172-41.86 82.39-16.72 168.19-17.73 250.45-.39C823.78 31 906.67 72 985.66 92.83c70.05 18.48 146.53 26.09 214.34 3V0H0v27.35a600.21 600.21 0 00321.39 29.09z" fill="currentColor" />
               </svg>
            </div>

            {/* Title Bar */}
            <div className="bg-[#FF7F3E] p-2 pb-4 flex justify-center items-center relative">
              <h3 className="text-white font-bold text-lg text-center w-full">
                {category.title}
              </h3>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// 2. Player Setup
const PlayerSetup = ({ 
  players, 
  setPlayers, 
  onNext, 
  onBack 
}: { 
  players: Player[], 
  setPlayers: React.Dispatch<React.SetStateAction<Player[]>>, 
  onNext: () => void,
  onBack: () => void
}) => {
  const [newName, setNewName] = useState('');

  const addPlayer = () => {
    if (newName.trim()) {
      setPlayers([...players, { id: Date.now(), name: newName.trim(), score: 0, isImposter: false }]);
      setNewName('');
    }
  };

  const removePlayer = (id: number) => {
    setPlayers(players.filter(p => p.id !== id));
  };

  const isValid = players.length >= 3;

  return (
    <div className="flex-1 flex flex-col p-6 text-center">
      <div className="flex justify-between items-center mb-6">
        <button onClick={onBack} className="p-2 bg-white/10 rounded-full text-white">
          <Home className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-[#FFF8E7]">اللاعبين</h2>
        <div className="w-10"></div>
      </div>

      <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-xl mb-6 flex-1 flex flex-col">
        <p className="text-[#0B3B24] font-bold mb-4 text-lg">
          {isValid 
            ? "تقدر تضيف لاعبين زيادة أو تبدأ اللعب بالضغط على التالي"
            : "أضف على الأقل 3 لاعبين، ثم اضغط التالي"
          }
        </p>

        <div className="flex gap-2 mb-4">
          <input 
            type="text" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
            placeholder="اسم اللاعب"
            className="flex-1 bg-white border-2 border-[#1A5D3A]/20 rounded-xl px-4 py-2 text-right focus:outline-none focus:border-[#FF7F3E]"
          />
          <button 
            onClick={addPlayer}
            className="bg-[#FF7F3E] text-white p-2 rounded-xl"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 space-y-2 pb-8">
          {players.map(player => (
            <motion.div 
              key={player.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white border border-[#1A5D3A]/10 rounded-xl p-3 flex justify-between items-center"
            >
              <span className="font-bold text-[#0B3B24]">{player.name}</span>
              <button 
                onClick={() => removePlayer(player.id)}
                className="text-red-500 p-1 hover:bg-red-50 rounded-full"
              >
                <Minus className="w-5 h-5" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className={`w-full py-4 rounded-2xl font-bold text-xl shadow-lg transition-all ${
          isValid 
            ? 'bg-[#FF7F3E] text-white hover:bg-[#E66A2C]' 
            : 'bg-gray-400 text-gray-200 cursor-not-allowed'
        }`}
      >
        التالي
      </button>
    </div>
  );
};

// 3 & 4. Role Reveal Components
const RoleRevealPrompt = ({ player, onNext }: { player: Player, onNext: () => void }) => (
  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-[#FFF8E7] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-[#FF7F3E]"
    >
      <h2 className="text-4xl font-bold text-[#0B3B24] mb-6">{player.name}</h2>
      <p className="text-xl text-[#1A5D3A] mb-8 leading-relaxed">
        اعطوا الجوال ل{player.name}
        <br/><br/>
        اضغط التالي حتى تعرف هل أنت برا السالفة أو داخلها ولا تخلي أحد غيرك يشوف الشاشة!
      </p>
      <button
        onClick={onNext}
        className="w-full bg-[#FF7F3E] text-white py-4 rounded-xl font-bold text-xl shadow-md hover:bg-[#E66A2C] transition-colors"
      >
        التالي
      </button>
    </motion.div>
  </div>
);

const RoleRevealInfo = ({ 
  player, 
  secret, 
  categoryTitle, 
  onNext 
}: { 
  player: Player, 
  secret: string, 
  categoryTitle: string, 
  onNext: () => void 
}) => (
  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
    <motion.div 
      initial={{ rotateY: 90, opacity: 0 }}
      animate={{ rotateY: 0, opacity: 1 }}
      className={`w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 ${
        player.isImposter ? 'bg-[#2a2a2a] border-red-500' : 'bg-[#FFF8E7] border-[#FF7F3E]'
      }`}
    >
      <h2 className={`text-4xl font-bold mb-6 ${player.isImposter ? 'text-white' : 'text-[#0B3B24]'}`}>
        {player.name}
      </h2>
      
      {player.isImposter ? (
        <>
          <div className="text-6xl mb-6">🕵️‍♂️</div>
          <p className="text-lg text-gray-300 mb-8 leading-relaxed">
            أنت اللي <span className="text-red-400 font-bold">برا السالفة!</span> حاول تعرف وش السالفة بالضبط من كلام البقية أو اقنعهم يصوتون على الشخص الخطأ!
            <br/><br/>
            تلميح السالفة عن <span className="text-yellow-400 font-bold">{categoryTitle}</span>
          </p>
        </>
      ) : (
        <>
          <div className="text-6xl mb-6">🤫</div>
          <p className="text-lg text-[#1A5D3A] mb-8 leading-relaxed">
            أنت <span className="text-[#FF7F3E] font-bold">داخل في السالفة</span> واللي هي
            <br/>
            <span className="block text-3xl font-bold my-4 text-[#0B3B24]">{secret}</span>
            هدفكم في اللعبة معرفة مين منكم اللي برا السالفة. اضغط التالي!
          </p>
        </>
      )}

      <button
        onClick={onNext}
        className={`w-full py-4 rounded-xl font-bold text-xl shadow-md transition-colors ${
          player.isImposter 
            ? 'bg-red-500 text-white hover:bg-red-600' 
            : 'bg-[#FF7F3E] text-white hover:bg-[#E66A2C]'
        }`}
      >
        التالي
      </button>
    </motion.div>
  </div>
);

// 5. Questions Phase
const QuestionsPhase = ({ 
  asker, 
  responder, 
  onNext,
  isIntro = false
}: { 
  asker?: string, 
  responder?: string, 
  onNext: () => void,
  isIntro?: boolean
}) => (
  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
    <motion.div 
      key={isIntro ? 'intro' : 'round'}
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-[#FFF8E7] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-[#1A5D3A]"
    >
      <h2 className="text-3xl font-bold text-[#0B3B24] mb-6">وقت الأسئلة</h2>
      
      {isIntro ? (
        <p className="text-xl text-[#1A5D3A] mb-8 leading-relaxed">
          كل شخص راح يسأل شخص ثاني سؤال متعلق بالسالفة! اضغطوا التالي حتى تعرفون مين راح يسأل مين
        </p>
      ) : (
        <div className="mb-8">
          <p className="text-2xl font-bold text-[#FF7F3E] mb-2">{asker}</p>
          <p className="text-lg text-[#0B3B24] mb-2">اسأل</p>
          <p className="text-2xl font-bold text-[#FF7F3E] mb-6">{responder}</p>
          <p className="text-sm text-[#1A5D3A] opacity-80">
            سؤال متعلق بالسالفة! اختار سؤالك بعناية حتى اللي برا السالفة ما يعرف عن إيش تتكلمون
          </p>
        </div>
      )}

      <button
        onClick={onNext}
        className="w-full bg-[#1A5D3A] text-white py-4 rounded-xl font-bold text-xl shadow-md hover:bg-[#0B3B24] transition-colors"
      >
        التالي
      </button>
    </motion.div>
  </div>
);

// 6. Optional Ask Phase
const AskAnyonePhase = ({ onNext }: { onNext: () => void }) => (
  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-[#FFF8E7] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-[#FF7F3E]"
    >
      <h2 className="text-3xl font-bold text-[#0B3B24] mb-6">أسئلة إضافية؟</h2>
      <p className="text-xl text-[#1A5D3A] mb-8 leading-relaxed">
        هل فيه أحد يبي يسأل شخص معين سؤال إضافي قبل التصويت؟
      </p>
      <button
        onClick={onNext}
        className="w-full bg-[#FF7F3E] text-white py-4 rounded-xl font-bold text-xl shadow-md hover:bg-[#E66A2C] transition-colors"
      >
        التالي
      </button>
    </motion.div>
  </div>
);

// 7. Voting Phase
const VotingSelect = ({ 
  voter, 
  candidates, 
  onVote 
}: { 
  voter: Player, 
  candidates: Player[], 
  onVote: (id: number) => void 
}) => (
  <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="bg-[#FFF8E7] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-[#FF7F3E]"
    >
      <h2 className="text-4xl font-bold text-[#0B3B24] mb-4">{voter.name}</h2>
      <p className="text-lg text-[#1A5D3A] mb-6 leading-relaxed font-bold">
        اختار الشخص اللي تظن انه برا السالفة!
        <br/>
        <span className="text-sm opacity-80 font-normal mt-1 block">(لا تخلي أحد يشوف اختيارك)</span>
      </p>

      <div className="w-full space-y-3">
        {candidates.map(candidate => (
          <button
            key={candidate.id}
            onClick={() => onVote(candidate.id)}
            className="w-full bg-[#FF7F3E] text-white py-4 rounded-xl font-bold text-xl shadow-md hover:bg-[#E66A2C] transition-colors"
          >
            {candidate.name}
          </button>
        ))}
      </div>
    </motion.div>
  </div>
);

// 8. Reveal & Imposter Guess
const ImposterReveal = ({ 
  imposter, 
  onNext 
}: { 
  imposter: Player, 
  onNext: () => void 
}) => {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (phase === 0) {
      const t = setTimeout(() => setPhase(1), 2000);
      return () => clearTimeout(t);
    } else if (phase === 1) {
      const t = setTimeout(() => setPhase(2), 2500);
      return () => clearTimeout(t);
    }
  }, [phase]);

  return (
    <div className="flex-1 flex flex-col justify-center items-center p-8 text-center overflow-hidden">
      <AnimatePresence mode="wait">
        {phase === 0 && (
          <motion.div
            key="phase0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.2, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="text-8xl animate-pulse">🥁</div>
            <h2 className="text-4xl font-bold text-white tracking-widest leading-relaxed">
              لحظة الحقيقة...
            </h2>
          </motion.div>
        )}

        {phase === 1 && (
          <motion.div
            key="phase1"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.5, filter: 'blur(10px)' }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center justify-center gap-6"
          >
            <div className="text-6xl">👀</div>
            <h2 className="text-3xl font-bold text-[#FF7F3E] leading-relaxed">
              اللي برا السالفة هو...
            </h2>
          </motion.div>
        )}

        {phase === 2 && (
          <motion.div 
            key="phase2"
            initial={{ scale: 0.1, opacity: 0, rotate: -10 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 12, stiffness: 100 }}
            className="bg-[#2a2a2a] w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 border-red-500 relative overflow-hidden"
          >
            {/* Flash Effect Base */}
            <motion.div 
               initial={{ opacity: 1 }} 
               animate={{ opacity: 0 }} 
               transition={{ duration: 1 }} 
               className="absolute inset-0 bg-red-500 z-0" 
            />

            <div className="relative z-10">
              <p className="text-[#FF7F3E] text-xl mb-4 font-bold">اللي برا السالفة هو!</p>
              <h2 className="text-6xl font-black text-red-500 mb-8 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                {imposter.name}
              </h2>
              <motion.div 
                animate={{ y: [0, -20, 0] }} 
                transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                className="text-7xl mb-8 drop-shadow-2xl"
              >
                🕵️‍♂️
              </motion.div>
              <button
                onClick={onNext}
                className="w-full bg-red-600 text-white py-4 rounded-xl font-bold text-xl shadow-md hover:bg-red-700 transition-colors"
              >
                التالي
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ImposterGuess = ({ 
  options, 
  onGuess 
}: { 
  options: string[], 
  onGuess: (item: string) => void 
}) => (
  <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
    <h2 className="text-2xl font-bold text-[#FFF8E7] mb-2">خمن السالفة!</h2>
    <p className="text-[#FFF8E7]/80 mb-6">إذا عرفت السالفة تكسب 100 نقطة</p>
    <div className="w-full max-w-sm grid grid-cols-2 gap-3">
      {options.map((item, idx) => (
        <button
          key={idx}
          onClick={() => onGuess(item)}
          className="bg-[#FFF8E7] p-4 rounded-xl text-[#0B3B24] font-bold shadow-lg hover:bg-white transition-colors"
        >
          {item}
        </button>
      ))}
    </div>
  </div>
);

const GuessResult = ({ 
  success, 
  secret,
  onNext 
}: { 
  success: boolean, 
  secret: string,
  onNext: () => void 
}) => (
  <div className="flex-1 flex flex-col justify-center items-center p-8 text-center">
    <motion.div 
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`w-full max-w-sm rounded-[2rem] p-8 shadow-2xl border-4 ${
        success ? 'bg-green-100 border-green-500' : 'bg-red-100 border-red-500'
      }`}
    >
      <div className="text-6xl mb-6">{success ? '🎉' : '❌'}</div>
      <h2 className={`text-3xl font-bold mb-4 ${success ? 'text-green-700' : 'text-red-700'}`}>
        {success ? 'إجابة صحيحة!' : 'إجابة خاطئة!'}
      </h2>
      <p className="text-lg text-gray-700 mb-8">
        السالفة كانت: <span className="font-bold">{secret}</span>
      </p>
      <button
        onClick={onNext}
        className="w-full bg-[#0B3B24] text-white py-4 rounded-xl font-bold text-xl shadow-md hover:bg-[#1A5D3A] transition-colors"
      >
        التالي
      </button>
    </motion.div>
  </div>
);

// 9. Leaderboard
const Leaderboard = ({ 
  players, 
  onHome 
}: { 
  players: Player[], 
  onHome: () => void 
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);

  return (
    <div className="flex-1 flex flex-col p-6 text-center">
      <h2 className="text-3xl font-bold text-[#FFF8E7] mb-8 flex items-center justify-center gap-2">
        <Trophy className="w-8 h-8 text-yellow-400" />
        النتائج
      </h2>

      <div className="bg-[#FFF8E7] rounded-3xl p-6 shadow-xl mb-6 flex-1">
        {sortedPlayers.map((player, index) => (
          <div 
            key={player.id}
            className={`flex justify-between items-center p-4 rounded-xl mb-3 ${
              index === 0 ? 'bg-[#FF7F3E] text-white' : 'bg-white text-[#0B3B24] border border-gray-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="font-bold text-xl w-6">{index + 1}</span>
              <span className="font-bold text-lg">{player.name}</span>
              {player.isImposter && <span className="text-sm opacity-70">(المحتال)</span>}
            </div>
            <span className="font-bold text-xl">{player.score}</span>
          </div>
        ))}
      </div>

      <button
        onClick={onHome}
        className="w-full bg-[#FF7F3E] text-white py-4 rounded-2xl font-bold text-xl shadow-lg hover:bg-[#E66A2C] transition-all"
      >
        عودة للرئيسية
      </button>
    </div>
  );
};

// --- Dev Menu Component ---
type DevPage = 'AUTH' | 'ACTIVATION' | 'GAME' | null;

const DevMenu = ({ current, onSelect }: { current: DevPage, onSelect: (page: DevPage) => void }) => {
  return (
    <div className="fixed top-2 left-2 z-50 flex gap-2 p-2 bg-black/80 rounded-lg shadow-lg border border-white/20 dir-ltr font-sans">
      <span className="text-white text-xs font-mono my-auto">Dev:</span>
      <select 
        value={current || ''} 
        onChange={(e) => onSelect(e.target.value ? (e.target.value as DevPage) : null)}
        className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-600 outline-none cursor-pointer"
        dir="ltr"
      >
        <option value="">Default (Auto)</option>
        <option value="AUTH">Auth Screen</option>
        <option value="ACTIVATION">Activation Screen</option>
        <option value="GAME">Game Screen</option>
      </select>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [devPage, setDevPage] = useState<DevPage>(null); // Developer explicit page override

  const [gameState, setGameState] = useState<GameState>('CATEGORY_SELECT');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [secret, setSecret] = useState('');
  const [imposterId, setImposterId] = useState<number>(-1);
  const [questionPairs, setQuestionPairs] = useState<[string, string][]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [guessOptions, setGuessOptions] = useState<string[]>([]);
  const [guessResult, setGuessResult] = useState<'NONE' | 'CORRECT' | 'WRONG'>('NONE');

  // Helper to shuffle array
  const shuffle = <T,>(array: T[]): T[] => {
    return [...array].sort(() => Math.random() - 0.5);
  };

  const startGame = (category: Category) => {
    setSelectedCategory(category);
    setGameState('PLAYER_SETUP');
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) checkAccess(session.user.id);
      else setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        checkAccess(session.user.id);
      } else {
        setAccessGranted(null);
        setAuthLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkAccess = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('access_granted')
        .eq('id', userId)
        .single();
      
      if (!error && data) {
        setAccessGranted(data.access_granted);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  // --- Render overrides (Dev Menu) ---
  if (devPage === 'AUTH') {
    return (
      <div className="relative">
         <DevMenu current={devPage} onSelect={setDevPage} />
         <AuthScreen onAuthSuccess={() => setDevPage(null)} onDevBypass={() => setDevPage('GAME')} />
      </div>
    );
  }

  if (devPage === 'ACTIVATION') {
    return (
      <div className="relative">
         <DevMenu current={devPage} onSelect={setDevPage} />
         <ActivationScreen onActivateSuccess={() => setDevPage(null)} onLogout={() => setDevPage(null)} onDevBypass={() => setDevPage('GAME')} />
      </div>
    );
  }

  if (devPage !== 'GAME') {
    if (authLoading) {
      return (
        <div className="min-h-screen w-full flex justify-center items-center bg-[#052e16]">
          <Loader2 className="w-10 h-10 text-[#FF7F3E] animate-spin" />
        </div>
      );
    }

    if (!session) {
      return (
        <div className="relative">
          <DevMenu current={null} onSelect={setDevPage} />
          <AuthScreen onAuthSuccess={() => {}} onDevBypass={() => setDevPage('GAME')} />
        </div>
      );
    }

    if (accessGranted === false) {
      return (
        <div className="relative">
          <DevMenu current={null} onSelect={setDevPage} />
          <ActivationScreen onActivateSuccess={() => setAccessGranted(true)} onLogout={handleLogout} onDevBypass={() => setDevPage('GAME')} />
        </div>
      );
    }
  }

  // --- Main Game Rendering Below ---

  const initializeRound = () => {
    if (!selectedCategory || players.length < 3) return;

    // 1. Pick Imposter
    const randomImposterIndex = Math.floor(Math.random() * players.length);
    const imposter = players[randomImposterIndex];
    setImposterId(imposter.id);

    // 2. Pick Secret
    const randomSecret = selectedCategory.items[Math.floor(Math.random() * selectedCategory.items.length)];
    setSecret(randomSecret);

    // 3. Update Players State (reset votes, set imposter)
    const updatedPlayers = players.map((p, idx) => ({
      ...p,
      isImposter: idx === randomImposterIndex,
      vote: undefined
    }));
    setPlayers(updatedPlayers);

    // 4. Generate Question Pairs (Random Round Robin)
    const shuffledPlayers = shuffle<Player>(updatedPlayers);
    const pairs: [string, string][] = [];
    for (let i = 0; i < shuffledPlayers.length; i++) {
      const asker = shuffledPlayers[i];
      const responder = shuffledPlayers[(i + 1) % shuffledPlayers.length];
      pairs.push([asker.name, responder.name]);
    }
    setQuestionPairs(pairs);

    // 5. Prepare Guess Options (Secret + 6 Random)
    const otherItems = selectedCategory.items.filter(i => i !== randomSecret);
    const distractors = shuffle(otherItems).slice(0, 6);
    setGuessOptions(shuffle([randomSecret, ...distractors]));

    setCurrentPlayerIndex(0);
    setGameState('ROLE_REVEAL_PROMPT');
  };

  const handleRoleRevealNext = () => {
    if (gameState === 'ROLE_REVEAL_PROMPT') {
      setGameState('ROLE_REVEAL_INFO');
    } else {
      if (currentPlayerIndex < players.length - 1) {
        setCurrentPlayerIndex(prev => prev + 1);
        setGameState('ROLE_REVEAL_PROMPT');
      } else {
        setGameState('QUESTIONS_INTRO');
      }
    }
  };

  const handleQuestionNext = () => {
    if (currentQuestionIndex < questionPairs.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setGameState('ASK_ANYONE');
    }
  };

  const handleVotingNext = (votedId?: number) => {
    if (votedId !== undefined) {
      // Record vote
      const updatedPlayers = [...players];
      updatedPlayers[currentPlayerIndex].vote = votedId;
      setPlayers(updatedPlayers);
    }

    if (currentPlayerIndex < players.length - 1) {
      setCurrentPlayerIndex(prev => prev + 1);
      setGameState('VOTING_SELECT');
    } else {
      setGameState('IMPOSTER_REVEAL');
    }
  };

  const handleImposterGuess = (item: string) => {
    const isCorrect = item === secret;
    setGuessResult(isCorrect ? 'CORRECT' : 'WRONG');
    
    // Calculate Scores
    const updatedPlayers = players.map(p => {
      let score = p.score;
      
      if (p.isImposter) {
        // Imposter gets points if they guess secret
        if (isCorrect) score += 100;
      } else {
        // Others get points if they voted for imposter
        if (p.vote === imposterId) score += 100;
      }
      return { ...p, score };
    });
    setPlayers(updatedPlayers);
    setGameState('GUESS_RESULT');
  };

  return (
    <div className="min-h-screen w-full flex justify-center bg-[#052e16]">
      <div className="w-full max-w-md min-h-screen bg-[#0B3B24] relative flex flex-col shadow-2xl">
        
        {/* Header (Only show on certain screens) */}
        {['CATEGORY_SELECT', 'PLAYER_SETUP'].includes(gameState) && (
          <header className="bg-[#FF7F3E] p-1 pt-1 pb-1 rounded-b-[2rem] shadow-lg sticky top-0 z-50 flex justify-center items-center">
            <img src="/images/PlainGameLogo.PNG" alt="Category Clash Logo" className="h-25 object-contain" />
          </header>
        )}

        {/* Content Area */}
        <AnimatePresence mode="wait">
          {gameState === 'CATEGORY_SELECT' && (
            <motion.div key="cat" className="flex-1 flex flex-col" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <CategorySelection onSelect={startGame} />
            </motion.div>
          )}

          {gameState === 'PLAYER_SETUP' && (
            <motion.div key="setup" className="flex-1 flex" initial={{x:100}} animate={{x:0}} exit={{x:-100}}>
              <PlayerSetup 
                players={players} 
                setPlayers={setPlayers} 
                onNext={initializeRound}
                onBack={() => setGameState('CATEGORY_SELECT')}
              />
            </motion.div>
          )}

          {gameState === 'ROLE_REVEAL_PROMPT' && (
            <motion.div key="reveal-prompt" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <RoleRevealPrompt 
                player={players[currentPlayerIndex]} 
                onNext={handleRoleRevealNext} 
              />
            </motion.div>
          )}

          {gameState === 'ROLE_REVEAL_INFO' && (
            <motion.div key="reveal-info" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <RoleRevealInfo 
                player={players[currentPlayerIndex]} 
                secret={secret}
                categoryTitle={selectedCategory?.title || ''}
                onNext={handleRoleRevealNext} 
              />
            </motion.div>
          )}

          {gameState === 'QUESTIONS_INTRO' && (
            <motion.div key="q-intro" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <QuestionsPhase 
                isIntro={true}
                onNext={() => {
                  setCurrentQuestionIndex(0);
                  setGameState('QUESTIONS_ROUND');
                }} 
              />
            </motion.div>
          )}

          {gameState === 'QUESTIONS_ROUND' && (
            <motion.div key="q-round" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <QuestionsPhase 
                asker={questionPairs[currentQuestionIndex][0]}
                responder={questionPairs[currentQuestionIndex][1]}
                onNext={handleQuestionNext} 
              />
            </motion.div>
          )}

          {gameState === 'ASK_ANYONE' && (
            <motion.div key="ask-any" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <AskAnyonePhase 
                onNext={() => {
                  setCurrentPlayerIndex(0);
                  setGameState('VOTING_SELECT');
                }} 
              />
            </motion.div>
          )}

          {gameState === 'VOTING_SELECT' && (
            <motion.div key="vote-select" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <VotingSelect 
                voter={players[currentPlayerIndex]}
                candidates={players.filter(p => p.id !== players[currentPlayerIndex].id)}
                onVote={handleVotingNext} 
              />
            </motion.div>
          )}

          {gameState === 'IMPOSTER_REVEAL' && (
            <motion.div key="imp-reveal" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <ImposterReveal 
                imposter={players.find(p => p.id === imposterId)!}
                onNext={() => setGameState('IMPOSTER_GUESS')} 
              />
            </motion.div>
          )}

          {gameState === 'IMPOSTER_GUESS' && (
            <motion.div key="imp-guess" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <ImposterGuess 
                options={guessOptions}
                onGuess={handleImposterGuess} 
              />
            </motion.div>
          )}

          {gameState === 'GUESS_RESULT' && (
            <motion.div key="guess-res" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <GuessResult 
                success={guessResult === 'CORRECT'}
                secret={secret}
                onNext={() => setGameState('LEADERBOARD')} 
              />
            </motion.div>
          )}

          {gameState === 'LEADERBOARD' && (
            <motion.div key="leaderboard" className="flex-1 flex" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
              <Leaderboard 
                players={players}
                onHome={() => {
                  setGuessResult('NONE');
                  setGameState('CATEGORY_SELECT');
                }} 
              />
            </motion.div>
          )}
        </AnimatePresence>

        <footer className="mt-auto p-4 text-center text-[#FFF8E7]/40 text-sm">
          All rights reserved for Abduallah
        </footer>
      </div>
    </div>
  );
}
