import { useState } from 'react'
import { Link } from 'react-router-dom'

import nodsystems from '../../assets/nodsystems.png'

import GrowthBackground from '../../components/GrowthBackground'

import '../../styles/usuario/Login.css'
import '../../styles/components/GrowthBackground.css'

function Login() {

  // Controla se a senha está visível ou escondida
  const [showPassword, setShowPassword] = useState(false)

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

          <form>

            {/* CAMPO DE E-MAIL */}
            <label>
              E-mail

              <input
                type="email"
                placeholder="Digite seu e-mail"
              />
            </label>


            {/* CAMPO DE SENHA */}
            <label>
              Senha

              <div className="password-field">

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
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

              <a href="#">
                Esqueci minha senha
              </a>

            </div>


            {/* BOTÃO ENTRAR */}
            <button type="submit">
              Entrar
            </button>

          </form>


          {/* CADASTRO */}
          <span className="register-link">

            Não possui uma conta?{' '}

            <Link to="/cadastro">
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