import { useState } from 'react'
import { Link } from 'react-router-dom'
import nodsystems from '../../assets/nodsystems.png'
import GrowthBackground from '../../components/GrowthBackground'


import '../../styles/usuario/Cadastro.css'
import '../../styles/components/GrowthBackground.css'

function Cadastro() {

  // Controla a visibilidade da senha
  const [showPassword, setShowPassword] = useState(false)

  // Controla a visibilidade da confirmação da senha
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  return (
    <main className="login-page">

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

          <form>

            {/* CAMPO DE NOME */}
            <label>
              Nome completo

              <input
                type="text"
                placeholder="Digite seu nome completo"
              />
            </label>


            {/* CAMPO DE E-MAIL */}
            <label>
              E-mail

              <input
                type="email"
                placeholder="Digite seu e-mail"
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
                  placeholder="Digite sua senha"
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
            <button type="submit">
              Criar minha conta
            </button>

          </form>


          {/* LINK PARA LOGIN */}
          <span className="register-link">

            Já possui uma conta?{' '}

            <Link to="/login">
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