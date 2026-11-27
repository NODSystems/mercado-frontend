// Editar empresa (só o proprietário): dados cadastrais e o plano/assinatura.
// É aqui que o dono assina um plano pago (cobrança pelo Asaas), vê o
// histórico de pagamentos e cancela a assinatura.
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faCrown, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';

import Navbar from '../../components/navbar';
import { useAuth } from '../../contexts/AuthContext';
import { api, ApiError, formatarMoeda, formatarData, mensagemDeErro, type EmpresaResumo } from '../../services/api';
import {
    assinaturaApi,
    NOMES_COBRANCA,
    type DadosAssinatura,
    type FormaCobranca,
    type Plano,
} from '../../services/assinatura';
import { TIPOS_EMPRESA } from '../../data/tiposEmpresa';
import { ESTADOS, cnpjValido, cpfValido, mascaraCnpj, mascaraCpf } from '../../utils/validacao';
import { campoDoBackend, mascaras, validarCampo, type DadosEmpresa } from './ConfigurarEmpresa';

import '../../styles/empresa/EditarEmpresa.css';

type EmpresaApi = {
    id: number;
    razao_social: string;
    nome_fantasia: string | null;
    cnpj: string | null;
    tipo_negocio: string;
    telefone: string;
    email_comercial: string;
    cep: string;
    estado: string;
    cidade: string;
    rua: string;
    numero: string;
};

const CAMPOS: { campo: keyof DadosEmpresa; rotulo: string; largura?: 'meia' | 'terco'; placeholder?: string }[] = [
    { campo: 'nome', rotulo: 'Razão social ou nome do responsável' },
    { campo: 'nomeFantasia', rotulo: 'Nome fantasia (opcional)', largura: 'meia' },
    { campo: 'cnpj', rotulo: 'CNPJ (opcional)', largura: 'meia', placeholder: '00.000.000/0000-00' },
    { campo: 'telefone', rotulo: 'Telefone', largura: 'meia', placeholder: '(12) 99999-9999' },
    { campo: 'email', rotulo: 'E-mail comercial', largura: 'meia' },
    { campo: 'cep', rotulo: 'CEP', largura: 'terco', placeholder: '00000-000' },
    { campo: 'cidade', rotulo: 'Cidade', largura: 'terco' },
    { campo: 'estado', rotulo: 'Estado', largura: 'terco' },
    { campo: 'endereco', rotulo: 'Rua / avenida', largura: 'meia' },
    { campo: 'numero', rotulo: 'Número', largura: 'meia' },
];

const STATUS_ASSINATURA: Record<string, { texto: string; classe: string }> = {
    pendente: { texto: 'Aguardando pagamento', classe: 'alerta' },
    ativa: { texto: 'Ativa', classe: 'ok' },
    atrasada: { texto: 'Pagamento atrasado', classe: 'perigo' },
    cancelada: { texto: 'Cancelada', classe: 'neutro' },
};

const STATUS_PAGAMENTO: Record<string, string> = {
    pago: 'Pago',
    pendente: 'Pendente',
    recusado: 'Recusado',
    reembolsado: 'Reembolsado',
};

function paraFormulario(e: EmpresaApi): DadosEmpresa {
    return {
        nome: e.razao_social ?? '',
        nomeFantasia: e.nome_fantasia ?? '',
        cnpj: e.cnpj ? mascaras.cnpj!(e.cnpj) : '',
        telefone: e.telefone ? mascaras.telefone!(e.telefone) : '',
        email: e.email_comercial ?? '',
        cep: e.cep ? mascaras.cep!(e.cep) : '',
        endereco: e.rua ?? '',
        numero: e.numero ?? '',
        cidade: e.cidade ?? '',
        estado: e.estado ?? '',
    };
}

function EditarEmpresa() {
    const { empresaId: idParam } = useParams();
    const empresaId = Number(idParam);
    const navigate = useNavigate();
    const { empresaAtual, selecionarEmpresa } = useAuth();

    const [carregando, setCarregando] = useState(true);
    const [erroCarga, setErroCarga] = useState('');

    // ----- Dados da empresa -----
    const [dados, setDados] = useState<DadosEmpresa | null>(null);
    const [tipoNegocio, setTipoNegocio] = useState('');
    const [erros, setErros] = useState<Partial<Record<keyof DadosEmpresa, string>>>({});
    const [salvando, setSalvando] = useState(false);
    const [avisoDados, setAvisoDados] = useState<{ texto: string; tipo: 'sucesso' | 'erro' } | null>(null);

    // ----- Assinatura -----
    const [assinatura, setAssinatura] = useState<DadosAssinatura | null>(null);
    const [planos, setPlanos] = useState<Plano[]>([]);
    const [forma, setForma] = useState<FormaCobranca>('UNDEFINED');
    // CPF do proprietário ou CNPJ da empresa, para o Asaas emitir a cobrança
    const [documento, setDocumento] = useState('');
    const [erroDocumento, setErroDocumento] = useState('');
    const [assinando, setAssinando] = useState<number | null>(null);
    const [avisoPlano, setAvisoPlano] = useState<{ texto: string; tipo: 'sucesso' | 'erro' | 'info' } | null>(null);
    const [cancelando, setCancelando] = useState(false);
    const [senhaCancelar, setSenhaCancelar] = useState('');
    const [erroCancelar, setErroCancelar] = useState('');

    const carregarAssinatura = useCallback(async () => {
        const [a, p] = await Promise.all([assinaturaApi.consultar(empresaId), assinaturaApi.planos()]);
        setAssinatura(a);
        setPlanos(p.planos);
    }, [empresaId]);

    useEffect(() => {
        if (!Number.isSafeInteger(empresaId) || empresaId <= 0) {
            setErroCarga('Empresa inválida.');
            setCarregando(false);
            return;
        }
        Promise.all([
            api.get<{ resultado: EmpresaApi }>(`/empresas/buscar/${empresaId}`),
            api.get<{ resultado: EmpresaResumo[] }>('/empresas/listar'),
        ])
            .then(async ([{ resultado }, lista]) => {
                const minha = lista.resultado.find((e) => e.id === empresaId);
                if (!minha || minha.cargo !== 'PROPRIETARIO') {
                    setErroCarga('Só o proprietário pode editar a empresa.');
                    return;
                }
                setDados(paraFormulario(resultado));
                setTipoNegocio(resultado.tipo_negocio);
                if (resultado.cnpj) setDocumento(mascaraCnpj(resultado.cnpj));
                await carregarAssinatura().catch(() => undefined);
            })
            .catch((e) => setErroCarga(mensagemDeErro(e)))
            .finally(() => setCarregando(false));
    }, [empresaId, carregarAssinatura]);

    function atualizar(campo: keyof DadosEmpresa, valor: string) {
        const mascara = mascaras[campo];
        const novo = mascara ? mascara(valor) : valor;
        setDados((d) => (d ? { ...d, [campo]: novo } : d));
        if (erros[campo]) setErros((e) => ({ ...e, [campo]: validarCampo(campo, novo) }));
        setAvisoDados(null);
    }

    async function salvar(evento: FormEvent) {
        evento.preventDefault();
        if (!dados) return;

        const novos: Partial<Record<keyof DadosEmpresa, string>> = {};
        for (const { campo } of CAMPOS) {
            const msg = validarCampo(campo, dados[campo]);
            if (msg) novos[campo] = msg;
        }
        setErros(novos);
        if (Object.keys(novos).length > 0) {
            setAvisoDados({ texto: 'Corrija os campos destacados.', tipo: 'erro' });
            return;
        }

        setSalvando(true);
        try {
            const { resultado } = await api.put<{ resultado?: EmpresaApi }>(`/empresas/editar/${empresaId}`, {
                razao_social: dados.nome.trim(),
                nome_fantasia: dados.nomeFantasia.trim() || null,
                cnpj: dados.cnpj.trim() || null,
                tipo_negocio: tipoNegocio,
                telefone: dados.telefone,
                email_comercial: dados.email.trim(),
                cep: dados.cep,
                estado: dados.estado,
                cidade: dados.cidade.trim(),
                rua: dados.endereco.trim(),
                numero: dados.numero.trim(),
            });
            setAvisoDados({ texto: 'Dados da empresa atualizados.', tipo: 'sucesso' });

            // Atualiza o nome mostrado na navbar se for a empresa aberta
            if (empresaAtual?.id === empresaId) {
                selecionarEmpresa({
                    ...empresaAtual,
                    razao_social: resultado?.razao_social ?? dados.nome.trim(),
                    nome_fantasia: resultado?.nome_fantasia ?? (dados.nomeFantasia.trim() || null),
                });
            }
        } catch (e) {
            if (e instanceof ApiError && e.erros.length > 0) {
                const doBackend: Partial<Record<keyof DadosEmpresa, string>> = {};
                for (const item of e.erros) {
                    const campo = campoDoBackend[item.campo];
                    if (campo) doBackend[campo] = item.mensagem;
                }
                setErros(doBackend);
            }
            setAvisoDados({ texto: mensagemDeErro(e), tipo: 'erro' });
        } finally {
            setSalvando(false);
        }
    }

    function mascaraDocumento(valor: string) {
        const d = valor.replace(/\D/g, '');
        return d.length <= 11 ? mascaraCpf(d) : mascaraCnpj(d);
    }

    function validarDocumento(valor: string) {
        const d = valor.replace(/\D/g, '');
        if (!d) return 'Informe o CPF do proprietário ou o CNPJ da empresa.';
        if (d.length === 11) return cpfValido(d) ? '' : 'CPF inválido. Confira os números.';
        if (d.length === 14) return cnpjValido(d) ? '' : 'CNPJ inválido. Confira os números.';
        return 'CPF tem 11 dígitos e CNPJ tem 14.';
    }

    async function assinar(plano: Plano) {
        setAvisoPlano(null);
        const msgDoc = validarDocumento(documento);
        setErroDocumento(msgDoc);
        if (msgDoc) {
            document.getElementById('ee-documento')?.focus();
            return;
        }
        setAssinando(plano.id);
        try {
            const r = await assinaturaApi.assinar(empresaId, plano.id, forma, documento.replace(/\D/g, ''));
            await carregarAssinatura();
            if (r.linkPagamento) {
                window.open(r.linkPagamento, '_blank', 'noopener');
                setAvisoPlano({ texto: 'Assinatura criada! A fatura abriu em outra aba. Assim que o pagamento for confirmado, o plano é ativado.', tipo: 'sucesso' });
            } else {
                setAvisoPlano({ texto: r.mensagem, tipo: 'sucesso' });
            }
        } catch (e) {
            if (e instanceof ApiError && e.erros.some((x) => x.campo === 'documento')) {
                setErroDocumento(e.erros.find((x) => x.campo === 'documento')!.mensagem);
            }
            setAvisoPlano({ texto: mensagemDeErro(e), tipo: 'erro' });
        } finally {
            setAssinando(null);
        }
    }

    async function confirmarCancelamento(evento: FormEvent) {
        evento.preventDefault();
        setErroCancelar('');
        try {
            const r = await assinaturaApi.cancelar(empresaId, senhaCancelar);
            setCancelando(false);
            setSenhaCancelar('');
            setAvisoPlano({ texto: r.mensagem, tipo: 'sucesso' });
            await carregarAssinatura();
        } catch (e) {
            setErroCancelar(mensagemDeErro(e));
        }
    }

    const assinaturaAtiva = assinatura?.assinatura && assinatura.assinatura.gateway_subscription_id;
    const status = assinatura?.assinatura ? STATUS_ASSINATURA[assinatura.assinatura.status] : null;
    const planoAtualId = assinatura?.planoAtual?.plano_id ?? 1;

    return (
        <>
            <Navbar simples />
            <main className="editar-empresa">
                <header className="editar-empresa-topo">
                    <Link to="/minhas-empresas" className="editar-empresa-voltar">
                        <FontAwesomeIcon icon={faArrowLeft} /> Minhas empresas
                    </Link>
                    <h1>Editar empresa</h1>
                    <p>Dados cadastrais, plano e assinatura.</p>
                </header>

                {carregando ? (
                    <p>Carregando...</p>
                ) : erroCarga ? (
                    <div className="nod-alerta nod-alerta--erro" role="alert">{erroCarga}</div>
                ) : dados && (
                    <div className="editar-empresa-grade">
                        {/* ===== Dados ===== */}
                        <form className="editar-empresa-painel" onSubmit={salvar} noValidate>
                            <h2>Dados da empresa</h2>

                            <div className="editar-empresa-campos">
                                <label className="ee-campo">
                                    Tipo de negócio
                                    <select value={tipoNegocio} onChange={(e) => setTipoNegocio(e.target.value)}>
                                        {!TIPOS_EMPRESA.some((t) => t.nome === tipoNegocio) && tipoNegocio && (
                                            <option value={tipoNegocio}>{tipoNegocio}</option>
                                        )}
                                        {TIPOS_EMPRESA.map((t) => <option key={t.id} value={t.nome}>{t.nome}</option>)}
                                    </select>
                                </label>

                                {CAMPOS.map(({ campo, rotulo, largura, placeholder }) => (
                                    <label key={campo} className={`ee-campo ${largura ? `ee-campo--${largura}` : ''}`}>
                                        {rotulo}
                                        {campo === 'estado' ? (
                                            <select
                                                id={`ee-${campo}`}
                                                value={dados.estado}
                                                onChange={(e) => atualizar('estado', e.target.value)}
                                                aria-invalid={Boolean(erros.estado)}
                                            >
                                                <option value="">UF</option>
                                                {ESTADOS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}
                                            </select>
                                        ) : (
                                            <input
                                                id={`ee-${campo}`}
                                                value={dados[campo]}
                                                placeholder={placeholder}
                                                onChange={(e) => atualizar(campo, e.target.value)}
                                                onBlur={() => dados[campo].trim() && setErros((er) => ({ ...er, [campo]: validarCampo(campo, dados[campo]) }))}
                                                aria-invalid={Boolean(erros[campo])}
                                            />
                                        )}
                                        {erros[campo] && <small className="ee-erro">{erros[campo]}</small>}
                                    </label>
                                ))}
                            </div>

                            {avisoDados && (
                                <div className={`nod-alerta nod-alerta--${avisoDados.tipo}`} role={avisoDados.tipo === 'erro' ? 'alert' : 'status'}>
                                    {avisoDados.texto}
                                </div>
                            )}

                            <div className="editar-empresa-acoes">
                                <button type="button" className="ee-botao-secundario" onClick={() => navigate('/minhas-empresas')}>
                                    Voltar
                                </button>
                                <button type="submit" className="ee-botao-principal" disabled={salvando}>
                                    <FontAwesomeIcon icon={faFloppyDisk} /> {salvando ? 'Salvando...' : 'Salvar alterações'}
                                </button>
                            </div>
                        </form>

                        {/* ===== Plano e assinatura ===== */}
                        <section className="editar-empresa-painel">
                            <h2>Plano e assinatura</h2>

                            {!assinatura ? (
                                <p className="ee-ajuda">Não foi possível carregar o plano agora.</p>
                            ) : (
                                <>
                                    <div className="ee-plano-atual">
                                        <div>
                                            <span>Plano atual</span>
                                            <strong>{assinatura.planoAtual?.plano ?? '—'}</strong>
                                            <small>
                                                {Number(assinatura.planoAtual?.preco ?? 0) > 0
                                                    ? `${formatarMoeda(assinatura.planoAtual!.preco)}/mês`
                                                    : 'Grátis'}
                                                {' · '}até {assinatura.planoAtual?.limite_usuarios} usuários
                                                {' · '}{assinatura.planoAtual?.limite_produtos ? `${assinatura.planoAtual.limite_produtos} produtos` : 'produtos ilimitados'}
                                            </small>
                                        </div>
                                        {status && assinaturaAtiva && (
                                            <span className={`ee-status ee-status--${status.classe}`}>{status.texto}</span>
                                        )}
                                    </div>

                                    {assinaturaAtiva && assinatura.assinatura && (
                                        <div className="ee-assinatura">
                                            <p>
                                                Assinatura do <strong>{assinatura.assinatura.plano}</strong> desde{' '}
                                                {formatarData(assinatura.assinatura.data_criacao)}
                                                {assinatura.assinatura.periodo_fim && assinatura.assinatura.status === 'ativa' && (
                                                    <> · próxima cobrança até {formatarData(assinatura.assinatura.periodo_fim)}</>
                                                )}
                                            </p>
                                            <div className="ee-assinatura-acoes">
                                                {assinatura.linkPagamento && (
                                                    <a className="ee-botao-principal" href={assinatura.linkPagamento} target="_blank" rel="noopener noreferrer">
                                                        Pagar fatura
                                                    </a>
                                                )}
                                                <button type="button" className="ee-botao-perigo" onClick={() => { setCancelando(true); setErroCancelar(''); }}>
                                                    Cancelar assinatura
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {!assinatura.pagamentosConfigurados && (
                                        <p className="nod-alerta nod-alerta--info">
                                            Os pagamentos ainda não foram configurados no servidor (chave do Asaas). Os planos aparecem, mas a assinatura só funciona depois disso.
                                        </p>
                                    )}

                                    {!assinaturaAtiva && (
                                        <>
                                            <h3>Escolha um plano</h3>
                                            <div className="ee-cobranca">
                                            <label className="ee-campo ee-documento">
                                                CPF ou CNPJ para cobrança
                                                <input
                                                    id="ee-documento"
                                                    value={documento}
                                                    inputMode="numeric"
                                                    placeholder="CPF do proprietário ou CNPJ"
                                                    onChange={(e) => { setDocumento(mascaraDocumento(e.target.value)); if (erroDocumento) setErroDocumento(''); }}
                                                    onBlur={() => documento && setErroDocumento(validarDocumento(documento))}
                                                    aria-invalid={Boolean(erroDocumento)}
                                                    aria-describedby="ee-documento-ajuda"
                                                />
                                                {erroDocumento
                                                    ? <small className="ee-erro">{erroDocumento}</small>
                                                    : <small id="ee-documento-ajuda" className="ee-ajuda-campo">Sem CNPJ? Use o CPF do proprietário. Vai só para o Asaas emitir a fatura.</small>}
                                            </label>
                                            <label className="ee-campo ee-forma">
                                                Forma de pagamento
                                                <select value={forma} onChange={(e) => setForma(e.target.value as FormaCobranca)}>
                                                    {(Object.keys(NOMES_COBRANCA) as FormaCobranca[]).map((f) => (
                                                        <option key={f} value={f}>{NOMES_COBRANCA[f]}</option>
                                                    ))}
                                                </select>
                                            </label>
                                            </div>
                                            <div className="ee-planos">
                                                {planos.map((p) => {
                                                    const gratis = Number(p.preco) <= 0;
                                                    const atual = p.id === planoAtualId;
                                                    return (
                                                        <article key={p.id} className={`ee-plano ${atual ? 'ee-plano--atual' : ''}`}>
                                                            <div className="ee-plano-nome">
                                                                {!gratis && <FontAwesomeIcon icon={faCrown} />}
                                                                <strong>{p.nome}</strong>
                                                            </div>
                                                            <span className="ee-plano-preco">
                                                                {gratis ? 'Grátis' : <>{formatarMoeda(p.preco)}<small>/mês</small></>}
                                                            </span>
                                                            <ul>
                                                                <li>Até {p.limite_usuarios} usuários</li>
                                                                <li>{p.limite_produtos ? `Até ${p.limite_produtos} produtos` : 'Produtos ilimitados'}</li>
                                                                <li>PDV, estoque, financeiro e relatórios</li>
                                                            </ul>
                                                            {atual ? (
                                                                <span className="ee-plano-selo">Plano atual</span>
                                                            ) : gratis ? null : (
                                                                <button
                                                                    type="button"
                                                                    className="ee-botao-principal"
                                                                    onClick={() => assinar(p)}
                                                                    disabled={assinando !== null || !assinatura.pagamentosConfigurados}
                                                                >
                                                                    {assinando === p.id ? 'Gerando fatura...' : 'Assinar'}
                                                                </button>
                                                            )}
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    )}

                                    {avisoPlano && (
                                        <div className={`nod-alerta nod-alerta--${avisoPlano.tipo}`} role="status">{avisoPlano.texto}</div>
                                    )}

                                    <h3>Pagamentos</h3>
                                    {assinatura.pagamentos.length === 0 ? (
                                        <p className="ee-ajuda">Nenhum pagamento ainda.</p>
                                    ) : (
                                        <table className="ee-tabela">
                                            <thead>
                                                <tr><th>Data</th><th>Forma</th><th>Situação</th><th className="direita">Valor</th></tr>
                                            </thead>
                                            <tbody>
                                                {assinatura.pagamentos.map((pg) => (
                                                    <tr key={pg.id}>
                                                        <td>{formatarData(pg.data_pagamento ?? pg.data_criacao)}</td>
                                                        <td>{pg.metodo_pagamento ? (NOMES_COBRANCA[pg.metodo_pagamento as FormaCobranca] ?? pg.metodo_pagamento) : '—'}</td>
                                                        <td><span className={`ee-pg ee-pg--${pg.status}`}>{STATUS_PAGAMENTO[pg.status] ?? pg.status}</span></td>
                                                        <td className="direita">{formatarMoeda(pg.valor)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </>
                            )}
                        </section>
                    </div>
                )}

                {cancelando && (
                    <div className="ee-modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && setCancelando(false)}>
                        <form className="ee-modal" onSubmit={confirmarCancelamento} role="dialog" aria-modal="true" aria-label="Cancelar assinatura">
                            <h2>Cancelar assinatura?</h2>
                            <p>A cobrança mensal para e a empresa volta para o plano grátis. Confirme com a sua senha.</p>
                            <input
                                type="password"
                                value={senhaCancelar}
                                onChange={(e) => setSenhaCancelar(e.target.value)}
                                placeholder="Sua senha"
                                autoComplete="current-password"
                                autoFocus
                            />
                            {erroCancelar && <p className="ee-erro">{erroCancelar}</p>}
                            <div className="editar-empresa-acoes">
                                <button type="button" className="ee-botao-secundario" onClick={() => setCancelando(false)}>Voltar</button>
                                <button type="submit" className="ee-botao-perigo" disabled={!senhaCancelar}>Cancelar assinatura</button>
                            </div>
                        </form>
                    </div>
                )}
            </main>
        </>
    );
}

export default EditarEmpresa;
