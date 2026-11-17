// Guarda o usuário logado e a empresa selecionada para todo o sistema.
import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";

import {
    api,
    ApiError,
    type EmpresaResumo,
    type Usuario,
} from "../services/api";

const CHAVE_EMPRESA = "nod:empresaAtual";

type AuthContextType = {
    usuario: Usuario | null;
    carregando: boolean;
    empresaAtual: EmpresaResumo | null;
    entrar: (email: string, senha: string) => Promise<void>;
    sair: () => Promise<void>;
    recarregarUsuario: () => Promise<void>;
    selecionarEmpresa: (empresa: EmpresaResumo | null) => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

function lerEmpresaSalva(): EmpresaResumo | null {
    try {
        const salva = localStorage.getItem(CHAVE_EMPRESA);
        return salva ? JSON.parse(salva) : null;
    } catch {
        return null;
    }
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [usuario, setUsuario] = useState<Usuario | null>(null);
    const [carregando, setCarregando] = useState(true);
    const [empresaAtual, setEmpresaAtual] = useState<EmpresaResumo | null>(
        lerEmpresaSalva,
    );

    const selecionarEmpresa = useCallback((empresa: EmpresaResumo | null) => {
        setEmpresaAtual(empresa);

        try {
            if (empresa) {
                localStorage.setItem(CHAVE_EMPRESA, JSON.stringify(empresa));
            } else {
                localStorage.removeItem(CHAVE_EMPRESA);
            }
        } catch {
            // Sem localStorage (modo privado): segue só em memória.
        }
    }, []);

    // Pergunta ao backend quem está logado (pelo cookie da sessão).
    const recarregarUsuario = useCallback(async () => {
        try {
            const resposta = await api.get<{ usuario: Usuario }>("/auth/me");
            setUsuario(resposta.usuario);
        } catch (erro) {
            if (erro instanceof ApiError && erro.status === 401) {
                setUsuario(null);
            } else {
                throw erro;
            }
        }
    }, []);

    useEffect(() => {
        recarregarUsuario()
            .catch(() => setUsuario(null))
            .finally(() => setCarregando(false));
    }, [recarregarUsuario]);

    const entrar = useCallback(async (email: string, senha: string) => {
        await api.post("/auth/login", { email, senha });
        selecionarEmpresa(null);
        await recarregarUsuario();
    }, [recarregarUsuario, selecionarEmpresa]);

    const sair = useCallback(async () => {
        try {
            await api.post("/auth/logout");
        } catch {
            // Mesmo se a sessão já tiver expirado, limpa o estado local.
        }

        setUsuario(null);
        selecionarEmpresa(null);
    }, [selecionarEmpresa]);

    return (
        <AuthContext.Provider
            value={{
                usuario,
                carregando,
                empresaAtual,
                entrar,
                sair,
                recarregarUsuario,
                selecionarEmpresa,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const contexto = useContext(AuthContext);

    if (!contexto) {
        throw new Error("useAuth precisa estar dentro do AuthProvider");
    }

    return contexto;
}
