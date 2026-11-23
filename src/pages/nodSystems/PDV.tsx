// Ponto de Venda ligado ao backend.
//
// Produto entra no carrinho de três jeitos:
//  - leitor USB: bipa e pronto (funciona mesmo sem clicar em nada);
//  - câmera do celular/webcam: botão "Câmera";
//  - busca por nome ou código digitado + Enter.
// Ao finalizar, o backend confere estoque e preços, baixa o estoque
// e grava a venda. Atalhos: F2 busca, F4 câmera, F9 finaliza.
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBarcode, faTrash, faCheck, faRotateLeft } from "@fortawesome/free-solid-svg-icons";

import "../../styles/nodSystems/PDV.css";
import { useAuth } from "../../contexts/AuthContext";
import { ApiError, formatarMoeda, mensagemDeErro } from "../../services/api";
import {
    produtosApi,
    vendasApi,
    formatarQuantidade,
    unidadeFracionada,
    NOMES_PAGAMENTO,
    type FormaPagamento,
    type Produto,
    type Venda,
} from "../../services/produtos";
import { numeroBR } from "../../utils/validacao";
import { useLeitorUSB } from "../../hooks/useLeitorUSB";
import LeitorCodigo from "../../components/LeitorCodigo";

interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
}

type Mensagem = { texto: string; tipo: "info" | "erro" | "ok" } | null;

const FORMAS: FormaPagamento[] = ["DINHEIRO", "PIX", "DEBITO", "CREDITO"];
const centavos = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;
const ativo = (p: Produto) => p.ativo === true || p.ativo === 1;

function hora(valor: string) {
    return new Date(valor).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function PDV() {
    const { pode, empresaAtual } = useAuth();
    const empresaId = empresaAtual?.id ?? 0;

    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState("");

    const [pesquisa, setPesquisa] = useState("");
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);
    const [pagamento, setPagamento] = useState<FormaPagamento>("DINHEIRO");
    const [valorRecebido, setValorRecebido] = useState("");
    const [desconto, setDesconto] = useState("");
    const [mensagem, setMensagem] = useState<Mensagem>(null);
    const [finalizando, setFinalizando] = useState(false);

    const [lendo, setLendo] = useState(false);
    // Produto vendido por peso aguardando a quantidade (substituir = editando item do carrinho)
    const [pesando, setPesando] = useState<{ produto: Produto; substituir: boolean } | null>(null);
    const [peso, setPeso] = useState("");
    const [concluida, setConcluida] = useState<Venda | null>(null);

    const [vendasHoje, setVendasHoje] = useState<Venda[]>([]);
    const [cancelando, setCancelando] = useState<Venda | null>(null);
    const [motivoCancelamento, setMotivoCancelamento] = useState("");
    const [erroCancelamento, setErroCancelamento] = useState("");

    const campoPesquisa = useRef<HTMLInputElement>(null);
    const podeVerVendas = pode("vendas.visualizar");
    const podeCancelar = pode("vendas.cancelar");

    const carregarProdutos = useCallback(async () => {
        if (!empresaId) return;
        try {
            const r = await produtosApi.listar(empresaId);
            setProdutos(r.produtos.filter(ativo));
            setErroCarga("");
        } catch (e) {
            setErroCarga(mensagemDeErro(e));
        } finally {
            setCarregando(false);
        }
    }, [empresaId]);

    const carregarVendas = useCallback(async () => {
        if (!empresaId || !podeVerVendas) return;
        try {
            const r = await vendasApi.listar(empresaId);
            setVendasHoje(r.vendas);
        } catch {
            /* a lista de vendas é complementar; o caixa continua funcionando */
        }
    }, [empresaId, podeVerVendas]);

    useEffect(() => { carregarProdutos(); carregarVendas(); }, [carregarProdutos, carregarVendas]);

    // ----- Carrinho -----

    const noCarrinho = (id: number) => carrinho.find((i) => i.produto.id === id)?.quantidade ?? 0;

    const colocar = useCallback((produto: Produto, quantidade: number) => {
        const disponivel = Number(produto.estoque_atual);
        const atual = carrinho.find((i) => i.produto.id === produto.id)?.quantidade ?? 0;
        const nova = Math.round((atual + quantidade) * 1000) / 1000;

        if (nova > disponivel) {
            setMensagem({ texto: `Só há ${formatarQuantidade(disponivel, produto.unidade)} de “${produto.nome}” em estoque.`, tipo: "erro" });
            return;
        }

        setCarrinho((itens) => itens.some((i) => i.produto.id === produto.id)
            ? itens.map((i) => (i.produto.id === produto.id ? { ...i, quantidade: nova } : i))
            : [...itens, { produto, quantidade }]);
        setMensagem(null);
    }, [carrinho]);

    // KG/L pergunta o peso; UN/CX entra 1
    const adicionar = useCallback((produto: Produto) => {
        if (unidadeFracionada(produto.unidade)) {
            setPeso("");
            setPesando({ produto, substituir: false });
            return;
        }
        colocar(produto, 1);
    }, [colocar]);

    const adicionarPorCodigo = useCallback(async (codigo: string) => {
        setLendo(false);
        const limpo = codigo.replace(/\D/g, "");
        if (!limpo) return;

        let produto = produtos.find((p) => p.codigo_barras === limpo);
        if (!produto) {
            try {
                produto = (await produtosApi.porCodigo(empresaId, limpo)).produto;
                setProdutos((lista) => (lista.some((p) => p.id === produto!.id) ? lista : [...lista, produto!]));
            } catch (e) {
                setMensagem({
                    texto: e instanceof ApiError && e.status === 404
                        ? `Nenhum produto com o código ${limpo}. Cadastre-o no Estoque.`
                        : mensagemDeErro(e),
                    tipo: "erro",
                });
                return;
            }
        }
        adicionar(produto);
        setPesquisa("");
    }, [produtos, empresaId, adicionar]);

    useLeitorUSB(adicionarPorCodigo, !lendo && !pesando && !concluida && !cancelando);

    function alterarQuantidade(item: ItemCarrinho, quantidade: number) {
        if (quantidade <= 0) {
            remover(item.produto.id);
            return;
        }
        if (quantidade > Number(item.produto.estoque_atual)) {
            setMensagem({ texto: `Só há ${formatarQuantidade(item.produto.estoque_atual, item.produto.unidade)} em estoque.`, tipo: "erro" });
            return;
        }
        setCarrinho((itens) => itens.map((i) => (i.produto.id === item.produto.id ? { ...i, quantidade } : i)));
        setMensagem(null);
    }

    function remover(id: number) {
        setCarrinho((itens) => itens.filter((i) => i.produto.id !== id));
        setMensagem(null);
    }

    function limparVenda() {
        setCarrinho([]);
        setValorRecebido("");
        setDesconto("");
        setPagamento("DINHEIRO");
        setMensagem(null);
        campoPesquisa.current?.focus();
    }

    function confirmarPeso(evento: FormEvent) {
        evento.preventDefault();
        if (!pesando) return;
        const q = Math.round(numeroBR(peso) * 1000) / 1000;
        if (!Number.isFinite(q) || q <= 0) return;
        const item = carrinho.find((i) => i.produto.id === pesando.produto.id);
        if (pesando.substituir && item) alterarQuantidade(item, q);
        else colocar(pesando.produto, q);
        setPesando(null);
        campoPesquisa.current?.focus();
    }

    // ----- Busca -----

    const filtrados = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();
        const lista = termo
            ? produtos.filter((p) => p.nome.toLowerCase().includes(termo) || (p.codigo_barras ?? "").includes(termo))
            : produtos;
        return lista.slice(0, 60);
    }, [produtos, pesquisa]);

    function aoTeclarPesquisa(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key !== "Enter") return;
        e.preventDefault();
        const texto = pesquisa.trim();
        if (/^\d{8,14}$/.test(texto)) {
            adicionarPorCodigo(texto);
        } else if (filtrados.length === 1) {
            adicionar(filtrados[0]);
            setPesquisa("");
        }
    }

    // ----- Totais -----

    const subtotal = centavos(carrinho.reduce((t, i) => t + centavos(Number(i.produto.preco_venda) * i.quantidade), 0));
    const valorDesconto = desconto.trim() ? numeroBR(desconto) : 0;
    const descontoValido = Number.isFinite(valorDesconto) && valorDesconto >= 0 && valorDesconto <= subtotal;
    const total = centavos(subtotal - (descontoValido ? valorDesconto : 0));
    const recebido = numeroBR(valorRecebido);
    const troco = pagamento === "DINHEIRO" && Number.isFinite(recebido) ? Math.max(0, centavos(recebido - total)) : 0;
    const qtdItens = carrinho.reduce((t, i) => t + (unidadeFracionada(i.produto.unidade) ? 1 : i.quantidade), 0);

    // ----- Finalizar -----

    async function finalizarVenda() {
        if (finalizando) return;
        if (carrinho.length === 0) {
            setMensagem({ texto: "Adicione pelo menos um produto à venda.", tipo: "erro" });
            return;
        }
        if (!descontoValido) {
            setMensagem({ texto: "O desconto não pode ser maior que o total.", tipo: "erro" });
            return;
        }
        if (pagamento === "DINHEIRO" && (!Number.isFinite(recebido) || recebido < total)) {
            setMensagem({ texto: "O valor recebido é menor que o total.", tipo: "erro" });
            document.getElementById("pdv-recebido")?.focus();
            return;
        }

        setFinalizando(true);
        try {
            const { venda } = await vendasApi.registrar(empresaId, {
                itens: carrinho.map((i) => ({ produtoId: i.produto.id, quantidade: i.quantidade })),
                formaPagamento: pagamento,
                desconto: valorDesconto || 0,
                valorRecebido: pagamento === "DINHEIRO" ? recebido : undefined,
            });
            setConcluida(venda);
            setCarrinho([]);
            setValorRecebido("");
            setDesconto("");
            setPagamento("DINHEIRO");
            setMensagem(null);
            carregarProdutos();
            carregarVendas();
        } catch (e) {
            setMensagem({ texto: mensagemDeErro(e), tipo: "erro" });
            // Estoque mudou (outro caixa vendeu): atualiza as quantidades
            if (e instanceof ApiError && e.status === 409) carregarProdutos();
        } finally {
            setFinalizando(false);
        }
    }

    function novaVenda() {
        setConcluida(null);
        setTimeout(() => campoPesquisa.current?.focus(), 0);
    }

    // ----- Cancelamento -----

    async function confirmarCancelamento(evento: FormEvent) {
        evento.preventDefault();
        if (!cancelando) return;
        setErroCancelamento("");
        try {
            await vendasApi.cancelar(empresaId, cancelando.id, motivoCancelamento.trim());
            setCancelando(null);
            setMotivoCancelamento("");
            setMensagem({ texto: `Venda #${cancelando.id} cancelada. Os produtos voltaram ao estoque.`, tipo: "ok" });
            carregarProdutos();
            carregarVendas();
        } catch (e) {
            setErroCancelamento(mensagemDeErro(e));
        }
    }

    // ----- Atalhos -----

    const atalhos = useRef({ finalizarVenda, novaVenda });
    atalhos.current = { finalizarVenda, novaVenda };

    useEffect(() => {
        function aoTeclar(e: globalThis.KeyboardEvent) {
            if (e.key === "Escape") {
                setLendo(false);
                setPesando(null);
                setCancelando(null);
            }
            if (concluida) {
                if (e.key === "Enter" || e.key === "Escape") {
                    e.preventDefault();
                    atalhos.current.novaVenda();
                }
                return;
            }
            if (e.key === "F2") { e.preventDefault(); campoPesquisa.current?.focus(); }
            if (e.key === "F4") { e.preventDefault(); setLendo(true); }
            if (e.key === "F9") { e.preventDefault(); atalhos.current.finalizarVenda(); }
        }
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [concluida]);

    const vendasConcluidas = vendasHoje.filter((v) => v.status === "CONCLUIDA");
    const totalHoje = vendasConcluidas.reduce((t, v) => t + Number(v.total), 0);

    return (
        <main className="pdv-page">
            <header className="pdv-header">
                <div>
                    <span className="pdv-subtitulo">VENDAS</span>
                    <h1>Ponto de Venda</h1>
                    <p>Bipe o produto, leia com a câmera ou pesquise pelo nome. <span className="pdv-atalhos">F2 busca · F4 câmera · F9 finaliza</span></p>
                </div>

                <div className="pdv-contador">
                    <span>Itens no carrinho</span>
                    <strong>{qtdItens}</strong>
                </div>
            </header>

            {mensagem && (
                <div className={`pdv-mensagem pdv-mensagem--${mensagem.tipo}`} role={mensagem.tipo === "erro" ? "alert" : "status"}>
                    {mensagem.texto}
                </div>
            )}

            <div className="pdv-layout">
                <section className="pdv-produtos">
                    <div className="pdv-busca">
                        <input
                            ref={campoPesquisa}
                            className="pdv-pesquisa"
                            type="text"
                            placeholder="Nome ou código de barras + Enter"
                            value={pesquisa}
                            onChange={(evento) => setPesquisa(evento.target.value)}
                            onKeyDown={aoTeclarPesquisa}
                            aria-label="Pesquisar produtos"
                            autoFocus
                        />
                        <button type="button" className="pdv-botao-camera" onClick={() => setLendo(true)}>
                            <FontAwesomeIcon icon={faBarcode} /> Câmera
                        </button>
                    </div>

                    <div className="pdv-lista-produtos">
                        {carregando ? (
                            <div className="pdv-vazio">Carregando produtos…</div>
                        ) : erroCarga ? (
                            <div className="pdv-vazio">
                                {erroCarga}
                                <button type="button" className="pdv-link" onClick={carregarProdutos}>Tentar de novo</button>
                            </div>
                        ) : produtos.length === 0 ? (
                            <div className="pdv-vazio">Nenhum produto cadastrado ainda. Cadastre no Estoque para começar a vender.</div>
                        ) : filtrados.length === 0 ? (
                            <div className="pdv-vazio">Nenhum produto encontrado.</div>
                        ) : (
                            filtrados.map((produto) => {
                                const restante = Number(produto.estoque_atual) - noCarrinho(produto.id);
                                const esgotado = restante <= 0;
                                return (
                                    <article className={`pdv-produto-card ${esgotado ? "pdv-produto-card--esgotado" : ""}`} key={produto.id}>
                                        <div className="pdv-produto-info">
                                            <h3>{produto.nome}</h3>
                                            <span>{produto.codigo_barras ?? "sem código"}</span>
                                            <span>
                                                {esgotado ? "Sem estoque" : `Estoque: ${formatarQuantidade(restante, produto.unidade)}`}
                                            </span>
                                        </div>

                                        <div className="pdv-produto-compra">
                                            <strong>
                                                {formatarMoeda(produto.preco_venda)}
                                                {unidadeFracionada(produto.unidade) && <small>/{produto.unidade.toLowerCase()}</small>}
                                            </strong>
                                            <button type="button" onClick={() => adicionar(produto)} disabled={esgotado}>
                                                + Adicionar
                                            </button>
                                        </div>
                                    </article>
                                );
                            })
                        )}
                    </div>
                </section>

                <aside className="pdv-carrinho">
                    <div className="pdv-secao-header">
                        <div>
                            <h2>Venda atual</h2>
                            <p>Confira os produtos antes de finalizar.</p>
                        </div>
                    </div>

                    <div className="pdv-itens-carrinho">
                        {carrinho.length > 0 ? (
                            carrinho.map((item) => {
                                const fracao = unidadeFracionada(item.produto.unidade);
                                return (
                                    <article className="pdv-item-carrinho" key={item.produto.id}>
                                        <div className="pdv-item-info">
                                            <strong>{item.produto.nome}</strong>
                                            <span>
                                                {formatarMoeda(item.produto.preco_venda)}
                                                {fracao ? `/${item.produto.unidade.toLowerCase()}` : " cada"}
                                            </span>
                                        </div>

                                        <div className="pdv-item-acoes">
                                            {fracao ? (
                                                <button type="button" className="pdv-item-peso" onClick={() => { setPeso(String(item.quantidade).replace(".", ",")); setPesando({ produto: item.produto, substituir: true }); }}
                                                    title="Alterar o peso">
                                                    {formatarQuantidade(item.quantidade, item.produto.unidade)}
                                                </button>
                                            ) : (
                                                <>
                                                    <button type="button" onClick={() => alterarQuantidade(item, item.quantidade - 1)} aria-label={`Diminuir ${item.produto.nome}`}>−</button>
                                                    <span>{item.quantidade}</span>
                                                    <button type="button" onClick={() => alterarQuantidade(item, item.quantidade + 1)} aria-label={`Aumentar ${item.produto.nome}`}>+</button>
                                                </>
                                            )}
                                            <button type="button" className="pdv-remover" onClick={() => remover(item.produto.id)} aria-label={`Remover ${item.produto.nome}`}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </div>

                                        <strong className="pdv-item-subtotal">
                                            {formatarMoeda(centavos(Number(item.produto.preco_venda) * item.quantidade))}
                                        </strong>
                                    </article>
                                );
                            })
                        ) : (
                            <div className="pdv-carrinho-vazio">
                                <p>Nenhum produto adicionado</p>
                                <span>Bipe um código ou escolha um produto ao lado.</span>
                            </div>
                        )}
                    </div>

                    <div className="pdv-resumo">
                        <div className="pdv-linha-resumo">
                            <span>Subtotal</span>
                            <span>{formatarMoeda(subtotal)}</span>
                        </div>

                        <div className="pdv-linha-resumo pdv-linha-desconto">
                            <label htmlFor="pdv-desconto">Desconto (R$)</label>
                            <input
                                id="pdv-desconto"
                                inputMode="decimal"
                                placeholder="0,00"
                                value={desconto}
                                onChange={(e) => setDesconto(e.target.value)}
                                aria-invalid={!descontoValido}
                            />
                        </div>

                        <div className="pdv-total">
                            <span>Total da venda</span>
                            <strong>{formatarMoeda(total)}</strong>
                        </div>

                        <span className="pdv-label">Forma de pagamento</span>
                        <div className="pdv-formas" role="radiogroup" aria-label="Forma de pagamento">
                            {FORMAS.map((f) => (
                                <button
                                    key={f}
                                    type="button"
                                    role="radio"
                                    aria-checked={pagamento === f}
                                    className={pagamento === f ? "selecionada" : ""}
                                    onClick={() => setPagamento(f)}
                                >
                                    {{ DINHEIRO: "Dinheiro", PIX: "Pix", DEBITO: "Débito", CREDITO: "Crédito" }[f]}
                                </button>
                            ))}
                        </div>

                        {pagamento === "DINHEIRO" && (
                            <div className="pdv-dinheiro">
                                <label className="pdv-label" htmlFor="pdv-recebido">Valor recebido (R$)</label>
                                <input
                                    id="pdv-recebido"
                                    inputMode="decimal"
                                    placeholder="0,00"
                                    value={valorRecebido}
                                    onChange={(evento) => setValorRecebido(evento.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && finalizarVenda()}
                                />
                                <div className="pdv-notas">
                                    <button type="button" onClick={() => setValorRecebido(total.toFixed(2).replace(".", ","))} disabled={!total}>Exato</button>
                                    {[10, 20, 50, 100].filter((n) => n >= total).slice(0, 3).map((n) => (
                                        <button type="button" key={n} onClick={() => setValorRecebido(`${n},00`)}>R$ {n}</button>
                                    ))}
                                </div>
                                <div className="pdv-troco">
                                    <span>Troco</span>
                                    <strong>{formatarMoeda(troco)}</strong>
                                </div>
                            </div>
                        )}

                        <div className="pdv-botoes">
                            <button type="button" className="pdv-botao-cancelar" onClick={limparVenda} disabled={carrinho.length === 0}>
                                Limpar
                            </button>
                            <button type="button" className="pdv-botao-finalizar" onClick={finalizarVenda} disabled={finalizando || carrinho.length === 0}>
                                {finalizando ? "Registrando…" : "Finalizar venda"}
                            </button>
                        </div>
                    </div>
                </aside>
            </div>

            {podeVerVendas && (
                <section className="pdv-vendas-hoje">
                    <div className="pdv-vendas-hoje-cabecalho">
                        <h2>{pode("relatorios.visualizar") ? "Vendas de hoje" : "Minhas vendas de hoje"}</h2>
                        <span>{vendasConcluidas.length} {vendasConcluidas.length === 1 ? "venda" : "vendas"} · {formatarMoeda(totalHoje)}</span>
                    </div>

                    {vendasHoje.length === 0 ? (
                        <p className="pdv-vazio">Nenhuma venda hoje ainda.</p>
                    ) : (
                        <ul>
                            {vendasHoje.slice(0, 15).map((v) => (
                                <li key={v.id} className={v.status === "CANCELADA" ? "cancelada" : ""}>
                                    <div>
                                        <strong>#{v.id} · {hora(v.data_criacao)}</strong>
                                        <span>
                                            {v.itens.length} {v.itens.length === 1 ? "item" : "itens"} · {NOMES_PAGAMENTO[v.forma_pagamento]}
                                            {v.vendedor ? ` · ${v.vendedor}` : ""}
                                        </span>
                                        {v.status === "CANCELADA" && <small>Cancelada: {v.motivo_cancelamento}</small>}
                                    </div>
                                    <div className="pdv-venda-direita">
                                        <strong>{formatarMoeda(v.total)}</strong>
                                        {v.status === "CONCLUIDA" && podeCancelar && (
                                            <button type="button" onClick={() => { setCancelando(v); setMotivoCancelamento(""); setErroCancelamento(""); }}>
                                                <FontAwesomeIcon icon={faRotateLeft} /> Cancelar
                                            </button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            )}

            {lendo && <LeitorCodigo titulo="Ler produto" onLido={adicionarPorCodigo} onFechar={() => setLendo(false)} />}

            {pesando && (
                <div className="pdv-modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && setPesando(null)}>
                    <form className="pdv-modal" onSubmit={confirmarPeso} role="dialog" aria-modal="true" aria-label="Informar peso">
                        <h2>{pesando.produto.nome}</h2>
                        <p>{formatarMoeda(pesando.produto.preco_venda)} por {pesando.produto.unidade.toLowerCase()} · estoque {formatarQuantidade(Number(pesando.produto.estoque_atual) - (pesando.substituir ? 0 : noCarrinho(pesando.produto.id)), pesando.produto.unidade)}</p>
                        <label className="pdv-label" htmlFor="pdv-peso">{pesando.produto.unidade === "KG" ? "Peso (kg)" : "Quantidade (L)"}</label>
                        <input id="pdv-peso" inputMode="decimal" value={peso} onChange={(e) => setPeso(e.target.value)} placeholder="0,500" autoFocus />
                        {Number.isFinite(numeroBR(peso)) && numeroBR(peso) > 0 && (
                            <p className="pdv-modal-total">= {formatarMoeda(centavos(numeroBR(peso) * Number(pesando.produto.preco_venda)))}</p>
                        )}
                        <div className="pdv-botoes">
                            <button type="button" className="pdv-botao-cancelar" onClick={() => setPesando(null)}>Voltar</button>
                            <button type="submit" className="pdv-botao-finalizar">Adicionar</button>
                        </div>
                    </form>
                </div>
            )}

            {concluida && (
                <div className="pdv-modal-fundo">
                    <div className="pdv-modal pdv-modal--sucesso" role="dialog" aria-modal="true" aria-label="Venda concluída">
                        <div className="pdv-sucesso-icone"><FontAwesomeIcon icon={faCheck} /></div>
                        <h2>Venda #{concluida.id} registrada</h2>
                        <ul className="pdv-cupom">
                            {concluida.itens.map((i) => (
                                <li key={i.id}>
                                    <span>{formatarQuantidade(i.quantidade, i.unidade)} {i.nome_produto}</span>
                                    <span>{formatarMoeda(i.subtotal)}</span>
                                </li>
                            ))}
                            {Number(concluida.desconto) > 0 && (
                                <li><span>Desconto</span><span>−{formatarMoeda(concluida.desconto)}</span></li>
                            )}
                            <li className="pdv-cupom-total"><span>Total · {NOMES_PAGAMENTO[concluida.forma_pagamento]}</span><span>{formatarMoeda(concluida.total)}</span></li>
                        </ul>
                        {concluida.forma_pagamento === "DINHEIRO" && (
                            <div className="pdv-troco pdv-troco--destaque">
                                <span>Troco</span>
                                <strong>{formatarMoeda(concluida.troco)}</strong>
                            </div>
                        )}
                        <button type="button" className="pdv-botao-finalizar" onClick={novaVenda} autoFocus>
                            Nova venda (Enter)
                        </button>
                    </div>
                </div>
            )}

            {cancelando && (
                <div className="pdv-modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && setCancelando(null)}>
                    <form className="pdv-modal" onSubmit={confirmarCancelamento} role="dialog" aria-modal="true" aria-label="Cancelar venda">
                        <h2>Cancelar venda #{cancelando.id}?</h2>
                        <p>{formatarMoeda(cancelando.total)} · os produtos voltam para o estoque.</p>
                        <label className="pdv-label" htmlFor="pdv-motivo">Motivo</label>
                        <input id="pdv-motivo" value={motivoCancelamento} onChange={(e) => setMotivoCancelamento(e.target.value.slice(0, 255))} placeholder="Ex.: Cliente desistiu" autoFocus />
                        {erroCancelamento && <p className="pdv-modal-erro">{erroCancelamento}</p>}
                        <div className="pdv-botoes">
                            <button type="button" className="pdv-botao-cancelar" onClick={() => setCancelando(null)}>Voltar</button>
                            <button type="submit" className="pdv-botao-perigo" disabled={motivoCancelamento.trim().length < 3}>Cancelar venda</button>
                        </div>
                    </form>
                </div>
            )}
        </main>
    );
}

export default PDV;
