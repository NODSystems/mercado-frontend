// Painel lateral de um produto: entrada, saída ou ajuste de estoque
// e o histórico de tudo que mexeu na quantidade (inclusive vendas).
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";

import { ApiError, formatarMoeda, mensagemDeErro } from "../../services/api";
import {
    produtosApi,
    formatarQuantidade,
    unidadeFracionada,
    type Movimentacao,
    type Produto,
    type TipoMovimentacao,
} from "../../services/produtos";
import { numeroBR } from "../../utils/validacao";

import "../../styles/components/PainelEstoque.css";

type Props = {
    empresaId: number;
    produto: Produto;
    podeMovimentar: boolean;
    onFechar: () => void;
    onAlterado: (mensagem: string) => void;
};

type Tipo = "ENTRADA" | "SAIDA" | "AJUSTE";

const NOMES_TIPO: Record<TipoMovimentacao, string> = {
    ENTRADA: "Entrada",
    SAIDA: "Saída",
    AJUSTE: "Ajuste (contagem)",
    VENDA: "Venda",
    CANCELAMENTO_VENDA: "Venda cancelada",
};

const MOTIVOS_SAIDA = ["Vencido", "Avariado / quebrado", "Consumo interno", "Devolução ao fornecedor", "Furto / perda"];

function dataHora(valor: string) {
    return new Date(valor).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function PainelMovimentacao({ empresaId, produto: inicial, podeMovimentar, onFechar, onAlterado }: Props) {
    const [produto, setProduto] = useState(inicial);
    const [tipo, setTipo] = useState<Tipo>("ENTRADA");
    const [quantidade, setQuantidade] = useState("");
    const [custo, setCusto] = useState("");
    const [motivo, setMotivo] = useState("");
    const [erro, setErro] = useState("");
    const [sucesso, setSucesso] = useState("");
    const [salvando, setSalvando] = useState(false);

    const [historico, setHistorico] = useState<Movimentacao[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroHistorico, setErroHistorico] = useState("");

    const carregarHistorico = useCallback(async () => {
        setCarregando(true);
        setErroHistorico("");
        try {
            const r = await produtosApi.movimentacoes(empresaId, produto.id);
            setHistorico(r.movimentacoes);
        } catch (e) {
            setErroHistorico(mensagemDeErro(e));
        } finally {
            setCarregando(false);
        }
    }, [empresaId, produto.id]);

    useEffect(() => { carregarHistorico(); }, [carregarHistorico]);

    useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [onFechar]);

    const atual = Number(produto.estoque_atual);
    const qtd = numeroBR(quantidade);
    const previsto = !Number.isFinite(qtd) ? null : tipo === "ENTRADA" ? atual + qtd : tipo === "SAIDA" ? atual - qtd : qtd;

    async function registrar(evento: FormEvent) {
        evento.preventDefault();
        setErro("");
        setSucesso("");

        if (!Number.isFinite(qtd) || qtd < 0 || (tipo !== "AJUSTE" && qtd === 0)) {
            setErro("Informe uma quantidade válida.");
            return;
        }
        if (!unidadeFracionada(produto.unidade) && !Number.isInteger(qtd)) {
            setErro("Este produto é vendido por unidade: use número inteiro.");
            return;
        }
        if (tipo !== "ENTRADA" && motivo.trim().length < 3) {
            setErro("Informe o motivo.");
            return;
        }
        const custoNum = custo.trim() ? numeroBR(custo) : null;
        if (custoNum !== null && (!Number.isFinite(custoNum) || custoNum < 0)) {
            setErro("Custo inválido.");
            return;
        }

        setSalvando(true);
        try {
            await produtosApi.movimentar(empresaId, produto.id, {
                tipo,
                quantidade: qtd,
                custoUnitario: tipo === "ENTRADA" ? custoNum : undefined,
                motivo: motivo.trim() || undefined,
            });
            const { produto: novo } = await produtosApi.buscar(empresaId, produto.id);
            setProduto(novo);
            setQuantidade("");
            setCusto("");
            setMotivo("");
            const texto = `${NOMES_TIPO[tipo].split(" ")[0]} registrada. Estoque agora: ${formatarQuantidade(novo.estoque_atual, novo.unidade)}.`;
            setSucesso(texto);
            onAlterado(texto);
            carregarHistorico();
        } catch (e) {
            setErro(e instanceof ApiError ? mensagemDeErro(e) : "Não foi possível registrar.");
        } finally {
            setSalvando(false);
        }
    }

    const baixo = atual <= Number(produto.estoque_minimo);

    return (
        <div className="painel-estoque-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
            <aside className="painel-estoque" role="dialog" aria-modal="true" aria-label={`Estoque de ${produto.nome}`}>
                <header className="painel-estoque-cabecalho">
                    <div>
                        <span>{produto.codigo_barras || "SEM CÓDIGO"}</span>
                        <strong>{produto.nome}</strong>
                    </div>
                    <button type="button" className="painel-estoque-fechar" onClick={onFechar} aria-label="Fechar">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <div className="painel-estoque-corpo">
                    <div className="painel-estoque-saldo">
                        <div>
                            <span>Em estoque</span>
                            <strong className={baixo ? "baixo" : ""}>{formatarQuantidade(atual, produto.unidade)}</strong>
                        </div>
                        <div>
                            <span>Mínimo</span>
                            <strong>{formatarQuantidade(produto.estoque_minimo, produto.unidade)}</strong>
                        </div>
                        <div>
                            <span>Custo</span>
                            <strong>{produto.preco_custo ? formatarMoeda(produto.preco_custo) : "—"}</strong>
                        </div>
                    </div>

                    {podeMovimentar && (
                        <form className="painel-estoque-mov" onSubmit={registrar} noValidate>
                            <div className="painel-estoque-tipos" role="tablist">
                                {(["ENTRADA", "SAIDA", "AJUSTE"] as Tipo[]).map((t) => (
                                    <button
                                        key={t}
                                        type="button"
                                        role="tab"
                                        aria-selected={tipo === t}
                                        className={tipo === t ? "ativo" : ""}
                                        onClick={() => { setTipo(t); setErro(""); setSucesso(""); }}
                                    >
                                        {t === "ENTRADA" ? "Entrada" : t === "SAIDA" ? "Saída" : "Ajuste"}
                                    </button>
                                ))}
                            </div>

                            <p className="painel-estoque-ajuda">
                                {tipo === "ENTRADA" && "Chegou mercadoria do fornecedor."}
                                {tipo === "SAIDA" && "Perda, vencimento, consumo interno… (vendas saem sozinhas pelo PDV)."}
                                {tipo === "AJUSTE" && "Contou a prateleira? Informe a quantidade real; o sistema corrige a diferença."}
                            </p>

                            <div className="painel-estoque-linha">
                                <label className="painel-estoque-campo">
                                    {tipo === "AJUSTE" ? "Quantidade contada" : "Quantidade"} ({produto.unidade.toLowerCase()})
                                    <input value={quantidade} onChange={(e) => setQuantidade(e.target.value)} inputMode="decimal" placeholder="0" autoFocus />
                                </label>
                                {tipo === "ENTRADA" && (
                                    <label className="painel-estoque-campo">
                                        Custo unitário (opcional)
                                        <input value={custo} onChange={(e) => setCusto(e.target.value)} inputMode="decimal" placeholder="0,00" />
                                    </label>
                                )}
                            </div>

                            <label className="painel-estoque-campo">
                                Motivo {tipo === "ENTRADA" && "(opcional)"}
                                <input
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value.slice(0, 255))}
                                    list={tipo === "SAIDA" ? "motivos-saida" : undefined}
                                    placeholder={tipo === "ENTRADA" ? "Ex.: NF 1234 – Distribuidora X" : tipo === "SAIDA" ? "Ex.: Vencido" : "Ex.: Contagem de inventário"}
                                />
                                <datalist id="motivos-saida">
                                    {MOTIVOS_SAIDA.map((m) => <option key={m} value={m} />)}
                                </datalist>
                            </label>

                            {previsto !== null && quantidade.trim() && (
                                <p className={`painel-estoque-previsto ${previsto < 0 ? "negativo" : ""}`}>
                                    {formatarQuantidade(atual, produto.unidade)} → <strong>{formatarQuantidade(previsto, produto.unidade)}</strong>
                                </p>
                            )}

                            {erro && <div className="painel-estoque-alerta" role="alert">{erro}</div>}
                            {sucesso && <div className="painel-estoque-ok" role="status">{sucesso}</div>}

                            <button type="submit" className="painel-estoque-registrar" disabled={salvando}>
                                {salvando ? "Registrando…" : "Registrar"}
                            </button>
                        </form>
                    )}

                    <section className="painel-estoque-historico">
                        <h3>Histórico</h3>
                        {carregando ? (
                            <p className="painel-estoque-ajuda">Carregando…</p>
                        ) : erroHistorico ? (
                            <div className="painel-estoque-alerta">{erroHistorico}</div>
                        ) : historico.length === 0 ? (
                            <p className="painel-estoque-ajuda">Nenhuma movimentação ainda.</p>
                        ) : (
                            <ul>
                                {historico.map((m) => {
                                    const q = Number(m.quantidade);
                                    return (
                                        <li key={m.id}>
                                            <div>
                                                <strong>{NOMES_TIPO[m.tipo]}</strong>
                                                <span>{m.motivo || "—"}</span>
                                                <small>{dataHora(m.data_criacao)}{m.usuario_nome ? ` · ${m.usuario_nome}` : ""}</small>
                                            </div>
                                            <div className="painel-estoque-hist-qtd">
                                                <strong className={q >= 0 ? "positivo" : "negativo"}>
                                                    {q >= 0 ? "+" : "−"}{formatarQuantidade(Math.abs(q), produto.unidade)}
                                                </strong>
                                                <small>{formatarQuantidade(m.estoque_anterior, produto.unidade)} → {formatarQuantidade(m.estoque_posterior, produto.unidade)}</small>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </section>
                </div>
            </aside>
        </div>
    );
}

export default PainelMovimentacao;
