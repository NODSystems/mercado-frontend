// Confirmação para excluir uma empresa de vez.
// Pede para digitar o nome da empresa (evita clique por engano) e a
// senha (o backend exige reautenticação antes de apagar).
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation, faXmark } from "@fortawesome/free-solid-svg-icons";

import { api, mensagemDeErro, type EmpresaResumo } from "../../services/api";
import "../../styles/components/ExcluirEmpresaModal.css";

type Props = {
    empresa: EmpresaResumo;
    onCancelar: () => void;
    onExcluida: (empresa: EmpresaResumo) => void;
};

function ExcluirEmpresaModal({ empresa, onCancelar, onExcluida }: Props) {
    const nomeEmpresa = empresa.nome_fantasia || empresa.razao_social;

    const [nomeDigitado, setNomeDigitado] = useState("");
    const [senha, setSenha] = useState("");
    const [erro, setErro] = useState("");
    const [excluindo, setExcluindo] = useState(false);
    const campoNome = useRef<HTMLInputElement>(null);

    // Compara sem diferenciar maiúsculas/minúsculas e espaços nas pontas
    const nomeConfere =
        nomeDigitado.trim().toLocaleLowerCase("pt-BR") === nomeEmpresa.trim().toLocaleLowerCase("pt-BR");

    useEffect(() => {
        campoNome.current?.focus();

        function aoTeclar(evento: KeyboardEvent) {
            if (evento.key === "Escape" && !excluindo) onCancelar();
        }

        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [onCancelar, excluindo]);

    async function excluir(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        if (!nomeConfere || !senha || excluindo) return;

        setErro("");
        setExcluindo(true);

        try {
            // 1) confirma a senha  2) apaga a empresa
            await api.post("/auth/reauth", { senhaAtual: senha });
            await api.delete(`/empresas/apagar/${empresa.id}`);
            onExcluida(empresa);
        } catch (e) {
            setErro(mensagemDeErro(e));
            setExcluindo(false);
        }
    }

    return (
        <div className="excluir-fundo" onClick={() => !excluindo && onCancelar()}>
            <form
                className="excluir-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="excluir-titulo"
                onClick={(e) => e.stopPropagation()}
                onSubmit={excluir}
            >
                <button type="button" className="excluir-fechar" onClick={onCancelar} disabled={excluindo} aria-label="Fechar">
                    <FontAwesomeIcon icon={faXmark} />
                </button>

                <div className="excluir-icone">
                    <FontAwesomeIcon icon={faTriangleExclamation} />
                </div>

                <h2 id="excluir-titulo">Excluir {nomeEmpresa}?</h2>

                <p className="excluir-texto">
                    Essa ação é <strong>permanente</strong> e não pode ser desfeita. Serão apagados:
                </p>

                <ul className="excluir-lista">
                    <li>os dados cadastrais da empresa;</li>
                    <li>a equipe: funcionários perdem o acesso e convites pendentes são cancelados;</li>
                    <li>o histórico de pagamentos dos funcionários.</li>
                </ul>

                <p className="excluir-texto">As contas dos funcionários continuam existindo.</p>

                <label className="excluir-campo">
                    <span>Para confirmar, digite <strong>{nomeEmpresa}</strong></span>
                    <input
                        ref={campoNome}
                        value={nomeDigitado}
                        onChange={(e) => setNomeDigitado(e.target.value)}
                        autoComplete="off"
                        disabled={excluindo}
                    />
                </label>

                <label className="excluir-campo">
                    Sua senha
                    <input
                        type="password"
                        value={senha}
                        onChange={(e) => setSenha(e.target.value)}
                        autoComplete="current-password"
                        disabled={excluindo}
                    />
                </label>

                {erro && (
                    <div className="nod-alerta nod-alerta--erro" role="alert">{erro}</div>
                )}

                <div className="excluir-acoes">
                    <button type="button" className="excluir-cancelar" onClick={onCancelar} disabled={excluindo}>
                        Cancelar
                    </button>
                    <button type="submit" className="excluir-confirmar" disabled={!nomeConfere || !senha || excluindo}>
                        {excluindo ? "Excluindo..." : "Excluir definitivamente"}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default ExcluirEmpresaModal;
