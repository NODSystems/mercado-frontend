// Painel lateral para cadastrar ou editar um produto.
//
// O código de barras pode vir da câmera, de um leitor USB (ele "digita"
// no campo e aperta Enter) ou ser digitado. Ao informar o código, o
// sistema procura numa base pública (Open Food Facts) para sugerir o
// nome. Sem código, o backend gera um código interno (começa com 2).
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faBarcode, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

import LeitorCodigo from "../LeitorCodigo";
import { ApiError, mensagemDeErro } from "../../services/api";
import {
    produtosApi,
    unidadeFracionada,
    NOMES_UNIDADE,
    type Produto,
    type Unidade,
} from "../../services/produtos";
import { numeroBR } from "../../utils/validacao";

import "../../styles/components/PainelEstoque.css";

type Props = {
    empresaId: number;
    produto?: Produto | null; // com produto = edição
    codigoInicial?: string;
    categorias: string[];
    onFechar: () => void;
    onSalvo: (produto: Produto, mensagem: string) => void;
    // Código já cadastrado: a tela abre a movimentação desse produto
    onJaExiste?: (produto: Produto) => void;
};

type Erros = Partial<Record<string, string>>;

const decimal = (v: string | null | undefined) =>
    v === null || v === undefined || v === "" ? "" : Number(v).toLocaleString("pt-BR", { maximumFractionDigits: 3 });

function FormularioProduto({ empresaId, produto, codigoInicial = "", categorias, onFechar, onSalvo, onJaExiste }: Props) {
    const editando = Boolean(produto);

    const [codigo, setCodigo] = useState(produto?.codigo_barras ?? codigoInicial);
    const [nome, setNome] = useState(produto?.nome ?? "");
    const [categoria, setCategoria] = useState(produto?.categoria ?? "");
    const [unidade, setUnidade] = useState<Unidade>(produto?.unidade ?? "UN");
    const [precoVenda, setPrecoVenda] = useState(produto ? decimal(produto.preco_venda) : "");
    const [precoCusto, setPrecoCusto] = useState(produto ? decimal(produto.preco_custo) : "");
    const [estoqueInicial, setEstoqueInicial] = useState("");
    const [estoqueMinimo, setEstoqueMinimo] = useState(produto ? decimal(produto.estoque_minimo) : "");

    const [erros, setErros] = useState<Erros>({});
    const [erroGeral, setErroGeral] = useState("");
    const [salvando, setSalvando] = useState(false);
    const [lendo, setLendo] = useState(false);
    const [consultando, setConsultando] = useState(false);
    const [sugestao, setSugestao] = useState("");
    const [achouNaBase, setAchouNaBase] = useState(false);
    const [existente, setExistente] = useState<Produto | null>(null);

    // Procura o código: primeiro na própria loja, depois na base pública
    const ultimaConsulta = useRef("");

    async function consultar(valor = codigo, forcar = true) {
        const limpo = valor.replace(/\D/g, "");
        // Ao sair do campo, não repete a consulta do mesmo código
        if (!forcar && limpo === ultimaConsulta.current) return;
        ultimaConsulta.current = limpo;
        setSugestao("");
        setAchouNaBase(false);
        setExistente(null);
        if (limpo.length < 8) return;

        setConsultando(true);
        try {
            if (!editando) {
                try {
                    const { produto: achado } = await produtosApi.porCodigo(empresaId, limpo);
                    setExistente(achado);
                    return;
                } catch (e) {
                    // 409 = existe mas está desativado
                    if (e instanceof ApiError && e.status === 409) {
                        setSugestao("Este código pertence a um produto desativado. Reative-o na lista (filtro “Mostrar inativos”).");
                        return;
                    }
                }
            }

            const r = await produtosApi.consultarCodigo(empresaId, limpo);
            if (r.encontrado && r.nome) {
                const nomeSugerido = [r.nome, r.quantidade].filter(Boolean).join(" ");
                if (!nome.trim()) setNome(nomeSugerido.slice(0, 150));
                setAchouNaBase(true);
                setSugestao(`Encontrado na base pública: ${nomeSugerido}${r.marca ? ` (${r.marca})` : ""}. Confira antes de salvar.`);
            } else if (r.indisponivel) {
                setSugestao("Não foi possível consultar a base pública agora. Preencha o nome manualmente.");
            } else {
                setSugestao("Código novo: não achamos na base pública. Preencha o nome.");
            }
        } catch {
            // Sem permissão de consulta ou sem internet: segue manual
        } finally {
            setConsultando(false);
        }
    }

    // Veio da leitura na tela de Estoque: já procura o nome
    const consultouInicial = useRef(false);
    useEffect(() => {
        if (consultouInicial.current || editando || !codigoInicial) return;
        consultouInicial.current = true;
        consultar(codigoInicial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    function aoLer(lido: string) {
        setLendo(false);
        const limpo = lido.replace(/\D/g, "").slice(0, 14);
        setCodigo(limpo);
        setErros((e) => ({ ...e, codigoBarras: undefined }));
        consultar(limpo);
    }

    // Leitor USB digita no campo e aperta Enter: consulta em vez de enviar o formulário
    function aoTeclarCodigo(e: KeyboardEvent<HTMLInputElement>) {
        if (e.key === "Enter") {
            e.preventDefault();
            consultar();
        }
    }

    function validar(): Erros {
        const novos: Erros = {};
        const fracao = unidadeFracionada(unidade);

        if (nome.trim().length < 2) novos.nome = "Informe o nome do produto";
        const cod = codigo.replace(/\D/g, "");
        if (cod && (cod.length < 8 || cod.length > 14)) novos.codigoBarras = "O código deve ter de 8 a 14 números";

        const pv = numeroBR(precoVenda);
        if (!Number.isFinite(pv) || pv <= 0) novos.precoVenda = "Informe o preço de venda";

        if (precoCusto.trim()) {
            const pc = numeroBR(precoCusto);
            if (!Number.isFinite(pc) || pc < 0) novos.precoCusto = "Preço de custo inválido";
        }

        for (const [campo, valor] of [["estoqueInicial", estoqueInicial], ["estoqueMinimo", estoqueMinimo]] as const) {
            if (!valor.trim()) continue;
            const n = numeroBR(valor);
            if (!Number.isFinite(n) || n < 0) novos[campo] = "Quantidade inválida";
            else if (!fracao && !Number.isInteger(n)) novos[campo] = "Use número inteiro para esta unidade";
        }

        return novos;
    }

    async function salvar(evento: FormEvent) {
        evento.preventDefault();
        setErroGeral("");

        const novos = validar();
        setErros(novos);
        if (Object.keys(novos).length > 0) return;

        const dados = {
            nome: nome.trim(),
            codigoBarras: codigo.replace(/\D/g, ""),
            categoria: categoria.trim(),
            unidade,
            precoVenda: numeroBR(precoVenda),
            precoCusto: precoCusto.trim() ? numeroBR(precoCusto) : null,
            estoqueMinimo: estoqueMinimo.trim() ? numeroBR(estoqueMinimo) : 0,
            ...(editando ? {} : { estoqueInicial: estoqueInicial.trim() ? numeroBR(estoqueInicial) : 0 }),
        };

        setSalvando(true);
        try {
            const r = editando
                ? await produtosApi.editar(empresaId, produto!.id, dados)
                : await produtosApi.criar(empresaId, dados);
            onSalvo(r.produto, editando ? "Produto atualizado." : `“${r.produto.nome}” cadastrado.`);
        } catch (e) {
            if (e instanceof ApiError && e.erros.length > 0) {
                const porCampo: Erros = {};
                for (const item of e.erros) porCampo[item.campo] = item.mensagem;
                setErros(porCampo);
                setErroGeral(e.message);
            } else {
                setErroGeral(mensagemDeErro(e));
            }
        } finally {
            setSalvando(false);
        }
    }

    const fracao = unidadeFracionada(unidade);
    const erroDe = (campo: string) => erros[campo] && <small className="painel-estoque-erro">{erros[campo]}</small>;

    return (
        <div className="painel-estoque-fundo" onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
            <aside className="painel-estoque" role="dialog" aria-modal="true" aria-label={editando ? "Editar produto" : "Novo produto"}>
                <header className="painel-estoque-cabecalho">
                    <div>
                        <span>{editando ? "EDITAR" : "CADASTRO"}</span>
                        <strong>{editando ? produto!.nome : "Novo produto"}</strong>
                    </div>
                    <button type="button" className="painel-estoque-fechar" onClick={onFechar} aria-label="Fechar">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <form className="painel-estoque-corpo" onSubmit={salvar} noValidate>
                    <label className="painel-estoque-campo">
                        Código de barras
                        <div className="painel-estoque-codigo">
                            <input
                                value={codigo}
                                onChange={(e) => {
                                    setCodigo(e.target.value.replace(/\D/g, "").slice(0, 14));
                                    setExistente(null);
                                    setSugestao("");
                                }}
                                onKeyDown={aoTeclarCodigo}
                                onBlur={() => !editando && codigo && consultar(codigo, false)}
                                inputMode="numeric"
                                placeholder="Bipe, leia com a câmera ou digite"
                                aria-invalid={Boolean(erros.codigoBarras)}
                                autoFocus={!editando && !codigoInicial}
                            />
                            <button type="button" onClick={() => setLendo(true)} title="Ler com a câmera">
                                <FontAwesomeIcon icon={faBarcode} /> Câmera
                            </button>
                            <button type="button" onClick={() => consultar()} disabled={consultando || codigo.length < 8} title="Procurar o código">
                                <FontAwesomeIcon icon={faMagnifyingGlass} />
                            </button>
                        </div>
                        {erroDe("codigoBarras")}
                        {!codigo && !editando && (
                            <small className="painel-estoque-ajuda">
                                Produto sem código (pão, fruta, item a granel)? Deixe vazio: o sistema cria um código interno.
                            </small>
                        )}
                        {consultando && <small className="painel-estoque-ajuda">Procurando…</small>}
                        {sugestao && <small className={achouNaBase ? "painel-estoque-sugestao" : "painel-estoque-ajuda painel-estoque-nota"}>{sugestao}</small>}
                    </label>

                    {existente && (
                        <div className="painel-estoque-existente">
                            <p><strong>{existente.nome}</strong> já está cadastrado com este código.</p>
                            {onJaExiste && (
                                <button type="button" onClick={() => onJaExiste(existente)}>
                                    Dar entrada no estoque deste produto
                                </button>
                            )}
                        </div>
                    )}

                    <label className="painel-estoque-campo">
                        Nome do produto
                        <input value={nome} onChange={(e) => setNome(e.target.value.slice(0, 150))} placeholder="Ex.: Arroz Tio João 5 kg" aria-invalid={Boolean(erros.nome)} autoFocus={Boolean(codigoInicial)} />
                        {erroDe("nome")}
                    </label>

                    <div className="painel-estoque-linha">
                        <label className="painel-estoque-campo">
                            Categoria
                            <input value={categoria} onChange={(e) => setCategoria(e.target.value.slice(0, 80))} list="categorias-produto" placeholder="Ex.: Mercearia" />
                            <datalist id="categorias-produto">
                                {categorias.map((c) => <option key={c} value={c} />)}
                            </datalist>
                            {erroDe("categoria")}
                        </label>

                        <label className="painel-estoque-campo">
                            Vendido por
                            <select value={unidade} onChange={(e) => setUnidade(e.target.value as Unidade)}>
                                {(Object.keys(NOMES_UNIDADE) as Unidade[]).map((u) => (
                                    <option key={u} value={u}>{NOMES_UNIDADE[u]}</option>
                                ))}
                            </select>
                            {erroDe("unidade")}
                        </label>
                    </div>

                    <div className="painel-estoque-linha">
                        <label className="painel-estoque-campo">
                            Preço de venda (R${fracao ? ` por ${unidade.toLowerCase()}` : ""})
                            <input value={precoVenda} onChange={(e) => setPrecoVenda(e.target.value)} inputMode="decimal" placeholder="0,00" aria-invalid={Boolean(erros.precoVenda)} />
                            {erroDe("precoVenda")}
                        </label>

                        <label className="painel-estoque-campo">
                            Preço de custo (opcional)
                            <input value={precoCusto} onChange={(e) => setPrecoCusto(e.target.value)} inputMode="decimal" placeholder="0,00" />
                            {erroDe("precoCusto")}
                        </label>
                    </div>

                    <div className="painel-estoque-linha">
                        {!editando && (
                            <label className="painel-estoque-campo">
                                Estoque atual
                                <input value={estoqueInicial} onChange={(e) => setEstoqueInicial(e.target.value)} inputMode="decimal" placeholder="0" />
                                {erroDe("estoqueInicial")}
                            </label>
                        )}

                        <label className="painel-estoque-campo">
                            Avisar quando ficar abaixo de
                            <input value={estoqueMinimo} onChange={(e) => setEstoqueMinimo(e.target.value)} inputMode="decimal" placeholder="0" />
                            {erroDe("estoqueMinimo")}
                        </label>
                    </div>

                    {editando && (
                        <p className="painel-estoque-ajuda">
                            Para mudar a quantidade em estoque, use “Movimentar” na lista: assim fica registrado no histórico.
                        </p>
                    )}

                    {erroGeral && <div className="painel-estoque-alerta" role="alert">{erroGeral}</div>}

                    <footer className="painel-estoque-acoes">
                        <button type="button" onClick={onFechar}>Cancelar</button>
                        <button type="submit" className="primario" disabled={salvando}>
                            {salvando ? "Salvando…" : editando ? "Salvar alterações" : "Cadastrar produto"}
                        </button>
                    </footer>
                </form>
            </aside>

            {lendo && <LeitorCodigo titulo="Ler código do produto" onLido={aoLer} onFechar={() => setLendo(false)} />}
        </div>
    );
}

export default FormularioProduto;
