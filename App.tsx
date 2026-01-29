
import React, { useState, useRef, useEffect } from 'react';
import { MascotStyle, MascotState, User } from './types';
import { generateMascotImage } from './services/geminiService';
import StyleCard from './components/StyleCard';

const ADMIN_EMAIL = 'admin@yumascotes.com';
const ADMIN_PASS = 'admin123';

const LOADING_MESSAGES = [
  "Analisando os traços do rostinho...",
  "Desenhando roupas mágicas...",
  "Escolhendo as cores perfeitas...",
  "Finalizando sua obra-prima..."
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [loadingMsgIndex, setLoadingMsgIndex] = useState(0);

  const [state, setState] = useState<MascotState>({
    image: null,
    style: null,
    clothingDetails: '',
    partyTheme: '',
    generatedMascot: null,
    isLoading: false,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let interval: any;
    if (state.isLoading) {
      interval = setInterval(() => {
        setLoadingMsgIndex(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [state.isLoading]);

  useEffect(() => {
    const users = JSON.parse(localStorage.getItem('yu_users') || '[]');
    if (!users.find((u: any) => u.email === ADMIN_EMAIL)) {
      users.push({ email: ADMIN_EMAIL, password: ADMIN_PASS, status: 'admin', createdAt: Date.now() });
      localStorage.setItem('yu_users', JSON.stringify(users));
    }
    const sessionEmail = localStorage.getItem('yu_session');
    if (sessionEmail) {
      const user = users.find((u: any) => u.email === sessionEmail);
      if (user) setCurrentUser(user);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem('yu_users') || '[]');
    const user = users.find((u: any) => u.email === emailInput && u.password === passwordInput);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('yu_session', user.email);
    } else {
      setAuthError('Credenciais inválidas.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setState(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!state.image || !state.style) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await generateMascotImage(state.image, state.style, state.clothingDetails, state.partyTheme);
      setState(prev => ({ ...prev, generatedMascot: result, isLoading: false }));
    } catch (err: any) {
      const isQuotaError = err.message?.includes('COTA ZERO') || err.message?.includes('429') || err.message?.includes('quota');
      const errorMsg = currentUser?.email === ADMIN_EMAIL 
        ? err.message 
        : (isQuotaError ? "O sistema está com alta demanda no momento devido ao sucesso do site! Por favor, tente novamente em alguns minutos." : err.message);
      
      setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fff8fa] flex items-center justify-center p-6">
        <div className="bg-white p-12 rounded-[4rem] shadow-[0_32px_64px_-16px_rgba(255,182,193,0.3)] w-full max-w-md text-center border border-pink-50 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-300 via-pink-500 to-pink-300"></div>
          <h1 className="text-4xl font-black text-slate-800 mb-2 tracking-tight">Yu Mascotes 🎀</h1>
          <p className="text-slate-400 text-sm mb-10 font-bold uppercase tracking-widest opacity-60">Sua Fábrica de Sonhos</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="text-left space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">E-mail de Assinante</label>
              <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-slate-700" placeholder="seu@email.com" />
            </div>
            <div className="text-left space-y-1">
              <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Senha</label>
              <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 outline-none focus:border-pink-300 focus:bg-white transition-all font-bold text-slate-700" placeholder="••••••••" />
            </div>
            
            {authError && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-2xl">{authError}</p>}
            
            <button type="submit" className="w-full py-5 bg-pink-500 text-white rounded-3xl font-black shadow-xl shadow-pink-200 hover:bg-pink-600 hover:-translate-y-1 transition-all active:scale-95 mt-4">
              ENTRAR NA FÁBRICA ✨
            </button>
          </form>
          
          <div className="mt-10 pt-10 border-t border-slate-50">
            <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Acesso Restrito a Parceiros Yu</p>
          </div>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-[#fffafa] pb-20">
      <header className="bg-white/80 backdrop-blur-md p-4 px-8 shadow-sm flex justify-between items-center sticky top-0 z-50 border-b border-pink-50">
        <div className="font-black text-slate-800 text-2xl flex items-center gap-2 group cursor-default">
          Yu Mascotes <span className="text-pink-500 group-hover:rotate-12 transition-transform inline-block">🎀</span>
        </div>
        <div className="flex gap-4 items-center">
          {isAdmin && (
            <button onClick={() => setShowHelpModal(true)} className="w-10 h-10 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm flex items-center justify-center hover:bg-slate-800 hover:text-white transition-all shadow-sm">⚙️</button>
          )}
          <button onClick={() => { localStorage.removeItem('yu_session'); setCurrentUser(null); }} className="px-5 py-2.5 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest hover:bg-red-50 hover:text-red-500 transition-all border border-transparent hover:border-red-100">Sair</button>
        </div>
      </header>

      {showHelpModal && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-lg flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-12 relative shadow-2xl animate-in zoom-in duration-300">
            <button onClick={() => setShowHelpModal(false)} className="absolute top-8 right-8 w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 transition-colors">✕</button>
            <h2 className="text-3xl font-black text-slate-800 mb-8">Painel Admin ⚙️</h2>
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status da Conexão</p>
                <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-100 flex items-center gap-3">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-emerald-700 font-black text-sm uppercase tracking-tight">Gemini API Online</span>
                </div>
              </div>
              
              <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <p className="text-slate-600 text-sm font-bold leading-relaxed">Seus clientes não veem esta tela. Use os links abaixo para gerenciar o faturamento da sua chave do Google.</p>
                <a href="https://aistudio.google.com/app/billing" target="_blank" className="block w-full py-5 bg-slate-800 text-white rounded-[1.5rem] text-center font-black uppercase text-xs tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-slate-200">Painel de Faturamento Google 💳</a>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-6 md:p-12 space-y-16">
        <div className="text-center space-y-4">
          <div className="inline-block bg-pink-100 text-pink-600 px-6 py-2 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-4">Ateliê Digital</div>
          <h2 className="text-5xl md:text-6xl font-black text-slate-800 tracking-tighter">Crie seu Mascote ✨</h2>
          <p className="text-slate-400 font-bold text-lg">Mascotes lindos em um clique</p>
        </div>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Lado Esquerdo: Workshop */}
          <div className="lg:col-span-5 space-y-8 bg-white p-8 rounded-[3.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.03)] border border-slate-50">
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-black text-sm">1</span>
                <h3 className="font-black text-slate-800 text-lg">Envie a Foto</h3>
              </div>
              
              <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 border-4 border-dashed rounded-[3rem] flex items-center justify-center cursor-pointer overflow-hidden border-slate-100 hover:border-pink-200 hover:bg-pink-50/30 transition-all relative group">
                {state.image ? (
                  <>
                    <img src={state.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-white font-black text-xs uppercase tracking-widest">Trocar Foto</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="text-6xl group-hover:scale-110 transition-transform">📸</div>
                    <div className="space-y-1">
                      <span className="font-black text-slate-400 block uppercase text-xs tracking-widest">Clique para escolher</span>
                      <span className="text-slate-300 text-[10px] font-bold">Rostinho bem visível é melhor!</span>
                    </div>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
            </div>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-black text-sm">2</span>
                <h3 className="font-black text-slate-800 text-lg">Personalize</h3>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Acessórios e Roupas (Opcional)</label>
                  <textarea 
                    value={state.clothingDetails} 
                    onChange={(e) => setState(prev => ({...prev, clothingDetails: e.target.value}))} 
                    placeholder="Ex: Vestido rosa de tule, coroa de princesa, segurando um ursinho..." 
                    className="w-full p-6 rounded-3xl bg-slate-50 border border-slate-100 outline-none h-32 text-sm font-bold focus:border-pink-300 focus:bg-white transition-all placeholder:text-slate-300 resize-none" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 tracking-widest">Tema da Festa (Opcional)</label>
                  <input 
                    type="text"
                    value={state.partyTheme} 
                    onChange={(e) => setState(prev => ({...prev, partyTheme: e.target.value}))} 
                    placeholder="Ex: Fundo do Mar, Astronauta, Barbie..." 
                    className="w-full p-5 rounded-3xl bg-slate-50 border border-slate-100 outline-none text-sm font-bold focus:border-pink-300 focus:bg-white transition-all placeholder:text-slate-300" 
                  />
                </div>
              </div>
            </div>

            <button 
              onClick={handleGenerate} 
              disabled={state.isLoading || !state.image || !state.style} 
              className="w-full py-7 bg-pink-500 text-white rounded-[2rem] font-black text-xl shadow-2xl shadow-pink-200 hover:bg-pink-600 hover:-translate-y-1 active:scale-95 disabled:bg-slate-100 disabled:text-slate-300 disabled:shadow-none transition-all"
            >
              {state.isLoading ? (
                <div className="flex flex-col items-center">
                  <div className="flex gap-1 mb-1">
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 bg-white rounded-full animate-bounce"></span>
                  </div>
                  <span className="text-[10px] opacity-80 font-black uppercase tracking-widest">{LOADING_MESSAGES[loadingMsgIndex]}</span>
                </div>
              ) : "GERAR MASCOTE AGORA 🪄"}
            </button>

            {state.error && (
              <div className="p-6 bg-amber-50 rounded-3xl border border-amber-100">
                <p className="text-amber-700 text-xs font-bold leading-relaxed text-center">{state.error}</p>
                {isAdmin && (state.error.includes('COTA') || state.error.includes('429')) && (
                  <a href="https://aistudio.google.com/app/billing" target="_blank" className="mt-4 block w-full py-3 bg-slate-800 text-white text-center rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-colors">Resolver Faturamento 💳</a>
                )}
              </div>
            )}
          </div>

          {/* Lado Direito: Estilos */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex items-center gap-3 px-2">
              <span className="w-8 h-8 rounded-full bg-pink-500 text-white flex items-center justify-center font-black text-sm">3</span>
              <h3 className="font-black text-slate-800 text-xl">Escolha a Arte</h3>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-4">
              {Object.values(MascotStyle).map(s => (
                <StyleCard 
                  key={s} 
                  style={s} 
                  isSelected={state.style === s} 
                  onSelect={(st) => setState(prev => ({...prev, style: st}))} 
                  description={
                    s === MascotStyle.MINI_REALISTA ? "Traços idênticos em miniatura luxuosa." :
                    s === MascotStyle.MAGIA_3D ? "Efeito cinema com brilho e profundidade." :
                    s === MascotStyle.CARTOON_POP ? "Moderno, vibrante e cheio de atitude." :
                    "Cores suaves e toque artístico feito à mão."
                  } 
                />
              ))}
            </div>

            {/* Resultado Final */}
            {state.generatedMascot && (
              <div className="mt-10 bg-slate-900 p-8 md:p-12 rounded-[4rem] text-center space-y-10 animate-in zoom-in duration-700 border-[12px] border-slate-800 shadow-[0_40px_100px_rgba(0,0,0,0.2)] overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-400 via-purple-500 to-pink-400"></div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-black text-white">Ficou Incrível! ✨</h2>
                  <p className="text-slate-400 font-bold text-sm">Sua arte exclusiva está pronta para brilhar.</p>
                </div>
                
                <div className="relative group max-w-sm mx-auto">
                   <img src={state.generatedMascot} className="w-full rounded-[3.5rem] shadow-2xl border-4 border-white/5 transition-transform group-hover:scale-[1.02] duration-500" />
                   <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center text-3xl shadow-xl shadow-pink-900/40 animate-bounce">🎨</div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4">
                  <a href={state.generatedMascot} download="meu-mascote-yu.png" className="w-full sm:w-auto bg-white text-slate-900 px-12 py-5 rounded-full font-black text-xl shadow-xl hover:bg-pink-50 hover:scale-105 transition-all flex items-center justify-center gap-3">
                    BAIXAR ARTE 📥
                  </a>
                  <button onClick={() => setState(prev => ({...prev, generatedMascot: null}))} className="text-slate-500 text-xs font-black uppercase tracking-widest hover:text-white transition-colors py-4 px-8 border border-slate-800 rounded-full hover:bg-slate-800">
                    Gerar Outra Versão
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <footer className="py-20 text-center space-y-8">
        <div className="flex items-center justify-center gap-4 opacity-20">
          <div className="h-[1px] w-20 bg-slate-400"></div>
          <div className="text-xl">🎀</div>
          <div className="h-[1px] w-20 bg-slate-400"></div>
        </div>
        <div className="space-y-2">
          <p className="text-slate-300 font-black text-[10px] uppercase tracking-[0.5em]">Yu Mascotes Premium Factory</p>
          <p className="text-slate-200 font-medium text-xs">Transformando momentos em arte eterna desde 2024</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
