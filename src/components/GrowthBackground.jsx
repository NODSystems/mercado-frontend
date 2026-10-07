function GrowthBackground() {
  return (
    <div className="growth-background">

      {/* =====================================================
          FUNDO PRINCIPAL
          Essa div ocupa todo o lado direito da tela de Login.
         ===================================================== */}
      <div className="growth-bg">

        {/* ===================================================
            EFEITO DE LUZ NO FUNDO

            São manchas de luz suaves para deixar o ambiente
            com aparência mais tecnológica.
           =================================================== */}
        <div className="glow glow-1"></div>
        <div className="glow glow-2"></div>
        <div className="glow glow-3"></div>


        {/* ===================================================
            SVG DAS LINHAS DE CRESCIMENTO

            O SVG permite desenhar as linhas poligonais
            que representam crescimento.

            Exemplo da ideia:

            _/\____/\____/\/────↗
           =================================================== */}
        <svg
          className="growth-lines"
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
        >

          {/* Linha de crescimento 1 */}
          <polyline
            className="growth-line line-1"
            points="
              0,650
              100,620
              180,640
              260,570
              340,590
              430,500
              520,530
              610,400
              700,430
              790,300
              900,260
              1000,150
            "
          />

          {/* Linha de crescimento 2 */}
          <polyline
            className="growth-line line-2"
            points="
              0,720
              130,680
              220,700
              310,620
              390,650
              500,560
              590,580
              680,480
              770,500
              860,390
              1000,320
            "
          />

          {/* Linha de crescimento 3 */}
          <polyline
            className="growth-line line-3"
            points="
              0,520
              120,490
              200,510
              300,450
              380,470
              470,390
              560,410
              650,330
              750,350
              850,240
              1000,190
            "
          />

          {/* Linha mais discreta no fundo */}
          <polyline
            className="growth-line line-4"
            points="
              0,760
              150,740
              250,700
              350,710
              450,620
              550,640
              650,550
              750,520
              850,430
              1000,380
            "
          />

        </svg>


        {/* ===================================================
            PONTOS NEON

            Esses pontos ficam sobre as linhas e piscam.

            Cada um possui uma classe diferente para podermos
            controlar a velocidade de cada animação.
           =================================================== */}

        <span className="neon-point point-1"></span>
        <span className="neon-point point-2"></span>
        <span className="neon-point point-3"></span>
        <span className="neon-point point-4"></span>
        <span className="neon-point point-5"></span>
        <span className="neon-point point-6"></span>
        <span className="neon-point point-7"></span>
        <span className="neon-point point-8"></span>
        <span className="neon-point point-9"></span>


        {/* ===================================================
            CONTEÚDO DA ÁREA DIREITA

            Fica por cima das animações.
           =================================================== */}
        <div className="growth-content">

          <div className="growth-brand">
            NODSystems
          </div>

          <h2>
            Crescimento que
            <br />
            acompanha você.
          </h2>

          <p>
            Tecnologia para transformar ideias
            em resultados.
          </p>

        </div>

      </div>

    </div>
  )
}

export default GrowthBackground