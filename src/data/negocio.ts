// Dados do negócio usados na Visão Geral, Relatórios e exportações.
// Tudo vem do backend: vendas do PDV, produtos do estoque e o
// financeiro (vendas + pagamentos da equipe + lançamentos manuais).
import { api } from "../services/api";
import { produtosApi, vendasApi, type FormaPagamento, type Venda as VendaApi } from "../services/produtos";

// Uma linha por produto vendido (formato usado nos relatórios)
export type Venda = {
    vendaId: number;
    data: string; // AAAA-MM-DD
    hora: string; // HH:MM
    produto: string;
    quantidade: number;
    valor: number; // já com o desconto da venda rateado
    pagamento: "Pix" | "Dinheiro" | "Débito" | "Crédito";
};

export type MovimentoFinanceiro = {
    id: string;
    origem: "VENDAS" | "EQUIPE" | "MANUAL";
    lancamentoId: number | null;
    data: string;
    descricao: string;
    tipo: "Entrada" | "Saída";
    categoria: string;
    valor: number;
};

export type ProdutoEstoque = {
    nome: string;
    quantidade: number;
    minimo: number;
};

export const NOME_PAGAMENTO_CURTO: Record<FormaPagamento, Venda["pagamento"]> = {
    DINHEIRO: "Dinheiro",
    PIX: "Pix",
    DEBITO: "Débito",
    CREDITO: "Crédito",
};

export function dataISO(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

export function horaHHMM(data: Date): string {
    return `${String(data.getHours()).padStart(2, "0")}:${String(data.getMinutes()).padStart(2, "0")}`;
}

// Venda do PDV -> linhas por produto. O desconto é dividido entre os
// itens na proporção do valor, para a soma bater com o total da venda.
export function linhasDeVenda(vendas: VendaApi[]): Venda[] {
    const linhas: Venda[] = [];

    for (const v of vendas) {
        if (v.status !== "CONCLUIDA") continue;
        const quando = new Date(v.data_criacao);
        const subtotal = Number(v.subtotal);
        const fator = subtotal > 0 ? Number(v.total) / subtotal : 1;

        let acumulado = 0;
        v.itens.forEach((item, i) => {
            const ultimo = i === v.itens.length - 1;
            const valor = ultimo
                ? Math.round((Number(v.total) - acumulado) * 100) / 100
                : Math.round(Number(item.subtotal) * fator * 100) / 100;
            acumulado += valor;

            linhas.push({
                vendaId: v.id,
                data: dataISO(quando),
                hora: horaHHMM(quando),
                produto: item.nome_produto,
                quantidade: Number(item.quantidade),
                valor,
                pagamento: NOME_PAGAMENTO_CURTO[v.forma_pagamento],
            });
        });
    }

    return linhas;
}

export async function carregarVendas(empresaId: number, inicio: Date, fim: Date): Promise<VendaApi[]> {
    const r = await vendasApi.listar(empresaId, { inicio: dataISO(inicio), fim: dataISO(fim) });
    return r.vendas;
}

export async function carregarEstoque(empresaId: number): Promise<ProdutoEstoque[]> {
    const r = await produtosApi.listar(empresaId);
    return r.produtos.map((p) => ({
        nome: p.nome,
        quantidade: Number(p.estoque_atual),
        minimo: Number(p.estoque_minimo),
    }));
}

type MovimentoApi = {
    id: string;
    origem: "VENDAS" | "EQUIPE" | "MANUAL";
    lancamentoId: number | null;
    data: string;
    tipo: "ENTRADA" | "SAIDA";
    categoria: string;
    descricao: string;
    valor: number;
};

export async function carregarFinanceiro(empresaId: number, inicio: Date, fim: Date): Promise<MovimentoFinanceiro[]> {
    const r = await api.get<{ movimentos: MovimentoApi[] }>(
        `/empresas/${empresaId}/financeiro?inicio=${dataISO(inicio)}&fim=${dataISO(fim)}`,
    );
    return r.movimentos.map((m) => ({ ...m, tipo: m.tipo === "ENTRADA" ? "Entrada" : "Saída" }));
}

export const financeiroApi = {
    lancar: (empresaId: number, dados: { tipo: "ENTRADA" | "SAIDA"; categoria: string; descricao: string; valor: number; data: string }) =>
        api.post<{ id: number }>(`/empresas/${empresaId}/financeiro/lancamentos`, dados),
    apagar: (empresaId: number, lancamentoId: number) =>
        api.delete<{ mensagem: string }>(`/empresas/${empresaId}/financeiro/lancamentos/${lancamentoId}`),
};

// ---------------------------------------------------------------------
// Formatação compartilhada
// ---------------------------------------------------------------------

export const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (data: string) =>
    new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
