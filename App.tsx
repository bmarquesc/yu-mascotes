
import React, { useState, useRef, useEffect } from 'react';
import { MascotStyle, MascotState, User, UserStatus } from './types';
import { generateMascotImage } from './services/geminiService';
import StyleCard from './components/StyleCard';

const ADMIN_EMAIL = 'admin@yumascotes.com';
const ADMIN_PASS = 'admin123';

const LOADING_MESSAGES = [
  "Analisando os traços do rostinho...",
  "Costurando as roupinhas mágicas...",
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
      // Se for erro de cota, mostramos uma mensagem profissional para o cliente
      // Mas para o Admin (você), mostramos o erro real.
      const isQuotaError = err.message?.includes('COTA ZERO') || err.message?.includes('429');
      const errorMsg = currentUser?.email === ADMIN_EMAIL 
        ? err.message 
        : (isQuotaError ? "O sistema está com alta demanda no momento. Por favor, tente novamente em alguns instantes." : err.message);
      
      setState(prev => ({ ...prev, error: errorMsg, isLoading: false }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center border border-pink-100">
          <h1 className="text-3xl font-black text-slate-800 mb-2">Yu Mascotes 🎀</h1>
          <p className="text-slate-400 text-sm mb-8 font-bold italic">Sua fábrica de sonhos</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-pink-300 transition-all font-medium" placeholder="E-mail de assinante" />
            <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-pink-300 transition-all font-medium" placeholder="Sua senha" />
            {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black shadow-lg shadow-pink-100 hover:bg-pink-600 transition-all">ENTRAR NA FÁBRICA</button>
          </form>
          <p className="mt-8 text-slate-400 text-xs font-bold uppercase tracking-widest">Acesso exclusivo para parceiros</p>
        </div>
      </div>
    );
  }

  const isAdmin = currentUser.email === ADMIN_EMAIL;

  return (
    <div className="min-h-screen bg-[#fffafa]">
      <header className="bg-white p-4 px-8 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="font-black text-slate-800 text-xl flex items-center gap-2">Yu Mascotes <span className="text-pink-400">🎀</span></div>
        <div className="flex gap-4 items-center">
          {isAdmin && (
            <button onClick={() => setShowHelpModal(true)} className="w-8 h-8 bg-slate-100 text-slate-500 rounded-full font-black text-sm flex items-center justify-center hover:bg-slate-200 transition-colors">⚙️</button>
          )}
          <button onClick={() => { localStorage.removeItem('yu_session'); setCurrentUser(null); }} className="text-[10px] font-black text-slate-400 uppercase tracking-tighter hover:text-red-400 transition-colors">Sair da Conta</button>
        </div>
      </header>

      {/* Modal de Ajuda apenas para o Admin */}
      {showHelpModal && isAdmin && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative shadow-2xl">
            <button onClick={() => setShowHelpModal(false)} className="absolute top-6 right-6 text-slate-400 font-bold">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-6">Painel de Controle ⚙️</h2>
            <div className="space-y-4 text-slate-600 text-sm text-left">
              <p className="font-bold text-slate-800">Status do Sistema:</p>
              <div className="bg-green-50 p-4 rounded-2xl border border-green-100 text-green-700 text-xs font-bold">
                ✓ Conectado ao Google Gemini
              </div>
              <p>Seus clientes não veem esta tela. Aqui você gerencia o faturamento.</p>
              <a href="https://aistudio.google.com/app/billing" target="_blank" className="block w-full py-4 bg-blue-600 text-white rounded-2xl text-center font-black uppercase text-xs">Gerenciar Pagamentos Google 💳</a>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6 mt-8 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-800">Crie sua Obra-Prima ✨</h2>
          <p className="text-slate-400 font-bold">Transforme o comum em algo extraordinário</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white border-4 border-dashed rounded-[3rem] flex items-center justify-center cursor-pointer overflow-hidden border-pink-100 hover:bg-pink-50/50 transition-all shadow-sm">
              {state.image ? <img src={state.image} className="w-full h-full object-cover" /> : (
                <div className="text-center space-y-2">
                  <div className="text-4xl">📸</div>
                  <span className="font-black text-slate-300 block">Clique para enviar a foto</span>
                </div>
              )}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
            
            <textarea value={state.clothingDetails} onChange={(e) => setState(prev => ({...prev, clothingDetails: e.target.value}))} placeholder="Descreva a roupinha ou acessórios que deseja..." className="w-full p-4 rounded-2xl bg-white border border-slate-100 outline-none h-32 text-sm font-bold focus:border-pink-200 transition-all placeholder:text-slate-300" />
            
            <button onClick={handleGenerate} disabled={state.isLoading || !state.image} className="w-full py-6 bg-pink-500 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-pink-100 hover:bg-pink-600 disabled:bg-slate-100 disabled:shadow-none transition-all">
              {state.isLoading ? (
                <div className="flex flex-col items-center">
                  <span className="animate-pulse">CRIANDO MAGIA...</span>
                  <span className="text-[10px] opacity-70 mt-1 font-medium">{LOADING_MESSAGES[loadingMsgIndex]}</span>
                </div>
              ) : "GERAR MASCOTE 🪄"}
            </button>

            {state.error && (
              <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100">
                <p className="text-amber-700 text-xs font-bold leading-relaxed text-center">{state.error}</p>
                {isAdmin && state.error.includes('COTA ZERO') && (
                  <a href="https://aistudio.google.com/app/billing" target="_blank" className="mt-4 block w-full py-2 bg-slate-800 text-white text-center rounded-xl text-[10px] font-black uppercase">Apenas você vê isso: Ative o Plano 💳</a>
                )}
              </div>
            )}
          </div>

          <div className="grid gap-4 content-start">
            <h3 className="font-black text-slate-800 px-2">Escolha o Estilo:</h3>
            {Object.values(MascotStyle).map(s => (
              <StyleCard key={s} style={s} isSelected={state.style === s} onSelect={(st) => setState(prev => ({...prev, style: st}))} description="Toque artístico selecionado." />
            ))}
          </div>
        </div>

        {state.generatedMascot && (
          <div className="bg-slate-900 p-10 rounded-[4rem] text-center space-y-8 animate-in zoom-in duration-500 border-[12px] border-slate-800 shadow-2xl">
            <h2 className="text-3xl font-black text-white">Prontinho! ✨</h2>
            <img src={state.generatedMascot} className="max-w-md w-full mx-auto rounded-[3rem] shadow-2xl" />
            <div className="flex flex-col items-center gap-4">
              <a href={state.generatedMascot} download="meu-mascote-yu.png" className="bg-white text-slate-900 px-12 py-5 rounded-full font-black text-xl shadow-xl hover:scale-105 transition-transform">BAIXAR AGORA 📥</a>
              <button onClick={() => setState(prev => ({...prev, generatedMascot: null}))} className="text-slate-500 text-xs font-bold hover:text-white transition-colors">GERAR OUTRA VERSÃO</button>
            </div>
          </div>
        )}
      </main>
      
      <footer className="py-12 text-center">
        <div className="w-12 h-1 bg-pink-100 mx-auto mb-6 rounded-full"></div>
        <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">Yu Mascotes Factory © 2024</p>
      </footer>
    </div>
  );
};

export default App;
