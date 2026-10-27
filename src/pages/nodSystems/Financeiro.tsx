// Importa o useState para controlar os lançamentos financeiros.
import { useState, type FormEvent } from "react";

// Importa o CSS exclusivo do módulo financeiro.
import "../../styles/nodSystems/Financeiro.css";

// Define a estrutura de cada lançamento financeiro.
interface Lancamento {
    id: number;
    descricao: string;
    categoria: string;
    tipo: "Entrada" | "Saída";
    valor: number;
    data: string;
}

function Financeiro() {
    // Guarda todos os lançamentos cadastrados nesta sessão.
    const [lancamentos, setLancamentos] = useState<Lancamento[]>([]);

    // Controla a exibição do formulário de novo lançamento.
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Guarda os valores preenchidos no formulário.
    const [descricao, setDescricao] = useState("");
    const [categoria, setCategoria] = useState("Vendas");
    const [tipo, setTipo] = useState<"Entrada" | "Saída">("Entrada");
    const [valor, setValor] = useState("");
    const [data, setData] = useState(
        new Date().toLocaleDateString("en-CA")
    );

    // Guarda os filtros utilizados na listagem.
    const [pesquisa, setPesquisa] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [mensagem, setMensagem] = useState("");

    // Formata valores para a moeda brasileira.
    function formatarMoeda(valor: number) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    // Soma todas as entradas financeiras.
    const totalEntradas = lancamentos
        .filter((item) => item.tipo === "Entrada")
        .reduce((total, item) => total + item.valor, 0);

    // Soma todas as saídas financeiras.
    const totalSaidas = lancamentos
        .filter((item) => item.tipo === "Saída")
        .reduce((total, item) => total + item.valor, 0);

    // Calcula o saldo com base nas entradas e saídas.
    const saldo = totalEntradas - totalSaidas;

    // Aplica os filtros de pesquisa e tipo aos lançamentos.
    const lancamentosFiltrados = lancamentos.filter((item) => {
        const correspondePesquisa =
            item.descricao.toLowerCase().includes(pesquisa.toLowerCase()) ||
            item.categoria.toLowerCase().includes(pesquisa.toLowerCase());

        const correspondeTipo =
            filtroTipo === "Todos" || item.tipo === filtroTipo;

        return correspondePesquisa && correspondeTipo;
    });

    // Cadastra um novo lançamento financeiro.
    function cadastrarLancamento(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();

        // Converte o valor digitado para número.
        const valorNumerico = Number(valor.replace(",", "."));

        // Impede valores inválidos ou iguais a zero.
        if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) {
            setMensagem("Informe um valor maior que zero.");
            return;
        }

        // Monta o novo lançamento com os dados do formulário.
        const novoLancamento: Lancamento = {
            id: Date.now(),
            descricao: descricao.trim(),
            categoria,
            tipo,
            valor: valorNumerico,
            data,
        };

        // Adiciona o lançamento à lista existente.
        setLancamentos((atuais) => [novoLancamento, ...atuais]);

        // Limpa os campos depois do cadastro.
        setDescricao("");
        setCategoria("Vendas");
        setTipo("Entrada");
        setValor("");
        setData(new Date().toLocaleDateString("en-CA"));
        setMostrarFormulario(false);
        setMensagem("");
    }

    // Exclui um lançamento pelo identificador.
    function excluirLancamento(id: number) {
        setLancamentos((atuais) =>
            atuais.filter((item) => item.id !== id)
        );
    }

    // Exibe a data em formato brasileiro na tabela.
    function formatarData(dataLancamento: string) {
        const [ano, mes, dia] = dataLancamento.split("-");
        return `${dia}/${mes}/${ano}`;
    }

    return (
        <main className="financeiro-page">
            {/* Cabeçalho do módulo financeiro. */}
            <header className="financeiro-header">
                <div>
                    <span className="financeiro-subtitulo">
                        GESTÃO DO NEGÓCIO
                    </span>
                    <h1>Financeiro</h1>
                    <p>Acompanhe as entradas, saídas e o saldo do negócio.</p>
                </div>

                {/* Abre o formulário para cadastrar um lançamento. */}
                <button
                    type="button"
                    className="financeiro-botao-principal"
                    onClick={() => {
                        setMensagem("");
                        setMostrarFormulario(!mostrarFormulario);
                    }}
                >
                    + Novo lançamento
                </button>
            </header>

            {/* Mostra mensagens de validação do formulário. */}
            {mensagem && (
                <div className="financeiro-mensagem" role="status">
                    {mensagem}
                </div>
            )}

            {/* Cards com os principais indicadores financeiros. */}
            <section className="financeiro-resumo">
                <article className="financeiro-card">
                    <span>Saldo atual</span>
                    <strong>{formatarMoeda(saldo)}</strong>
                    <small>Entradas menos saídas</small>
                </article>

                <article className="financeiro-card financeiro-card--entrada">
                    <span>Total de entradas</span>
                    <strong>{formatarMoeda(totalEntradas)}</strong>
                    <small>Receitas registradas</small>
                </article>

                <article className="financeiro-card financeiro-card--saida">
                    <span>Total de saídas</span>
                    <strong>{formatarMoeda(totalSaidas)}</strong>
                    <small>Despesas registradas</small>
                </article>
            </section>

            {/* Formulário para adicionar receitas ou despesas. */}
            {mostrarFormulario && (
                <form
                    className="financeiro-formulario"
                    onSubmit={cadastrarLancamento}
                >
                    <h2>Novo lançamento</h2>

                    <div className="financeiro-formulario-grid">
                        <label>
                            Descrição
                            <input
                                type="text"
                                value={descricao}
                                onChange={(evento) =>
                                    setDescricao(evento.target.value)
                                }
                                placeholder="Ex.: Compra de mercadorias"
                                required
                            />
                        </label>

                        <label>
                            Tipo de lançamento
                            <select
                                value={tipo}
                                onChange={(evento) =>
                                    setTipo(evento.target.value as "Entrada" | "Saída")
                                }
                            >
                                <option value="Entrada">Entrada</option>
                                <option value="Saída">Saída</option>
                            </select>
                        </label>

                        <label>
                            Categoria
                            <select
                                value={categoria}
                                onChange={(evento) =>
                                    setCategoria(evento.target.value)
                                }
                            >
                                <option value="Vendas">Vendas</option>
                                <option value="Compras">Compras</option>
                                <option value="Contas">Contas</option>
                                <option value="Salários">Salários</option>
                                <option value="Serviços">Serviços</option>
                                <option value="Outros">Outros</option>
                            </select>
                        </label>

                        <label>
                            Valor (R$)
                            <input
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={valor}
                                onChange={(evento) =>
                                    setValor(evento.target.value)
                                }
                                placeholder="0,00"
                                required
                            />
                        </label>

                        <label>
                            Data do lançamento
                            <input
                                type="date"
                                value={data}
                                onChange={(evento) =>
                                    setData(evento.target.value)
                                }
                                required
                            />
                        </label>
                    </div>

                    {/* Botões para confirmar ou cancelar o cadastro. */}
                    <div className="financeiro-formulario-acoes">
                        <button
                            type="button"
                            className="financeiro-botao-secundario"
                            onClick={() => {
                                setMostrarFormulario(false);
                                setMensagem("");
                            }}
                        >
                            Cancelar
                        </button>

                        <button
                            type="submit"
                            className="financeiro-botao-principal"
                        >
                            Salvar lançamento
                        </button>
                    </div>
                </form>
            )}

            {/* Área de consulta dos lançamentos cadastrados. */}
            <section className="financeiro-lista">
                <div className="financeiro-lista-header">
                    <div>
                        <h2>Lançamentos</h2>
                        <p>Consulte as movimentações financeiras.</p>
                    </div>

                    {/* Pesquisa e filtro da tabela. */}
                    <div className="financeiro-filtros">
                        <input
                            type="search"
                            value={pesquisa}
                            onChange={(evento) =>
                                setPesquisa(evento.target.value)
                            }
                            placeholder="Pesquisar lançamento..."
                            aria-label="Pesquisar lançamentos"
                        />

                        <select
                            value={filtroTipo}
                            onChange={(evento) =>
                                setFiltroTipo(evento.target.value)
                            }
                            aria-label="Filtrar por tipo"
                        >
                            <option value="Todos">Todos os tipos</option>
                            <option value="Entrada">Entradas</option>
                            <option value="Saída">Saídas</option>
                        </select>
                    </div>
                </div>

                {/* Exibe uma mensagem quando não existem resultados. */}
                {lancamentosFiltrados.length === 0 ? (
                    <div className="financeiro-vazio">
                        <h3>
                            {pesquisa || filtroTipo !== "Todos"
                                ? "Nenhum lançamento encontrado"
                                : "Nenhum lançamento cadastrado"}
                        </h3>
                        <p>
                            {pesquisa || filtroTipo !== "Todos"
                                ? "Tente alterar os filtros da pesquisa."
                                : "Cadastre uma entrada ou saída para começar."}
                        </p>
                    </div>
                ) : (
                    /* Tabela com os dados dos lançamentos. */
                    <div className="financeiro-tabela-container">
                        <table className="financeiro-tabela">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Tipo</th>
                                    <th>Valor</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {lancamentosFiltrados.map((item) => (
                                    <tr key={item.id}>
                                        <td>{formatarData(item.data)}</td>
                                        <td>{item.descricao}</td>
                                        <td>{item.categoria}</td>
                                        <td>
                                            <span
                                                className={
                                                    item.tipo === "Entrada"
                                                        ? "financeiro-status financeiro-status--entrada"
                                                        : "financeiro-status financeiro-status--saida"
                                                }
                                            >
                                                {item.tipo}
                                            </span>
                                        </td>
                                        <td
                                            className={
                                                item.tipo === "Entrada"
                                                    ? "financeiro-valor-entrada"
                                                    : "financeiro-valor-saida"
                                            }
                                        >
                                            {item.tipo === "Saída" ? "− " : "+ "}
                                            {formatarMoeda(item.valor)}
                                        </td>
                                        <td>
                                            {/* Remove o lançamento selecionado. */}
                                            <button
                                                type="button"
                                                className="financeiro-botao-excluir"
                                                onClick={() =>
                                                    excluirLancamento(item.id)
                                                }
                                            >
                                                Excluir
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

export default Financeiro;
