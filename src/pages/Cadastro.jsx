import { Link } from 'react-router-dom'
import nodsystems from '../assets/nodsystems.png'
import GrowthBackground from '../components/GrowthBackground'

function Cadastro() {
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

          {/* Título */}
          <h1>Crie sua conta!</h1>

          {/* Descrição */}
          <p>
            Cadastre-se para começar.
          </p>


          {/* =================================================
              FORMULÁRIO
             ================================================= */}
          <form>

            {/* NOME */}
            <label>
              Nome completo

              <input
                type="text"
                placeholder="Digite seu nome completo"
              />
            </label>


            {/* E-MAIL */}
            <label>
              E-mail

              <input
                type="email"
                placeholder="Digite seu e-mail"
              />
            </label>


            {/* SENHA */}
            <label>
              Senha

              <input
                type="password"
                placeholder="Digite sua senha"
              />
            </label>


            {/* CONFIRMAÇÃO DA SENHA */}
            <label>
              Confirmar senha

              <input
                type="password"
                placeholder="Digite sua senha novamente"
              />
            </label>


            {/* BOTÃO DE CADASTRO */}
            <button type="submit">
              Criar minha conta
            </button>

          </form>


          {/* =================================================
              LINK PARA LOGIN
             ================================================= */}
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