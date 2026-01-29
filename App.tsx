import React, { useState, useRef, useEffect } from 'react';
import { MascotStyle, MascotState, User, UserStatus } from './types';
import { generateMascotImage } from './services/geminiService';
import StyleCard from './components/StyleCard';

const ADMIN_EMAIL = 'admin@yumascotes.com';
const ADMIN_PASS = 'admin123';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);

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
    const users = getUsers();
    const adminExists = users.find(u => u.email === ADMIN_EMAIL);
    if (!adminExists) {
      const admin: User = { email: ADMIN_EMAIL, password: ADMIN_PASS, status: 'admin' };
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
    const newUser: User = { email: emailInput, password: passwordInput, status: 'pending' };
    saveUsers([...users, newUser]);
    setAuthMode('login');
    setAuthError('Cadastro realizado! Aguarde aprovação.');
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
    if (confirm(`Excluir ${email}?`)) {
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
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-[3rem] shadow-2xl w-full max-w-md text-center">
          <div className="w-16 h-16 bg-pink-500 rounded-2xl flex items-center justify-center text-white text-3xl font-black mx-auto mb-6">Y</div>
          <h1 className="text-2xl font-black text-slate-800 mb-6">Yu Mascotes</h1>
          <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            <input type="email" required value={emailInput} onChange={(e) => setEmailInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border outline-none" placeholder="E-mail" />
            <input type="password" required value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} className="w-full p-4 rounded-2xl bg-slate-50 border outline-none" placeholder="Senha" />
            {authError && <p className="text-xs text-red-500 font-bold">{authError}</p>}
            <button type="submit" className="w-full py-4 bg-pink-500 text-white rounded-2xl font-bold">
              {authMode === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
          </form>
          <button onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')} className="mt-6 text-pink-500 font-bold text-sm">
            {authMode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Login'}
          </button>
        </div>
      </div>
    );
  }

  if (currentUser.status === 'pending') {
    return (
      <div className="min-h-screen bg-[#fff5f8] flex items-center justify-center p-4 text-center">
        <div className="bg-white p-12 rounded-[3rem] shadow-2xl max-w-lg">
          <h2 className="text-2xl font-black mb-4">Aguardando Aprovação</h2>
          <p className="text-slate-500 mb-8">Sua conta foi criada. O administrador precisa aprovar seu acesso.</p>
          <button onClick={handleLogout} className="text-pink-500 font-bold">Sair</button>
        </div>
      </div>
    );
  }

  if (showAdminPanel && currentUser.status === 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black">Painel Administrativo</h2>
            <button onClick={() => setShowAdminPanel(false)} className="bg-pink-500 text-white px-6 py-2 rounded-full font-bold">Voltar</button>
          </div>
          <div className="bg-white rounded-3xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="p-4 font-bold text-sm">Usuário</th>
                  <th className="p-4 font-bold text-sm">Status</th>
                  <th className="p-4 font-bold text-sm text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {getUsers().filter(u => u.email !== ADMIN_EMAIL).map(u => (
                  <tr key={u.email} className="border-t">
                    <td className="p-4 text-sm">{u.email}</td>
                    <td className="p-4 text-xs font-bold uppercase">{u.status}</td>
                    <td className="p-4 text-right">
                      {u.status === 'pending' && <button onClick={() => approveUser(u.email)} className="text-green-500 font-bold mr-4">Aprovar</button>}
                      <button onClick={() => deleteUser(u.email)} className="text-red-500 font-bold">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff5f8]">
      <header className="bg-white p-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-pink-500 rounded-xl flex items-center justify-center text-white font-bold">Y</div>
          <span className="font-black text-slate-800">Yu Mascotes</span>
        </div>
        <div className="flex gap-4">
          {currentUser.status === 'admin' && <button onClick={() => setShowAdminPanel(true)} className="text-xs font-bold uppercase">Admin</button>}
          <button onClick={handleLogout} className="text-xs font-bold text-pink-500 uppercase">Sair</button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-6 space-y-8">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h2 className="font-bold mb-4">1. Envie a Foto</h2>
              <div onClick={() => fileInputRef.current?.click()} className="aspect-square bg-slate-50 border-2 border-dashed rounded-2xl flex items-center justify-center cursor-pointer overflow-hidden">
                {state.image ? <img src={state.image} className="w-full h-full object-cover" /> : <span className="text-slate-400">Clique para enviar</span>}
              </div>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleImageUpload} accept="image/*" />
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-sm">
              <h2 className="font-bold mb-4">3. Detalhes (Opcional)</h2>
              <textarea value={state.clothingDetails} onChange={(e) => setState(prev => ({...prev, clothingDetails: e.target.value}))} placeholder="Ex: Vestido rosa..." className="w-full p-4 bg-slate-50 rounded-xl text-sm h-20 outline-none" />
            </div>
            <button onClick={handleGenerate} disabled={!state.image || !state.style || state.isLoading} className="w-full py-5 bg-pink-500 text-white rounded-2xl font-black text-lg disabled:bg-slate-300">
              {state.isLoading ? 'Gerando...' : 'GERAR AGORA'}
            </button>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm">
            <h2 className="font-bold mb-6">2. Escolha o Estilo</h2>
            <div className="grid gap-4">
              {Object.values(MascotStyle).map(s => (
                <StyleCard key={s} style={s} isSelected={state.style === s} onSelect={(style) => setState(prev => ({...prev, style}))} description="" />
              ))}
            </div>
          </div>
        </div>

        {state.generatedMascot && (
          <div className="bg-white p-8 rounded-[3rem] shadow-xl text-center space-y-6">
            <img src={state.generatedMascot} className="max-w-sm mx-auto rounded-3xl shadow-lg" />
            <a href={state.generatedMascot} download="mascote.png" className="inline-block bg-pink-500 text-white px-12 py-4 rounded-2xl font-black">BAIXAR ARTE</a>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;