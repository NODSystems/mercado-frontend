// Configuração da Vercel para o front.
//
// BACKEND_URL (variável de ambiente no projeto da Vercel) é o endereço do
// backend, por exemplo https://mercado-backend-xyz.vercel.app
// O site chama /api/... e a Vercel repassa para o backend. Assim o login
// (cookie) fica no mesmo domínio do site e funciona também no iPhone.
import { routes, type VercelConfig } from '@vercel/config/v1'

const BACKEND_URL = (process.env.BACKEND_URL || '').trim().replace(/\/+$/, '')

if (!BACKEND_URL) {
  throw new Error(
    'Defina a variável BACKEND_URL no projeto da Vercel (Settings > Environment Variables) com o endereço do backend.',
  )
}

export const config: VercelConfig = {
  rewrites: [
    // API: repassa ao backend
    routes.rewrite('/api/:path*', `${BACKEND_URL}/:path*`),
    // Rotas do React (/pdv, /estoque...): sempre o index.html
    routes.rewrite('/(.*)', '/index.html'),
  ],
}
