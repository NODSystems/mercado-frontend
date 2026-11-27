// Produtos, estoque e vendas: consome /empresas/:empresaId/produtos e /vendas.
import { api } from "./api";

export type Unidade = "UN" | "KG" | "L" | "CX";
export type TipoMovimentacao = "ENTRADA" | "SAIDA" | "AJUSTE" | "VENDA" | "CANCELAMENTO_VENDA";
export type FormaPagamento = "DINHEIRO" | "PIX" | "DEBITO" | "CREDITO";

// O MySQL devolve DECIMAL como texto ("27.90"); converta com Number()
export type Produto = {
    id: number;
    nome: string;
    codigo_barras: string | null;
    categoria: string | null;
    unidade: Unidade;
    preco_venda: string;
    preco_custo: string | null;
    estoque_atual: string;
    estoque_minimo: string;
    ativo: number | boolean;
    data_criacao: string;
    data_atualizacao: string | null;
};

export type Movimentacao = {
    id: number;
    tipo: TipoMovimentacao;
    quantidade: string;
    estoque_anterior: string;
    estoque_posterior: string;
    custo_unitario: string | null;
    motivo: string | null;
    venda_id: number | null;
    usuario_nome: string | null;
    data_criacao: string;
};

export type ItemVenda = {
    id: number;
    produto_id: number | null;
    nome_produto: string;
    codigo_barras: string | null;
    unidade: Unidade;
    quantidade: string;
    preco_unitario: string;
    subtotal: string;
};

export type Venda = {
    id: number;
    usuario_id: number | null;
    vendedor: string | null;
    subtotal: string;
    desconto: string;
    total: string;
    forma_pagamento: FormaPagamento;
    valor_recebido: string | null;
    troco: string | null;
    status: "CONCLUIDA" | "CANCELADA";
    motivo_cancelamento: string | null;
    cancelada_em: string | null;
    data_criacao: string;
    itens: ItemVenda[];
};

export type DadosProduto = {
    nome: string;
    codigoBarras: string;
    categoria: string;
    unidade: Unidade;
    precoVenda: number;
    precoCusto: number | null;
    estoqueMinimo: number;
    estoqueInicial?: number;
};

export type ConsultaCodigo = {
    encontrado: boolean;
    codigo: string;
    nome?: string;
    marca?: string | null;
    quantidade?: string | null;
    indisponivel?: boolean;
};

export const NOMES_UNIDADE: Record<Unidade, string> = {
    UN: "Unidade",
    KG: "Quilo (kg)",
    L: "Litro (L)",
    CX: "Caixa",
};

export const NOMES_PAGAMENTO: Record<FormaPagamento, string> = {
    DINHEIRO: "Dinheiro",
    PIX: "Pix",
    DEBITO: "Cartão de débito",
    CREDITO: "Cartão de crédito",
};

// UN e CX só aceitam número inteiro; KG e L aceitam fração
export const unidadeFracionada = (u: Unidade) => u === "KG" || u === "L";

export function formatarQuantidade(valor: number | string, unidade: Unidade): string {
    const n = Number(valor);
    if (unidadeFracionada(unidade)) {
        return `${n.toLocaleString("pt-BR", { maximumFractionDigits: 3 })} ${unidade.toLowerCase()}`;
    }
    return `${n.toLocaleString("pt-BR")} ${unidade === "CX" ? "cx" : "un"}`;
}

const base = (empresaId: number) => `/empresas/${empresaId}`;

export type ItemImportacao =
    | { produtoId: number; quantidade: number; custoUnitario: number | null }
    | { nome: string; codigoBarras: string | null; categoria: string | null; unidade: Unidade; precoVenda: number; quantidade: number; custoUnitario: number | null };

export type DadosImportacao = {
    numeroNota: string;
    fornecedor: string;
    lancarDespesa: boolean;
    itens: ItemImportacao[];
};

export type ResultadoImportacao = {
    mensagem: string;
    itens: number;
    criados: number;
    atualizados: number;
    valorTotal: number;
    despesaLancada: boolean;
};

export const produtosApi = {
    listar: (empresaId: number, filtros: { busca?: string; inativos?: boolean; estoqueBaixo?: boolean } = {}) => {
        const q = new URLSearchParams();
        if (filtros.busca) q.set("busca", filtros.busca);
        if (filtros.inativos) q.set("inativos", "1");
        if (filtros.estoqueBaixo) q.set("estoqueBaixo", "1");
        const qs = q.toString();
        return api.get<{ produtos: Produto[] }>(`${base(empresaId)}/produtos${qs ? `?${qs}` : ""}`);
    },

    buscar: (empresaId: number, produtoId: number) =>
        api.get<{ produto: Produto }>(`${base(empresaId)}/produtos/${produtoId}`),

    porCodigo: (empresaId: number, codigo: string) =>
        api.get<{ produto: Produto }>(`${base(empresaId)}/produtos/codigo/${encodeURIComponent(codigo)}`),

    consultarCodigo: (empresaId: number, codigo: string) =>
        api.get<ConsultaCodigo>(`${base(empresaId)}/produtos/consulta-codigo/${encodeURIComponent(codigo)}`),

    criar: (empresaId: number, dados: DadosProduto) =>
        api.post<{ produto: Produto }>(`${base(empresaId)}/produtos`, dados),

    editar: (empresaId: number, produtoId: number, dados: DadosProduto) =>
        api.put<{ produto: Produto }>(`${base(empresaId)}/produtos/${produtoId}`, dados),

    alterarAtivo: (empresaId: number, produtoId: number, ativo: boolean) =>
        api.patch<{ produto: Produto; mensagem: string }>(`${base(empresaId)}/produtos/${produtoId}/ativo`, { ativo }),

    remover: (empresaId: number, produtoId: number) =>
        api.delete<{ apagado: boolean; mensagem: string }>(`${base(empresaId)}/produtos/${produtoId}`),

    movimentar: (
        empresaId: number,
        produtoId: number,
        dados: { tipo: "ENTRADA" | "SAIDA" | "AJUSTE"; quantidade: number; custoUnitario?: number | null; motivo?: string },
    ) => api.post<{ mensagem: string }>(`${base(empresaId)}/produtos/${produtoId}/movimentacoes`, dados),

    importarNota: (empresaId: number, dados: DadosImportacao) =>
        api.post<ResultadoImportacao>(`${base(empresaId)}/produtos/importar-nota`, dados),

    movimentacoes: (empresaId: number, produtoId: number) =>
        api.get<{ movimentacoes: Movimentacao[] }>(`${base(empresaId)}/produtos/${produtoId}/movimentacoes`),
};

export const vendasApi = {
    registrar: (
        empresaId: number,
        dados: {
            itens: { produtoId: number; quantidade: number }[];
            formaPagamento: FormaPagamento;
            desconto?: number;
            valorRecebido?: number;
        },
    ) => api.post<{ venda: Venda }>(`${base(empresaId)}/vendas`, dados),

    listar: (empresaId: number, filtros: { inicio?: string; fim?: string; status?: string } = {}) => {
        const q = new URLSearchParams(Object.entries(filtros).filter(([, v]) => v) as [string, string][]);
        const qs = q.toString();
        return api.get<{ vendas: Venda[] }>(`${base(empresaId)}/vendas${qs ? `?${qs}` : ""}`);
    },

    cancelar: (empresaId: number, vendaId: number, motivo: string) =>
        api.post<{ venda: Venda }>(`${base(empresaId)}/vendas/${vendaId}/cancelar`, { motivo }),
};
