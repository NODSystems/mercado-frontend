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
    EVENTO_SESSAO_ENCERRADA,
    type EmpresaResumo,
    type Usuario,
} from "../services/api";

// Marca lida pela tela de login para explicar por que a pessoa caiu lá
export const CHAVE_SESSAO_EXPIRADA = "nod:sessaoExpirada";

const CHAVE_EMPRESA = "nod:empresaAtual";

type AuthContextType = {
    usuario: Usuario | null;
    carregando: boolean;
    empresaAtual: EmpresaResumo | null;
    // Permissões do usuário na empresa aberta (null = carregando)
    permissoes: string[] | null;
    pode: (permissao: string) => boolean;
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

    const [permissoes, setPermissoes] = useState<string[] | null>(null);

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

    // Sessão encerrada durante o uso (expirou, logout em outro aparelho,
    // troca de senha...): limpa o estado e as rotas protegidas mandam
    // para o login.
    useEffect(() => {
        function aoEncerrar() {
            try {
                sessionStorage.setItem(CHAVE_SESSAO_EXPIRADA, "1");
            } catch {
                // ignora
            }
            setUsuario(null);
        }

        window.addEventListener(EVENTO_SESSAO_ENCERRADA, aoEncerrar);
        return () => window.removeEventListener(EVENTO_SESSAO_ENCERRADA, aoEncerrar);
    }, []);

    // A empresa salva no navegador pode estar desatualizada (cargo mudou,
    // acesso inativado, empresa removida): confere com o backend.
    const idUsuario = usuario?.id;
    const idEmpresa = empresaAtual?.id;

    useEffect(() => {
        if (!idUsuario || !idEmpresa) return;

        api.get<{ resultado: EmpresaResumo[] }>("/empresas/listar")
            .then((resposta) => {
                const atual = resposta.resultado.find((e) => e.id === idEmpresa);
                selecionarEmpresa(atual && atual.status === "ATIVA" ? atual : null);
            })
            .catch(() => {
                // Sem conexão: mantém a empresa salva
            });
    }, [idUsuario, idEmpresa, selecionarEmpresa]);

    // Permissões do cargo na empresa aberta. O backend continua conferindo
    // cada rota; isto serve para o front mostrar só o que o cargo pode usar.
    useEffect(() => {
        setPermissoes(null);

        if (!idUsuario || !idEmpresa) return;

        let cancelado = false;

        api.get<{ permissoes: string[] }>(`/empresas/${idEmpresa}/permissoes`)
            .then((resposta) => {
                if (!cancelado) setPermissoes(resposta.permissoes);
            })
            .catch(() => {
                // Na dúvida, não libera nada
                if (!cancelado) setPermissoes([]);
            });

        return () => {
            cancelado = true;
        };
    }, [idUsuario, idEmpresa]);

    const pode = useCallback(
        (permissao: string) => permissoes?.includes(permissao) ?? false,
        [permissoes],
    );

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
                permissoes,
                pode,
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
