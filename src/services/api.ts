// Comunicação com o backend da NODSystems.
//
// O login fica num cookie httpOnly criado pelo backend, por isso toda
// requisição vai com credentials: "include". O endereço da API vem da
// variável VITE_API_URL (arquivo .env.local); sem ela, usa localhost.

export const API_URL = (
    import.meta.env.VITE_API_URL || "http://localhost:3333"
).replace(/\/+$/, "");

export type ErroCampo = {
    campo: string;
    mensagem: string;
};

// Erro devolvido pela API, com o status HTTP e os erros por campo.
export class ApiError extends Error {
    status: number;
    erros: ErroCampo[];

    constructor(mensagem: string, status: number, erros: ErroCampo[] = []) {
        super(mensagem);
        this.status = status;
        this.erros = erros;
    }
}

type Metodo = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

// Respostas 401 do authMiddleware que significam "não está mais logado".
// (401 também é usado para senha atual errada, que NÃO desloga.)
const MENSAGENS_SESSAO_ENCERRADA = [
    "Não autenticado",
    "Sessão não encontrada",
    "Sessão encerrada",
    "Sessão expirada",
    "Usuário não encontrado",
    "Token inválido ou expirado",
];

export const EVENTO_SESSAO_ENCERRADA = "nod:sessao-encerrada";

async function requisicao<T>(
    metodo: Metodo,
    rota: string,
    corpo?: unknown,
): Promise<T> {
    let resposta: Response;

    try {
        resposta = await fetch(`${API_URL}${rota}`, {
            method: metodo,
            credentials: "include",
            headers: corpo !== undefined
                ? { "Content-Type": "application/json" }
                : undefined,
            body: corpo !== undefined ? JSON.stringify(corpo) : undefined,
        });
    } catch {
        throw new ApiError(
            "Não foi possível conectar ao servidor. Verifique se o backend está rodando.",
            0,
        );
    }

    let dados: any = null;

    try {
        dados = await resposta.json();
    } catch {
        dados = null;
    }

    if (!resposta.ok) {
        // Sessão caiu no meio do uso: avisa o AuthContext para mandar
        // a pessoa ao login em vez de mostrar erros soltos na tela.
        if (
            resposta.status === 401 &&
            rota !== "/auth/me" &&
            rota !== "/auth/login" &&
            MENSAGENS_SESSAO_ENCERRADA.includes(dados?.mensagem)
        ) {
            window.dispatchEvent(new Event(EVENTO_SESSAO_ENCERRADA));
        }

        throw new ApiError(
            dados?.mensagem || "Ocorreu um erro inesperado.",
            resposta.status,
            Array.isArray(dados?.erros) ? dados.erros : [],
        );
    }

    return dados as T;
}

export const api = {
    get: <T>(rota: string) => requisicao<T>("GET", rota),
    post: <T>(rota: string, corpo?: unknown) => requisicao<T>("POST", rota, corpo ?? {}),
    put: <T>(rota: string, corpo?: unknown) => requisicao<T>("PUT", rota, corpo ?? {}),
    patch: <T>(rota: string, corpo?: unknown) => requisicao<T>("PATCH", rota, corpo ?? {}),
    delete: <T>(rota: string) => requisicao<T>("DELETE", rota),
};

// Junta a mensagem principal com os erros por campo, para exibir na tela.
export function mensagemDeErro(erro: unknown): string {
    if (erro instanceof ApiError) {
        if (erro.erros.length > 0) {
            return erro.erros.map((e) => e.mensagem).join(" ");
        }

        return erro.message;
    }

    return "Ocorreu um erro inesperado.";
}

// ---------------------------------------------------------------------
// Tipos das respostas do backend
// ---------------------------------------------------------------------

export type Usuario = {
    id: number;
    nome: string;
    email: string;
    tipo: "ADMIN" | "DONO";
    status: boolean;
    data_criacao: string;
    data_atualizacao: string | null;
};

export type CargoNaEmpresa = "PROPRIETARIO" | "ADMINISTRADOR" | "FUNCIONARIO";

export type EmpresaResumo = {
    id: number;
    razao_social: string;
    nome_fantasia: string | null;
    status: "ATIVA" | "SUSPENSA";
    cargo: CargoNaEmpresa;
    cargo_nome: string | null;
};

export type Sessao = {
    id: string;
    created_at: string;
    expires_at: string;
    revoked_at: string | null;
    user_agent: string | null;
    atual?: boolean;
};

export type StatusFuncionario = "CONVIDADO" | "ATIVO" | "INATIVO";

export type Funcionario = {
    id: number;
    usuario_id: number | null;
    nome: string;
    email: string;
    telefone: string | null;
    cpf: string | null;
    salario: string | null;
    data_admissao: string | null;
    status: StatusFuncionario;
    cargo_id: number | null;
    cargo: string | null;
    convite_pendente_id: number | null;
};

export type TipoPagamento = "SALARIO" | "ADIANTAMENTO" | "BONUS" | "COMISSAO" | "OUTRO";

export type PagamentoFuncionario = {
    id: number;
    tipo: TipoPagamento;
    valor: string;
    referencia: string | null;
    data_pagamento: string;
    metodo_pagamento: string | null;
    observacao: string | null;
    registrado_por_nome: string | null;
};

// Formata número como moeda (R$ 1.234,56)
export function formatarMoeda(valor: number | string | null | undefined): string {
    const numero = Number(valor ?? 0);
    return numero.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Formata "2026-11-05" como "05/11/2026" sem mexer no fuso horário
export function formatarData(data: string | null | undefined): string {
    if (!data) return "—";
    const [ano, mes, dia] = data.slice(0, 10).split("-");
    return `${dia}/${mes}/${ano}`;
}

// Formata CPF: 52998224725 → 529.982.247-25
export function formatarCpf(cpf: string | null | undefined): string {
    if (!cpf) return "";
    const d = cpf.replace(/\D/g, "");
    if (d.length !== 11) return cpf;
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

// Formata telefone: 12988887777 → (12) 98888-7777
export function formatarTelefone(telefone: string | null | undefined): string {
    if (!telefone) return "";
    const d = telefone.replace(/\D/g, "");
    if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
    if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return telefone;
}

export type Cargo = {
    id: number;
    nome: string;
    descricao: string | null;
};

// Nome que aparece na tela para o papel do usuário na empresa.
export function nomeDoCargo(empresa: Pick<EmpresaResumo, "cargo" | "cargo_nome">): string {
    if (empresa.cargo === "PROPRIETARIO") return "Proprietário";
    if (empresa.cargo === "ADMINISTRADOR") return "Administrador";
    return empresa.cargo_nome || "Funcionário";
}
