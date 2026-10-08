import { Link } from 'react-router-dom'
import nodsystems from '../assets/nodsystems.png'

import '../styles/Home.css'

function Home() {
  return (
    <main className="home-page">

      {/* =====================================================
          NAVBAR
         ===================================================== */}
      <header className="home-navbar">

        <img
          src={nodsystems}
          alt="NODSystems"
          className="home-logo"
        />

        <nav>
          <a href="#inicio">Início</a>
          <a href="#sobre">Sobre nós</a>
          <a href="#solucao">Solução</a>
          <a href="#funcionalidades">Funcionalidades</a>
        </nav>

        <div className="home-nav-buttons">
          <Link to="/login" className="nav-login">
            Entrar
          </Link>

          <Link to="/cadastro" className="nav-register">
            Criar conta
          </Link>
        </div>

      </header>


      {/* =====================================================
          HERO
         ===================================================== */}
      <section className="home-hero" id="inicio">

        <div className="hero-content">

          <span className="hero-tag">
            TECNOLOGIA PARA PEQUENOS NEGÓCIOS
          </span>

          <h1>
            Seu negócio.
            <br />
            <span>Mais organizado.</span>
            <br />
            Mais preparado para crescer.
          </h1>

          <p>
            A NODSystems ajuda pequenos empreendedores a
            organizar produtos, estoque, vendas e clientes
            em um único lugar.
          </p>

          <div className="hero-buttons">

            <Link to="/cadastro" className="hero-primary">
              Começar agora
            </Link>

            <a href="#sobre" className="hero-secondary">
              Conheça nossa ideia →
            </a>

          </div>

        </div>


        {/* =================================================
            VISUAL DO HERO
           ================================================= */}
        <div className="hero-visual">

          <div className="hero-glow"></div>

          <div className="growth-chart">

            <div className="chart-grid"></div>

            <svg
              viewBox="0 0 500 350"
              preserveAspectRatio="none"
            >
              <polyline
                points="
                  20,300
                  80,270
                  120,285
                  175,220
                  220,240
                  275,175
                  320,195
                  375,115
                  420,135
                  480,45
                "
              />
            </svg>

            <span className="chart-point cp-1"></span>
            <span className="chart-point cp-2"></span>
            <span className="chart-point cp-3"></span>
            <span className="chart-point cp-4"></span>
            <span className="chart-point cp-5"></span>

            <div className="chart-label">
              <strong>Crescimento</strong>
              <span>+ organização</span>
            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          SOBRE A IDEIA
         ===================================================== */}
      <section className="home-section about-section" id="sobre">

        <div className="section-label">
          NOSSA HISTÓRIA
        </div>

        <div className="about-grid">

          <div className="about-title">

            <h2>
              Uma ideia criada
              <span> para fazer diferença.</span>
            </h2>

          </div>


          <div className="about-text">

            <p>
              A NODSystems nasceu da união de
              <strong> cinco alunos</strong> com uma
              ideia em comum: utilizar a tecnologia
              para solucionar problemas reais.
            </p>

            <p>
              Ao observar a rotina de pequenos
              empreendedores, percebemos que muitas
              atividades ainda podem depender de
              controles manuais, informações espalhadas
              e processos pouco organizados.
            </p>

            <div className="idea-question">
              <span>“</span>

              <p>
                Como podemos utilizar a tecnologia
                para facilitar a organização de
                pequenos negócios?
              </p>

              <span>”</span>
            </div>

            <p>
              Foi a partir dessa pergunta que surgiu
              a NODSystems.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          PROBLEMA
         ===================================================== */}
      <section className="problem-section">

        <div className="problem-content">

          <div className="section-label light">
            O DESAFIO
          </div>

          <h2>
            Quando a organização
            <span> vira um problema.</span>
          </h2>

          <p>
            Pequenos negócios lidam diariamente com
            produtos, estoque, vendas e clientes.
            Quando essas informações ficam espalhadas,
            acompanhar tudo pode se tornar mais difícil.
          </p>

        </div>


        <div className="problem-cards">

          <div className="problem-card">
            <span>01</span>
            <h3>Informações espalhadas</h3>
            <p>
              Dados importantes podem ficar divididos
              entre diferentes controles.
            </p>
          </div>

          <div className="problem-card">
            <span>02</span>
            <h3>Processos manuais</h3>
            <p>
              Tarefas repetitivas podem consumir
              tempo durante a rotina.
            </p>
          </div>

          <div className="problem-card">
            <span>03</span>
            <h3>Falta de organização</h3>
            <p>
              Encontrar informações rapidamente pode
              se tornar um desafio.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================================
          SOLUÇÃO
         ===================================================== */}
      <section
        className="home-section solution-section"
        id="solucao"
      >

        <div className="section-heading">

          <div>
            <div className="section-label">
              NOSSA SOLUÇÃO
            </div>

            <h2>
              Tudo em um só lugar.
            </h2>
          </div>

          <p>
            A NODSystems foi pensada para centralizar
            informações importantes do negócio em uma
            plataforma simples e acessível.
          </p>

        </div>


        {/* =================================================
            FUNCIONALIDADES
           ================================================= */}
        <div
          className="feature-grid"
          id="funcionalidades"
        >

          <div className="feature-card">

            <div className="feature-icon blue">
              📦
            </div>

            <h3>Produtos</h3>

            <p>
              Cadastre e organize os produtos
              da sua empresa.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon green">
              📊
            </div>

            <h3>Estoque</h3>

            <p>
              Acompanhe entradas, saídas e
              quantidades disponíveis.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon purple">
              💰
            </div>

            <h3>Vendas</h3>

            <p>
              Organize as movimentações e
              informações das vendas.
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon cyan">
              👥
            </div>

            <h3>Clientes</h3>

            <p>
              Mantenha as informações dos
              seus clientes organizadas.
            </p>

          </div>

        </div>

      </section>


      {/* =====================================================
          DIFERENCIAL
         ===================================================== */}
      <section className="simplicity-section">

        <div className="simplicity-glow"></div>

        <div className="simplicity-content">

          <div className="section-label light">
            NOSSO DIFERENCIAL
          </div>

          <h2>
            Simples por escolha.
          </h2>

          <p>
            A tecnologia não deveria ser mais uma
            dificuldade para quem empreende.
          </p>

          <p>
            Por isso, a NODSystems foi pensada para
            ser <strong>simples, organizada e fácil
            de utilizar.</strong>
          </p>

        </div>

      </section>


      {/* =====================================================
          COMO FUNCIONA
         ===================================================== */}
      <section className="home-section process-section">

        <div className="section-label">
          COMO FUNCIONA
        </div>

        <h2>
          Do primeiro acesso ao controle do seu negócio.
        </h2>


        <div className="process-grid">

          <div className="process-item">
            <span>01</span>
            <h3>Conheça</h3>
            <p>
              Conheça a proposta da NODSystems.
            </p>
          </div>

          <div className="process-line"></div>

          <div className="process-item">
            <span>02</span>
            <h3>Cadastre-se</h3>
            <p>
              Crie sua conta de maneira simples.
            </p>
          </div>

          <div className="process-line"></div>

          <div className="process-item">
            <span>03</span>
            <h3>Organize</h3>
            <p>
              Cadastre seus produtos e informações.
            </p>
          </div>

          <div className="process-line"></div>

          <div className="process-item">
            <span>04</span>
            <h3>Gerencie</h3>
            <p>
              Tenha mais controle sobre seu negócio.
            </p>
          </div>

        </div>

      </section>


      {/* =====================================================
          CTA FINAL
         ===================================================== */}
      <section className="final-cta">

        <div className="final-cta-glow"></div>

        <div className="final-cta-content">

          <img
            src={nodsystems}
            alt="NODSystems"
          />

          <h2>
            Seu negócio merece uma
            <span> tecnologia que acompanhe seu crescimento.</span>
          </h2>

          <p>
            Organize. Simplifique. Cresça.
          </p>

          <Link to="/cadastro">
            Começar agora →
          </Link>

        </div>

      </section>


      {/* =====================================================
          FOOTER
         ===================================================== */}
      <footer className="home-footer">

        <img
          src={nodsystems}
          alt="NODSystems"
        />

        <p>
          © 2026 NODSystems. Tecnologia para pequenos negócios.
        </p>

      </footer>

    </main>
  )
}

export default Home