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

## Abrir no celular (câmera para ler código de barras)

O celular só libera a câmera em sites `https`. Com o computador e o celular **na mesma rede Wi-Fi**:

```bash
npm run dev:rede
```

1. O Vite mostra o endereço da rede, por exemplo `https://192.168.0.15:5173`. Abra esse endereço no celular.
2. O navegador avisa que o certificado não é confiável. Toque em **Avançado → Continuar**. O certificado é de desenvolvimento.
3. As chamadas à API passam pelo próprio Vite (`/api` → `http://localhost:3333`). O backend continua rodando normalmente no computador.

No computador, `npm run dev` (http://localhost:5173) também libera a webcam.

## Telas

Todas usam dados do backend.

| Tela | O que faz |
|------|-----------|
| Cadastro e login | Conta com confirmação de e-mail; sessão por cookie |
| Minhas empresas | Escolhe em qual empresa trabalhar |
| Visão Geral | Vendas de hoje e do mês, gráfico da semana, estoque baixo, convites pendentes e últimas vendas |
| PDV | Venda por leitor USB, câmera ou busca; produto por peso; desconto, troco; cancelamento com devolução ao estoque |
| Estoque | Cadastro pelo código de barras (câmera, leitor ou digitado), entradas, saídas, ajustes e histórico |
| Financeiro | Vendas e salários entram sozinhos; lançamentos manuais de contas e compras |
| Relatórios | Indicadores do período e exportação em PDF e Excel |
| Equipe | Convites, cargos, permissões, inativação e pagamentos |
| Perfil | Nome, senha e últimos logins |

Cada cargo vê só o que pode usar:
- **Vendedor:** PDV e as próprias vendas.
- **Estoquista:** movimenta o estoque, mas não cadastra produtos.
- **Gerente:** quase tudo, exceto pagar e remover funcionários.

## Publicar na Vercel

Publique primeiro o backend (veja o README do `mercado-backend`) e anote o endereço dele.

1. Em https://vercel.com: **Add New → Project** e importe este repositório. A Vercel reconhece o Vite sozinha.
2. Em **Environment Variables**, adicione `BACKEND_URL` com o endereço do backend, por exemplo `https://mercado-backend-xyz.vercel.app`.
3. Clique em **Deploy**.

O `vercel.ts` faz duas coisas:
- repassa `/api/...` para o `BACKEND_URL`. O login fica no mesmo domínio do site e funciona até no iPhone;
- devolve o `index.html` para as rotas do React (`/pdv`, `/estoque`...).

Sem o `BACKEND_URL`, o deploy falha com uma mensagem explicando o que falta.

O site da Vercel é `https`, então a câmera do celular funciona direto.

## Dados para apresentação

No backend, `npm run demo` cria o "Mercado Demonstração", com 30 dias de vendas fictícias. Senha de todas as contas: `demo12345`.
- `dono@demo.nod`
- `gerente@demo.nod`
- `vendedor@demo.nod`
- `estoque@demo.nod`

Arquivos principais da integração: `src/services/api.ts` (requisições), `src/services/produtos.ts` e `src/data/negocio.ts` (produtos, vendas e financeiro), `src/contexts/AuthContext.tsx` (usuário logado e empresa selecionada) e `src/components/RotaProtegida.tsx` (bloqueia páginas sem login).

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
