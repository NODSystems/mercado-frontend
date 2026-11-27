// Plano e assinatura da empresa (cobrança pelo Asaas no backend)
import { api } from "./api";

export type Plano = {
    id: number;
    nome: string;
    slug: string;
    preco: string;
    limite_usuarios: number;
    limite_produtos: number | null;
};

export type StatusAssinatura = "pendente" | "ativa" | "atrasada" | "cancelada";

export type DadosAssinatura = {
    planoAtual: { plano_id: number; plano: string; preco: string; limite_usuarios: number; limite_produtos: number | null } | null;
    assinatura: {
        id: number;
        plano_id: number;
        plano: string;
        preco: string;
        status: StatusAssinatura;
        gateway_subscription_id: string | null;
        periodo_inicio: string | null;
        periodo_fim: string | null;
        data_criacao: string;
    } | null;
    linkPagamento?: string | null;
    pagamentos: { id: number; valor: string; status: "pago" | "pendente" | "recusado" | "reembolsado"; metodo_pagamento: string | null; data_pagamento: string | null; data_criacao: string }[];
    pagamentosConfigurados: boolean;
};

export type FormaCobranca = "UNDEFINED" | "PIX" | "BOLETO" | "CREDIT_CARD";

export const NOMES_COBRANCA: Record<FormaCobranca, string> = {
    UNDEFINED: "Escolher na fatura",
    PIX: "Pix",
    BOLETO: "Boleto",
    CREDIT_CARD: "Cartão de crédito",
};

export const assinaturaApi = {
    planos: () => api.get<{ planos: Plano[] }>("/empresas/planos"),
    consultar: (empresaId: number) => api.get<DadosAssinatura>(`/empresas/${empresaId}/assinatura`),
    assinar: (empresaId: number, planoId: number, formaPagamento: FormaCobranca) =>
        api.post<{ mensagem: string; linkPagamento: string | null }>(`/empresas/${empresaId}/assinatura`, { planoId, formaPagamento }),
    cancelar: async (empresaId: number, senha: string) => {
        await api.post("/auth/reauth", { senhaAtual: senha });
        return api.delete<{ mensagem: string }>(`/empresas/${empresaId}/assinatura`);
    },
};
