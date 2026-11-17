# NODSystems — Frontend

Frontend do NODSystems (React + Vite), ligado ao [backend](https://github.com/NODSystems/mercado-backend).

## Como rodar com o backend

1. Suba o backend (`npm run dev` no `mercado-backend`, porta 3333). No `.env` dele, `FRONTEND_URL` deve ser `http://localhost:5173`.
2. Aqui no frontend:

```bash
npm install
npm run dev
```

3. Abra `http://localhost:5173/login`.

O endereço da API vem de `VITE_API_URL` (copie `.env.example` para `.env.local` se precisar mudar). Sem ele, usa `http://localhost:3333`.

## O que já está ligado ao backend

| Tela | O que faz |
|------|-----------|
| Cadastro | Cria a conta e pede para confirmar o e-mail (com reenvio do link) |
| Login | Entra com cookie de sessão; avisa se o e-mail não foi confirmado |
| Minhas empresas | Lista as empresas do usuário e escolhe em qual trabalhar |
| Configurar empresa | Cadastra a empresa |
| Navbar | Nome, cargo, trocar de empresa e sair |
| Equipe | Lista funcionários e envia convites por e-mail |
| Aceitar convite | Página do link do e-mail de convite |
| Perfil | Edita o nome, troca a senha e mostra os últimos logins |

Ainda sem backend (dados de exemplo): PDV, Estoque, Financeiro, Relatórios, Visão geral (cards), recuperação de senha e foto do perfil.

Arquivos principais da integração: `src/services/api.ts` (requisições), `src/contexts/AuthContext.tsx` (usuário logado e empresa selecionada) e `src/components/RotaProtegida.tsx` (bloqueia páginas sem login).

---

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
