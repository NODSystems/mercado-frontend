// Gera o relatório em Excel formatado (cores, R$, datas de verdade,
// filtros, cabeçalho congelado, totais com fórmula e pronto para
// imprimir). Antes era um "despejo" sem formatação feito com o pacote
// xlsx, que não permite estilos na versão gratuita.
import type { Workbook, Worksheet } from "exceljs";

import { dataBR, dataISO } from "../data/demonstracao";
import { baixarArquivo, nomeArquivo, type DadosRelatorio } from "./relatorio";

const AZUL = "FF2563EB";
const AZUL_ESCURO = "FF1D4ED8";
const AZUL_CLARO = "FFE8EFFF";
const CINZA_LISTRA = "FFF8FAFC";
const CINZA_TEXTO = "FF64748B";
const BORDA = "FFE2E8F0";
const VERDE = "FF15803D";
const VERDE_CLARO = "FFE5F7ED";
const VERMELHO = "FFB91C1C";
const VERMELHO_CLARO = "FFFEE2E2";

const FORMATO_MOEDA = '"R$" #,##0.00;[Red]-"R$" #,##0.00';
const FORMATO_DATA = "dd/mm/yyyy";

// "2026-11-05" → Date local (sem deslocar o dia pelo fuso)
const paraData = (iso: string) => {
    const [a, m, d] = iso.split("-").map(Number);
    return new Date(Date.UTC(a, m - 1, d));
};

const bordaFina = { style: "thin" as const, color: { argb: BORDA } };

// Título da aba (faixa azul) + linha com empresa e período
function cabecalhoAba(aba: Worksheet, titulo: string, colunas: number, dados: DadosRelatorio) {
    aba.mergeCells(1, 1, 1, colunas);
    const celulaTitulo = aba.getCell(1, 1);
    celulaTitulo.value = titulo;
    celulaTitulo.font = { name: "Calibri", size: 16, bold: true, color: { argb: "FFFFFFFF" } };
    celulaTitulo.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL } };
    celulaTitulo.alignment = { vertical: "middle", indent: 1 };
    aba.getRow(1).height = 30;

    aba.mergeCells(2, 1, 2, colunas);
    const sub = aba.getCell(2, 1);
    sub.value = `${dados.empresa}  ·  ${dados.periodoTexto} (${dataBR(dataISO(dados.inicio))} a ${dataBR(dataISO(dados.fim))})${dados.demonstracao ? "  ·  DADOS DE DEMONSTRAÇÃO" : ""}`;
    sub.font = { name: "Calibri", size: 10, color: { argb: CINZA_TEXTO } };
    sub.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_CLARO } };
    sub.alignment = { vertical: "middle", indent: 1 };
    aba.getRow(2).height = 20;
}

type Coluna = { titulo: string; largura: number; formato?: string; direita?: boolean };

// Tabela com cabeçalho azul, listras, bordas finas, filtro e congelamento
function tabela(
    aba: Worksheet,
    linhaInicial: number,
    colunas: Coluna[],
    linhas: (string | number | Date)[][],
    total?: { rotulo: string; colunasSoma: number[] },
): number {
    colunas.forEach((c, i) => {
        aba.getColumn(i + 1).width = c.largura;
    });

    const cabecalho = aba.getRow(linhaInicial);
    colunas.forEach((c, i) => {
        const celula = cabecalho.getCell(i + 1);
        celula.value = c.titulo;
        celula.font = { name: "Calibri", size: 10, bold: true, color: { argb: "FFFFFFFF" } };
        celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ESCURO } };
        celula.alignment = { vertical: "middle", horizontal: c.direita ? "right" : "left", indent: c.direita ? 0 : 1 };
        celula.border = { bottom: bordaFina };
    });
    cabecalho.height = 22;

    linhas.forEach((valores, indice) => {
        const linha = aba.getRow(linhaInicial + 1 + indice);
        valores.forEach((valor, i) => {
            const celula = linha.getCell(i + 1);
            celula.value = valor;
            celula.font = { name: "Calibri", size: 10 };
            celula.border = { bottom: bordaFina };
            celula.alignment = { vertical: "middle", horizontal: colunas[i].direita ? "right" : "left", indent: colunas[i].direita ? 0 : 1 };
            if (colunas[i].formato) celula.numFmt = colunas[i].formato!;
            if (indice % 2 === 1) {
                celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: CINZA_LISTRA } };
            }
        });
        linha.height = 18;
    });

    let ultimaLinha = linhaInicial + linhas.length;

    if (total && linhas.length > 0) {
        ultimaLinha += 1;
        const linha = aba.getRow(ultimaLinha);
        colunas.forEach((c, i) => {
            const celula = linha.getCell(i + 1);
            celula.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_CLARO } };
            celula.font = { name: "Calibri", size: 10, bold: true, color: { argb: AZUL_ESCURO } };
            celula.border = { top: { style: "medium", color: { argb: AZUL } } };
            celula.alignment = { vertical: "middle", horizontal: c.direita ? "right" : "left", indent: c.direita ? 0 : 1 };
            if (i === 0) celula.value = total.rotulo;
            if (total.colunasSoma.includes(i)) {
                const letra = aba.getColumn(i + 1).letter;
                // Fórmula: se a pessoa editar um valor, o total acompanha
                celula.value = { formula: `SUM(${letra}${linhaInicial + 1}:${letra}${linhaInicial + linhas.length})` };
                if (c.formato) celula.numFmt = c.formato;
            }
        });
        linha.height = 22;
    }

    aba.autoFilter = {
        from: { row: linhaInicial, column: 1 },
        to: { row: linhaInicial + linhas.length, column: colunas.length },
    };
    aba.views = [{ state: "frozen", ySplit: linhaInicial, showGridLines: false }];

    return ultimaLinha;
}

function configurarImpressao(aba: Worksheet, titulo: string, paisagem = false) {
    aba.pageSetup = {
        paperSize: 9, // A4
        orientation: paisagem ? "landscape" : "portrait",
        fitToPage: true,
        fitToWidth: 1,
        fitToHeight: 0,
        margins: { left: 0.4, right: 0.4, top: 0.6, bottom: 0.6, header: 0.3, footer: 0.3 },
        printTitlesRow: "4:4",
    };
    aba.headerFooter = {
        oddFooter: `&L&8NODSystems · ${titulo}&R&8Página &P de &N`,
    };
}

function abaResumo(arquivo: Workbook, dados: DadosRelatorio) {
    const aba = arquivo.addWorksheet("Resumo", { properties: { tabColor: { argb: AZUL } } });
    const t = dados.totais;

    cabecalhoAba(aba, "Relatório gerencial", 3, dados);
    aba.getColumn(1).width = 34;
    aba.getColumn(2).width = 20;
    aba.getColumn(3).width = 34;

    const indicadores: [string, number, string, string?][] = [
        ["Total vendido", t.vendas, FORMATO_MOEDA, `${t.quantidade} vendas · ${t.itens} itens`],
        ["Ticket médio", t.ticket, FORMATO_MOEDA, "por venda"],
        ["Entradas", t.entradas, FORMATO_MOEDA],
        ["Despesas", t.despesas, FORMATO_MOEDA],
        ["Resultado (entradas − despesas)", t.resultado, FORMATO_MOEDA],
        ["Produtos com estoque baixo", t.estoqueBaixo, "0", `de ${dados.estoque.length} produtos`],
    ];

    const titulo = aba.getRow(4);
    ["Indicador", "Valor", "Observação"].forEach((texto, i) => {
        const c = titulo.getCell(i + 1);
        c.value = texto;
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ESCURO } };
        c.alignment = { horizontal: i === 1 ? "right" : "left", indent: i === 1 ? 0 : 1, vertical: "middle" };
    });
    titulo.height = 22;

    indicadores.forEach(([nome, valor, formato, obs], i) => {
        const linha = aba.getRow(5 + i);
        linha.height = 24;
        const destaque = nome.startsWith("Resultado");

        const a = linha.getCell(1);
        a.value = nome;
        a.font = { size: 11, bold: destaque };
        a.alignment = { vertical: "middle", indent: 1 };

        const b = linha.getCell(2);
        b.value = valor;
        b.numFmt = formato;
        b.alignment = { vertical: "middle", horizontal: "right" };
        b.font = {
            size: 12,
            bold: true,
            color: { argb: destaque ? (valor < 0 ? VERMELHO : VERDE) : nome === "Despesas" ? VERMELHO : AZUL_ESCURO },
        };

        const c = linha.getCell(3);
        c.value = obs ?? "";
        c.font = { size: 9, color: { argb: CINZA_TEXTO } };
        c.alignment = { vertical: "middle", indent: 1 };

        [a, b, c].forEach((cel) => {
            cel.border = { bottom: bordaFina };
            if (destaque) cel.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_CLARO } };
        });
    });

    const rodape = aba.getRow(13);
    aba.mergeCells(13, 1, 13, 3);
    rodape.getCell(1).value = `Gerado por ${dados.usuario} em ${dados.geradoEm.toLocaleString("pt-BR")} · NODSystems`;
    rodape.getCell(1).font = { size: 9, italic: true, color: { argb: CINZA_TEXTO } };

    aba.views = [{ showGridLines: false }];
    configurarImpressao(aba, "Resumo");
}

export async function exportarExcel(dados: DadosRelatorio): Promise<void> {
    const modulo = await import("exceljs");
    const ExcelJS = ((modulo as unknown as { default?: typeof modulo }).default ?? modulo) as typeof modulo;

    const arquivo = new ExcelJS.Workbook();
    arquivo.creator = dados.usuario;
    arquivo.company = dados.empresa;
    arquivo.title = `Relatório gerencial - ${dados.empresa}`;
    arquivo.created = dados.geradoEm;

    // ---------- Resumo ----------
    abaResumo(arquivo, dados);

    // ---------- Vendas ----------
    const vendas = arquivo.addWorksheet("Vendas", { properties: { tabColor: { argb: "FF22C55E" } } });
    cabecalhoAba(vendas, "Vendas", 6, dados);
    tabela(
        vendas,
        4,
        [
            { titulo: "Data", largura: 13, formato: FORMATO_DATA },
            { titulo: "Hora", largura: 9 },
            { titulo: "Produto", largura: 30 },
            { titulo: "Quantidade", largura: 13, direita: true, formato: "0" },
            { titulo: "Pagamento", largura: 14 },
            { titulo: "Valor", largura: 16, direita: true, formato: FORMATO_MOEDA },
        ],
        dados.vendas.map((v) => [paraData(v.data), v.hora, v.produto, v.quantidade, v.pagamento, v.valor]),
        { rotulo: "Total", colunasSoma: [3, 5] },
    );
    configurarImpressao(vendas, "Vendas");

    // ---------- Produtos mais vendidos e formas de pagamento ----------
    const analise = arquivo.addWorksheet("Análise", { properties: { tabColor: { argb: "FF7C3AED" } } });
    cabecalhoAba(analise, "Produtos e formas de pagamento", 4, dados);
    const fimProdutos = tabela(
        analise,
        4,
        [
            { titulo: "Produto", largura: 30 },
            { titulo: "Quantidade", largura: 14, direita: true, formato: "0" },
            { titulo: "Total vendido", largura: 18, direita: true, formato: FORMATO_MOEDA },
            { titulo: "Participação", largura: 14, direita: true, formato: "0.0%" },
        ],
        // Todos os produtos (não só o top 5), do que mais vendeu para o que menos vendeu
        Object.values(
            dados.vendas.reduce<Record<string, { produto: string; qtd: number; total: number }>>((acc, v) => {
                acc[v.produto] ??= { produto: v.produto, qtd: 0, total: 0 };
                acc[v.produto].qtd += v.quantidade;
                acc[v.produto].total += v.valor;
                return acc;
            }, {}),
        )
            .sort((a, b) => b.total - a.total)
            .map((p) => [p.produto, p.qtd, Math.round(p.total * 100) / 100, dados.totais.vendas ? p.total / dados.totais.vendas : 0]),
        { rotulo: "Total", colunasSoma: [1, 2] },
    );

    // Formas de pagamento logo abaixo
    const inicioPagamentos = fimProdutos + 3;
    const tituloPag = analise.getRow(inicioPagamentos - 1);
    tituloPag.getCell(1).value = "Formas de pagamento";
    tituloPag.getCell(1).font = { size: 12, bold: true, color: { argb: AZUL_ESCURO } };
    const cab = analise.getRow(inicioPagamentos);
    ["Forma", "Vendas", "Total", "Participação"].forEach((texto, i) => {
        const c = cab.getCell(i + 1);
        c.value = texto;
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: AZUL_ESCURO } };
        c.alignment = { horizontal: i === 0 ? "left" : "right", indent: i === 0 ? 1 : 0 };
    });
    dados.porPagamento.forEach((p, i) => {
        const linha = analise.getRow(inicioPagamentos + 1 + i);
        const valores: [string | number, string?][] = [[p.forma], [p.quantidade, "0"], [p.total, FORMATO_MOEDA], [p.percentual / 100, "0.0%"]];
        valores.forEach(([v, f], j) => {
            const c = linha.getCell(j + 1);
            c.value = v;
            if (f) c.numFmt = f;
            c.border = { bottom: bordaFina };
            c.alignment = { horizontal: j === 0 ? "left" : "right", indent: j === 0 ? 1 : 0 };
        });
    });
    configurarImpressao(analise, "Análise");

    // ---------- Estoque ----------
    const estoque = arquivo.addWorksheet("Estoque", { properties: { tabColor: { argb: "FFF59E0B" } } });
    cabecalhoAba(estoque, "Situação do estoque", 4, dados);
    tabela(
        estoque,
        4,
        [
            { titulo: "Produto", largura: 30 },
            { titulo: "Em estoque", largura: 14, direita: true, formato: '0" un."' },
            { titulo: "Estoque mínimo", largura: 16, direita: true, formato: '0" un."' },
            { titulo: "Situação", largura: 16 },
        ],
        dados.estoque.map((p) => [p.nome, p.quantidade, p.minimo, p.quantidade <= p.minimo ? "Repor" : "Normal"]),
    );
    // Destaca quem precisa de reposição
    dados.estoque.forEach((p, i) => {
        const situacao = estoque.getCell(5 + i, 4);
        const baixo = p.quantidade <= p.minimo;
        situacao.font = { bold: true, color: { argb: baixo ? VERMELHO : VERDE } };
        situacao.fill = { type: "pattern", pattern: "solid", fgColor: { argb: baixo ? VERMELHO_CLARO : VERDE_CLARO } };
        if (baixo) estoque.getCell(5 + i, 2).font = { bold: true, color: { argb: VERMELHO } };
    });
    configurarImpressao(estoque, "Estoque");

    // ---------- Financeiro ----------
    const financeiro = arquivo.addWorksheet("Financeiro", { properties: { tabColor: { argb: "FFEF4444" } } });
    cabecalhoAba(financeiro, "Movimentações financeiras", 5, dados);
    const linhasFin = dados.movimentos.map((m) => [
        paraData(m.data),
        m.descricao,
        m.categoria,
        m.tipo,
        m.tipo === "Saída" ? -m.valor : m.valor,
    ]);
    tabela(
        financeiro,
        4,
        [
            { titulo: "Data", largura: 13, formato: FORMATO_DATA },
            { titulo: "Descrição", largura: 30 },
            { titulo: "Categoria", largura: 18 },
            { titulo: "Tipo", largura: 12 },
            { titulo: "Valor", largura: 18, direita: true, formato: FORMATO_MOEDA },
        ],
        linhasFin,
        { rotulo: "Resultado", colunasSoma: [4] },
    );
    dados.movimentos.forEach((m, i) => {
        const tipo = financeiro.getCell(5 + i, 4);
        tipo.font = { bold: true, color: { argb: m.tipo === "Saída" ? VERMELHO : VERDE } };
        financeiro.getCell(5 + i, 5).font = { color: { argb: m.tipo === "Saída" ? VERMELHO : VERDE } };
    });
    configurarImpressao(financeiro, "Financeiro");

    // Mesma fonte em todas as células (algumas ficavam com a padrão do programa)
    arquivo.eachSheet((aba) => {
        aba.eachRow((linha) => {
            linha.eachCell((celula) => {
                celula.font = { ...celula.font, name: "Calibri", size: celula.font?.size ?? 10 };
            });
        });
    });

    const buffer = await arquivo.xlsx.writeBuffer();
    baixarArquivo(
        new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
        `${nomeArquivo(dados)}.xlsx`,
    );
}
