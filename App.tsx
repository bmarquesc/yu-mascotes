
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
  "Polindo os detalhes da arte...",
  "Adicionando um toque de brilho...",
  "Finalizando sua obra-prima..."
];

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
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
    const users = getUsers();
    const adminExists = users.find(u => u.email === ADMIN_EMAIL);
    if (!adminExists) {
      const admin: User = { 
        email: ADMIN_EMAIL, 
        password: ADMIN_PASS, 
        status: 'admin',
        createdAt: Date.now() 
      };
      localStorage.setItem('yu_users', JSON.stringify([...users, admin]));
    }
    const sessionEmail = localStorage.getItem('yu_session');
    if (sessionEmail) {
      const usersLatest = getUsers();
      const user = usersLatest.find(u => u.email === sessionEmail);
      if (user) {
        setCurrentUser(user);
        if (user.status === 'admin') setShowAdminPanel(true);
      }
    }
  }, []);

  const getUsers = (): User[] => {
    const users = localStorage.getItem('yu_users');
    return users ? JSON.parse(users) : [];
  };

  const saveUsers = (users: User[]) => {
    localStorage.setItem('yu_users', JSON.stringify(users));
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!emailInput.includes('@')) { setAuthError('E-mail inválido.'); return; }
    const users = getUsers();
    if (users.find(u => u.email === emailInput)) { setAuthError('E-mail já cadastrado.'); return; }
    const newUser: User = { 
      email: emailInput, 
      password: passwordInput, 
      status: 'pending',
      createdAt: Date.now()
    };
    saveUsers([...users, newUser]);
    setAuthMode('login');
    setAuthError('Cadastro realizado! Peça ao admin para te aprovar.');
    setEmailInput(''); setPasswordInput('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    const users = getUsers();
    const user = users.find(u => u.email === emailInput && u.password === passwordInput);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('yu_session', user.email);
      if (user.status === 'admin') setShowAdminPanel(true);
      setEmailInput(''); setPasswordInput('');
    } else {
      setAuthError('E-mail ou senha incorretos.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('yu_session');
    setShowAdminPanel(false);
  };

  const approveUser = (email: string) => {
    const users = getUsers();
    const updatedUsers = users.map(u => u.email === email ? { ...u, status: 'approved' as UserStatus } : u);
    saveUsers(updatedUsers);
  };

  const deleteUser = (email: string) => {
    if (confirm(`Excluir permanentemente ${email}?`)) {
      const users = getUsers();
      saveUsers(users.filter(u => u.email !== email));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setState(prev => ({ ...prev, image: reader.result as string, error: null, generatedMascot: null }));
      reader.readAsDataURL(file);
    }
  };

  const handleGenerate = async () => {
    if (!state.image || !state.style) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const resultImage = await generateMascotImage(state.image, state.style, state.clothingDetails, state.partyTheme);
      setState(prev => ({ ...prev, generatedMascot: resultImage, isLoading: false }));
      setTimeout(() => {
        const resultSection = document.getElementById('result');
        resultSection?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  const getStyleDescription = (style: MascotStyle) => {
    switch(style) {
      case MascotStyle.MINI_REALISTA: return "Rosto 100% fiel com corpinho de boneca luxo.";
      case MascotStyle.MAGIA_3D: return "Estilo cinema 3D com olhos grandes e expressivos.";
      case MascotStyle.CARTOON_POP: return "Visual 2D limpo, moderno e muito carismático.";
      case MascotStyle.PINTURA_DOCE: return "Arte feita à mão com cores suaves e mágicas.";
      default: return "";
    }
  };

  const isExpired = (createdAt: number) => {
    const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
    return (Date.now() - createdAt) > ONE_MONTH_MS;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-4">
        <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl w-full max-w-md text-center border border-pink-100">
          <img src="/logo.png" alt="Yu Mascotes Logo" className="w-32 h-32 object-contain mx-auto mb-6 drop-shadow-sm" onError={(e) => {
            e.currentTarget.style.display = 'none';
          }} />
          <h1 className="text-3xl font-black text-slate-800 mb-2">Yu Mascotes</h1>
          <p className="text-slate-400 text-sm mb-8 font-medium">Mascotes lindos em um clique</p>
          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-pink-300 transition-all text-slate-700" placeholder="E-mail" />
            <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-100 outline-none focus:border-pink-300 transition-all text-slate-700" placeholder="Senha" />
            {authError && <p className="text-xs text-red-500 font-bold bg-red-50 p-2 rounded-lg">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-pink-100 hover:opacity-90 transition-all active:scale-95">
              {authMode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-8 text-pink-500 font-bold text-sm hover:underline">
            {authMode === 'login' ? 'Não tem conta? Cadastre-se agora' : 'Já possui uma conta? Faça login'}
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-4 text-center">
        <div className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-lg border border-pink-100">
          <div className="w-20 h-20 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">⏳</div>
          <h2 className="text-3xl font-black mb-4 text-slate-800">Quase lá!</h2>
          <p className="text-slate-500 mb-8 leading-relaxed font-medium">Sua conta foi criada com sucesso, mas como somos um serviço exclusivo, um administrador precisa aprovar seu acesso manualmente.</p>
          <button onClick={handleLogout} className="text-pink-500 font-black hover:underline uppercase tracking-widest text-sm">Sair da conta</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff8fa] pb-20">
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 p-4 px-8 shadow-sm border-b border-pink-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-12 h-12 object-contain" onError={(e) => e.currentTarget.style.display='none'} />
          <div>
            <span className="font-black text-slate-800 block leading-none">Yu Mascotes</span>
            <span className="text-[10px] text-pink-500 font-bold uppercase tracking-tighter">Premium Edition</span>
          </div>
        </div>
        <div className="flex gap-4 items-center">
          {currentUser.status === 'admin' && (
            <button onClick={() => setShowAdminPanel(true)} className="text-[10px] bg-slate-800 text-white px-4 py-2 rounded-full font-bold uppercase tracking-widest hover:bg-slate-700 transition-colors">Painel Admin</button>
          )}
          <button onClick={handleLogout} className="text-[10px] font-black text-pink-500 uppercase border border-pink-100 px-5 py-2 rounded-full hover:bg-pink-50 transition-colors">Sair</button>
        </div>
      </header>

      {showAdminPanel && currentUser.status === 'admin' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-8 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-800">Gestão de Clientes e Assinaturas</h2>
              <button onClick={() => setShowAdminPanel(false)} className="bg-white text-slate-400 hover:text-slate-600 font-bold w-10 h-10 rounded-full flex items-center justify-center shadow-sm">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <table className="w-full text-left">
                <thead className="sticky top-0 bg-white">
                  <tr>
                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Usuário</th>
                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Cadastro em</th>
                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Status</th>
                    <th className="p-4 font-bold text-xs uppercase text-slate-400">Assinatura</th>
                    <th className="p-4 font-bold text-xs uppercase text-slate-400 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {getUsers().filter(u => u.email !== ADMIN_EMAIL).map(u => {
                    const expired = isExpired(u.createdAt || Date.now());
                    return (
                      <tr key={u.email} className="hover:bg-slate-50/50">
                        <td className="p-4 text-sm font-bold text-slate-700">{u.email}</td>
                        <td className="p-4 text-xs text-slate-500">
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'Antigo'}
                        </td>
                        <td className="p-4">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${u.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                            {u.status === 'approved' ? 'Ativo' : 'Pendente'}
                          </span>
                        </td>
                        <td className="p-4">
                          {expired ? (
                            <span className="text-[10px] font-black bg-red-100 text-red-600 px-3 py-1 rounded-full uppercase flex items-center gap-1 w-fit">
                              🔴 VENCIDA (Pagar)
                            </span>
                          ) : (
                            <span className="text-[10px] font-black bg-green-100 text-green-600 px-3 py-1 rounded-full uppercase flex items-center gap-1 w-fit">
                              🟢 ATIVA
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          {u.status === 'pending' && <button onClick={() => approveUser(u.email)} className="bg-green-500 text-white text-[10px] font-black px-4 py-2 rounded-lg mr-2 shadow-md shadow-green-100">APROVAR</button>}
                          <button onClick={() => deleteUser(u.email)} className="text-red-500 text-[10px] font-black hover:bg-red-50 px-4 py-2 rounded-lg">EXCLUIR</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto p-6 mt-8 space-y-12">
        <div className="text-center space-y-3">
          <h2 className="text-5xl font-black text-slate-800 tracking-tight">Crie seu Mascote 🎀</h2>
          <p className="text-slate-400 font-bold text-lg">Mascotes lindos em um clique</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-pink-100/20 border border-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center font-black text-xl">1</div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl leading-none">Foto da Criança</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Use fotos frontais e claras</p>
                </div>
              </div>
              
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className={`aspect-video md:aspect-square max-h-[400px] w-full rounded-[2.5rem] border-4 border-dashed transition-all flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group ${state.image ? 'border-pink-300' : 'border-slate-100 bg-slate-50/50 hover:bg-slate-50'}`}
              >
                {state.image ? (
                  <>
                    <img src={state.image} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-pink-500/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                      <span className="bg-white text-pink-600 px-6 py-3 rounded-full font-black text-sm shadow-2xl">TROCAR FOTO</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-8">
                    <div className="w-20 h-20 bg-white rounded-[2rem] shadow-lg flex items-center justify-center mx-auto mb-6 text-4xl">📸</div>
                    <span className="text-slate-500 font-black text-lg block">Clique para enviar</span>
                    <p className="text-xs text-slate-300 mt-2 font-bold uppercase">Formatos aceitos: JPG, PNG</p>
                  </div>
                )}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
            </section>

            <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-pink-100/20 border border-white">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center font-black text-xl">3</div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl leading-none">Detalhes (Opcional)</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Personalize do seu jeito</p>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-[0.2em]">Roupa Desejada</label>
                  <textarea 
                    value={state.clothingDetails} 
                    onChange={(e) => setState(prev => ({...prev, clothingDetails: e.target.value}))} 
                    placeholder="Ex: Vestidinho de festa rosa com brilhos e laço grande no cabelo..." 
                    className="w-full p-5 bg-slate-50 rounded-[2rem] text-sm h-32 outline-none border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all resize-none font-medium text-slate-600" 
                  />
                </div>
                <div className="relative">
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-4 mb-2 block tracking-[0.2em]">Tema da Festa</label>
                  <input 
                    type="text"
                    value={state.partyTheme} 
                    onChange={(e) => setState(prev => ({...prev, partyTheme: e.target.value}))} 
                    placeholder="Ex: Jardim Encantado, Princesas, Circo Rosa..." 
                    className="w-full p-5 bg-slate-50 rounded-2xl text-sm outline-none border-2 border-transparent focus:border-pink-200 focus:bg-white transition-all font-medium text-slate-600" 
                  />
                </div>
              </div>
            </section>

            <div className="pt-4">
              <button 
                onClick={handleGenerate} 
                disabled={!state.image || !state.style || state.isLoading} 
                className={`w-full py-7 rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-4 group relative overflow-hidden ${(!state.image || !state.style || state.isLoading) ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-pink-500 via-rose-500 to-pink-600 text-white shadow-rose-200 hover:shadow-rose-300'}`}
              >
                {state.isLoading ? (
                  <span className="flex items-center gap-3">
                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                    GERANDO...
                  </span>
                ) : (
                  <>
                    GERAR AGORA ✨
                    <div className="absolute top-0 -left-full w-full h-full bg-white/20 skew-x-[45deg] group-hover:left-[150%] transition-all duration-700 pointer-events-none"></div>
                  </>
                )}
              </button>
              {state.error && <p className="text-center text-red-500 text-xs font-bold mt-4 bg-red-50 p-4 rounded-2xl border border-red-100">{state.error}</p>}
            </div>
          </div>

          <div>
            <section className="bg-white p-8 rounded-[3rem] shadow-xl shadow-pink-100/20 border border-white h-full">
              <div className="flex items-center gap-4 mb-10">
                <div className="w-12 h-12 bg-pink-100 text-pink-500 rounded-2xl flex items-center justify-center font-black text-xl">2</div>
                <div>
                  <h3 className="font-black text-slate-800 text-xl leading-none">Escolha o Estilo Artístico</h3>
                  <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-wider">Qual mágica vamos aplicar hoje?</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                {Object.values(MascotStyle).map(s => (
                  <StyleCard 
                    key={s} 
                    style={s} 
                    isSelected={state.style === s} 
                    onSelect={(style) => setState(prev => ({...prev, style}))} 
                    description={getStyleDescription(s)} 
                  />
                ))}
              </div>

              <div className="mt-12 p-8 bg-gradient-to-br from-slate-50 to-pink-50 rounded-[2.5rem] border border-white shadow-inner">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">💎</span>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">Dica Premium</h4>
                </div>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">O estilo <strong>Mini Realista</strong> é o nosso campeão de vendas por manter o rosto idêntico à foto original, perfeito para convites luxuosos.</p>
              </div>
            </section>
          </div>
        </div>

        {state.isLoading && (
          <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
             <div className="relative mb-12">
               <div className="w-32 h-32 border-[12px] border-pink-100 border-t-pink-500 rounded-full animate-spin"></div>
               <div className="absolute inset-0 flex items-center justify-center text-3xl">✨</div>
             </div>
             <p className="text-3xl font-black text-slate-800 animate-pulse tracking-tight">{LOADING_MESSAGES[loadingMsgIndex]}</p>
             <p className="text-slate-400 mt-4 font-bold uppercase tracking-widest text-sm">Aguarde alguns segundos...</p>
          </div>
        )}

        {state.generatedMascot && (
          <div id="result" className="bg-slate-900 p-12 md:p-20 rounded-[4rem] shadow-2xl text-center space-y-12 animate-in zoom-in slide-in-from-bottom-20 duration-700">
            <div className="space-y-4">
              <div className="inline-block px-4 py-2 bg-pink-500/20 text-pink-400 rounded-full text-xs font-black uppercase tracking-[0.3em] mb-2">Sucesso Total</div>
              <h2 className="text-5xl font-black text-white tracking-tight">Ficou Incrível! 🌟</h2>
              <p className="text-slate-400 font-bold text-xl">Sua obra de arte exclusiva está pronta:</p>
            </div>
            
            <div className="relative inline-block">
              <div className="absolute -inset-4 bg-gradient-to-tr from-pink-500 to-rose-500 rounded-[4.5rem] blur-2xl opacity-20 animate-pulse"></div>
              <img src={state.generatedMascot} className="max-w-xl w-full mx-auto rounded-[4rem] shadow-2xl border-8 border-white/5 relative z-10" alt="Mascote Gerado" />
              <div className="absolute -top-6 -right-6 bg-gradient-to-br from-yellow-400 to-orange-500 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-2xl animate-bounce z-20">🎨</div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-8">
              <a 
                href={state.generatedMascot} 
                download={`yu-mascote-${Date.now()}.png`} 
                className="bg-white text-slate-900 px-14 py-6 rounded-[2.5rem] font-black text-2xl hover:scale-105 transition-all flex items-center justify-center gap-4 shadow-2xl shadow-white/10"
              >
                📥 BAIXAR AGORA
              </a>
              <button 
                onClick={() => {
                  setState(prev => ({...prev, generatedMascot: null}));
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }} 
                className="bg-slate-800 text-white px-10 py-6 rounded-[2.5rem] font-black hover:bg-slate-700 transition-all text-lg"
              >
                CRIAR OUTRO
              </button>
            </div>
            <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.4em] opacity-50">Qualidade Profissional Ultra HD</p>
          </div>
        )}
      </main>
      
      <footer className="text-center py-16 opacity-30">
        <div className="flex justify-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-pink-400"></div>
          <div className="w-2 h-2 rounded-full bg-pink-400"></div>
          <div className="w-2 h-2 rounded-full bg-pink-400"></div>
        </div>
        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">© {new Date().getFullYear()} Yu Mascotes - Mascotes lindos em um clique</p>
      </footer>
    </div>
  );
};

export default App;
