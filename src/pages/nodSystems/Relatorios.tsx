
import { useMemo, useState } from 'react';
import {
    faChartLine,
    faShoppingCart,
    faBoxesStacked,
    faWallet,
    faFileExcel,
    faFilePdf,
    faArrowTrendUp,
    faArrowTrendDown,
    faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/nodSystems/Relatorios.css';

import { useAuth } from '../../contexts/AuthContext';
import {
    dataBR as dataFormatada,
    ESTA_EM_DEMONSTRACAO,
    estoqueDemonstracao,
    financeiroDemonstracao,
    moeda,
    vendasDemonstracao,
} from '../../data/demonstracao';
import { calcularRelatorio } from '../../services/relatorio';

const nomesPeriodo: Record<string, string> = {
    hoje: 'Hoje',
    '7dias': 'Últimos 7 dias',
    mes: 'Este mês',
    personalizado: 'Período personalizado',
};

// Quantas vendas mostrar na tabela da tela (o arquivo exportado leva todas)
const LIMITE_TABELA = 50;

function hojeISO() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function Relatorios() {
    const { usuario, empresaAtual } = useAuth();

    // Controla o filtro de período selecionado.
    const [periodo, setPeriodo] = useState('mes');
    const [dataInicial, setDataInicial] = useState(`${hojeISO().slice(0, 8)}01`);
    const [dataFinal, setDataFinal] = useState(hojeISO());
    const [exportando, setExportando] = useState<'' | 'pdf' | 'excel'>('');
    const [erroExportar, setErroExportar] = useState('');

    // Calcula as datas inicial e final do relatório.
    const intervalo = useMemo(() => {
        const hoje = new Date();
        let inicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
        let fim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

        if (periodo === 'hoje') {
            inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
            fim = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
        } else if (periodo === '7dias') {
            inicio = new Date(hoje);
            inicio.setDate(hoje.getDate() - 6);
            fim = hoje;
        } else if (periodo === 'personalizado') {
            inicio = new Date(`${dataInicial}T00:00:00`);
            fim = new Date(`${dataFinal}T00:00:00`);
        }

        // "Este mês" vai só até hoje (dias futuros não têm movimento)
        if (fim > hoje) fim = new Date(hoje);

        return { inicio, fim };
    }, [periodo, dataInicial, dataFinal]);

    // Todos os números saem daqui: a tela e os arquivos usam os mesmos
    const relatorio = useMemo(() => calcularRelatorio({
        vendas: vendasDemonstracao(),
        movimentos: financeiroDemonstracao(),
        estoque: estoqueDemonstracao(),
        inicio: intervalo.inicio,
        fim: intervalo.fim,
        empresa: empresaAtual?.nome_fantasia || empresaAtual?.razao_social || 'Minha empresa',
        usuario: usuario?.nome ?? '',
        periodoTexto: nomesPeriodo[periodo],
        demonstracao: ESTA_EM_DEMONSTRACAO,
    }), [intervalo, empresaAtual, usuario, periodo]);

    const vendas = relatorio.vendas;
    const totalVendas = relatorio.totais.vendas;
    const totalEntradas = relatorio.totais.entradas;
    const totalDespesas = relatorio.totais.despesas;
    const resultado = relatorio.totais.resultado;
    const ticketMedio = relatorio.totais.ticket;
    const estoqueTodo = relatorio.estoque;
    const estoqueBaixo = estoqueTodo.filter((produto) => produto.quantidade <= produto.minimo);
    const vendasRecentes = [...vendas].reverse().slice(0, LIMITE_TABELA);

    // As bibliotecas de PDF e Excel só são baixadas quando a pessoa clica
    async function exportar(tipo: 'pdf' | 'excel') {
        setErroExportar('');
        setExportando(tipo);

        try {
            if (tipo === 'pdf') {
                const { exportarPdf } = await import('../../services/relatorioPdf');
                await exportarPdf({ ...relatorio, geradoEm: new Date() });
            } else {
                const { exportarExcel } = await import('../../services/relatorioExcel');
                await exportarExcel({ ...relatorio, geradoEm: new Date() });
            }
        } catch (erro) {
            console.error(erro);
            setErroExportar('Não foi possível gerar o arquivo. Tente novamente.');
        } finally {
            setExportando('');
        }
    }

    return (
        <main className="relatorios-page">
            {/* Cabeçalho da página */}
            <header className="relatorios-header">
                <div>
                    <span className="relatorios-subtitulo">ANÁLISE DO NEGÓCIO</span>
                    <h1>Relatórios</h1>
                    <p>
                        Acompanhe os resultados da sua empresa em um só lugar.
                    </p>
                </div>

                <div className="relatorios-exportar-grupo">
                    <button
                        type="button"
                        className="relatorios-exportar"
                        onClick={() => exportar('pdf')}
                        disabled={exportando !== ''}
                    >
                        <FontAwesomeIcon icon={faFilePdf} />
                        {exportando === 'pdf' ? 'Gerando PDF...' : 'Exportar PDF'}
                    </button>

                    <button
                        type="button"
                        className="relatorios-exportar relatorios-exportar--secundario"
                        onClick={() => exportar('excel')}
                        disabled={exportando !== ''}
                    >
                        <FontAwesomeIcon icon={faFileExcel} />
                        {exportando === 'excel' ? 'Gerando Excel...' : 'Excel'}
                    </button>
                </div>
            </header>

            {erroExportar && (
                <div className="nod-alerta nod-alerta--erro" role="alert">{erroExportar}</div>
            )}

            {/* Filtros para selecionar o período */}
            <section className="relatorios-filtros">
                <div className="relatorios-filtro-titulo">
                    <FontAwesomeIcon icon={faCalendarDays} />
                    <span>Período do relatório</span>
                </div>

                <div className="relatorios-filtro-controles">
                    <select
                        aria-label="Selecionar período"
                        value={periodo}
                        onChange={(evento) => setPeriodo(evento.target.value)}
                    >
                        <option value="hoje">Hoje</option>
                        <option value="7dias">Últimos 7 dias</option>
                        <option value="mes">Este mês</option>
                        <option value="personalizado">Personalizado</option>
                    </select>

                    {periodo === 'personalizado' && (
                        <div className="relatorios-datas">
                            <input
                                type="date"
                                aria-label="Data inicial"
                                value={dataInicial}
                                onChange={(evento) => setDataInicial(evento.target.value)}
                            />
                            <span>até</span>
                            <input
                                type="date"
                                aria-label="Data final"
                                min={dataInicial}
                                value={dataFinal}
                                onChange={(evento) => setDataFinal(evento.target.value)}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Cards com os principais indicadores */}
            <section className="relatorios-indicadores">
                <article className="relatorio-card">
                    <div className="relatorio-card-topo">
                        <span>Total de vendas</span>
                        <span className="relatorio-icone azul">
                            <FontAwesomeIcon icon={faShoppingCart} />
                        </span>
                    </div>
                    <strong>{moeda(totalVendas)}</strong>
                    <small>{vendas.length} registros de venda</small>
                </article>

                <article className="relatorio-card">
                    <div className="relatorio-card-topo">
                        <span>Entradas</span>
                        <span className="relatorio-icone verde">
                            <FontAwesomeIcon icon={faArrowTrendUp} />
                        </span>
                    </div>
                    <strong>{moeda(totalEntradas)}</strong>
                    <small>Movimentações de entrada</small>
                </article>

                <article className="relatorio-card">
                    <div className="relatorio-card-topo">
                        <span>Despesas</span>
                        <span className="relatorio-icone vermelho">
                            <FontAwesomeIcon icon={faArrowTrendDown} />
                        </span>
                    </div>
                    <strong>{moeda(totalDespesas)}</strong>
                    <small>Movimentações de saída</small>
                </article>

                <article className="relatorio-card">
                    <div className="relatorio-card-topo">
                        <span>Resultado estimado</span>
                        <span className="relatorio-icone roxo">
                            <FontAwesomeIcon icon={faChartLine} />
                        </span>
                    </div>
                    <strong className={resultado < 0 ? 'valor-negativo' : ''}>
                        {moeda(resultado)}
                    </strong>
                    <small>Entradas menos despesas registradas</small>
                </article>
            </section>

            {/* Resumo de cada área do sistema */}
            <section className="relatorios-blocos">
                <article className="relatorios-painel">
                    <div className="relatorios-painel-titulo">
                        <span className="relatorio-icone azul">
                            <FontAwesomeIcon icon={faShoppingCart} />
                        </span>
                        <div>
                            <h2>Resumo de vendas</h2>
                            <p>Registros no período selecionado</p>
                        </div>
                    </div>

                    <div className="relatorios-dado-linha">
                        <span>Vendas registradas</span>
                        <strong>{vendas.length}</strong>
                    </div>
                    <div className="relatorios-dado-linha">
                        <span>Ticket médio por registro</span>
                        <strong>{moeda(ticketMedio)}</strong>
                    </div>
                    <div className="relatorios-dado-linha">
                        <span>Total vendido</span>
                        <strong>{moeda(totalVendas)}</strong>
                    </div>
                </article>

                <article className="relatorios-painel">
                    <div className="relatorios-painel-titulo">
                        <span className="relatorio-icone laranja">
                            <FontAwesomeIcon icon={faBoxesStacked} />
                        </span>
                        <div>
                            <h2>Situação do estoque</h2>
                            <p>Verificação dos níveis cadastrados</p>
                        </div>
                    </div>

                    <div className="relatorios-dado-linha">
                        <span>Produtos cadastrados</span>
                        <strong>{estoqueTodo.length}</strong>
                    </div>
                    <div className="relatorios-dado-linha">
                        <span>Produtos com estoque baixo</span>
                        <strong className={estoqueBaixo.length ? 'valor-alerta' : ''}>
                            {estoqueBaixo.length}
                        </strong>
                    </div>

                    <div className="relatorios-produtos-baixos">
                        {estoqueBaixo.length > 0 ? (
                            estoqueBaixo.map((produto) => (
                                <div key={produto.nome} className="relatorios-produto">
                                    <span>{produto.nome}</span>
                                    <strong>{produto.quantidade} un.</strong>
                                </div>
                            ))
                        ) : (
                            <p>Não há produtos abaixo do mínimo.</p>
                        )}
                    </div>
                </article>

                <article className="relatorios-painel">
                    <div className="relatorios-painel-titulo">
                        <span className="relatorio-icone roxo">
                            <FontAwesomeIcon icon={faWallet} />
                        </span>
                        <div>
                            <h2>Resumo financeiro</h2>
                            <p>Movimentações no período</p>
                        </div>
                    </div>

                    <div className="relatorios-dado-linha">
                        <span>Total de entradas</span>
                        <strong className="valor-positivo">{moeda(totalEntradas)}</strong>
                    </div>
                    <div className="relatorios-dado-linha">
                        <span>Total de despesas</span>
                        <strong className="valor-negativo">{moeda(totalDespesas)}</strong>
                    </div>
                    <div className="relatorios-dado-linha">
                        <span>Saldo das movimentações</span>
                        <strong>{moeda(resultado)}</strong>
                    </div>
                </article>
            </section>

            {/* Tabela detalhada de vendas */}
            <section className="relatorios-tabela-painel">
                <div className="relatorios-tabela-cabecalho">
                    <div>
                        <h2>Detalhamento das vendas</h2>
                        <p>Confira os registros incluídos no relatório.</p>
                    </div>
                    <span className="relatorios-contagem">
                        {vendas.length > LIMITE_TABELA
                            ? `${LIMITE_TABELA} mais recentes de ${vendas.length}`
                            : `${vendas.length} registros`}
                    </span>
                </div>

                <div className="relatorios-tabela-scroll">
                    <table className="relatorios-tabela">
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Pagamento</th>
                                <th>Valor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vendas.length > 0 ? (
                                vendasRecentes.map((venda, indice) => (
                                    <tr key={`${venda.data}-${venda.produto}-${indice}`}>
                                        <td>{dataFormatada(venda.data)}</td>
                                        <td>{venda.produto}</td>
                                        <td>{venda.quantidade}</td>
                                        <td>{venda.pagamento}</td>
                                        <td className="relatorios-valor">
                                            {moeda(venda.valor)}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={5} className="relatorios-vazio">
                                        Nenhuma venda encontrada nesse período.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </section>

            {/* Informa que os dados ainda são apenas exemplos */}
            <p className="relatorios-aviso">
                <strong>Modo de demonstração:</strong> os valores exibidos são
                exemplos e ainda não representam os dados reais da empresa.
                A tabela mostra as vendas mais recentes; o PDF e o Excel levam todas.
            </p>
        </main>
    );
}

export default Relatorios;
