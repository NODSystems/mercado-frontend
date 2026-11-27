// Protege as páginas que exigem login e, se for o caso, uma empresa
// selecionada. Quem não estiver logado vai para o /login e volta para
// a página original depois de entrar.
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import SemAcesso from "./SemAcesso";

type Props = {
    children: ReactNode;
    exigeEmpresa?: boolean;
    // Permissão do cargo exigida para abrir a página (ex.: "relatorios.visualizar")
    permissao?: string;
};

function RotaProtegida({ children, exigeEmpresa = false, permissao }: Props) {
    const { usuario, carregando, empresaAtual, permissoes, pode } = useAuth();
    const location = useLocation();

    if (carregando) {
        return (
            <div className="d-flex justify-content-center align-items-center vh-100">
                <div className="spinner-border text-secondary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                </div>
            </div>
        );
    }

    if (!usuario) {
        // Visitante abrindo o endereço principal vê a página inicial (apresentação do produto)
        if (location.pathname === "/" && !location.search) {
            return <Navigate to="/home" replace />;
        }

        const destino = location.pathname + location.search;

        return (
            <Navigate
                to={`/login?redirect=${encodeURIComponent(destino)}`}
                replace
            />
        );
    }

    if (exigeEmpresa && !empresaAtual) {
        return <Navigate to="/minhas-empresas" replace />;
    }

    if (permissao) {
        // Ainda carregando as permissões: espera em vez de piscar a página
        if (permissoes === null) {
            return (
                <div className="d-flex justify-content-center align-items-center vh-100">
                    <div className="spinner-border text-secondary" role="status">
                        <span className="visually-hidden">Carregando...</span>
                    </div>
                </div>
            );
        }

        if (!pode(permissao)) {
            // Mantém a navbar (primeiro filho) e troca a página pelo aviso
            const filhos = Array.isArray(children) ? children : [children];
            return (
                <>
                    {filhos.length > 1 ? filhos[0] : null}
                    <SemAcesso />
                </>
            );
        }
    }

    return <>{children}</>;
}

export default RotaProtegida;
