import { Link } from 'react-router-dom'
import nodsystems from '../assets/nodsystems.png'
import GrowthBackground from '../components/GrowthBackground'

function Login() {
  return (
    <main className="login-page">

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

              <input
                type="password"
                placeholder="Digite sua senha"
              />
            </label>


            {/* ESQUECI MINHA SENHA */}
            <div className="forgot-password">
              <a href="#">
                Esqueci minha senha
              </a>
            </div>


            {/* BOTÃO */}
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