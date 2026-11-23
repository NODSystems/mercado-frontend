// Mostrado quando o cargo da pessoa não tem acesso à página
// (ex.: Vendedor abrindo /financeiro pelo endereço).
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLock } from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../contexts/AuthContext";
import { nomeDoCargo } from "../services/api";

function SemAcesso() {
    const { empresaAtual } = useAuth();

    return (
        <main className="sem-acesso">
            <div className="sem-acesso-cartao">
                <span className="sem-acesso-icone">
                    <FontAwesomeIcon icon={faLock} />
                </span>
                <h1>Você não tem acesso a esta área</h1>
                <p>
                    {empresaAtual ? <>Seu cargo ({nomeDoCargo(empresaAtual)}) não permite abrir esta página. </> : null}
                    Se precisar, peça acesso ao responsável pela empresa.
                </p>
                <Link to="/" className="sem-acesso-botao">Voltar para a Visão Geral</Link>
            </div>
        </main>
    );
}

export default SemAcesso;
