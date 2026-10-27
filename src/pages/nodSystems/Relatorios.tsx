
import { useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import {
    faChartLine,
    faShoppingCart,
    faBoxesStacked,
    faWallet,
    faFileExcel,
    faArrowTrendUp,
    faArrowTrendDown,
    faCalendarDays,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import '../../styles/nodSystems/Relatorios.css';

// Estrutura dos dados usados nos relatórios.
type Venda = {
    data: string;
    produto: string;
    quantidade: number;
    valor: number;
    pagamento: string;
};

type MovimentoFinanceiro = {
    data: string;
    descricao: string;
    tipo: 'Entrada' | 'Saída';
    categoria: string;
    valor: number;
};

type ProdutoEstoque = {
    nome: string;
    quantidade: number;
    minimo: number;
};

// Dados de demonstração.
// Posteriormente, serão substituídos pelos dados reais do backend.
const vendasExemplo: Venda[] = [
    { data: '2026-10-02', produto: 'Arroz 5kg', quantidade: 2, valor: 50, pagamento: 'Pix' },
    { data: '2026-10-05', produto: 'Feijão 1kg', quantidade: 3, valor: 27, pagamento: 'Dinheiro' },
    { data: '2026-10-10', produto: 'Óleo 900ml', quantidade: 4, valor: 32, pagamento: 'Cartão' },
    { data: '2026-10-15', produto: 'Leite 1L', quantidade: 5, valor: 30, pagamento: 'Pix' },
    { data: '2026-10-20', produto: 'Café 500g', quantidade: 2, valor: 36, pagamento: 'Cartão' },
];

const financeiroExemplo: MovimentoFinanceiro[] = [
    { data: '2026-10-02', descricao: 'Venda de produtos', tipo: 'Entrada', categoria: 'Vendas', valor: 50 },
    { data: '2026-10-04', descricao: 'Compra de mercadorias', tipo: 'Saída', categoria: 'Estoque', valor: 120 },
    { data: '2026-10-10', descricao: 'Venda de produtos', tipo: 'Entrada', categoria: 'Vendas', valor: 32 },
    { data: '2026-10-15', descricao: 'Conta de energia', tipo: 'Saída', categoria: 'Contas', valor: 90 },
    { data: '2026-10-20', descricao: 'Venda de produtos', tipo: 'Entrada', categoria: 'Vendas', valor: 36 },
];

const estoqueExemplo: ProdutoEstoque[] = [
    { nome: 'Arroz 5kg', quantidade: 18, minimo: 5 },
    { nome: 'Feijão 1kg', quantidade: 3, minimo: 8 },
    { nome: 'Óleo 900ml', quantidade: 12, minimo: 5 },
    { nome: 'Leite 1L', quantidade: 4, minimo: 10 },
    { nome: 'Café 500g', quantidade: 15, minimo: 5 },
];

// Converte números em valores monetários brasileiros.
const moeda = (valor: number) =>
    valor.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    });

// Converte uma data para o formato brasileiro.
const dataFormatada = (data: string) =>
    new Date(`${data}T12:00:00`).toLocaleDateString('pt-BR');

function Relatorios() {
    // Controla o filtro de período selecionado.
    const [periodo, setPeriodo] = useState('mes');
    const [dataInicial, setDataInicial] = useState('2026-10-01');
    const [dataFinal, setDataFinal] = useState('2026-10-31');

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
            fim = new Date(`${dataFinal}T23:59:59`);
        }

        return { inicio, fim };
    }, [periodo, dataInicial, dataFinal]);

    // Verifica se um registro pertence ao intervalo escolhido.
    const dentroDoPeriodo = (data: string) => {
        const dataRegistro = new Date(`${data}T12:00:00`);
        return dataRegistro >= intervalo.inicio && dataRegistro <= intervalo.fim;
    };

    // Filtra as vendas e movimentações financeiras pelo período.
    const vendas = vendasExemplo.filter((venda) => dentroDoPeriodo(venda.data));
    const movimentos = financeiroExemplo.filter((item) => dentroDoPeriodo(item.data));

    // Calcula os totais apresentados na tela.
    const totalVendas = vendas.reduce((total, venda) => total + venda.valor, 0);

    const totalEntradas = movimentos
        .filter((item) => item.tipo === 'Entrada')
        .reduce((total, item) => total + item.valor, 0);

    const totalDespesas = movimentos
        .filter((item) => item.tipo === 'Saída')
        .reduce((total, item) => total + item.valor, 0);

    const resultado = totalEntradas - totalDespesas;
    const ticketMedio = vendas.length > 0 ? totalVendas / vendas.length : 0;

    // Identifica produtos cuja quantidade está no limite ou abaixo dele.
    const estoqueBaixo = estoqueExemplo.filter(
        (produto) => produto.quantidade <= produto.minimo,
    );

    // Cria um Excel com abas separadas para cada área.
    const exportarExcel = () => {
        const resumo = [
            { Indicador: 'Total de vendas', Valor: totalVendas },
            { Indicador: 'Quantidade de registros de venda', Valor: vendas.length },
            { Indicador: 'Ticket médio por registro', Valor: ticketMedio },
            { Indicador: 'Entradas financeiras', Valor: totalEntradas },
            { Indicador: 'Despesas registradas', Valor: totalDespesas },
            { Indicador: 'Resultado financeiro estimado', Valor: resultado },
            { Indicador: 'Produtos com estoque baixo', Valor: estoqueBaixo.length },
        ];

        const arquivo = XLSX.utils.book_new();

        // Aba 1: indicadores gerais.
        XLSX.utils.book_append_sheet(
            arquivo,
            XLSX.utils.json_to_sheet(resumo),
            'Resumo geral',
        );

        // Aba 2: vendas filtradas.
        XLSX.utils.book_append_sheet(
            arquivo,
            XLSX.utils.json_to_sheet(
                vendas.map((venda) => ({
                    Data: dataFormatada(venda.data),
                    Produto: venda.produto,
                    Quantidade: venda.quantidade,
                    Valor: venda.valor,
                    Pagamento: venda.pagamento,
                })),
            ),
            'Vendas',
        );

        // Aba 3: situação do estoque.
        XLSX.utils.book_append_sheet(
            arquivo,
            XLSX.utils.json_to_sheet(
                estoqueExemplo.map((produto) => ({
                    Produto: produto.nome,
                    Quantidade: produto.quantidade,
                    'Estoque mínimo': produto.minimo,
                    Situação:
                        produto.quantidade <= produto.minimo
                            ? 'Estoque baixo'
                            : 'Normal',
                })),
            ),
            'Estoque',
        );

        // Aba 4: movimentações financeiras filtradas.
        XLSX.utils.book_append_sheet(
            arquivo,
            XLSX.utils.json_to_sheet(
                movimentos.map((item) => ({
                    Data: dataFormatada(item.data),
                    Descrição: item.descricao,
                    Tipo: item.tipo,
                    Categoria: item.categoria,
                    Valor: item.valor,
                })),
            ),
            'Financeiro',
        );

        // Baixa o arquivo no computador do usuário.
        XLSX.writeFile(arquivo, 'relatorio-nodsystems.xlsx');
    };

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

                <button
                    type="button"
                    className="relatorios-exportar"
                    onClick={exportarExcel}
                >
                    <FontAwesomeIcon icon={faFileExcel} />
                    Exportar para Excel
                </button>
            </header>

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
                        <strong>{estoqueExemplo.length}</strong>
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
                        {vendas.length} registros
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
                                vendas.map((venda, indice) => (
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
            </p>
        </main>
    );
}

export default Relatorios;
