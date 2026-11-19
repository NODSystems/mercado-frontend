// Cálculos do relatório, usados pela tela de Relatórios e pelos
// arquivos exportados (PDF e Excel). Uma única fonte para os números:
// o que aparece na tela é exatamente o que vai para o arquivo.
import type { MovimentoFinanceiro, ProdutoEstoque, Venda } from "../data/demonstracao";
import { dataISO } from "../data/demonstracao";

export type DadosRelatorio = {
    empresa: string;
    usuario: string;
    periodoTexto: string;
    inicio: Date;
    fim: Date;
    geradoEm: Date;
    demonstracao: boolean;
    vendas: Venda[];
    movimentos: MovimentoFinanceiro[];
    estoque: ProdutoEstoque[];
    totais: {
        vendas: number;
        quantidade: number;
        itens: number;
        ticket: number;
        entradas: number;
        despesas: number;
        resultado: number;
        estoqueBaixo: number;
    };
    porDia: { data: string; total: number; quantidade: number }[];
    porPagamento: { forma: string; quantidade: number; total: number; percentual: number }[];
    topProdutos: { produto: string; quantidade: number; total: number }[];
};

const arredondar = (valor: number) => Math.round(valor * 100) / 100;

export function calcularRelatorio(params: {
    vendas: Venda[];
    movimentos: MovimentoFinanceiro[];
    estoque: ProdutoEstoque[];
    inicio: Date;
    fim: Date;
    empresa: string;
    usuario: string;
    periodoTexto: string;
    demonstracao: boolean;
}): DadosRelatorio {
    const inicioISO = dataISO(params.inicio);
    const fimISO = dataISO(params.fim);
    const noPeriodo = (data: string) => data >= inicioISO && data <= fimISO;

    const vendas = params.vendas.filter((v) => noPeriodo(v.data));
    const movimentos = params.movimentos.filter((m) => noPeriodo(m.data));

    const totalVendas = arredondar(vendas.reduce((t, v) => t + v.valor, 0));
    const entradas = arredondar(movimentos.filter((m) => m.tipo === "Entrada").reduce((t, m) => t + m.valor, 0));
    const despesas = arredondar(movimentos.filter((m) => m.tipo === "Saída").reduce((t, m) => t + m.valor, 0));

    // Um ponto por dia do período (inclusive dias sem venda)
    const porDia: DadosRelatorio["porDia"] = [];
    const cursor = new Date(params.inicio);
    cursor.setHours(12, 0, 0, 0);
    const limite = new Date(params.fim);
    limite.setHours(12, 0, 0, 0);

    while (cursor <= limite && porDia.length < 400) {
        const iso = dataISO(cursor);
        const doDia = vendas.filter((v) => v.data === iso);
        porDia.push({
            data: iso,
            total: arredondar(doDia.reduce((t, v) => t + v.valor, 0)),
            quantidade: doDia.length,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    const formas = new Map<string, { quantidade: number; total: number }>();
    const produtos = new Map<string, { quantidade: number; total: number }>();

    for (const v of vendas) {
        const f = formas.get(v.pagamento) ?? { quantidade: 0, total: 0 };
        f.quantidade += 1;
        f.total += v.valor;
        formas.set(v.pagamento, f);

        const p = produtos.get(v.produto) ?? { quantidade: 0, total: 0 };
        p.quantidade += v.quantidade;
        p.total += v.valor;
        produtos.set(v.produto, p);
    }

    return {
        empresa: params.empresa,
        usuario: params.usuario,
        periodoTexto: params.periodoTexto,
        inicio: params.inicio,
        fim: params.fim,
        geradoEm: new Date(),
        demonstracao: params.demonstracao,
        vendas: [...vendas].sort((a, b) => (a.data + a.hora).localeCompare(b.data + b.hora)),
        movimentos,
        estoque: params.estoque,
        totais: {
            vendas: totalVendas,
            quantidade: vendas.length,
            itens: vendas.reduce((t, v) => t + v.quantidade, 0),
            ticket: vendas.length ? arredondar(totalVendas / vendas.length) : 0,
            entradas,
            despesas,
            resultado: arredondar(entradas - despesas),
            estoqueBaixo: params.estoque.filter((p) => p.quantidade <= p.minimo).length,
        },
        porDia,
        porPagamento: [...formas.entries()]
            .map(([forma, f]) => ({
                forma,
                quantidade: f.quantidade,
                total: arredondar(f.total),
                percentual: totalVendas ? (f.total / totalVendas) * 100 : 0,
            }))
            .sort((a, b) => b.total - a.total),
        topProdutos: [...produtos.entries()]
            .map(([produto, p]) => ({ produto, quantidade: p.quantidade, total: arredondar(p.total) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, 5),
    };
}

// Nome do arquivo: relatorio-mercado-da-ana-2026-11-01-a-2026-11-30
export function nomeArquivo(dados: DadosRelatorio): string {
    const empresa = dados.empresa
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");

    return `relatorio-${empresa || "empresa"}-${dataISO(dados.inicio)}-a-${dataISO(dados.fim)}`;
}

export function baixarArquivo(blob: Blob, nome: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
