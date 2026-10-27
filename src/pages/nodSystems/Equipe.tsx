// Importa o useState para controlar os funcionários cadastrados.
import { useState, type FormEvent } from "react";

// Importa os ícones utilizados na tela.
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUsers,
    faUserPlus,
    faMagnifyingGlass,
    faTrash,
    faUserTie,
} from "@fortawesome/free-solid-svg-icons";

// Importa o CSS exclusivo da página.
import "../../styles/nodSystems/Equipe.css";

// Define os dados que cada funcionário precisa ter.
interface Funcionario {
    id: number;
    nome: string;
    email: string;
    telefone: string;
    cargo: string;
    status: "Ativo" | "Inativo";
}

// Cargos disponíveis para os funcionários.
const cargos = [
    "Administrador",
    "Gerente",
    "Vendedor",
    "Estoquista",
    "Atendente",
];

// Página de gerenciamento da equipe.
function Equipe() {
    // Guarda os funcionários cadastrados.
    const [funcionarios, setFuncionarios] = useState<Funcionario[]>([]);

    // Controla a abertura e o fechamento do formulário.
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Guarda os dados preenchidos no formulário.
    const [nome, setNome] = useState("");
    const [email, setEmail] = useState("");
    const [telefone, setTelefone] = useState("");
    const [cargo, setCargo] = useState("Vendedor");

    // Controla a pesquisa e o filtro por cargo.
    const [pesquisa, setPesquisa] = useState("");
    const [filtroCargo, setFiltroCargo] = useState("Todos");

    // Guarda mensagens de sucesso ou validação.
    const [mensagem, setMensagem] = useState("");

    // Calcula quantos funcionários estão ativos.
    const totalAtivos = funcionarios.filter(
        (funcionario) => funcionario.status === "Ativo"
    ).length;

    // Filtra os funcionários de acordo com a pesquisa e o cargo.
    const funcionariosFiltrados = funcionarios.filter((funcionario) => {
        const correspondePesquisa =
            funcionario.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
            funcionario.email.toLowerCase().includes(pesquisa.toLowerCase());

        const correspondeCargo =
            filtroCargo === "Todos" || funcionario.cargo === filtroCargo;

        return correspondePesquisa && correspondeCargo;
    });

    // Cadastra um funcionário com os dados do formulário.
    function cadastrarFuncionario(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        // Impede o cadastro sem nome ou e-mail válido.
        if (!nome.trim() || !email.trim()) {
            setMensagem("Preencha o nome e o e-mail do funcionário.");
            return;
        }

        // Verifica se o e-mail já está cadastrado.
        const emailExiste = funcionarios.some(
            (funcionario) =>
                funcionario.email.toLowerCase() === email.trim().toLowerCase()
        );

        if (emailExiste) {
            setMensagem("Já existe um funcionário cadastrado com esse e-mail.");
            return;
        }

        // Cria o novo funcionário com os dados preenchidos.
        const novoFuncionario: Funcionario = {
            id: Date.now(),
            nome: nome.trim(),
            email: email.trim(),
            telefone: telefone.trim(),
            cargo,
            status: "Ativo",
        };

        // Adiciona o funcionário à lista.
        setFuncionarios((atuais) => [...atuais, novoFuncionario]);

        // Limpa o formulário após o cadastro.
        setNome("");
        setEmail("");
        setTelefone("");
        setCargo("Vendedor");
        setMostrarFormulario(false);
        setMensagem("Funcionário cadastrado com sucesso!");
    }

    // Remove um funcionário da lista pelo identificador.
    function excluirFuncionario(id: number) {
        setFuncionarios((atuais) =>
            atuais.filter((funcionario) => funcionario.id !== id)
        );

        setMensagem("Funcionário removido da lista.");
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
            {mostrarFormulario && (
                <form
                    className="equipe-formulario"
                    onSubmit={cadastrarFuncionario}
                >
                    <h2>Cadastrar funcionário</h2>
                    <p>Preencha os dados para adicionar uma pessoa à equipe.</p>

                    <div className="equipe-formulario-grid">
                        <label>
                            Nome completo *
                            <input
                                type="text"
                                value={nome}
                                onChange={(evento) => setNome(evento.target.value)}
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
                                placeholder="exemplo@email.com"
                                required
                            />
                        </label>

                        <label>
                            Telefone
                            <input
                                type="tel"
                                value={telefone}
                                onChange={(evento) => setTelefone(evento.target.value)}
                                placeholder="(12) 99999-9999"
                            />
                        </label>

                        <label>
                            Cargo
                            <select
                                value={cargo}
                                onChange={(evento) => setCargo(evento.target.value)}
                            >
                                {cargos.map((opcao) => (
                                    <option key={opcao} value={opcao}>
                                        {opcao}
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

                        <button type="submit" className="equipe-botao-principal">
                            Cadastrar funcionário
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
                                <option key={opcao} value={opcao}>
                                    {opcao}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Exibe uma mensagem se não houver resultados. */}
                {funcionariosFiltrados.length === 0 ? (
                    <div className="equipe-vazio">
                        <FontAwesomeIcon icon={faUsers} />
                        <h3>
                            {funcionarios.length === 0
                                ? "Nenhum funcionário cadastrado"
                                : "Nenhum funcionário encontrado"}
                        </h3>
                        <p>
                            {funcionarios.length === 0
                                ? "Clique em Novo funcionário para começar."
                                : "Tente alterar a pesquisa ou o filtro de cargo."}
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
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {funcionariosFiltrados.map((funcionario) => (
                                    <tr key={funcionario.id}>
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
                                                    {funcionario.telefone || "Sem telefone"}
                                                </small>
                                            </div>
                                        </td>

                                        <td>{funcionario.cargo}</td>

                                        <td>
                                            <span className="equipe-status">
                                                {funcionario.status}
                                            </span>
                                        </td>

                                        <td>
                                            <button
                                                type="button"
                                                className="equipe-botao-excluir"
                                                onClick={() =>
                                                    excluirFuncionario(funcionario.id)
                                                }
                                                aria-label={`Excluir ${funcionario.nome}`}
                                                title="Excluir funcionário"
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
        </main>
    );
}

export default Equipe;