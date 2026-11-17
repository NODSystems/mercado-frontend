// Protege as páginas que exigem login e, se for o caso, uma empresa
// selecionada. Quem não estiver logado vai para o /login e volta para
// a página original depois de entrar.
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";

type Props = {
    children: ReactNode;
    exigeEmpresa?: boolean;
};

function RotaProtegida({ children, exigeEmpresa = false }: Props) {
    const { usuario, carregando, empresaAtual } = useAuth();
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

    return <>{children}</>;
}

export default RotaProtegida;
