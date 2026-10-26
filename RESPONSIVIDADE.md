# NODSystems — padrão de CSS e responsividade

Este projeto mantém os estilos globais em `src/index.css` e os estilos específicos em `src/styles/` ou `src/App.css`.

## Organização dos estilos

- `src/index.css`: variáveis CSS, fonte padrão, box sizing, base do documento, foco de teclado e preferência por movimento reduzido.
- `src/App.css`: estilos dos cards da tela de visão geral.
- `src/styles/usuario/`: login e cadastro.
- `src/styles/empresa/`: minhas empresas, tipo de empresa e configuração.
- `src/styles/components/`: navbar, carrossel e fundo animado.
- `src/styles/home/`: página pública inicial.

## Variáveis CSS globais

As variáveis ficam dentro de `:root` no `src/index.css`. Use-as em vez de repetir valores quando a cor ou medida tiver o mesmo significado.

Exemplos:

```css
.botao {
    color: var(--cor-superficie);
    background: var(--cor-primaria);
    border-radius: var(--raio-padrao);
    padding: var(--espaco-sm) var(--espaco-md);
}
```

Principais variáveis:

- `--cor-primaria` e `--cor-primaria-hover`: azul principal e estado hover.
- `--cor-texto` e `--cor-texto-secundario`: texto principal e secundário.
- `--cor-fundo`, `--cor-superficie` e `--cor-fundo-destaque`: superfícies.
- `--cor-borda`: bordas padrão.
- `--espaco-xs` até `--espaco-xl`: escala de espaçamentos.
- `--raio-padrao`, `--raio-card` e `--raio-grande`: arredondamentos.
- `--sombra-padrao`: sombra discreta.

Não substitua automaticamente todas as cores por uma única variável. Branco usado em texto sobre fundo escuro, por exemplo, tem um significado diferente de branco usado como fundo de cartão.

## Como a responsividade foi organizada

As media queries usam principalmente a largura e a altura disponíveis, não o nome de um dispositivo. Os valores são pontos de ajuste e não representam os únicos tamanhos suportados.

- Até `1100px`: ajustes para notebooks compactos e tablets.
- Até `1000px` ou `900px`: redução de espaços e reorganização de componentes, conforme a tela.
- Até `850px` / `800px`: empilhamento ou quebra de elementos quando duas colunas ficam apertadas.
- Até `700px` / `650px` / `600px`: ajustes para celulares e telas estreitas.
- Até `420px` / `400px` / `380px`: proteção para celulares menores.
- Até `650px` de altura: redução de espaços verticais em telas baixas, como `800×600`.

Nem toda tela precisa usar todos os pontos de quebra. O objetivo é alterar o layout quando o conteúdo deixa de caber bem.

## Resoluções para testar

No navegador, abra as ferramentas de desenvolvedor (F12), ative a simulação de dispositivo e teste pelo menos:

- `800×600`: tela compacta e baixa.
- `1024×768`: monitor/tablet em paisagem.
- `1280×720`: notebook HD.
- `1366×768`: notebook comum.
- `1920×1080`: monitor Full HD.
- `768×1024`: tablet em retrato.
- `390×844`: celular comum.
- `320×568`: celular estreito.

Teste também larguras intermediárias, arrastando a janela gradualmente. Uma tela responsiva não deve depender apenas dos tamanhos da lista.

## O que observar durante os testes

1. Nenhum texto, botão, formulário ou card deve ficar cortado.
2. Não deve existir rolagem horizontal da página sem necessidade.
3. A rolagem vertical é correta quando o conteúdo não cabe na altura disponível — especialmente em formulários longos e em `800×600`.
4. Botões e links devem continuar acessíveis por toque e teclado.
5. Menus, cards, carrosséis e formulários devem manter espaçamento legível.
6. Compare as páginas antes e depois de qualquer mudança global.

## Cuidados para futuras alterações

- Não crie regras globais para nomes genéricos como `button`, `section`, `h1` ou `.container` sem avaliar o impacto em todas as páginas.
- Prefira nomes de classes específicos da tela ou componente.
- Evite duplicar regras de `html`, `body` e `#root` nos CSS individuais; elas pertencem ao `index.css`.
- Evite mudar o `font-size` no `:hover`, pois isso desloca elementos vizinhos.
- Use `min-width: 0` em itens de `grid`/`flex` quando conteúdo comprido puder forçar a largura.
- Não use `overflow-x: hidden` como única solução para conteúdo que transborda; encontre e corrija o elemento que ultrapassa a tela.
- Depois de modificar uma variável global, revise visualmente as páginas que a utilizam.

## Nota de validação

As regras foram revisadas estaticamente e os pontos de quebra foram adicionados ao CSS. A compilação automática não pôde ser confirmada neste ambiente porque o arquivo enviado contém dependências nativas opcionais ausentes do Vite/Rolldown e do TypeScript. Depois de baixar/instalar as dependências normalmente na máquina de desenvolvimento, execute:

```bash
npm install
npm run build
npm run dev
```

A responsividade deve ser validada visualmente nas resoluções listadas acima; uma folha CSS não consegue garantir que todos os conteúdos dinâmicos se comportem corretamente sem testar a aplicação no navegador.
