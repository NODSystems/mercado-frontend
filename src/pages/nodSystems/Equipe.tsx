// Importa os hooks do React.
import { useCallback, useEffect, useState, type FormEvent } from "react";

// Importa os ícones utilizados na tela.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faUserPlus,
    faMagnifyingGlass,
    faUserTie,
} from "@fortawesome/free-solid-svg-icons";

// Integração com o backend.
import { useAuth } from "../../contexts/AuthContext";
import {
    api,
    formatarTelefone,
    mensagemDeErro,
    type Cargo,
    type Funcionario,
} from "../../services/api";

import {
    emailValido,
    LIMITES,
    mascaraTelefone,
    telefoneValido,
} from "../../utils/validacao";

// Painel lateral para gerenciar um funcionário.
import PainelFuncionario from "../../components/equipe/PainelFuncionario";

// Importa o CSS exclusivo da página.
import "../../styles/nodSystems/Equipe.css";

// Texto exibido para cada status do backend.
const nomesStatus: Record<Funcionario["status"], string> = {
    CONVIDADO: "Convite enviado",
    ATIVO: "Ativo",
    INATIVO: "Inativo",
};

// Página de gerenciamento da equipe.
function Equipe() {
    const { empresaAtual, pode } = useAuth();

    // Ações liberadas para o cargo
    const podeConvidar = pode("funcionarios.convidar");
    const podeGerenciar =
        pode("funcionarios.editar") || pode("funcionarios.remover") || pode("funcionarios.pagar") || podeConvidar;
    const empresaId = empresaAtual?.id;

    // Funcionários e cargos vindos do backend.
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);
    const [cargos, setCargos] = useState<Cargo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroLista, setErroLista] = useState("");

    // Controla a abertura e o fechamento do formulário.
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Guarda os dados preenchidos no formulário.
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cargoId, setCargoId] = useState("");
    const [enviando, setEnviando] = useState(false);

    // Controla a pesquisa e o filtro por cargo.
    const [pesquisa, setPesquisa] = useState("");
    const [filtroCargo, setFiltroCargo] = useState("Todos");
    const [filtroStatus, setFiltroStatus] = useState("Todos");

    // Funcionário aberto no painel de gerenciamento.
    const [selecionadoId, setSelecionadoId] = useState<number | null>(null);

    // Guarda mensagens de sucesso ou validação.
    const [mensagem, setMensagem] = useState("");

    // Busca a lista de funcionários da empresa selecionada.
    const carregarFuncionarios = useCallback(async () => {
        if (!empresaId) return;

        try {
            const resposta = await api.get<{ funcionarios: Funcionario[] }>(
                `/empresas/${empresaId}/funcionarios`
            );
            setFuncionarios(resposta.funcionarios);
            setErroLista("");
        } catch (erro) {
            setErroLista(mensagemDeErro(erro));
        }
    }, [empresaId]);

    useEffect(() => {
        if (!empresaId) return;

        // Cargos disponíveis para o formulário de convite.
        api.get<{ cargos: Cargo[] }>(`/empresas/${empresaId}/cargos`)
            .then((resposta) => {
                setCargos(resposta.cargos);
                const vendedor = resposta.cargos.find((c) => c.nome === "Vendedor");
                setCargoId(String((vendedor ?? resposta.cargos[0])?.id ?? ""));
            })
            .catch(() => setCargos([]));

        carregarFuncionarios().finally(() => setCarregando(false));
    }, [empresaId, carregarFuncionarios]);

    // Calcula quantos funcionários estão ativos.
    const totalAtivos = funcionarios.filter(
        (funcionario) => funcionario.status === "ATIVO"
    ).length;

    // Filtra os funcionários de acordo com a pesquisa e o cargo.
    const funcionariosFiltrados = funcionarios.filter((funcionario) => {
        const correspondePesquisa =
            funcionario.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
            funcionario.email.toLowerCase().includes(pesquisa.toLowerCase());

        const correspondeCargo =
            filtroCargo === "Todos" || funcionario.cargo === filtroCargo;

        const correspondeStatus =
            filtroStatus === "Todos" || funcionario.status === filtroStatus;

        return correspondePesquisa && correspondeCargo && correspondeStatus;
    });

    // Envia o convite por e-mail. A pessoa entra na equipe quando aceitar.
    async function cadastrarFuncionario(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        // Mesmas regras do backend, avisando antes de enviar
        if (nome.trim().length < 3) {
            setMensagem("O nome do funcionário deve ter pelo menos 3 caracteres.");
            return;
        }

        if (!emailValido(email)) {
            setMensagem("Informe um e-mail válido para o convite.");
            return;
        }

        if (telefone.trim() && !telefoneValido(telefone)) {
            setMensagem("Telefone inválido: informe DDD + número (10 ou 11 dígitos), ou deixe em branco.");
            return;
        }

        if (!empresaId) return;

        setEnviando(true);
        setMensagem("");

        try {
            await api.post(`/empresas/${empresaId}/funcionarios/convidar`, {
                nome: nome.trim(),
                email: email.trim(),
                telefone: telefone.trim() || null,
                cargoId: Number(cargoId),
            });

            const enviadoPara = email.trim();

            // Limpa o formulário após o envio.
            setNome("");
            setEmail("");
            setTelefone("");
            setMostrarFormulario(false);
            setMensagem(
                `Convite enviado para ${enviadoPara}. A pessoa entra na equipe ao aceitar pelo e-mail.`
            );

            await carregarFuncionarios();
        } catch (erro) {
            setMensagem(mensagemDeErro(erro));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <main className="equipe-page">
            {/* Cabeçalho com o título e o botão de cadastro. */}
            <header className="equipe-header">
                <div>
                    <span className="equipe-subtitulo">GESTÃO DE PESSOAS</span>
                    <h1>Equipe</h1>
                    <p>Gerencie os funcionários e os cargos do seu negócio.</p>
                </div>

                {podeConvidar && (
                    <button
                        type="button"
                        className="equipe-botao-principal"
                        onClick={() => {
                            setMensagem("");
                            setMostrarFormulario(!mostrarFormulario);
                        }}
                    >
                        <FontAwesomeIcon icon={faUserPlus} />
                        Novo funcionário
                    </button>
                )}
            </header>

            {/* Mostra mensagens após as ações do usuário. */}
            {mensagem && (
                <div className="equipe-mensagem" role="status">
                    {mensagem}
                </div>
            )}

            {/* Cards com o resumo da equipe. */}
            <section className="equipe-resumo">
                <article className="equipe-card-resumo">
                    <div className="equipe-icone-resumo">
                        <FontAwesomeIcon icon={faUsers} />
                    </div>
                    <div>
                        <span>Total de funcionários</span>
                        <strong>{funcionarios.length}</strong>
                    </div>
                </article>

                <article className="equipe-card-resumo">
                    <div className="equipe-icone-resumo equipe-icone-ativo">
                        <FontAwesomeIcon icon={faUserTie} />
                    </div>
                    <div>
                        <span>Funcionários ativos</span>
                        <strong>{totalAtivos}</strong>
                    </div>
                </article>
            </section>

            {/* Formulário que aparece ao clicar em Novo funcionário. */}
            {/* (o botão só aparece para quem pode convidar) */}
            {mostrarFormulario && (
                <form
                    className="equipe-formulario"
                    onSubmit={cadastrarFuncionario}
                >
                    <h2>Convidar funcionário</h2>
                    <p>
                        A pessoa recebe um convite por e-mail e entra na equipe
                        quando aceitar.
                    </p>

                    <div className="equipe-formulario-grid">
                        <label>
                            Nome completo *
                            <input
                                type="text"
                                value={nome}
                                onChange={(evento) => setNome(evento.target.value)}
                                maxLength={LIMITES.nomeFuncionario}
                                placeholder="Digite o nome completo"
                                required
                            />
                        </label>

                        <label>
                            E-mail *
                            <input
                                type="email"
                                value={email}
                                onChange={(evento) => setEmail(evento.target.value)}
                                maxLength={LIMITES.email}
                                placeholder="exemplo@email.com"
                                required
                            />
                        </label>

                        <label>
                            Telefone
                            <input
                                type="tel"
                                value={telefone}
                                onChange={(evento) => setTelefone(mascaraTelefone(evento.target.value))}
                                placeholder="(12) 99999-9999"
                            />
                        </label>

                        <label>
                            Cargo
                            <select
                                value={cargoId}
                                onChange={(evento) => setCargoId(evento.target.value)}
                                required
                            >
                                {cargos.map((opcao) => (
                                    <option key={opcao.id} value={opcao.id}>
                                        {opcao.nome}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>

                    {/* Ações para salvar ou cancelar o cadastro. */}
                    <div className="equipe-formulario-acoes">
                        <button
                            type="button"
                            className="equipe-botao-secundario"
                            onClick={() => {
                                setMostrarFormulario(false);
                                setMensagem("");
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="equipe-botao-principal"
                            disabled={enviando}
                        >
                            {enviando ? "Enviando..." : "Enviar convite"}
                        </button>
                    </div>
                </form>
            )}

            {/* Área de listagem e pesquisa dos funcionários. */}
            <section className="equipe-lista">
                <div className="equipe-lista-header">
                    <div>
                        <h2>Funcionários cadastrados</h2>
                        <p>Consulte e gerencie os integrantes da equipe.</p>
                    </div>

                    {/* Campos para pesquisar e filtrar a lista. */}
                    <div className="equipe-filtros">
                        <div className="equipe-pesquisa">
                            <FontAwesomeIcon icon={faMagnifyingGlass} />
                            <input
                                type="search"
                                value={pesquisa}
                                onChange={(evento) => setPesquisa(evento.target.value)}
                                placeholder="Pesquisar funcionário..."
                                aria-label="Pesquisar funcionário"
                            />
                        </div>

                        <select
                            value={filtroCargo}
                            onChange={(evento) => setFiltroCargo(evento.target.value)}
                            aria-label="Filtrar por cargo"
                        >
                            <option value="Todos">Todos os cargos</option>
                            {cargos.map((opcao) => (
                                <option key={opcao.id} value={opcao.nome}>
                                    {opcao.nome}
                                </option>
                            ))}
                        </select>

                        <select
                            value={filtroStatus}
                            onChange={(evento) => setFiltroStatus(evento.target.value)}
                            aria-label="Filtrar por status"
                        >
                            <option value="Todos">Todos os status</option>
                            <option value="ATIVO">Ativos</option>
                            <option value="CONVIDADO">Convites enviados</option>
                            <option value="INATIVO">Inativos</option>
                        </select>
                    </div>
                </div>

                {erroLista && (
                    <div className="nod-alerta nod-alerta--erro" role="alert">
                        {erroLista}
                    </div>
                )}

                {/* Exibe uma mensagem se não houver resultados. */}
                {carregando ? (
                    <div className="equipe-vazio">
                        <p>Carregando equipe...</p>
                    </div>
                ) : funcionariosFiltrados.length === 0 ? (
                    <div className="equipe-vazio">
                        <FontAwesomeIcon icon={faUsers} />
                        <h3>
                            {funcionarios.length === 0
                                ? "Nenhum funcionário cadastrado"
                                : "Nenhum funcionário encontrado"}
                        </h3>
                        <p>
                            {funcionarios.length === 0
                                ? (podeConvidar ? "Clique em Novo funcionário para enviar um convite." : "A equipe ainda não tem funcionários.")
                                : "Tente alterar a pesquisa ou os filtros."}
                        </p>
                    </div>
                ) : (
                    /* Tabela que apresenta os dados cadastrados. */
                    <div className="equipe-tabela-container">
                        <table className="equipe-tabela">
                            <thead>
                                <tr>
                                    <th>Funcionário</th>
                                    <th>Contato</th>
                                    <th>Cargo</th>
                                    <th>Status</th>
                                    <th aria-label="Ações"></th>
                                </tr>
                            </thead>

                            <tbody>
                                {funcionariosFiltrados.map((funcionario) => (
                                    <tr
                                        key={funcionario.id}
                                        className="equipe-linha-clicavel"
                                        onClick={() => setSelecionadoId(funcionario.id)}
                                    >
                                        <td>
                                            <div className="equipe-funcionario">
                                                <div className="equipe-avatar">
                                                    {funcionario.nome
                                                        .trim()
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <strong>{funcionario.nome}</strong>
                                            </div>
                                        </td>

                                        <td>
                                            <div className="equipe-contato">
                                                <span>{funcionario.email}</span>
                                                <small>
                                                    {formatarTelefone(funcionario.telefone) || "Sem telefone"}
                                                </small>
                                            </div>
                                        </td>

                                        <td>{funcionario.cargo || "—"}</td>

                                        <td>
                                            <span className={`equipe-status equipe-status--${funcionario.status.toLowerCase()}`}>
                                                {nomesStatus[funcionario.status]}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="equipe-botao-gerenciar"
                                                onClick={(evento) => {
                                                    evento.stopPropagation();
                                                    setSelecionadoId(funcionario.id);
                                                }}
                                            >
                                                {podeGerenciar ? "Gerenciar" : "Ver detalhes"}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {selecionadoId !== null && empresaId && (
                <PainelFuncionario
                    empresaId={empresaId}
                    funcionarioId={selecionadoId}
                    cargos={cargos}
                    onFechar={() => setSelecionadoId(null)}
                    onAlterado={(texto) => {
                        if (texto) setMensagem(texto);
                        carregarFuncionarios();
                    }}
                />
            )}
        </main>
    );
}

export default Equipe;