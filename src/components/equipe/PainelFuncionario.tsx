// Painel lateral para gerenciar um funcionário: dados cadastrais,
// cargo e acesso, e pagamentos. Consome as rotas
// /empresas/:empresaId/funcionarios/:funcionarioId/... do backend.
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faXmark,
    faIdCard,
    faUserShield,
    faMoneyBillWave,
    faTrash,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../contexts/AuthContext";
import {
    api,
    ApiError,
    formatarCpf,
    formatarData,
    formatarMoeda,
    formatarTelefone,
    mensagemDeErro,
    type Cargo,
    type Funcionario,
    type PagamentoFuncionario,
    type TipoPagamento,
} from "../../services/api";

import "../../styles/components/PainelFuncionario.css";
import {
    cpfValido,
    LIMITES,
    mascaraCpf,
    mascaraTelefone,
    numeroBR,
    telefoneValido,
} from "../../utils/validacao";

type Aba = "dados" | "acesso" | "pagamentos";

type Props = {
    empresaId: number;
    funcionarioId: number;
    cargos: Cargo[];
    onFechar: () => void;
    // Avisa a tela de Equipe para recarregar a lista
    onAlterado: (mensagem?: string) => void;
};

const nomesStatus: Record<Funcionario["status"], string> = {
    CONVIDADO: "Convite enviado",
    ATIVO: "Ativo",
    INATIVO: "Inativo",
};

const nomesTipo: Record<TipoPagamento, string> = {
    SALARIO: "Salário",
    ADIANTAMENTO: "Adiantamento",
    BONUS: "Bônus",
    COMISSAO: "Comissão",
    OUTRO: "Outro",
};

const metodos = ["PIX", "Dinheiro", "Transferência", "Cartão", "Outro"];

function hojeISO(): string {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function PainelFuncionario({ empresaId, funcionarioId, cargos, onFechar, onAlterado }: Props) {
    const { usuario, pode } = useAuth();

    // O que o cargo de quem está usando permite fazer neste painel
    const podeEditar = pode("funcionarios.editar");
    const podeRemover = pode("funcionarios.remover");
    const podeConvidar = pode("funcionarios.convidar");
    const podePagar = pode("funcionarios.pagar");
    const verAbaAcesso = podeEditar || podeRemover || podeConvidar;
    const rotaBase = `/empresas/${empresaId}/funcionarios/${funcionarioId}`;

    const [aba, setAba] = useState<Aba>("dados");
    const [funcionario, setFuncionario] = useState<Funcionario | null>(null);
    const [erroCarregar, setErroCarregar] = useState("");

    // Mensagens de cada aba
    const [mensagem, setMensagem] = useState<{ tipo: "sucesso" | "erro"; texto: string } | null>(null);
    const [salvando, setSalvando] = useState(false);

    // Formulário de dados
    const [nome, setNome] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cpf, setCpf] = useState("");
    const [salario, setSalario] = useState("");
    const [dataAdmissao, setDataAdmissao] = useState("");

    // Cargo
    const [cargoId, setCargoId] = useState("");

    // Pagamentos
    const [pagamentos, setPagamentos] = useState<PagamentoFuncionario[]>([]);
    const [totalPago, setTotalPago] = useState(0);
    const [erroPagamentos, setErroPagamentos] = useState("");
    const [tipo, setTipo] = useState<TipoPagamento>("SALARIO");
    const [valor, setValor] = useState("");
    const [referencia, setReferencia] = useState(hojeISO().slice(0, 7));
    const [dataPagamento, setDataPagamento] = useState(hojeISO());
    const [metodo, setMetodo] = useState("PIX");
    const [observacao, setObservacao] = useState("");

    const preencher = useCallback((f: Funcionario) => {
        setFuncionario(f);
        setNome(f.nome);
        setTelefone(formatarTelefone(f.telefone));
        setCpf(formatarCpf(f.cpf));
        setSalario(f.salario ? f.salario.replace(".", ",") : "");
        setDataAdmissao(f.data_admissao ?? "");
        setCargoId(f.cargo_id ? String(f.cargo_id) : "");
    }, []);

    const carregar = useCallback(async () => {
        try {
            const resposta = await api.get<{ funcionario: Funcionario }>(rotaBase);
            preencher(resposta.funcionario);
        } catch (erro) {
            setErroCarregar(mensagemDeErro(erro));
        }
    }, [rotaBase, preencher]);

    const carregarPagamentos = useCallback(async () => {
        try {
            const resposta = await api.get<{ pagamentos: PagamentoFuncionario[]; total: number }>(
                `${rotaBase}/pagamentos`
            );
            setPagamentos(resposta.pagamentos);
            setTotalPago(resposta.total);
            setErroPagamentos("");
        } catch (erro) {
            setErroPagamentos(
                erro instanceof ApiError && erro.status === 403
                    ? "Seu cargo não tem permissão para ver os pagamentos."
                    : mensagemDeErro(erro)
            );
        }
    }, [rotaBase]);

    useEffect(() => {
        carregar();
    }, [carregar]);

    useEffect(() => {
        if (aba === "pagamentos") carregarPagamentos();
    }, [aba, carregarPagamentos]);

    // Fecha com a tecla Esc
    useEffect(() => {
        function aoTeclar(evento: KeyboardEvent) {
            if (evento.key === "Escape") onFechar();
        }
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [onFechar]);

    function trocarAba(nova: Aba) {
        setAba(nova);
        setMensagem(null);
    }

    // Executa uma ação, mostra o resultado e atualiza a lista
    async function executar(
        acao: () => Promise<unknown>,
        sucesso: string,
        depois?: () => void
    ) {
        setSalvando(true);
        setMensagem(null);

        try {
            await acao();
            setMensagem({ tipo: "sucesso", texto: sucesso });
            onAlterado();
            depois?.();
        } catch (erro) {
            setMensagem({ tipo: "erro", texto: mensagemDeErro(erro) });
        } finally {
            setSalvando(false);
        }
    }

    // ---------------- Dados ----------------
    function salvarDados(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        // Avisos na hora, com as mesmas regras do backend
        const problemas: string[] = [];
        if (nome.trim().length < 3) problemas.push("O nome deve ter pelo menos 3 caracteres.");
        if (telefone.trim() && !telefoneValido(telefone)) problemas.push("Telefone inválido: informe DDD + número.");
        if (cpf.trim() && !cpfValido(cpf)) problemas.push("CPF inválido. Confira os números.");
        const salarioNumero = salario.trim() === "" ? null : numeroBR(salario);
        if (salarioNumero !== null && (!Number.isFinite(salarioNumero) || salarioNumero < 0)) {
            problemas.push("Salário inválido. Use, por exemplo, 2.500,00.");
        }

        if (problemas.length > 0) {
            setMensagem({ tipo: "erro", texto: problemas.join(" ") });
            return;
        }

        executar(async () => {
            const resposta = await api.put<{ funcionario: Funcionario }>(rotaBase, {
                nome,
                telefone,
                cpf,
                salario: salarioNumero,
                dataAdmissao: dataAdmissao || null,
            });
            preencher(resposta.funcionario);
        }, "Dados salvos com sucesso.");
    }

    // ---------------- Cargo e acesso ----------------
    function salvarCargo() {
        executar(async () => {
            const resposta = await api.patch<{ funcionario: Funcionario }>(`${rotaBase}/cargo`, {
                cargoId: Number(cargoId),
            });
            preencher(resposta.funcionario);
        }, funcionario?.status === "CONVIDADO"
            ? "Cargo alterado. Ele vale quando a pessoa aceitar o convite."
            : "Cargo alterado com sucesso.");
    }

    function alterarStatus(status: "ATIVO" | "INATIVO") {
        const pergunta = status === "INATIVO"
            ? `Inativar ${funcionario?.nome}? A pessoa perde o acesso à empresa até ser reativada.`
            : `Reativar ${funcionario?.nome}? A pessoa volta a acessar a empresa.`;

        if (!window.confirm(pergunta)) return;

        executar(async () => {
            const resposta = await api.patch<{ funcionario: Funcionario }>(`${rotaBase}/status`, { status });
            preencher(resposta.funcionario);
        }, status === "INATIVO" ? "Funcionário inativado." : "Funcionário reativado.");
    }

    function cancelarConvite() {
        if (!window.confirm(`Cancelar o convite de ${funcionario?.nome}?`)) return;

        executar(
            () => api.post(`/empresas/${empresaId}/funcionarios/cancelar`, { funcionarioId }),
            "Convite cancelado.",
            () => {
                onAlterado(`Convite de ${funcionario?.nome} cancelado.`);
                onFechar();
            }
        );
    }

    function remover() {
        if (!window.confirm(
            `Remover ${funcionario?.nome} da empresa de vez? Essa ação não pode ser desfeita.`
        )) return;

        executar(
            () => api.delete(rotaBase),
            "Funcionário removido.",
            () => {
                onAlterado(`${funcionario?.nome} foi removido da empresa.`);
                onFechar();
            }
        );
    }

    // ---------------- Pagamentos ----------------
    function registrarPagamento(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        // "2.500,50" virava NaN antes; agora entende o formato brasileiro
        const valorNumero = numeroBR(valor);

        if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
            setMensagem({ tipo: "erro", texto: "Informe um valor maior que zero. Ex.: 2.500,00" });
            return;
        }

        executar(async () => {
            await api.post(`${rotaBase}/pagamentos`, {
                tipo,
                valor: valorNumero,
                referencia: referencia || null,
                dataPagamento,
                metodoPagamento: metodo,
                observacao: observacao || null,
            });
            setValor("");
            setObservacao("");
            await carregarPagamentos();
        }, "Pagamento registrado.");
    }

    function apagarPagamento(pagamento: PagamentoFuncionario) {
        if (!window.confirm(
            `Apagar o pagamento de ${formatarMoeda(pagamento.valor)} do dia ${formatarData(pagamento.data_pagamento)}?`
        )) return;

        executar(async () => {
            await api.delete(`${rotaBase}/pagamentos/${pagamento.id}`);
            await carregarPagamentos();
        }, "Pagamento apagado.");
    }

    const souEu = funcionario?.usuario_id != null && funcionario.usuario_id === usuario?.id;

    // Campos de dados ficam só para leitura se não puder editar
    const somenteLeitura = souEu || !podeEditar;

    // ---------------- Renderização ----------------
    function conteudoAba() {
        if (!funcionario) return null;

        if (aba === "dados") {
            return (
                <form className="painel-form" onSubmit={salvarDados}>
                    <label>
                        Nome completo
                        <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={LIMITES.nomeFuncionario} disabled={somenteLeitura} />
                    </label>

                    <label>
                        E-mail
                        <input value={funcionario.email} readOnly title="O e-mail vem do convite e não pode ser alterado" />
                    </label>

                    <div className="painel-form-grid">
                        <label>
                            Telefone
                            <input value={telefone} onChange={(e) => setTelefone(mascaraTelefone(e.target.value))} placeholder="(00) 00000-0000" inputMode="tel" disabled={somenteLeitura} />
                        </label>

                        <label>
                            CPF
                            <input value={cpf} onChange={(e) => setCpf(mascaraCpf(e.target.value))} placeholder="000.000.000-00" inputMode="numeric" disabled={somenteLeitura} />
                        </label>

                        <label>
                            Salário (R$)
                            <input
                                value={salario}
                                onChange={(e) => setSalario(e.target.value)}
                                placeholder="0,00"
                                inputMode="decimal"
                                disabled={souEu}
                            />
                        </label>

                        <label>
                            Data de admissão
                            <input type="date" value={dataAdmissao} onChange={(e) => setDataAdmissao(e.target.value)} disabled={somenteLeitura} />
                        </label>
                    </div>

                    {!somenteLeitura && (
                        <button type="submit" className="equipe-botao-principal" disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar dados"}
                        </button>
                    )}

                    {!souEu && !podeEditar && (
                        <small className="painel-somente-leitura">Seu cargo pode ver, mas não alterar estes dados.</small>
                    )}
                </form>
            );
        }

        if (aba === "acesso") {
            return (
                <div className="painel-secoes">
                    {podeEditar && (
                    <section className="painel-secao">
                        <h3>Cargo</h3>
                        <p>
                            {funcionario.status === "CONVIDADO"
                                ? "Ainda não aceitou o convite. O cargo escolhido vale quando aceitar."
                                : "Define o que a pessoa pode fazer no sistema."}
                        </p>

                        <div className="painel-linha">
                            <select
                                value={cargoId}
                                onChange={(e) => setCargoId(e.target.value)}
                                disabled={souEu || funcionario.status === "INATIVO"}
                                aria-label="Cargo"
                            >
                                {!cargoId && <option value="">Selecione</option>}
                                {cargos.map((c) => (
                                    <option key={c.id} value={c.id}>{c.nome}</option>
                                ))}
                            </select>

                            <button
                                type="button"
                                className="equipe-botao-principal"
                                onClick={salvarCargo}
                                disabled={
                                    salvando || souEu || !cargoId ||
                                    funcionario.status === "INATIVO" ||
                                    String(funcionario.cargo_id) === cargoId
                                }
                            >
                                Salvar cargo
                            </button>
                        </div>

                        {funcionario.status === "INATIVO" && (
                            <small>Reative o funcionário para mudar o cargo.</small>
                        )}
                    </section>
                    )}

                    <section className="painel-secao">
                        <h3>Acesso à empresa</h3>

                        {funcionario.status === "CONVIDADO" && (
                            <>
                                <p>O convite foi enviado para {funcionario.email} e ainda não foi aceito.</p>
                                {podeConvidar && (
                                    <button type="button" className="painel-botao-perigo" onClick={cancelarConvite} disabled={salvando}>
                                        Cancelar convite
                                    </button>
                                )}
                            </>
                        )}

                        {funcionario.status !== "CONVIDADO" && !podeRemover && (
                            <p>Status: {nomesStatus[funcionario.status]}. Só quem pode remover funcionários ativa ou inativa o acesso.</p>
                        )}

                        {podeRemover && funcionario.status === "ATIVO" && (
                            <>
                                <p>Inativar tira o acesso sem apagar o histórico. Dá para reativar depois.</p>
                                <button
                                    type="button"
                                    className="painel-botao-perigo"
                                    onClick={() => alterarStatus("INATIVO")}
                                    disabled={salvando || souEu}
                                >
                                    Inativar acesso
                                </button>
                            </>
                        )}

                        {podeRemover && funcionario.status === "INATIVO" && (
                            funcionario.usuario_id ? (
                                <>
                                    <p>Este funcionário está sem acesso à empresa.</p>
                                    <button
                                        type="button"
                                        className="equipe-botao-principal"
                                        onClick={() => alterarStatus("ATIVO")}
                                        disabled={salvando}
                                    >
                                        Reativar acesso
                                    </button>
                                </>
                            ) : (
                                <p>Esta pessoa nunca entrou na empresa. Para trazê-la, envie um novo convite.</p>
                            )
                        )}
                    </section>

                    {!souEu && podeRemover && (
                        <section className="painel-secao painel-secao--perigo">
                            <h3>Remover da empresa</h3>
                            <p>
                                Apaga o cadastro e o vínculo de vez. Quem já recebeu pagamentos não pode
                                ser removido: inative em vez disso.
                            </p>
                            <button type="button" className="painel-botao-perigo" onClick={remover} disabled={salvando}>
                                <FontAwesomeIcon icon={faTrash} /> Remover funcionário
                            </button>
                        </section>
                    )}
                </div>
            );
        }

        // Pagamentos
        if (erroPagamentos) {
            return <div className="nod-alerta nod-alerta--erro" role="alert">{erroPagamentos}</div>;
        }

        return (
            <div className="painel-secoes">
                {funcionario.status === "CONVIDADO" ? (
                    <div className="nod-alerta nod-alerta--info">
                        Só é possível registrar pagamentos depois que a pessoa aceitar o convite.
                    </div>
                ) : (
                    <form className="painel-form painel-secao" onSubmit={registrarPagamento}>
                        <h3>Registrar pagamento</h3>

                        <div className="painel-form-grid">
                            <label>
                                Tipo
                                <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoPagamento)}>
                                    {Object.entries(nomesTipo).map(([valorTipo, rotulo]) => (
                                        <option key={valorTipo} value={valorTipo}>{rotulo}</option>
                                    ))}
                                </select>
                            </label>

                            <label>
                                Valor (R$)
                                <input
                                    value={valor}
                                    onChange={(e) => setValor(e.target.value)}
                                    placeholder="0,00"
                                    inputMode="decimal"
                                    required
                                />
                            </label>

                            <label>
                                Mês de referência
                                <input type="month" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
                            </label>

                            <label>
                                Data do pagamento
                                <input type="date" value={dataPagamento} onChange={(e) => setDataPagamento(e.target.value)} required />
                            </label>

                            <label>
                                Forma de pagamento
                                <select value={metodo} onChange={(e) => setMetodo(e.target.value)}>
                                    {metodos.map((m) => <option key={m} value={m}>{m}</option>)}
                                </select>
                            </label>

                            <label>
                                Observação
                                <input value={observacao} onChange={(e) => setObservacao(e.target.value)} maxLength={255} placeholder="Opcional" />
                            </label>
                        </div>

                        <button type="submit" className="equipe-botao-principal" disabled={salvando}>
                            {salvando ? "Registrando..." : "Registrar pagamento"}
                        </button>
                    </form>
                )}

                <section className="painel-secao">
                    <div className="painel-historico-topo">
                        <h3>Histórico</h3>
                        <span>Total pago: <strong>{formatarMoeda(totalPago)}</strong></span>
                    </div>

                    {pagamentos.length === 0 ? (
                        <p>Nenhum pagamento registrado.</p>
                    ) : (
                        <div className="painel-tabela-container">
                            <table className="painel-tabela">
                                <thead>
                                    <tr>
                                        <th>Data</th>
                                        <th>Tipo</th>
                                        <th>Ref.</th>
                                        <th>Valor</th>
                                        <th aria-label="Ações"></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pagamentos.map((p) => (
                                        <tr key={p.id}>
                                            <td>{formatarData(p.data_pagamento)}</td>
                                            <td>
                                                {nomesTipo[p.tipo]}
                                                {(p.metodo_pagamento || p.observacao) && (
                                                    <small>{[p.metodo_pagamento, p.observacao].filter(Boolean).join(" · ")}</small>
                                                )}
                                            </td>
                                            <td>{p.referencia ? `${p.referencia.slice(5)}/${p.referencia.slice(0, 4)}` : "—"}</td>
                                            <td><strong>{formatarMoeda(p.valor)}</strong></td>
                                            <td>
                                                <button
                                                    type="button"
                                                    className="equipe-botao-excluir"
                                                    onClick={() => apagarPagamento(p)}
                                                    title="Apagar pagamento"
                                                    aria-label="Apagar pagamento"
                                                    disabled={salvando}
                                                >
                                                    <FontAwesomeIcon icon={faTrash} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>
        );
    }

    return (
        <div className="painel-fundo" onClick={onFechar}>
            <aside
                className="painel-funcionario"
                role="dialog"
                aria-modal="true"
                aria-label="Gerenciar funcionário"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="painel-cabecalho">
                    <div className="equipe-funcionario">
                        <div className="equipe-avatar">
                            {(funcionario?.nome ?? "?").trim().charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <strong>{funcionario?.nome ?? "Carregando..."}</strong>
                            {funcionario && (
                                <small>
                                    {funcionario.cargo || "Sem cargo"} ·{" "}
                                    <span className={`painel-status painel-status--${funcionario.status.toLowerCase()}`}>
                                        {nomesStatus[funcionario.status]}
                                    </span>
                                </small>
                            )}
                        </div>
                    </div>

                    <button type="button" className="painel-fechar" onClick={onFechar} aria-label="Fechar">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <nav className="painel-abas" role="tablist">
                    <button type="button" role="tab" aria-selected={aba === "dados"} className={aba === "dados" ? "ativa" : ""} onClick={() => trocarAba("dados")}>
                        <FontAwesomeIcon icon={faIdCard} /> Dados
                    </button>
                    {verAbaAcesso && (
                        <button type="button" role="tab" aria-selected={aba === "acesso"} className={aba === "acesso" ? "ativa" : ""} onClick={() => trocarAba("acesso")}>
                            <FontAwesomeIcon icon={faUserShield} /> Cargo e acesso
                        </button>
                    )}
                    {podePagar && (
                        <button type="button" role="tab" aria-selected={aba === "pagamentos"} className={aba === "pagamentos" ? "ativa" : ""} onClick={() => trocarAba("pagamentos")}>
                            <FontAwesomeIcon icon={faMoneyBillWave} /> Pagamentos
                        </button>
                    )}
                </nav>

                <div className="painel-corpo">
                    {erroCarregar && (
                        <div className="nod-alerta nod-alerta--erro" role="alert">{erroCarregar}</div>
                    )}

                    {souEu && (
                        <div className="nod-alerta nod-alerta--info">
                            Este é o seu cadastro. Seu cargo e acesso só podem ser alterados por outra pessoa.
                        </div>
                    )}

                    {mensagem && (
                        <div className={`nod-alerta nod-alerta--${mensagem.tipo}`} role={mensagem.tipo === "erro" ? "alert" : "status"}>
                            {mensagem.texto}
                        </div>
                    )}

                    {!funcionario && !erroCarregar ? <p>Carregando...</p> : conteudoAba()}
                </div>
            </aside>
        </div>
    );
}

export default PainelFuncionario;
