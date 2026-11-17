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

type Metodo = "GET" | "POST" | "PUT" | "DELETE";

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
};

export type Funcionario = {
    id: number;
    nome: string;
    email: string;
    telefone: string | null;
    status: "CONVIDADO" | "ATIVO" | "INATIVO";
    cargo_id: number | null;
    cargo: string | null;
};

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
