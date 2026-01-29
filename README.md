
# 🎀 Yu Mascotes - Manual do Proprietário

Este é o seu gerador de mascotes profissional. Siga os passos abaixo para colocar sua empresa no ar!

## 🚀 Como colocar o site na Vercel (Passo a Passo)

### 1. No GitHub
- Crie um repositório chamado `yu-mascotes`.
- Suba todos os arquivos para lá. **Importante:** Mantenha as pastas `services/` e `components/` organizadas.

### 2. Na Vercel
- Conecte seu GitHub e importe o projeto `yu-mascotes`.
- Em **Environment Variables**, adicione:
  - **NOME:** `API_KEY`
  - **VALOR:** (Sua chave do Google)
- Clique em **Deploy**.

## 🔑 Acesso Admin
- Assim que o site abrir, use:
  - **E-mail:** `admin@yumascotes.com`
  - **Senha:** `admin123`
- No painel, você verá os clientes que se cadastraram e poderá aprová-los.

## ⚠️ Observação Importante sobre Clientes
Atualmente, o app guarda os usuários no "navegador" (LocalStorage). 
- **O que isso significa?** Se você limpar o histórico do navegador ou acessar de outro PC, os dados somem.
- **Dica:** Para um negócio real com milhares de clientes, recomendo futuramente trocarmos o LocalStorage por um Banco de Dados Real (Supabase).

Desenvolvido com ❤️ para a Yu Mascotes.
