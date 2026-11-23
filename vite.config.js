import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'
import { defineConfig } from 'vite'

// https://vite.dev/config/
//
// npm run dev       -> http://localhost:5173 (uso normal no computador)
// npm run dev:rede  -> https://IP-DO-COMPUTADOR:5173, para abrir no celular
//                      na mesma rede Wi-Fi. O celular só libera a câmera em
//                      https, por isso o certificado (o navegador vai avisar
//                      que não é confiável: toque em "Avançado" e "Continuar").
//                      As chamadas vão para /api e o Vite repassa ao backend
//                      local, então o backend não precisa ficar exposto.
export default defineConfig(({ mode }) => {
  const rede = mode === 'rede'

  return {
    plugins: [react(), ...(rede ? [basicSsl()] : [])],
    server: rede
      ? {
          host: true,
          proxy: {
            '/api': {
              target: process.env.BACKEND_URL || 'http://localhost:3333',
              changeOrigin: true,
              rewrite: (caminho) => caminho.replace(/^\/api/, ''),
            },
          },
        }
      : undefined,
  }
})
