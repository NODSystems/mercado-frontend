import { useState } from 'react'
import { Link } from 'react-router-dom'

import nodsystems from '../../assets/nodsystems.png'
import GrowthBackground from '../../components/GrowthBackground'

import '../../styles/usuario/Login.css'
import '../../styles/components/GrowthBackground.css'

function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviado, setEnviado] = useState(false)

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // Demonstração visual: o envio real depende do backend.
    setEnviado(true)
  }

  return (
    <main className="login-page login-page--login">
      <section className="login-form">
        <img
          src={nodsystems}
          alt="NODSystems"
          className="login-logo"
        />

        <div className="login-content">
          {enviado ? (
            <>
              <h1>Verifique seu e-mail</h1>

              <p>
                Se existir uma conta associada a esse endereço,
                você receberá instruções para recuperar sua senha.
              </p>

              <Link to="/login">
                Voltar para o login
              </Link>
            </>
          ) : (
            <>
              <h1>Esqueceu sua senha?</h1>

              <p>
                Informe seu e-mail cadastrado para iniciar
                a recuperação da sua conta.
              </p>

              <form onSubmit={handleSubmit}>
                <label>
                  E-mail

                  <input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    required
                  />
                </label>

                <button type="submit">
                  Recuperar senha
                </button>
              </form>

              <span className="register-link">
                Lembrou sua senha?{' '}
                <Link to="/login">Voltar para o login</Link>
              </span>
            </>
          )}
        </div>
      </section>

      <section className="login-visual">
        <GrowthBackground />
      </section>
    </main>
  )
}

export default RecuperarSenha