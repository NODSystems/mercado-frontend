// Entrada de mercadoria pela nota fiscal (XML da NF-e) do fornecedor.
// 1) escolhe o XML  2) confere cada item (produto existente, novo ou ignorar)
// 3) dá entrada em tudo de uma vez.
import { useMemo, useRef, useState, type ChangeEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileImport, faXmark, faCircleCheck, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons';

import { formatarMoeda, formatarData, mensagemDeErro } from '../../services/api';
import { produtosApi, formatarQuantidade, type ItemImportacao, type Produto, type Unidade } from '../../services/produtos';
import { numeroBR } from '../../utils/validacao';
import { eanValido, fatorEmbalagem, lerNota, nomeBonito, parecenca, unidadeDaLoja, type ItemNota, type Nota } from '../../utils/nfe';

import '../../styles/components/ImportarNota.css';

type Props = {
    empresaId: number;
    produtos: Produto[];
    podeCadastrar: boolean;
    podeFinanceiro: boolean;
    onFechar: () => void;
    onImportado: (mensagem: string) => void;
};

type Acao = 'existente' | 'novo' | 'ignorar';

type Linha = {
    item: ItemNota;
    fator: string;
    acao: Acao;
    produtoId: number | null;
    sugestao: 'codigo' | 'nome' | null;
    codigo: string;
    nome: string;
    unidade: Unidade;
    categoria: string;
    preco: string; // vazio = calculado pela margem
};

const r2 = (n: number) => Math.round(n * 100) / 100;

function montarLinha(item: ItemNota, produtos: Produto[], podeCadastrar: boolean): Linha {
    const fator = fatorEmbalagem(item);
    // Com embalagem (caixa/fardo), o código da unidade costuma vir no cEANTrib
    const codigo = (fator > 1 ? item.eanTributavel || item.ean : item.ean || item.eanTributavel) || '';
    const codigos = [codigo, item.ean, item.eanTributavel].filter(Boolean);

    const porCodigo = produtos.find((p) => p.codigo_barras && codigos.includes(p.codigo_barras));
    let porNome: Produto | undefined;
    if (!porCodigo) {
        let melhor = 0;
        for (const p of produtos) {
            const s = parecenca(item.nome, p.nome);
            if (s > melhor) { melhor = s; porNome = p; }
        }
        if (melhor < 0.6) porNome = undefined;
    }
    const achado = porCodigo ?? porNome;

    return {
        item,
        fator: String(fator),
        acao: achado ? 'existente' : podeCadastrar ? 'novo' : 'ignorar',
        produtoId: achado?.id ?? null,
        sugestao: porCodigo ? 'codigo' : porNome ? 'nome' : null,
        codigo,
        nome: nomeBonito(item.nome),
        unidade: unidadeDaLoja(item, fator),
        categoria: '',
        preco: '',
    };
}

function ImportarNota({ empresaId, produtos, podeCadastrar, podeFinanceiro, onFechar, onImportado }: Props) {
    const arquivo = useRef<HTMLInputElement>(null);
    const [nota, setNota] = useState<Nota | null>(null);
    const [linhas, setLinhas] = useState<Linha[]>([]);
    const [margem, setMargem] = useState('30');
    const [lancarDespesa, setLancarDespesa] = useState(podeFinanceiro);
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    const ativos = useMemo(() => produtos.filter((p) => p.ativo === true || p.ativo === 1), [produtos]);
    const ordenados = useMemo(() => [...ativos].sort((a, b) => a.nome.localeCompare(b.nome)), [ativos]);
    const margemNum = Number.isFinite(numeroBR(margem)) ? numeroBR(margem) : 0;

    async function escolherArquivo(e: ChangeEvent<HTMLInputElement>) {
        const f = e.target.files?.[0];
        e.target.value = '';
        if (!f) return;
        setErro('');
        try {
            if (f.size > 5 * 1024 * 1024) throw new Error('Arquivo grande demais (máximo 5 MB).');
            const n = lerNota(await f.text());
            setNota(n);
            setLinhas(n.itens.map((it) => montarLinha(it, ativos, podeCadastrar)));
        } catch (err) {
            setErro(err instanceof Error ? err.message : 'Não foi possível ler o arquivo.');
        }
    }

    function mudar(i: number, campos: Partial<Linha>) {
        setLinhas((ls) => ls.map((l, j) => (j === i ? { ...l, ...campos } : l)));
    }

    function calcular(l: Linha) {
        const fator = Math.max(1, Math.round(Number(l.fator) || 1));
        const quantidade = Math.round(l.item.quantidade * fator * 1000) / 1000;
        const custo = l.item.valorUnitario > 0 ? r2(l.item.valorUnitario / fator) : null;
        const precoSugerido = custo ? r2(custo * (1 + margemNum / 100)) : 0;
        const preco = l.preco.trim() ? numeroBR(l.preco) : precoSugerido;
        const produto = l.produtoId ? ativos.find((p) => p.id === l.produtoId) : undefined;
        const unidade = l.acao === 'existente' && produto ? produto.unidade : l.unidade;
        const inteira = unidade === 'UN' || unidade === 'CX';
        const problema =
            l.acao === 'existente' && !produto ? 'Escolha o produto'
            : l.acao === 'novo' && (!Number.isFinite(preco) || preco <= 0) ? 'Informe o preço de venda'
            : l.acao === 'novo' && l.nome.trim().length < 2 ? 'Informe o nome'
            : l.acao !== 'ignorar' && inteira && !Number.isInteger(quantidade) ? `Quantidade ${quantidade} não é inteira para ${unidade}`
            : '';
        return { fator, quantidade, custo, preco, precoSugerido, produto, unidade, problema };
    }

    const calculadas = linhas.map(calcular);
    const resumo = linhas.reduce(
        (r, l, i) => {
            if (l.acao === 'ignorar') { r.ignorados++; return r; }
            if (l.acao === 'novo') r.novos++; else r.existentes++;
            if (calculadas[i].problema) r.problemas++;
            r.total += (calculadas[i].custo ?? 0) * calculadas[i].quantidade;
            return r;
        },
        { existentes: 0, novos: 0, ignorados: 0, problemas: 0, total: 0 },
    );

    async function darEntrada() {
        if (!nota) return;
        setErro('');
        const itens: ItemImportacao[] = [];
        linhas.forEach((l, i) => {
            const c = calculadas[i];
            if (l.acao === 'ignorar') return;
            if (l.acao === 'existente') {
                itens.push({ produtoId: l.produtoId!, quantidade: c.quantidade, custoUnitario: c.custo });
            } else {
                itens.push({
                    nome: l.nome.trim(),
                    codigoBarras: eanValido(l.codigo) || null,
                    categoria: l.categoria.trim() || null,
                    unidade: l.unidade,
                    precoVenda: r2(c.preco),
                    quantidade: c.quantidade,
                    custoUnitario: c.custo,
                });
            }
        });
        if (itens.length === 0) { setErro('Nenhum item marcado para dar entrada.'); return; }

        setEnviando(true);
        try {
            const r = await produtosApi.importarNota(empresaId, {
                numeroNota: nota.numero,
                fornecedor: nota.fornecedor,
                lancarDespesa: podeFinanceiro && lancarDespesa,
                itens,
            });
            onImportado(r.mensagem + (r.despesaLancada ? ` Despesa de ${formatarMoeda(r.valorTotal)} lançada no financeiro.` : ''));
        } catch (e) {
            setErro(mensagemDeErro(e));
        } finally {
            setEnviando(false);
        }
    }

    return (
        <div className="nfe-fundo" onMouseDown={(e) => e.target === e.currentTarget && !enviando && onFechar()}>
            <div className="nfe-janela" role="dialog" aria-modal="true" aria-label="Entrada pela nota fiscal">
                <header className="nfe-cabecalho">
                    <div>
                        <span>ENTRADA DE MERCADORIA</span>
                        <h2>Importar nota fiscal (XML)</h2>
                    </div>
                    <button className="nfe-fechar" onClick={onFechar} aria-label="Fechar" disabled={enviando}>
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                <input ref={arquivo} type="file" accept=".xml,text/xml,application/xml" hidden onChange={escolherArquivo} />

                {!nota ? (
                    <div className="nfe-inicio">
                        <FontAwesomeIcon icon={faFileImport} className="nfe-inicio-icone" />
                        <h3>Chegou uma carga grande?</h3>
                        <p>
                            Escolha o <strong>XML da NF-e</strong> que o fornecedor enviou (por e-mail ou no portal dele).
                            O sistema lê todos os itens com código de barras, quantidade e custo, e você só confere antes de dar entrada.
                        </p>
                        <button className="nfe-botao-principal" onClick={() => arquivo.current?.click()}>
                            Escolher arquivo XML
                        </button>
                        <a className="nfe-exemplo" href="/exemplos/nfe-exemplo.xml" download>
                            Baixar uma nota de exemplo para testar
                        </a>
                        {erro && <div className="nod-alerta nod-alerta--erro" role="alert">{erro}</div>}
                    </div>
                ) : (
                    <>
                        <div className="nfe-conteudo">
                            <section className="nfe-dados-nota">
                                <div><span>Fornecedor</span><strong>{nota.fornecedor || '—'}</strong></div>
                                <div><span>Nota</span><strong>{nota.numero ? `nº ${nota.numero}` : '—'}{nota.serie ? ` · série ${nota.serie}` : ''}</strong></div>
                                <div><span>Emissão</span><strong>{nota.dataEmissao ? formatarData(nota.dataEmissao) : '—'}</strong></div>
                                <div><span>Total da nota</span><strong>{formatarMoeda(nota.valorTotal)}</strong></div>
                                <button className="nfe-botao-secundario" onClick={() => arquivo.current?.click()} disabled={enviando}>Trocar arquivo</button>
                            </section>

                            <section className="nfe-opcoes">
                                {podeCadastrar && (
                                    <label>
                                        Margem para produtos novos
                                        <span className="nfe-margem">
                                            <input value={margem} onChange={(e) => setMargem(e.target.value)} inputMode="decimal" />%
                                        </span>
                                    </label>
                                )}
                                {podeFinanceiro && (
                                    <label className="nfe-check">
                                        <input type="checkbox" checked={lancarDespesa} onChange={(e) => setLancarDespesa(e.target.checked)} />
                                        Lançar o valor como despesa no financeiro (Fornecedores)
                                    </label>
                                )}
                            </section>

                            <ul className="nfe-itens">
                                {linhas.map((l, i) => {
                                    const c = calculadas[i];
                                    return (
                                        <li key={i} className={`nfe-item nfe-item--${l.acao} ${c.problema ? 'nfe-item--problema' : ''}`}>
                                            <div className="nfe-item-nota">
                                                <strong>{l.item.numero}. {l.item.nome}</strong>
                                                <small>
                                                    {l.codigo ? `Código ${l.codigo}` : 'Sem código de barras'}
                                                    {' · '}{l.item.quantidade.toLocaleString('pt-BR')} {l.item.unidade} × {formatarMoeda(l.item.valorUnitario)}
                                                    {' = '}{formatarMoeda(l.item.valorTotal)}
                                                </small>
                                            </div>

                                            <div className="nfe-item-campos">
                                                <label className="nfe-campo nfe-campo--acao">
                                                    O que fazer
                                                    <select
                                                        value={l.acao === 'existente' ? String(l.produtoId ?? '') : l.acao}
                                                        onChange={(e) => {
                                                            const v = e.target.value;
                                                            if (v === 'novo' || v === 'ignorar') mudar(i, { acao: v, sugestao: null });
                                                            else mudar(i, { acao: 'existente', produtoId: Number(v), sugestao: null });
                                                        }}
                                                        disabled={enviando}
                                                    >
                                                        {podeCadastrar && <option value="novo">＋ Cadastrar como produto novo</option>}
                                                        <option value="ignorar">Não dar entrada neste item</option>
                                                        <optgroup label="Somar no produto já cadastrado">
                                                            {l.acao === 'existente' && !c.produto && <option value="">Escolha…</option>}
                                                            {ordenados.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                                        </optgroup>
                                                    </select>
                                                    {l.sugestao === 'codigo' && <em className="nfe-tag nfe-tag--ok">achado pelo código</em>}
                                                    {l.sugestao === 'nome' && <em className="nfe-tag nfe-tag--alerta">sugerido pelo nome, confira</em>}
                                                </label>

                                                {l.acao !== 'ignorar' && (
                                                    <label className="nfe-campo nfe-campo--curto" title="Quantas unidades vêm em cada embalagem da nota (caixa, fardo...)">
                                                        Un. por {l.item.unidade || 'emb.'}
                                                        <input
                                                            value={l.fator}
                                                            inputMode="numeric"
                                                            onChange={(e) => mudar(i, { fator: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                                            disabled={enviando}
                                                        />
                                                    </label>
                                                )}

                                                {l.acao === 'novo' && (
                                                    <>
                                                        <label className="nfe-campo nfe-campo--nome">
                                                            Nome na loja
                                                            <input value={l.nome} onChange={(e) => mudar(i, { nome: e.target.value })} disabled={enviando} />
                                                        </label>
                                                        <label className="nfe-campo nfe-campo--curto">
                                                            Vende por
                                                            <select value={l.unidade} onChange={(e) => mudar(i, { unidade: e.target.value as Unidade })} disabled={enviando}>
                                                                <option value="UN">UN</option>
                                                                <option value="KG">KG</option>
                                                                <option value="L">L</option>
                                                                <option value="CX">CX</option>
                                                            </select>
                                                        </label>
                                                        <label className="nfe-campo nfe-campo--medio">
                                                            Preço de venda
                                                            <input
                                                                value={l.preco}
                                                                placeholder={c.precoSugerido ? c.precoSugerido.toFixed(2).replace('.', ',') : '0,00'}
                                                                inputMode="decimal"
                                                                onChange={(e) => mudar(i, { preco: e.target.value })}
                                                                disabled={enviando}
                                                            />
                                                        </label>
                                                    </>
                                                )}
                                            </div>

                                            {l.acao !== 'ignorar' && (
                                                <div className="nfe-item-resultado">
                                                    {c.problema ? (
                                                        <span className="nfe-problema"><FontAwesomeIcon icon={faTriangleExclamation} /> {c.problema}</span>
                                                    ) : (
                                                        <span>
                                                            <FontAwesomeIcon icon={faCircleCheck} /> Entra{' '}
                                                            <strong>{formatarQuantidade(c.quantidade, c.unidade)}</strong>
                                                            {c.custo !== null && <> a {formatarMoeda(c.custo)} cada</>}
                                                            {c.produto && <> em “{c.produto.nome}” (hoje {formatarQuantidade(c.produto.estoque_atual, c.produto.unidade)})</>}
                                                            {l.acao === 'novo' && c.custo && c.preco > 0 && (
                                                                <> · venda {formatarMoeda(c.preco)} ({Math.round((c.preco / c.custo - 1) * 100)}% de margem)</>
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>

                        <footer className="nfe-rodape">
                            <div className="nfe-resumo">
                                <strong>{resumo.existentes + resumo.novos} itens para dar entrada</strong>
                                <span>
                                    {resumo.existentes} já cadastrados · {resumo.novos} novos · {resumo.ignorados} ignorados · custo {formatarMoeda(resumo.total)}
                                </span>
                            </div>
                            {erro && <div className="nod-alerta nod-alerta--erro nfe-erro" role="alert">{erro}</div>}
                            <div className="nfe-rodape-botoes">
                                <button className="nfe-botao-secundario" onClick={onFechar} disabled={enviando}>Cancelar</button>
                                <button
                                    className="nfe-botao-principal"
                                    onClick={darEntrada}
                                    disabled={enviando || resumo.problemas > 0 || resumo.existentes + resumo.novos === 0}
                                    title={resumo.problemas > 0 ? 'Resolva os itens marcados em vermelho' : undefined}
                                >
                                    {enviando ? 'Dando entrada...' : resumo.problemas > 0 ? `${resumo.problemas} item(ns) para revisar` : 'Dar entrada em tudo'}
                                </button>
                            </div>
                        </footer>
                    </>
                )}
            </div>
        </div>
    );
}

export default ImportarNota;
