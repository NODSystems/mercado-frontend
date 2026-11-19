// Visão Geral: primeira tela depois de escolher a empresa.
// - Banner na largura toda, no azul do sistema, com saudação e atalhos.
// - Indicadores lado a lado (sem carrossel: o dono vê tudo de uma vez).
// - Atenções com coisas para resolver, cada uma levando à tela certa.
// - Equipe com dados reais do backend; vendas e estoque com dados de
//   demonstração (marcados) até existirem as rotas no backend.
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faArrowTrendDown,
    faArrowTrendUp,
    faBoxesStacked,
    faCashRegister,
    faChartLine,
    faCircleCheck,
    faEnvelopeOpenText,
    faFileInvoiceDollar,
    faReceipt,
    faUserPlus,
    faUsers,
    type IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../../contexts/AuthContext";
import { api, nomeDoCargo, type Funcionario } from "../../services/api";
import {
    dataISO,
    ESTA_EM_DEMONSTRACAO,
    estoqueDemonstracao,
    moeda,
    vendasDemonstracao,
} from "../../data/demonstracao";

import "../../styles/nodSystems/VisaoGeral.css";

type Atencao = {
    id: string;
    icone: IconDefinition;
    tom: "alerta" | "info" | "perigo";
    titulo: string;
    descricao: string;
    acao: string;
    destino: string;
};

function saudacao(): string {
    const hora = new Date().getHours();
    if (hora < 12) return "Bom dia";
    if (hora < 18) return "Boa tarde";
    return "Boa noite";
}

function variacao(atual: number, anterior: number): number | null {
    if (anterior === 0) return null;
    return ((atual - anterior) / anterior) * 100;
}

function VisaoGeral() {
    const { usuario, empresaAtual } = useAuth();
    const navigate = useNavigate();

    // ---------------- Equipe (dados reais) ----------------
    const [funcionarios, setFuncionarios] = useState<Funcionario[] | null>(null);

    useEffect(() => {
        if (!empresaAtual) return;

        api.get<{ funcionarios: Funcionario[] }>(`/empresas/${empresaAtual.id}/funcionarios`)
            .then((resposta) => setFuncionarios(resposta.funcionarios))
            // Sem permissão para ver a equipe: o card não aparece
            .catch(() => setFuncionarios(null));
    }, [empresaAtual]);

    const ativos = funcionarios?.filter((f) => f.status === "ATIVO").length ?? 0;
    const convidados = funcionarios?.filter((f) => f.status === "CONVIDADO") ?? [];

    // ---------------- Vendas e estoque (demonstração) ----------------
    const indicadores = useMemo(() => {
        const vendas = vendasDemonstracao();
        const hoje = new Date();
        const ontem = new Date();
        ontem.setDate(hoje.getDate() - 1);

        const doDia = (data: string) => vendas.filter((v) => v.data === data);
        const soma = (lista: typeof vendas) => lista.reduce((t, v) => t + v.valor, 0);

        const vendasHoje = doDia(dataISO(hoje));
        const vendasOntem = doDia(dataISO(ontem));
        const mes = dataISO(hoje).slice(0, 7);
        const vendasMes = vendas.filter((v) => v.data.startsWith(mes));

        // Últimos 7 dias para o gráfico
        const semana = Array.from({ length: 7 }, (_, i) => {
            const d = new Date();
            d.setDate(hoje.getDate() - (6 - i));
            const total = soma(doDia(dataISO(d)));
            return {
                rotulo: i === 6 ? "Hoje" : d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
                data: d.toLocaleDateString("pt-BR"),
                total,
            };
        });

        const estoqueBaixo = estoqueDemonstracao().filter((p) => p.quantidade <= p.minimo);

        return {
            totalHoje: soma(vendasHoje),
            totalOntem: soma(vendasOntem),
            qtdHoje: vendasHoje.length,
            qtdOntem: vendasOntem.length,
            ticketHoje: vendasHoje.length ? soma(vendasHoje) / vendasHoje.length : 0,
            totalMes: soma(vendasMes),
            semana,
            maiorDia: Math.max(...semana.map((s) => s.total), 1),
            ultimas: [...vendasHoje].reverse().slice(0, 6),
            estoqueBaixo,
        };
    }, []);

    const varHoje = variacao(indicadores.totalHoje, indicadores.totalOntem);
    const varQtd = variacao(indicadores.qtdHoje, indicadores.qtdOntem);

    // ---------------- Atenções ----------------
    const atencoes: Atencao[] = [];

    if (indicadores.estoqueBaixo.length > 0) {
        atencoes.push({
            id: "estoque",
            icone: faBoxesStacked,
            tom: "perigo",
            titulo: `${indicadores.estoqueBaixo.length} produtos com estoque baixo`,
            descricao: indicadores.estoqueBaixo.slice(0, 3).map((p) => `${p.nome} (${p.quantidade} un.)`).join(", "),
            acao: "Ver estoque",
            destino: "/estoque",
        });
    }

    if (convidados.length > 0) {
        atencoes.push({
            id: "convites",
            icone: faEnvelopeOpenText,
            tom: "info",
            titulo: convidados.length === 1
                ? "1 convite aguardando aceite"
                : `${convidados.length} convites aguardando aceite`,
            descricao: convidados.slice(0, 3).map((c) => c.nome).join(", "),
            acao: "Ver equipe",
            destino: "/equipe",
        });
    }

    const inativos = funcionarios?.filter((f) => f.status === "INATIVO").length ?? 0;

    if (inativos > 0) {
        atencoes.push({
            id: "inativos",
            icone: faUsers,
            tom: "alerta",
            titulo: inativos === 1 ? "1 funcionário inativo" : `${inativos} funcionários inativos`,
            descricao: "Sem acesso à empresa. Reative ou remova pela tela de Equipe.",
            acao: "Revisar",
            destino: "/equipe",
        });
    }

    const atalhos = [
        { icone: faCashRegister, titulo: "Nova venda", descricao: "Abrir o PDV", destino: "/pdv", cor: "azul" },
        { icone: faBoxesStacked, titulo: "Estoque", descricao: "Entradas e saídas", destino: "/estoque", cor: "laranja" },
        { icone: faUserPlus, titulo: "Convidar", descricao: "Novo funcionário", destino: "/equipe", cor: "verde" },
        { icone: faFileInvoiceDollar, titulo: "Relatórios", descricao: "PDF e Excel", destino: "/relatorios", cor: "roxo" },
    ];

    const nomeEmpresa = empresaAtual?.nome_fantasia || empresaAtual?.razao_social || "";
    // "quinta-feira, 19 de novembro" → "Quinta-feira, 19 de novembro"
    const dataTexto = new Date().toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    const hojeExtenso = dataTexto.charAt(0).toUpperCase() + dataTexto.slice(1);

    return (
        <main className="visao-geral">
            {/* ===== Banner ===== */}
            <section className="vg-banner">
                <div className="vg-banner-conteudo">
                    <div>
                        <span className="vg-banner-data">{hojeExtenso}</span>
                        <h1>
                            {saudacao()}, {usuario?.nome.split(" ")[0] ?? ""}!
                        </h1>
                        <p>
                            {nomeEmpresa}
                            {empresaAtual && <> · {nomeDoCargo(empresaAtual)}</>}
                        </p>
                    </div>

                    <div className="vg-banner-acoes">
                        <button type="button" className="vg-botao-claro" onClick={() => navigate("/pdv")}>
                            <FontAwesomeIcon icon={faCashRegister} /> Nova venda
                        </button>
                        <button type="button" className="vg-botao-contorno" onClick={() => navigate("/relatorios")}>
                            <FontAwesomeIcon icon={faChartLine} /> Relatórios
                        </button>
                    </div>
                </div>
            </section>

            <div className="vg-conteudo">
                {/* ===== Indicadores ===== */}
                <section className="vg-indicadores" aria-label="Indicadores do dia">
                    <article className="vg-kpi">
                        <div className="vg-kpi-topo">
                            <span>Vendas hoje</span>
                            <span className="vg-icone azul"><FontAwesomeIcon icon={faCashRegister} /></span>
                        </div>
                        <strong>{moeda(indicadores.totalHoje)}</strong>
                        <Variacao valor={varHoje} texto="que ontem" />
                    </article>

                    <article className="vg-kpi">
                        <div className="vg-kpi-topo">
                            <span>Nº de vendas</span>
                            <span className="vg-icone verde"><FontAwesomeIcon icon={faReceipt} /></span>
                        </div>
                        <strong>{indicadores.qtdHoje}</strong>
                        <Variacao valor={varQtd} texto="que ontem" />
                    </article>

                    <article className="vg-kpi">
                        <div className="vg-kpi-topo">
                            <span>Ticket médio</span>
                            <span className="vg-icone roxo"><FontAwesomeIcon icon={faChartLine} /></span>
                        </div>
                        <strong>{moeda(indicadores.ticketHoje)}</strong>
                        <small>por venda hoje</small>
                    </article>

                    <article className="vg-kpi">
                        <div className="vg-kpi-topo">
                            <span>Vendas no mês</span>
                            <span className="vg-icone laranja"><FontAwesomeIcon icon={faFileInvoiceDollar} /></span>
                        </div>
                        <strong>{moeda(indicadores.totalMes)}</strong>
                        <small>desde o dia 1º</small>
                    </article>
                </section>

                {ESTA_EM_DEMONSTRACAO && (
                    <p className="vg-aviso-demo">
                        Vendas e estoque com <strong>dados de exemplo</strong> até o módulo de vendas
                        ficar pronto. Os dados da equipe são reais.
                    </p>
                )}

                {/* ===== Gráfico + Atenções ===== */}
                <section className="vg-grade">
                    <article className="vg-painel vg-painel--largo">
                        <header className="vg-painel-cabecalho">
                            <div>
                                <h2>Vendas da semana</h2>
                                <p>Últimos 7 dias</p>
                            </div>
                            <strong className="vg-painel-total">
                                {moeda(indicadores.semana.reduce((t, d) => t + d.total, 0))}
                            </strong>
                        </header>

                        <div className="vg-grafico" role="img" aria-label="Gráfico de vendas dos últimos 7 dias">
                            {indicadores.semana.map((dia) => (
                                <div className="vg-grafico-coluna" key={dia.data} title={`${dia.data}: ${moeda(dia.total)}`}>
                                    <span className="vg-grafico-valor">{moeda(dia.total).replace(",00", "")}</span>
                                    <div className="vg-grafico-trilho">
                                        <div
                                            className={`vg-grafico-barra ${dia.rotulo === "Hoje" ? "hoje" : ""}`}
                                            style={{ height: `${Math.max((dia.total / indicadores.maiorDia) * 100, 3)}%` }}
                                        />
                                    </div>
                                    <span className="vg-grafico-rotulo">{dia.rotulo}</span>
                                </div>
                            ))}
                        </div>
                    </article>

                    <article className="vg-painel">
                        <header className="vg-painel-cabecalho">
                            <div>
                                <h2>Atenções</h2>
                                <p>O que precisa do seu olhar</p>
                            </div>
                            {atencoes.length > 0 && <span className="vg-contador">{atencoes.length}</span>}
                        </header>

                        {atencoes.length === 0 ? (
                            <div className="vg-vazio">
                                <FontAwesomeIcon icon={faCircleCheck} />
                                <p>Tudo em ordem por aqui.</p>
                            </div>
                        ) : (
                            <ul className="vg-atencoes">
                                {atencoes.map((a) => (
                                    <li key={a.id} className={`vg-atencao vg-atencao--${a.tom}`}>
                                        <span className="vg-atencao-icone"><FontAwesomeIcon icon={a.icone} /></span>
                                        <div>
                                            <strong>{a.titulo}</strong>
                                            <small>{a.descricao}</small>
                                        </div>
                                        <Link to={a.destino}>{a.acao}</Link>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </article>
                </section>

                {/* ===== Atalhos + Equipe + Últimas vendas ===== */}
                <section className="vg-grade">
                    <article className="vg-painel">
                        <header className="vg-painel-cabecalho">
                            <div>
                                <h2>Acesso rápido</h2>
                                <p>O que você mais usa</p>
                            </div>
                        </header>

                        <div className="vg-atalhos">
                            {atalhos.map((a) => (
                                <Link key={a.titulo} to={a.destino} className="vg-atalho">
                                    <span className={`vg-icone ${a.cor}`}><FontAwesomeIcon icon={a.icone} /></span>
                                    <strong>{a.titulo}</strong>
                                    <small>{a.descricao}</small>
                                </Link>
                            ))}
                        </div>

                        {funcionarios && (
                            <div className="vg-equipe">
                                <div>
                                    <strong>{ativos}</strong>
                                    <small>{ativos === 1 ? "funcionário ativo" : "funcionários ativos"}</small>
                                </div>
                                <div>
                                    <strong>{convidados.length}</strong>
                                    <small>{convidados.length === 1 ? "convite pendente" : "convites pendentes"}</small>
                                </div>
                                <Link to="/equipe">Gerenciar equipe</Link>
                            </div>
                        )}
                    </article>

                    <article className="vg-painel vg-painel--largo">
                        <header className="vg-painel-cabecalho">
                            <div>
                                <h2>Últimas vendas</h2>
                                <p>Hoje</p>
                            </div>
                            <Link to="/relatorios" className="vg-link">Ver todas</Link>
                        </header>

                        {indicadores.ultimas.length === 0 ? (
                            <div className="vg-vazio">
                                <FontAwesomeIcon icon={faReceipt} />
                                <p>Nenhuma venda ainda hoje.</p>
                            </div>
                        ) : (
                            <table className="vg-tabela">
                                <thead>
                                    <tr>
                                        <th>Hora</th>
                                        <th>Produto</th>
                                        <th>Pagamento</th>
                                        <th className="direita">Valor</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {indicadores.ultimas.map((v, i) => (
                                        <tr key={`${v.hora}-${i}`}>
                                            <td className="vg-hora">{v.hora}</td>
                                            <td>{v.quantidade}× {v.produto}</td>
                                            <td><span className={`vg-pagamento vg-pagamento--${v.pagamento.toLowerCase()}`}>{v.pagamento}</span></td>
                                            <td className="direita"><strong>{moeda(v.valor)}</strong></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </article>
                </section>
            </div>
        </main>
    );
}

// Comparação com ontem: verde para cima, vermelho para baixo
function Variacao({ valor, texto }: { valor: number | null; texto: string }) {
    if (valor === null) return <small>sem dados de ontem</small>;

    const subiu = valor >= 0;

    return (
        <small className={subiu ? "vg-sobe" : "vg-desce"}>
            <FontAwesomeIcon icon={subiu ? faArrowTrendUp : faArrowTrendDown} />{" "}
            {Math.abs(valor).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}% {subiu ? "a mais" : "a menos"} {texto}
        </small>
    );
}

export default VisaoGeral;
