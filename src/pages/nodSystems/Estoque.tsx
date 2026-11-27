// Estoque: produtos da empresa vindos do backend, com cadastro por
// código de barras (câmera, leitor USB ou digitado), entradas, saídas,
// ajustes e histórico.
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBarcode, faFileImport, faPlus } from '@fortawesome/free-solid-svg-icons';

import '../../styles/nodSystems/Estoque.css';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError, formatarMoeda, mensagemDeErro } from '../../services/api';
import { produtosApi, formatarQuantidade, type Produto } from '../../services/produtos';
import { useLeitorUSB } from '../../hooks/useLeitorUSB';
import LeitorCodigo from '../../components/LeitorCodigo';
import FormularioProduto from '../../components/estoque/FormularioProduto';
import PainelMovimentacao from '../../components/estoque/PainelMovimentacao';
import ImportarNota from '../../components/estoque/ImportarNota';

type Painel =
    | { tipo: 'novo'; codigo?: string }
    | { tipo: 'editar'; produto: Produto }
    | { tipo: 'movimentar'; produto: Produto }
    | { tipo: 'nota' }
    | null;

const ativo = (p: Produto) => p.ativo === true || p.ativo === 1;
const baixo = (p: Produto) => ativo(p) && Number(p.estoque_atual) <= Number(p.estoque_minimo);

function Estoque() {
    const { pode, empresaAtual } = useAuth();
    const empresaId = empresaAtual?.id ?? 0;

    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    const [pesquisa, setPesquisa] = useState('');
    const [soBaixo, setSoBaixo] = useState(false);
    const [mostrarInativos, setMostrarInativos] = useState(false);

    const [painel, setPainel] = useState<Painel>(null);
    const [lendo, setLendo] = useState(false);

    const podeCadastrar = pode('produtos.cadastrar');
    const podeEditar = pode('produtos.editar');
    const podeExcluir = pode('produtos.excluir');
    const podeMovimentar = pode('estoque.movimentar');

    const carregar = useCallback(async () => {
        if (!empresaId) return;
        setErro('');
        try {
            const r = await produtosApi.listar(empresaId, { inativos: true });
            setProdutos(r.produtos);
        } catch (e) {
            setErro(mensagemDeErro(e));
        } finally {
            setCarregando(false);
        }
    }, [empresaId]);

    useEffect(() => { carregar(); }, [carregar]);

    // Aviso some sozinho
    useEffect(() => {
        if (!aviso) return;
        const t = setTimeout(() => setAviso(''), 5000);
        return () => clearTimeout(t);
    }, [aviso]);

    // Código lido (câmera ou leitor USB): se existe, abre a movimentação;
    // se não, abre o cadastro já com o código preenchido.
    const aoLerCodigo = useCallback(async (codigo: string) => {
        setLendo(false);
        const limpo = codigo.replace(/\D/g, '');
        if (!limpo) return;

        const local = produtos.find((p) => p.codigo_barras === limpo);
        if (local) {
            if (!ativo(local)) {
                setAviso(`“${local.nome}” está desativado. Ative-o na lista para voltar a usar.`);
                setMostrarInativos(true);
                setPesquisa(limpo);
                return;
            }
            setPainel({ tipo: 'movimentar', produto: local });
            return;
        }

        if (podeCadastrar) {
            setPainel({ tipo: 'novo', codigo: limpo });
        } else {
            setAviso(`Nenhum produto com o código ${limpo}. Peça a quem pode cadastrar produtos.`);
        }
    }, [produtos, podeCadastrar]);

    // Leitor USB funciona com a página aberta, sem clicar em nada
    useLeitorUSB(aoLerCodigo, painel === null && !lendo);

    async function alternarAtivo(produto: Produto) {
        try {
            const r = await produtosApi.alterarAtivo(empresaId, produto.id, !ativo(produto));
            setAviso(r.mensagem);
            carregar();
        } catch (e) {
            setAviso(mensagemDeErro(e));
        }
    }

    async function excluir(produto: Produto) {
        if (!window.confirm(`Excluir “${produto.nome}”? Se ele já foi vendido, será apenas desativado para manter o histórico.`)) return;
        try {
            const r = await produtosApi.remover(empresaId, produto.id);
            setAviso(r.mensagem);
            carregar();
        } catch (e) {
            setAviso(e instanceof ApiError ? e.message : 'Não foi possível excluir.');
        }
    }

    const categorias = useMemo(
        () => [...new Set(produtos.map((p) => p.categoria).filter(Boolean) as string[])].sort(),
        [produtos],
    );

    const filtrados = useMemo(() => {
        const termo = pesquisa.trim().toLowerCase();
        return produtos.filter((p) => {
            if (!mostrarInativos && !ativo(p)) return false;
            if (soBaixo && !baixo(p)) return false;
            if (!termo) return true;
            return p.nome.toLowerCase().includes(termo)
                || (p.categoria ?? '').toLowerCase().includes(termo)
                || (p.codigo_barras ?? '').includes(termo);
        });
    }, [produtos, pesquisa, soBaixo, mostrarInativos]);

    const ativos = produtos.filter(ativo);
    const qtdBaixo = ativos.filter(baixo).length;
    const valorEstoque = ativos.reduce(
        (t, p) => t + Math.max(0, Number(p.estoque_atual)) * Number(p.preco_custo ?? p.preco_venda),
        0,
    );

    return (
        <main className="estoque-page">
            <header className="estoque-header">
                <div>
                    <span className="estoque-subtitulo">GERENCIAMENTO</span>
                    <h1>Estoque</h1>
                    <p>Cadastre produtos pelo código de barras e acompanhe entradas, saídas e vendas.</p>
                </div>

                <div className="estoque-header-acoes">
                    {(podeCadastrar || podeMovimentar) && (
                        <button className="estoque-botao-secundario" onClick={() => setLendo(true)}>
                            <FontAwesomeIcon icon={faBarcode} /> Ler código
                        </button>
                    )}
                    {podeMovimentar && (
                        <button className="estoque-botao-secundario" onClick={() => setPainel({ tipo: 'nota' })}>
                            <FontAwesomeIcon icon={faFileImport} /> Importar nota (XML)
                        </button>
                    )}
                    {podeCadastrar && (
                        <button className="estoque-botao-principal" onClick={() => setPainel({ tipo: 'novo' })}>
                            <FontAwesomeIcon icon={faPlus} /> Novo produto
                        </button>
                    )}
                </div>
            </header>

            {aviso && <div className="estoque-aviso" role="status">{aviso}</div>}

            <section className="estoque-resumo">
                <article className="estoque-resumo-card">
                    <span>Produtos ativos</span>
                    <strong>{ativos.length}</strong>
                </article>

                <article className="estoque-resumo-card">
                    <span>Valor em estoque <small>(pelo custo)</small></span>
                    <strong>{formatarMoeda(valorEstoque)}</strong>
                </article>

                <button
                    type="button"
                    className={`estoque-resumo-card estoque-resumo-card--botao ${qtdBaixo ? 'estoque-resumo-card--alerta' : ''} ${soBaixo ? 'selecionado' : ''}`}
                    onClick={() => setSoBaixo((v) => !v)}
                    aria-pressed={soBaixo}
                >
                    <span>Estoque baixo {soBaixo ? '· filtrando' : ''}</span>
                    <strong>{qtdBaixo}</strong>
                </button>
            </section>

            <section className="estoque-lista">
                <div className="estoque-lista-header">
                    <h2>Produtos</h2>

                    <div className="estoque-filtros">
                        <label className="estoque-check">
                            <input type="checkbox" checked={mostrarInativos} onChange={(e) => setMostrarInativos(e.target.checked)} />
                            Mostrar inativos
                        </label>
                        <input
                            className="estoque-pesquisa"
                            value={pesquisa}
                            onChange={(event) => setPesquisa(event.target.value)}
                            placeholder="Nome, categoria ou código…"
                            aria-label="Pesquisar produto"
                        />
                    </div>
                </div>

                {carregando ? (
                    <div className="estoque-vazio"><p>Carregando produtos…</p></div>
                ) : erro ? (
                    <div className="estoque-vazio">
                        <h3>Não foi possível carregar o estoque</h3>
                        <p>{erro}</p>
                        <button className="estoque-botao-secundario" onClick={carregar}>Tentar de novo</button>
                    </div>
                ) : filtrados.length === 0 ? (
                    <div className="estoque-vazio">
                        <h3>
                            {produtos.length === 0 ? 'Nenhum produto cadastrado' : 'Nenhum produto encontrado'}
                        </h3>
                        <p>
                            {produtos.length === 0
                                ? podeCadastrar
                                    ? 'Clique em “Ler código” e aponte a câmera para a embalagem, ou em “Novo produto”.'
                                    : 'Quem tem permissão de cadastro ainda não adicionou produtos.'
                                : 'Tente outro nome, categoria ou código.'}
                        </p>
                    </div>
                ) : (
                    <div className="estoque-tabela-container">
                        <table className="estoque-tabela">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Em estoque</th>
                                    <th>Preço</th>
                                    <th>Situação</th>
                                    <th aria-label="Ações" />
                                </tr>
                            </thead>

                            <tbody>
                                {filtrados.map((produto) => {
                                    const situacao = !ativo(produto)
                                        ? { texto: 'Inativo', classe: 'inativo' }
                                        : Number(produto.estoque_atual) <= 0
                                            ? { texto: 'Sem estoque', classe: 'zerado' }
                                            : baixo(produto)
                                                ? { texto: 'Estoque baixo', classe: 'baixo' }
                                                : { texto: 'Disponível', classe: 'normal' };

                                    return (
                                        <tr key={produto.id} className={!ativo(produto) ? 'estoque-linha-inativa' : ''}>
                                            <td>
                                                <div className="estoque-produto">
                                                    <strong>{produto.nome}</strong>
                                                    <span>{produto.codigo_barras ?? 'sem código'}</span>
                                                </div>
                                            </td>
                                            <td>{produto.categoria || '—'}</td>
                                            <td>
                                                {formatarQuantidade(produto.estoque_atual, produto.unidade)}
                                                {Number(produto.estoque_minimo) > 0 && (
                                                    <small className="estoque-minimo">mín. {Number(produto.estoque_minimo).toLocaleString('pt-BR')}</small>
                                                )}
                                            </td>
                                            <td>
                                                {formatarMoeda(produto.preco_venda)}
                                                {produto.unidade === 'KG' || produto.unidade === 'L' ? <small className="estoque-minimo">/{produto.unidade.toLowerCase()}</small> : null}
                                            </td>
                                            <td>
                                                <span className={`estoque-status estoque-status--${situacao.classe}`}>{situacao.texto}</span>
                                            </td>
                                            <td>
                                                <div className="estoque-acoes">
                                                    {ativo(produto) && (
                                                        <button className="estoque-acao estoque-acao--destaque" onClick={() => setPainel({ tipo: 'movimentar', produto })}>
                                                            {podeMovimentar ? 'Movimentar' : 'Histórico'}
                                                        </button>
                                                    )}
                                                    {podeEditar && ativo(produto) && (
                                                        <button className="estoque-acao" onClick={() => setPainel({ tipo: 'editar', produto })}>Editar</button>
                                                    )}
                                                    {podeEditar && !ativo(produto) && (
                                                        <button className="estoque-acao" onClick={() => alternarAtivo(produto)}>Reativar</button>
                                                    )}
                                                    {podeExcluir && ativo(produto) && (
                                                        <button className="estoque-acao estoque-botao-excluir" onClick={() => excluir(produto)}>Excluir</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {lendo && (
                <LeitorCodigo
                    titulo="Ler código do produto"
                    onLido={aoLerCodigo}
                    onFechar={() => setLendo(false)}
                />
            )}

            {painel?.tipo === 'novo' && (
                <FormularioProduto
                    empresaId={empresaId}
                    codigoInicial={painel.codigo}
                    categorias={categorias}
                    onFechar={() => setPainel(null)}
                    onSalvo={(_, mensagem) => { setPainel(null); setAviso(mensagem); carregar(); }}
                    onJaExiste={(produto) => setPainel({ tipo: 'movimentar', produto })}
                />
            )}

            {painel?.tipo === 'editar' && (
                <FormularioProduto
                    empresaId={empresaId}
                    produto={painel.produto}
                    categorias={categorias}
                    onFechar={() => setPainel(null)}
                    onSalvo={(_, mensagem) => { setPainel(null); setAviso(mensagem); carregar(); }}
                />
            )}

            {painel?.tipo === 'movimentar' && (
                <PainelMovimentacao
                    empresaId={empresaId}
                    produto={painel.produto}
                    podeMovimentar={podeMovimentar}
                    onFechar={() => setPainel(null)}
                    onAlterado={() => carregar()}
                />
            )}

            {painel?.tipo === 'nota' && (
                <ImportarNota
                    empresaId={empresaId}
                    produtos={produtos}
                    podeCadastrar={podeCadastrar}
                    podeFinanceiro={pode('financeiro.visualizar')}
                    onFechar={() => setPainel(null)}
                    onImportado={(mensagem) => { setPainel(null); setAviso(mensagem); carregar(); }}
                />
            )}
        </main>
    );
}

export default Estoque;
