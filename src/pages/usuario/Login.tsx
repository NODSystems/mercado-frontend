import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'

import { CHAVE_SESSAO_EXPIRADA, useAuth } from '../../contexts/AuthContext'
import { api, ApiError, mensagemDeErro } from '../../services/api'

import nodsystems from '../../assets/nodsystems.png'

import GrowthBackground from '../../components/GrowthBackground'

import '../../styles/usuario/Login.css'
import '../../styles/components/GrowthBackground.css'

function Login() {

  // Controla se a senha está visível ou escondida
  const [showPassword, setShowPassword] = useState(false)

  const { usuario, carregando, entrar } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // Página para onde voltar depois do login (ex.: aceitar convite)
  const redirect = params.get('redirect') || '/minhas-empresas'

  // Resultado do link de verificação de e-mail (?verificado=true/false)
  const verificado = params.get('verificado')

  // Caiu aqui porque a sessão expirou durante o uso?
  // (lê no início e apaga depois, para o aviso não reaparecer)
  const [sessaoExpirada] = useState(() => {
    try {
      return sessionStorage.getItem(CHAVE_SESSAO_EXPIRADA) === '1'
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      sessionStorage.removeItem(CHAVE_SESSAO_EXPIRADA)
    } catch {
      // ignora
    }
  }, [])

  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [emailNaoVerificado, setEmailNaoVerificado] = useState(false)
  const [reenvio, setReenvio] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErro('')
    setReenvio('')
    setEmailNaoVerificado(false)
    setEnviando(true)

    try {
      await entrar(email, senha)
      navigate(redirect, { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))

      // 403 = e-mail ainda não confirmado: oferece reenviar o link
      if (e instanceof ApiError && e.status === 403 && /e-mail/i.test(e.message)) {
        setEmailNaoVerificado(true)
      }
    } finally {
      setEnviando(false)
    }
  }

  async function reenviarVerificacao() {
    setReenvio('enviando')

    try {
      const resposta = await api.post<{ mensagem: string }>(
        '/auth/reenviar-verificacao',
        { email },
      )
      setReenvio(resposta.mensagem)
    } catch (e) {
      setReenvio(mensagemDeErro(e))
    }
  }

  // Já está logado: não precisa ver a tela de login
  if (!carregando && usuario) {
    return <Navigate to={redirect} replace />
  }

  // O modificador --login permite identificar a página em seu CSS.
  return (
    <main className="login-page login-page--login">

      {/* =================================================
          LADO ESQUERDO — FORMULÁRIO
         ================================================= */}
      <section className="login-form">

        {/* Logo da NODSystems */}
        <img
          src={nodsystems}
          alt="NODSystems"
          className="login-logo"
        />

        <div className="login-content">

          <h1>Bem-vindo de volta!</h1>

          <p>
            Entre na sua conta para continuar.
          </p>

          {sessaoExpirada && !erro && (
            <div className="nod-alerta nod-alerta--info" role="status">
              Sua sessão expirou ou foi encerrada. Entre novamente para continuar.
            </div>
          )}

          {verificado === 'true' && (
            <div className="nod-alerta nod-alerta--sucesso" role="status">
              E-mail confirmado! Agora é só entrar.
            </div>
          )}

          {verificado === 'false' && (
            <div className="nod-alerta nod-alerta--erro" role="alert">
              O link de confirmação é inválido ou expirou. Faça login para
              pedir um novo.
            </div>
          )}

          {erro && (
            <div className="nod-alerta nod-alerta--erro" role="alert">
              {erro}

              {emailNaoVerificado && (
                <div style={{ marginTop: 8 }}>
                  {reenvio && reenvio !== 'enviando' ? (
                    reenvio
                  ) : (
                    <button
                      type="button"
                      className="nod-link-botao"
                      onClick={reenviarVerificacao}
                      disabled={reenvio === 'enviando'}
                    >
                      {reenvio === 'enviando'
                        ? 'Enviando...'
                        : 'Reenviar e-mail de confirmação'}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* CAMPO DE E-MAIL */}
            <label>
              E-mail

              <input
                type="email"
                placeholder="Digite seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>


            {/* CAMPO DE SENHA */}
            <label>
              Senha

              <div className="password-field">

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  required
                />

                {/* Botão para mostrar/esconder a senha */}
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    /* Olho fechado */
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M3 3l18 18"
                      />
                      <path
                        d="M10.6 10.6a2 2 0 0 0 2.8 2.8"
                      />
                      <path
                        d="M9.9 5.1A10.8 10.8 0 0 1 12 4.9c5 0 8.5 4.5 9.5 6.1-.4.7-1.3 1.9-2.7 3"
                      />
                      <path
                        d="M6.2 6.2C4.5 7.3 3.4 8.8 2.5 11c1 1.7 4.5 6.1 9.5 6.1 1.1 0 2.1-.2 3-.5"
                      />
                    </svg>
                  ) : (
                    /* Olho aberto */
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r="2.5"
                      />
                    </svg>
                  )}
                </button>

              </div>
            </label>


            {/* ESQUECI MINHA SENHA */}
            <div className="forgot-password">
              <Link to="/recuperar-senha">
                Esqueci minha senha
              </Link>
            </div>


            {/* BOTÃO ENTRAR */}
            <button type="submit" disabled={enviando}>
              {enviando ? 'Entrando...' : 'Entrar'}
            </button>

          </form>


          {/* CADASTRO */}
          <span className="register-link">

            Não possui uma conta?{' '}

            <Link to={`/cadastro${params.get('redirect') ? `?redirect=${encodeURIComponent(redirect)}` : ''}`}>
              Cadastre-se
            </Link>

          </span>

        </div>

      </section>


      {/* =================================================
          LADO DIREITO — FUNDO ANIMADO
         ================================================= */}
      <section className="login-visual">

        <GrowthBackground />

      </section>

    </main>
  )
}

export default Login