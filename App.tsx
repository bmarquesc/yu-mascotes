
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
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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

  const handleSelectApiKey = async () => {
    // @ts-ignore
    if (window.aistudio?.openSelectKey) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setState(prev => ({ ...prev, error: null }));
    } else {
      window.open('https://aistudio.google.com/app/apikey', '_blank');
    }
  };

  const handleGenerate = async () => {
    if (!state.image || !state.style) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const result = await generateMascotImage(state.image, state.style, state.clothingDetails, state.partyTheme);
      setState(prev => ({ ...prev, generatedMascot: result, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <h1 className="text-3xl font-black text-slate-800 mb-6">Yu Mascotes</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border outline-none" placeholder="E-mail" />
            <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border outline-none" placeholder="Senha" />
            {authError && <p className="text-red-500 text-xs font-bold">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-pink-500 text-white rounded-2xl font-black">ENTRAR</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fffafa]">
      <header className="bg-white p-4 px-8 shadow-sm flex justify-between items-center sticky top-0 z-50">
        <div className="font-black text-slate-800 text-xl">Yu Mascotes 🎀</div>
        <div className="flex gap-4">
          <button onClick={() => setShowHelpModal(true)} className="w-10 h-10 bg-pink-100 text-pink-500 rounded-full font-black border border-pink-200 shadow-sm">?</button>
          <button onClick={() => { localStorage.removeItem('yu_session'); setCurrentUser(null); }} className="text-xs font-bold text-slate-400 uppercase">Sair</button>
        </div>
      </header>

      {showHelpModal && (
        <div className="fixed inset-0 z-[100] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[3rem] p-10 relative animate-in zoom-in duration-300">
            <button onClick={() => setShowHelpModal(false)} className="absolute top-6 right-6 text-slate-400 font-bold">✕</button>
            <h2 className="text-2xl font-black text-slate-800 mb-6">🎁 Ativar Uso Gratuito</h2>
            <div className="space-y-4 text-slate-600 font-medium">
              <p>1. Vá no <a href="https://aistudio.google.com/" target="_blank" className="text-pink-500 font-bold underline">Google AI Studio</a>.</p>
              <p>2. Clique em <b>Settings (Engrenagem)</b> no canto inferior esquerdo.</p>
              <p>3. Clique na aba <b>Plan</b>.</p>
              <p>4. Clique em <b>"Upgrade to Pay-as-you-go"</b>. Mesmo com esse nome, você terá uma cota gratuita de centenas de imagens por dia.</p>
              <p>5. Volte aqui e use sua chave normalmente!</p>
            </div>
            <button onClick={() => setShowHelpModal(false)} className="w-full mt-8 py-4 bg-slate-800 text-white rounded-2xl font-black">ENTENDI!</button>
          </div>
        </div>
      )}

      <main className="max-w-4xl mx-auto p-6 mt-8 space-y-12">
        <div className="text-center">
          <h2 className="text-4xl font-black text-slate-800">Crie seu Mascote ✨</h2>
          <p className="text-slate-400 font-bold">Transforme fotos em arte em segundos</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-white border-4 border-dashed rounded-[3rem] flex items-center justify-center cursor-pointer overflow-hidden border-pink-100">
              {state.image ? <img src={state.image} className="w-full h-full object-cover" /> : <span className="font-black text-slate-300">📸 Clique para enviar foto</span>}
            </div>
            <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
            
            <textarea value={state.clothingDetails} onChange={(e) => setState(prev => ({...prev, clothingDetails: e.target.value}))} placeholder="Detalhes da roupa..." className="w-full p-4 rounded-2xl bg-white border outline-none h-32 text-sm font-bold" />
            
            <button onClick={handleGenerate} disabled={state.isLoading || !state.image} className="w-full py-6 bg-pink-500 text-white rounded-[2rem] font-black text-xl shadow-xl shadow-pink-100">
              {state.isLoading ? "GERANDO..." : "GERAR AGORA 🪄"}
            </button>

            {state.error && (
              <div className="p-6 bg-red-50 rounded-2xl border border-red-100">
                <p className="text-red-500 text-xs font-bold mb-4">{state.error}</p>
                <button onClick={handleSelectApiKey} className="text-xs bg-slate-800 text-white px-4 py-2 rounded-lg font-bold">CONFIGURAR CHAVE 🔑</button>
              </div>
            )}
          </div>

          <div className="grid gap-4 content-start">
            <h3 className="font-black text-slate-800 px-2">Escolha o Estilo:</h3>
            {Object.values(MascotStyle).map(s => (
              <StyleCard key={s} style={s} isSelected={state.style === s} onSelect={(st) => setState(prev => ({...prev, style: st}))} description="Estilo premium selecionado." />
            ))}
          </div>
        </div>

        {state.generatedMascot && (
          <div className="bg-slate-900 p-10 rounded-[4rem] text-center space-y-8 animate-in zoom-in duration-500">
            <h2 className="text-3xl font-black text-white">Resultado Mágico! ✨</h2>
            <img src={state.generatedMascot} className="max-w-md w-full mx-auto rounded-[3rem] shadow-2xl" />
            <a href={state.generatedMascot} download="mascote.png" className="inline-block bg-white text-slate-900 px-12 py-5 rounded-full font-black text-xl shadow-xl">BAIXAR ARTE</a>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
