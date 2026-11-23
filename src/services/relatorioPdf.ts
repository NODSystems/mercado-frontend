// Gera o relatório em PDF (A4, pronto para imprimir) com pdfmake.
// A biblioteca é carregada só quando a pessoa clica em "Exportar PDF",
// para não pesar o carregamento do site.
import type { Content, TDocumentDefinitions, TableCell } from "pdfmake/interfaces";

import { dataBR, dataISO, moeda } from "../data/negocio";
import { baixarArquivo, nomeArquivo, type DadosRelatorio } from "./relatorio";

// Paleta do sistema (index.css)
const COR = {
    primaria: "#2563eb",
    primariaEscura: "#1d4ed8",
    primariaClara: "#e8efff",
    texto: "#0f172a",
    secundario: "#64748b",
    borda: "#e2e8f0",
    fundo: "#f8fafc",
    verde: "#15803d",
    verdeClaro: "#e5f7ed",
    vermelho: "#b91c1c",
    vermelhoClaro: "#fee2e2",
    laranja: "#b45309",
    laranjaClaro: "#fef3c7",
};

const LARGURA_UTIL = 515; // A4 (595pt) - margens de 40pt

const dataHora = (d: Date) =>
    `${d.toLocaleDateString("pt-BR")} às ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;

// Layout de tabela: só linhas horizontais finas e listras suaves
const layoutTabela = {
    hLineWidth: (i: number, node: { table: { body: unknown[] } }) =>
        i === 0 || i === node.table.body.length ? 0 : 0.5,
    vLineWidth: () => 0,
    hLineColor: () => COR.borda,
    fillColor: (linha: number) => (linha === 0 ? COR.primaria : linha % 2 === 0 ? COR.fundo : null),
    paddingLeft: () => 8,
    paddingRight: () => 8,
    paddingTop: () => 6,
    paddingBottom: () => 6,
};

function cabecalhoTabela(titulos: { texto: string; direita?: boolean }[]): TableCell[] {
    return titulos.map((t) => ({
        text: t.texto.toUpperCase(),
        style: "th",
        alignment: t.direita ? "right" : "left",
    }));
}

function tituloSecao(titulo: string, subtitulo?: string): Content {
    return {
        margin: [0, 22, 0, 10],
        stack: [
            {
                columnGap: 0,
                columns: [
                    { width: 4, canvas: [{ type: "rect", x: 0, y: 1, w: 4, h: 15, r: 2, color: COR.primaria }] },
                    { width: "*", text: titulo, style: "h2", margin: [8, 0, 0, 0] },
                ],
            },
            ...(subtitulo ? [{ text: subtitulo, style: "legenda", margin: [12, 2, 0, 0] as [number, number, number, number] }] : []),
        ],
    };
}

// Card de indicador (número grande + rótulo)
function cardIndicador(rotulo: string, valor: string, detalhe: string, cor: string): Content {
    return {
        table: {
            widths: ["*"],
            body: [[{
                stack: [
                    { text: rotulo.toUpperCase(), style: "kpiRotulo" },
                    { text: valor, style: "kpiValor", color: cor },
                    { text: detalhe, style: "legenda" },
                ],
                margin: [10, 9, 10, 9],
            }]],
        },
        layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => COR.borda,
            vLineColor: () => COR.borda,
            paddingLeft: () => 0,
            paddingRight: () => 0,
            paddingTop: () => 0,
            paddingBottom: () => 0,
        },
    };
}

// Gráfico de barras em SVG (vetorial: fica nítido na impressão)
function graficoVendas(dados: DadosRelatorio): string {
    let pontos = dados.porDia.map((d) => ({ rotulo: d.data.slice(8, 10), total: d.total }));

    // Período longo: agrupa por semana para as barras não ficarem finas demais
    if (pontos.length > 31) {
        const semanas: { rotulo: string; total: number }[] = [];
        for (let i = 0; i < dados.porDia.length; i += 7) {
            const grupo = dados.porDia.slice(i, i + 7);
            semanas.push({
                rotulo: `${grupo[0].data.slice(8, 10)}/${grupo[0].data.slice(5, 7)}`,
                total: grupo.reduce((t, d) => t + d.total, 0),
            });
        }
        pontos = semanas;
    }

    const largura = LARGURA_UTIL;
    const altura = 170;
    const topo = 14;
    const base = altura - 22;
    const esquerda = 44;
    const areaAltura = base - topo;
    const areaLargura = largura - esquerda - 4;

    const maior = Math.max(...pontos.map((p) => p.total), 1);
    // Escala "redonda" (ex.: 0, 150, 300, 450)
    const passo = Math.pow(10, Math.floor(Math.log10(maior / 3)));
    const divisao = Math.ceil(maior / 3 / passo) * passo;
    const teto = divisao * 3;

    const slot = areaLargura / Math.max(pontos.length, 1);
    const barra = Math.min(slot * 0.62, 34);
    const mostrarCada = pontos.length > 20 ? 2 : 1;

    let svg = `<svg width="${largura}" height="${altura}" viewBox="0 0 ${largura} ${altura}" xmlns="http://www.w3.org/2000/svg">`;

    for (let i = 0; i <= 3; i++) {
        const y = base - (areaAltura * i) / 3;
        svg += `<line x1="${esquerda}" y1="${y}" x2="${largura}" y2="${y}" stroke="${COR.borda}" stroke-width="0.6"/>`;
        svg += `<text x="${esquerda - 6}" y="${y + 3}" font-size="7" fill="${COR.secundario}" text-anchor="end">${(divisao * i).toLocaleString("pt-BR")}</text>`;
    }

    pontos.forEach((p, i) => {
        const h = teto ? (p.total / teto) * areaAltura : 0;
        const x = esquerda + slot * i + (slot - barra) / 2;
        const ultima = i === pontos.length - 1;
        svg += `<rect x="${x}" y="${base - h}" width="${barra}" height="${Math.max(h, 0.5)}" rx="2" fill="${ultima ? COR.primaria : "#93b4f5"}"/>`;
        if (i % mostrarCada === 0 || ultima) {
            svg += `<text x="${x + barra / 2}" y="${base + 12}" font-size="7" fill="${COR.secundario}" text-anchor="middle">${p.rotulo}</text>`;
        }
    });

    svg += `</svg>`;
    return svg;
}

function montarDocumento(dados: DadosRelatorio): TDocumentDefinitions {
    const t = dados.totais;

    const pagamentos: TableCell[][] = [
        cabecalhoTabela([{ texto: "Forma" }, { texto: "Vendas", direita: true }, { texto: "Participação", direita: true }, { texto: "Total", direita: true }]),
        ...dados.porPagamento.map((p) => [
            p.forma,
            { text: String(p.quantidade), alignment: "right" as const },
            { text: `${p.percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`, alignment: "right" as const },
            { text: moeda(p.total), alignment: "right" as const, bold: true },
        ]),
    ];

    const top: TableCell[][] = [
        cabecalhoTabela([{ texto: "#" }, { texto: "Produto" }, { texto: "Qtd.", direita: true }, { texto: "Total", direita: true }]),
        ...dados.topProdutos.map((p, i) => [
            { text: String(i + 1), color: COR.secundario },
            p.produto,
            { text: String(p.quantidade), alignment: "right" as const },
            { text: moeda(p.total), alignment: "right" as const, bold: true },
        ]),
    ];

    const estoque: TableCell[][] = [
        cabecalhoTabela([{ texto: "Produto" }, { texto: "Em estoque", direita: true }, { texto: "Mínimo", direita: true }, { texto: "Situação" }]),
        ...dados.estoque.map((p) => {
            const baixo = p.quantidade <= p.minimo;
            return [
                p.nome,
                { text: `${p.quantidade} un.`, alignment: "right" as const, bold: baixo, color: baixo ? COR.vermelho : COR.texto },
                { text: `${p.minimo} un.`, alignment: "right" as const, color: COR.secundario },
                {
                    text: baixo ? "  Repor  " : "  Normal  ",
                    fontSize: 7.5,
                    bold: true,
                    color: baixo ? COR.vermelho : COR.verde,
                    background: baixo ? COR.vermelhoClaro : COR.verdeClaro,
                },
            ];
        }),
    ];

    const financeiro: TableCell[][] = [
        cabecalhoTabela([{ texto: "Data" }, { texto: "Descrição" }, { texto: "Categoria" }, { texto: "Valor", direita: true }]),
        ...dados.movimentos.map((m) => [
            dataBR(m.data),
            m.descricao,
            { text: m.categoria, color: COR.secundario },
            {
                text: `${m.tipo === "Saída" ? "− " : "+ "}${moeda(m.valor)}`,
                alignment: "right" as const,
                color: m.tipo === "Saída" ? COR.vermelho : COR.verde,
                bold: true,
            },
        ]),
        [
            { text: "Resultado do período", colSpan: 3, bold: true, fillColor: COR.primariaClara },
            {},
            {},
            {
                text: moeda(t.resultado),
                alignment: "right" as const,
                bold: true,
                fillColor: COR.primariaClara,
                color: t.resultado < 0 ? COR.vermelho : COR.primariaEscura,
            },
        ],
    ];

    // Resumo por dia: para imprimir é mais útil que listar cada venda
    // (a lista completa, venda por venda, vai no Excel)
    const diasComVenda = dados.porDia.filter((d) => d.quantidade > 0);
    const porDia: TableCell[][] = [
        cabecalhoTabela([{ texto: "Data" }, { texto: "Dia" }, { texto: "Vendas", direita: true }, { texto: "Ticket médio", direita: true }, { texto: "Total", direita: true }]),
        ...diasComVenda.map((d) => {
            const semana = new Date(`${d.data}T12:00:00`).toLocaleDateString("pt-BR", { weekday: "long" });
            return [
                dataBR(d.data),
                { text: semana.charAt(0).toUpperCase() + semana.slice(1), color: COR.secundario },
                { text: String(d.quantidade), alignment: "right" as const },
                { text: moeda(d.total / d.quantidade), alignment: "right" as const, color: COR.secundario },
                { text: moeda(d.total), alignment: "right" as const, bold: true },
            ];
        }),
        [
            { text: `Total (${t.quantidade} vendas)`, colSpan: 2, bold: true, fillColor: COR.primariaClara },
            {},
            { text: String(t.quantidade), alignment: "right" as const, bold: true, fillColor: COR.primariaClara },
            { text: moeda(t.ticket), alignment: "right" as const, bold: true, fillColor: COR.primariaClara },
            { text: moeda(t.vendas), alignment: "right" as const, bold: true, fillColor: COR.primariaClara, color: COR.primariaEscura },
        ],
    ];

    const semVendas: Content = { text: "Nenhuma venda no período.", style: "legenda", margin: [0, 4, 0, 0] };

    return {
        pageSize: "A4",
        pageMargins: [40, 64, 40, 54],
        info: {
            title: `Relatório gerencial - ${dados.empresa}`,
            author: dados.usuario,
            subject: `Período: ${dados.periodoTexto}`,
            creator: "NODSystems",
        },
        defaultStyle: { font: "Roboto", fontSize: 8.5, color: COR.texto, lineHeight: 1.15 },

        // Faixa azul no topo da 1ª página; cabeçalho discreto nas demais
        background: (paginaAtual: number) =>
            paginaAtual === 1
                ? {
                    canvas: [
                        { type: "rect", x: 0, y: 0, w: 595.28, h: 150, color: COR.primaria },
                        { type: "rect", x: 0, y: 146, w: 595.28, h: 4, color: COR.primariaEscura },
                    ],
                }
                : "",

        header: (paginaAtual: number) =>
            paginaAtual === 1
                ? ""
                : {
                    margin: [40, 26, 40, 0],
                    columns: [
                        { text: [{ text: "NOD", bold: true, color: COR.primaria }, { text: "Systems", color: COR.primaria }, { text: `   ·   Relatório gerencial · ${dados.empresa}`, color: COR.secundario }], fontSize: 8 },
                        { text: dados.periodoTexto, alignment: "right", fontSize: 8, color: COR.secundario },
                    ],
                },

        footer: (paginaAtual: number, totalPaginas: number) => ({
            margin: [40, 16, 40, 0],
            stack: [
                { canvas: [{ type: "line", x1: 0, y1: 0, x2: LARGURA_UTIL, y2: 0, lineWidth: 0.5, lineColor: COR.borda }] },
                {
                    margin: [0, 6, 0, 0],
                    columns: [
                        { text: `Gerado por ${dados.usuario} em ${dataHora(dados.geradoEm)} · NODSystems`, fontSize: 7, color: COR.secundario },
                        { text: `Página ${paginaAtual} de ${totalPaginas}`, alignment: "right", fontSize: 7, color: COR.secundario },
                    ],
                },
            ],
        }),

        content: [
            // ---------- Capa (sobre a faixa azul) ----------
            {
                margin: [0, -30, 0, 0],
                columns: [
                    {
                        width: "*",
                        stack: [
                            { text: [{ text: "NOD", bold: true }, { text: "Systems" }], color: "#ffffff", fontSize: 11, opacity: 0.9 },
                            { text: "Relatório gerencial", color: "#ffffff", fontSize: 22, bold: true, margin: [0, 10, 0, 2] },
                            { text: dados.empresa, color: "#dbe7ff", fontSize: 12 },
                        ],
                    },
                    {
                        width: 170,
                        alignment: "right",
                        stack: [
                            { text: "PERÍODO", color: "#bcd0fb", fontSize: 7, bold: true, characterSpacing: 0.8, margin: [0, 18, 0, 2] },
                            { text: dados.periodoTexto, color: "#ffffff", fontSize: 10.5, bold: true },
                            { text: `${dataBR(dataISO(dados.inicio))} a ${dataBR(dataISO(dados.fim))}`, color: "#dbe7ff", fontSize: 8.5, margin: [0, 2, 0, 0] },
                        ],
                    },
                ],
            },

            ...(dados.demonstracao
                ? [{
                    margin: [0, 44, 0, 0] as [number, number, number, number],
                    table: {
                        widths: ["*"],
                        body: [[{
                            text: [
                                { text: "Dados de demonstração. ", bold: true },
                                "Vendas, estoque e financeiro ainda não vêm do sistema real.",
                            ],
                            fontSize: 7.5,
                            color: COR.laranja,
                            fillColor: COR.laranjaClaro,
                            margin: [8, 5, 8, 5],
                        }]],
                    },
                    layout: "noBorders",
                } as Content]
                : [{ text: "", margin: [0, 44, 0, 0] as [number, number, number, number] }]),

            // ---------- Indicadores ----------
            {
                margin: [0, 14, 0, 0],
                columns: [
                    cardIndicador("Total vendido", moeda(t.vendas), `${t.quantidade} vendas · ${t.itens} itens`, COR.primariaEscura),
                    cardIndicador("Ticket médio", moeda(t.ticket), "por venda", COR.texto),
                    cardIndicador("Despesas", moeda(t.despesas), "saídas do período", COR.vermelho),
                    cardIndicador("Resultado", moeda(t.resultado), "entradas − despesas", t.resultado < 0 ? COR.vermelho : COR.verde),
                ],
                columnGap: 8,
            },

            // ---------- Gráfico ----------
            tituloSecao("Vendas no período", dados.porDia.length > 31 ? "Total por semana (R$)" : "Total por dia (R$)"),
            { svg: graficoVendas(dados), width: LARGURA_UTIL },

            // ---------- Pagamento + Top produtos ----------
            {
                unbreakable: true,
                columns: [
                    {
                        width: "*",
                        stack: [
                            tituloSecao("Formas de pagamento"),
                            dados.porPagamento.length
                                ? { table: { headerRows: 1, widths: ["*", "auto", "auto", "auto"], body: pagamentos }, layout: layoutTabela }
                                : semVendas,
                        ],
                    },
                    {
                        width: "*",
                        stack: [
                            tituloSecao("Mais vendidos"),
                            dados.topProdutos.length
                                ? { table: { headerRows: 1, widths: ["auto", "*", "auto", "auto"], body: top }, layout: layoutTabela }
                                : semVendas,
                        ],
                    },
                ],
                columnGap: 16,
            },

            // ---------- Estoque (não quebra no meio da tabela) ----------
            {
                unbreakable: true,
                stack: [
                    tituloSecao("Situação do estoque", `${t.estoqueBaixo} de ${dados.estoque.length} produtos precisam de reposição`),
                    { table: { headerRows: 1, widths: ["*", 70, 60, 60], body: estoque }, layout: layoutTabela },
                ],
            },

            // ---------- Financeiro ----------
            tituloSecao("Movimentações financeiras", `Entradas ${moeda(t.entradas)} · Despesas ${moeda(t.despesas)}`),
            dados.movimentos.length
                ? { table: { headerRows: 1, dontBreakRows: true, widths: [60, "*", 90, 90], body: financeiro }, layout: layoutTabela }
                : { text: "Nenhuma movimentação no período.", style: "legenda" },

            // ---------- Vendas por dia ----------
            tituloSecao("Vendas por dia", "A lista completa, venda por venda, está no Excel"),
            diasComVenda.length
                ? { table: { headerRows: 1, dontBreakRows: true, widths: [62, "*", 60, 80, 90], body: porDia }, layout: layoutTabela }
                : semVendas,
        ],

        styles: {
            h2: { fontSize: 12, bold: true, color: COR.texto },
            legenda: { fontSize: 7.5, color: COR.secundario },
            th: { fontSize: 7, bold: true, color: "#ffffff", characterSpacing: 0.4 },
            kpiRotulo: { fontSize: 6.5, bold: true, color: COR.secundario, characterSpacing: 0.5 },
            kpiValor: { fontSize: 14, bold: true, margin: [0, 4, 0, 2] },
        },
    };
}

export async function exportarPdf(dados: DadosRelatorio): Promise<void> {
    const [modulo, fontes] = await Promise.all([
        import("pdfmake/build/pdfmake"),
        import("pdfmake/build/vfs_fonts"),
    ]);

    const pdfMake = ((modulo as unknown as { default?: typeof modulo }).default ?? modulo) as typeof modulo;
    const vfs = ((fontes as unknown as { default?: unknown }).default ?? fontes) as Parameters<typeof pdfMake.addVirtualFileSystem>[0];

    pdfMake.addVirtualFileSystem(vfs);

    const blob = await pdfMake.createPdf(montarDocumento(dados)).getBlob();
    baixarArquivo(blob, `${nomeArquivo(dados)}.pdf`);
}
