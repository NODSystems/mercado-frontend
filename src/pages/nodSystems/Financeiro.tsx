// Financeiro: entradas, saídas e saldo do período.
// Vendas do PDV e pagamentos da equipe entram sozinhos; aluguel,
// energia, compras etc. são lançados aqui e ficam salvos no banco.
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import "../../styles/nodSystems/Financeiro.css";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError, mensagemDeErro } from "../../services/api";
import {
    carregarFinanceiro,
    dataISO,
    financeiroApi,
    moeda,
    type MovimentoFinanceiro,
} from "../../data/negocio";
import { numeroBR } from "../../utils/validacao";

type Periodo = "mes" | "mesPassado" | "30dias" | "personalizado";

const CATEGORIAS = {
    Entrada: ["Outras receitas", "Aporte", "Serviços"],
    Saída: ["Compra de mercadorias", "Aluguel", "Energia e água", "Internet e telefone", "Impostos", "Manutenção", "Outras despesas"],
};

const ORIGEM: Record<MovimentoFinanceiro["origem"], string> = {
    VENDAS: "PDV",
    EQUIPE: "Equipe",
    MANUAL: "Manual",
};

function intervaloDo(periodo: Periodo, inicioPersonalizado: string, fimPersonalizado: string) {
    const hoje = new Date();
    if (periodo === "mesPassado") {
        return { inicio: new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1), fim: new Date(hoje.getFullYear(), hoje.getMonth(), 0) };
    }
    if (periodo === "30dias") {
        const inicio = new Date(hoje);
        inicio.setDate(hoje.getDate() - 29);
        return { inicio, fim: hoje };
    }
    if (periodo === "personalizado") {
        return { inicio: new Date(`${inicioPersonalizado}T12:00:00`), fim: new Date(`${fimPersonalizado}T12:00:00`) };
    }
    return { inicio: new Date(hoje.getFullYear(), hoje.getMonth(), 1), fim: hoje };
}

function Financeiro() {
    const { empresaAtual } = useAuth();
    const empresaId = empresaAtual?.id ?? 0;

    const [periodo, setPeriodo] = useState<Periodo>("mes");
    const [inicioPers, setInicioPers] = useState(`${dataISO(new Date()).slice(0, 8)}01`);
    const [fimPers, setFimPers] = useState(dataISO(new Date()));

    const [movimentos, setMovimentos] = useState<MovimentoFinanceiro[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState("");

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [descricao, setDescricao] = useState("");
    const [tipo, setTipo] = useState<"Entrada" | "Saída">("Saída");
    const [categoria, setCategoria] = useState(CATEGORIAS.Saída[0]);
    const [valor, setValor] = useState("");
    const [data, setData] = useState(dataISO(new Date()));
    const [salvando, setSalvando] = useState(false);
    const [errosCampo, setErrosCampo] = useState<Record<string, string>>({});

    const [pesquisa, setPesquisa] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("Todos");
    const [mensagem, setMensagem] = useState("");

    const intervalo = useMemo(() => intervaloDo(periodo, inicioPers, fimPers), [periodo, inicioPers, fimPers]);

    const carregar = useCallback(async () => {
        if (!empresaId) return;
        if (intervalo.fim < intervalo.inicio) {
            setErroCarga("A data final deve ser depois da inicial.");
            setCarregando(false);
            return;
        }
        setCarregando(true);
        setErroCarga("");
        try {
            setMovimentos(await carregarFinanceiro(empresaId, intervalo.inicio, intervalo.fim));
        } catch (e) {
            setErroCarga(mensagemDeErro(e));
        } finally {
            setCarregando(false);
        }
    }, [empresaId, intervalo]);

    useEffect(() => { carregar(); }, [carregar]);

    useEffect(() => {
        if (!mensagem) return;
        const t = setTimeout(() => setMensagem(""), 5000);
        return () => clearTimeout(t);
    }, [mensagem]);

    const totalEntradas = movimentos.filter((m) => m.tipo === "Entrada").reduce((t, m) => t + m.valor, 0);
    const totalSaidas = movimentos.filter((m) => m.tipo === "Saída").reduce((t, m) => t + m.valor, 0);
    const saldo = totalEntradas - totalSaidas;
    const vendasPeriodo = movimentos.filter((m) => m.origem === "VENDAS").reduce((t, m) => t + m.valor, 0);

    const filtrados = movimentos.filter((m) => {
        const termo = pesquisa.trim().toLowerCase();
        const texto = !termo || m.descricao.toLowerCase().includes(termo) || m.categoria.toLowerCase().includes(termo);
        return texto && (filtroTipo === "Todos" || m.tipo === filtroTipo);
    });

    function trocarTipo(novo: "Entrada" | "Saída") {
        setTipo(novo);
        setCategoria(CATEGORIAS[novo][0]);
    }

    async function cadastrarLancamento(evento: FormEvent<HTMLFormElement>) {
        evento.preventDefault();
        const erros: Record<string, string> = {};
        const valorNumerico = numeroBR(valor);

        if (descricao.trim().length < 2) erros.descricao = "Informe a descrição.";
        if (!Number.isFinite(valorNumerico) || valorNumerico <= 0) erros.valor = "Informe um valor maior que zero.";
        if (!data) erros.data = "Informe a data.";
        setErrosCampo(erros);
        if (Object.keys(erros).length > 0) return;

        setSalvando(true);
        try {
            await financeiroApi.lancar(empresaId, {
                tipo: tipo === "Entrada" ? "ENTRADA" : "SAIDA",
                categoria,
                descricao: descricao.trim(),
                valor: Math.round(valorNumerico * 100) / 100,
                data,
            });
            setDescricao("");
            setValor("");
            setMostrarFormulario(false);
            setMensagem("Lançamento salvo.");
            carregar();
        } catch (e) {
            if (e instanceof ApiError && e.erros.length) {
                setErrosCampo(Object.fromEntries(e.erros.map((x) => [x.campo, x.mensagem])));
            } else {
                setMensagem(mensagemDeErro(e));
            }
        } finally {
            setSalvando(false);
        }
    }

    async function excluirLancamento(item: MovimentoFinanceiro) {
        if (!item.lancamentoId) return;
        if (!window.confirm(`Excluir o lançamento “${item.descricao}”?`)) return;
        try {
            await financeiroApi.apagar(empresaId, item.lancamentoId);
            setMensagem("Lançamento excluído.");
            carregar();
        } catch (e) {
            setMensagem(mensagemDeErro(e));
        }
    }

    const formatarData = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(0, 4)}`;

    return (
        <main className="financeiro-page">
            <header className="financeiro-header">
                <div>
                    <span className="financeiro-subtitulo">GESTÃO DO NEGÓCIO</span>
                    <h1>Financeiro</h1>
                    <p>Vendas do PDV e pagamentos da equipe entram sozinhos. Lance aqui as outras contas.</p>
                </div>

                <button
                    type="button"
                    className="financeiro-botao-principal"
                    onClick={() => {
                        setMensagem("");
                        setErrosCampo({});
                        setMostrarFormulario(!mostrarFormulario);
                    }}
                >
                    + Novo lançamento
                </button>
            </header>

            {mensagem && <div className="financeiro-mensagem" role="status">{mensagem}</div>}

            <section className="financeiro-periodo">
                <label>
                    Período
                    <select value={periodo} onChange={(e) => setPeriodo(e.target.value as Periodo)} aria-label="Período">
                        <option value="mes">Este mês</option>
                        <option value="mesPassado">Mês passado</option>
                        <option value="30dias">Últimos 30 dias</option>
                        <option value="personalizado">Personalizado</option>
                    </select>
                </label>
                {periodo === "personalizado" && (
                    <>
                        <input type="date" value={inicioPers} onChange={(e) => setInicioPers(e.target.value)} aria-label="Data inicial" />
                        <span>até</span>
                        <input type="date" value={fimPers} min={inicioPers} onChange={(e) => setFimPers(e.target.value)} aria-label="Data final" />
                    </>
                )}
            </section>

            <section className="financeiro-resumo">
                <article className="financeiro-card">
                    <span>Saldo do período</span>
                    <strong className={saldo < 0 ? "financeiro-valor-saida" : ""}>{moeda(saldo)}</strong>
                    <small>Entradas menos saídas</small>
                </article>

                <article className="financeiro-card financeiro-card--entrada">
                    <span>Total de entradas</span>
                    <strong>{moeda(totalEntradas)}</strong>
                    <small>{moeda(vendasPeriodo)} em vendas do PDV</small>
                </article>

                <article className="financeiro-card financeiro-card--saida">
                    <span>Total de saídas</span>
                    <strong>{moeda(totalSaidas)}</strong>
                    <small>Equipe e contas lançadas</small>
                </article>
            </section>

            {mostrarFormulario && (
                <form className="financeiro-formulario" onSubmit={cadastrarLancamento} noValidate>
                    <h2>Novo lançamento</h2>

                    <div className="financeiro-formulario-grid">
                        <label>
                            Tipo de lançamento
                            <select value={tipo} onChange={(e) => trocarTipo(e.target.value as "Entrada" | "Saída")}>
                                <option value="Saída">Saída (despesa)</option>
                                <option value="Entrada">Entrada (receita)</option>
                            </select>
                        </label>

                        <label>
                            Categoria
                            <select value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                                {CATEGORIAS[tipo].map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </label>

                        <label>
                            Descrição
                            <input
                                type="text"
                                value={descricao}
                                onChange={(e) => setDescricao(e.target.value.slice(0, 150))}
                                placeholder={tipo === "Saída" ? "Ex.: Aluguel de novembro" : "Ex.: Serviço de entrega"}
                                aria-invalid={Boolean(errosCampo.descricao)}
                            />
                            {errosCampo.descricao && <small className="financeiro-erro">{errosCampo.descricao}</small>}
                        </label>

                        <label>
                            Valor (R$)
                            <input
                                inputMode="decimal"
                                value={valor}
                                onChange={(e) => setValor(e.target.value)}
                                placeholder="0,00"
                                aria-invalid={Boolean(errosCampo.valor)}
                            />
                            {errosCampo.valor && <small className="financeiro-erro">{errosCampo.valor}</small>}
                        </label>

                        <label>
                            Data
                            <input type="date" value={data} onChange={(e) => setData(e.target.value)} aria-invalid={Boolean(errosCampo.data)} />
                            {errosCampo.data && <small className="financeiro-erro">{errosCampo.data}</small>}
                        </label>
                    </div>

                    <div className="financeiro-formulario-acoes">
                        <button type="button" className="financeiro-botao-secundario" onClick={() => setMostrarFormulario(false)}>
                            Cancelar
                        </button>
                        <button type="submit" className="financeiro-botao-principal" disabled={salvando}>
                            {salvando ? "Salvando..." : "Salvar lançamento"}
                        </button>
                    </div>
                </form>
            )}

            <section className="financeiro-lista">
                <div className="financeiro-lista-header">
                    <div>
                        <h2>Movimentações</h2>
                        <p>Tudo que entrou e saiu no período.</p>
                    </div>

                    <div className="financeiro-filtros">
                        <input
                            type="search"
                            value={pesquisa}
                            onChange={(e) => setPesquisa(e.target.value)}
                            placeholder="Pesquisar..."
                            aria-label="Pesquisar movimentações"
                        />
                        <select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} aria-label="Filtrar por tipo">
                            <option value="Todos">Todos os tipos</option>
                            <option value="Entrada">Entradas</option>
                            <option value="Saída">Saídas</option>
                        </select>
                    </div>
                </div>

                {carregando ? (
                    <div className="financeiro-vazio"><p>Carregando...</p></div>
                ) : erroCarga ? (
                    <div className="financeiro-vazio">
                        <h3>Não foi possível carregar</h3>
                        <p>{erroCarga}</p>
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="financeiro-vazio">
                        <h3>{pesquisa || filtroTipo !== "Todos" ? "Nada encontrado" : "Nenhuma movimentação no período"}</h3>
                        <p>
                            {pesquisa || filtroTipo !== "Todos"
                                ? "Tente alterar os filtros."
                                : "As vendas do PDV aparecem aqui sozinhas. Lance aluguel, contas e compras em “Novo lançamento”."}
                        </p>
                    </div>
                ) : (
                    <div className="financeiro-tabela-container">
                        <table className="financeiro-tabela">
                            <thead>
                                <tr>
                                    <th>Data</th>
                                    <th>Descrição</th>
                                    <th>Categoria</th>
                                    <th>Origem</th>
                                    <th>Valor</th>
                                    <th aria-label="Ações" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtrados.map((item) => (
                                    <tr key={item.id}>
                                        <td>{formatarData(item.data)}</td>
                                        <td>{item.descricao}</td>
                                        <td>{item.categoria}</td>
                                        <td><span className="financeiro-origem">{ORIGEM[item.origem]}</span></td>
                                        <td className={item.tipo === "Entrada" ? "financeiro-valor-entrada" : "financeiro-valor-saida"}>
                                            {item.tipo === "Saída" ? "− " : "+ "}
                                            {moeda(item.valor)}
                                        </td>
                                        <td>
                                            {item.origem === "MANUAL" && (
                                                <button type="button" className="financeiro-botao-excluir" onClick={() => excluirLancamento(item)}>
                                                    Excluir
                                                </button>
                                            )}
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
