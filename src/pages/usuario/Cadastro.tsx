import { useState, type FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { api, mensagemDeErro } from '../../services/api'
import nodsystems from '../../assets/nodsystems.png'
import GrowthBackground from '../../components/GrowthBackground'


import '../../styles/usuario/Cadastro.css'
import '../../styles/components/GrowthBackground.css'

function Cadastro() {

  // Controla a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false)

  // Controla a visibilidade da confirmação da senha
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [params] = useSearchParams()
  const redirect = params.get('redirect')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [erro, setErro] = useState('')
  const [enviando, setEnviando] = useState(false)

  // Mensagem do backend depois do cadastro
  const [sucesso, setSucesso] = useState('')
  const [reenvio, setReenvio] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')

    if (senha !== confirmarSenha) {
      setErro('As senhas não conferem.')
      return
    }

    setEnviando(true)

    try {
      const resposta = await api.post<{ mensagem: string }>(
        '/auth/cadastrar',
        { nome, email, senha },
      )
      setSucesso(resposta.mensagem)
    } catch (e) {
      setErro(mensagemDeErro(e))
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

  const linkLogin = `/login${redirect ? `?redirect=${encodeURIComponent(redirect)}` : ''}`

  // Cadastro feito: pede para confirmar o e-mail
  if (sucesso) {
    return (
      <main className="login-page login-page--cadastro">
        <section className="login-form">
          <img src={nodsystems} alt="NODSystems" className="login-logo" />

          <div className="login-content">
            <h1>Confirme seu e-mail</h1>

            <div className="nod-alerta nod-alerta--sucesso" role="status">
              {sucesso}
            </div>

            <p>
              Abra o link enviado para <strong>{email}</strong> e depois
              faça login. O link expira em 30 minutos.
            </p>

            <p>
              Não recebeu?{' '}
              {reenvio && reenvio !== 'enviando' ? (
                <span>{reenvio}</span>
              ) : (
                <button
                  type="button"
                  className="nod-link-botao"
                  onClick={reenviarVerificacao}
                  disabled={reenvio === 'enviando'}
                >
                  {reenvio === 'enviando' ? 'Enviando...' : 'Reenviar e-mail'}
                </button>
              )}
            </p>

            <span className="register-link">
              <Link to={linkLogin}>Ir para o login</Link>
            </span>
          </div>
        </section>

        <section className="login-visual">
          <GrowthBackground />
        </section>
      </main>
    )
  }

  // O modificador --cadastro permite identificar a página em seu CSS.
  return (
    <main className="login-page login-page--cadastro">

      {/* =================================================
          LADO ESQUERDO — FORMULÁRIO DE CADASTRO
         ================================================= */}
      <section className="login-form">

        {/* Logo da NODSystems */}
        <img
          src={nodsystems}
          alt="NODSystems"
          className="login-logo"
        />

        <div className="login-content">

          <h1>Crie sua conta!</h1>

          <p>
            Cadastre-se para começar.
          </p>

          {erro && (
            <div className="nod-alerta nod-alerta--erro" role="alert">
              {erro}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {/* CAMPO DE NOME */}
            <label>
              Nome completo

              <input
                type="text"
                placeholder="Digite seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                autoComplete="name"
                required
              />
            </label>


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


            {/* =================================================
                CAMPO DE SENHA
               ================================================= */}
            <label>
              Senha

              <div className="password-field">

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo de 8 caracteres"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="new-password"
                  minLength={8}
                  required
                />

                {/* Botão do olho */}
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={
                    showPassword
                      ? 'Ocultar senha'
                      : 'Mostrar senha'
                  }
                >

                  {showPassword ? (

                    /* OLHO FECHADO */
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />

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

                    /* OLHO ABERTO */
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


            {/* =================================================
                CONFIRMAR SENHA
               ================================================= */}
            <label>
              Confirmar senha

              <div className="password-field">

                <input
                  type={
                    showConfirmPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Digite sua senha novamente"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  autoComplete="new-password"
                  required
                />

                {/* Botão do olho */}
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label={
                    showConfirmPassword
                      ? 'Ocultar confirmação da senha'
                      : 'Mostrar confirmação da senha'
                  }
                >

                  {showConfirmPassword ? (

                    /* OLHO FECHADO */
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path d="M3 3l18 18" />

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

                    /* OLHO ABERTO */
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


            {/* BOTÃO DE CADASTRO */}
            <button type="submit" disabled={enviando}>
              {enviando ? 'Criando conta...' : 'Criar minha conta'}
            </button>

          </form>


          {/* LINK PARA LOGIN */}
          <span className="register-link">

            Já possui uma conta?{' '}

            <Link to={linkLogin}>
              Entrar
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

export default Cadastro