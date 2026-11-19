import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';

import { useAuth } from '../../contexts/AuthContext';
import ExcluirEmpresaModal from '../../components/empresa/ExcluirEmpresaModal';
import {
    api,
    mensagemDeErro,
    nomeDoCargo,
    type EmpresaResumo,
} from '../../services/api';
import '../../styles/empresa/MinhasEmpresas.css';

const CHAVE_CONVITE = 'nod:convitePendente';

function MinhasEmpresas() {
    const navigate = useNavigate();
    const { usuario, sair, selecionarEmpresa, empresaAtual } = useAuth();

    const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');
    const [aviso, setAviso] = useState('');

    // Empresa aberta no modal de exclusão
    const [paraExcluir, setParaExcluir] = useState<EmpresaResumo | null>(null);

    function aoExcluir(excluida: EmpresaResumo) {
        setParaExcluir(null);
        setEmpresas((lista) => lista.filter((e) => e.id !== excluida.id));
        setAviso(`${excluida.nome_fantasia || excluida.razao_social} foi excluída.`);

        // Se era a empresa aberta no sistema, deixa de ser
        if (empresaAtual?.id === excluida.id) selecionarEmpresa(null);
    }

    // Convite aberto antes do login/cadastro (guardado pela página de convite)
    const [convitePendente] = useState(() => {
        try {
            return localStorage.getItem(CHAVE_CONVITE);
        } catch {
            return null;
        }
    });

    useEffect(() => {
        api.get<{ resultado: EmpresaResumo[] }>('/empresas/listar')
            .then((resposta) => setEmpresas(resposta.resultado))
            .catch((e) => setErro(mensagemDeErro(e)))
            .finally(() => setCarregando(false));
    }, []);

    function abrirEmpresa(empresa: EmpresaResumo) {
        selecionarEmpresa(empresa);
        navigate('/');
    }

    async function sairDaConta() {
        await sair();
        navigate('/login');
    }

    const botaoAdicionar = (
        <button
            className="adicionar-empresa"
            onClick={() => navigate('/tipo-empresa')}
        >
            <span>+</span> Adicionar empresa
        </button>
    );

    return (
        <main className="minhas-empresas">
            <header className="empresas-header">
                <div>
                    <h1>Minhas empresas</h1>
                    <p>
                        {usuario ? `Olá, ${usuario.nome.split(' ')[0]}! ` : ''}
                        Gerencie seus negócios em um só lugar com a NODSystems.
                    </p>
                </div>

                <div className="empresas-acoes-topo">
                    {botaoAdicionar}
                    <button className="empresas-sair" onClick={sairDaConta}>
                        Sair
                    </button>
                </div>
            </header>

            {convitePendente && (
                <div className="nod-alerta nod-alerta--info" role="status">
                    Você tem um convite para entrar numa equipe.{' '}
                    <Link to={`/aceitar-convite?token=${encodeURIComponent(convitePendente)}`}>
                        Ver convite
                    </Link>
                </div>
            )}

            {aviso && (
                <div className="nod-alerta nod-alerta--sucesso" role="status">
                    {aviso}
                </div>
            )}

            {erro && (
                <div className="nod-alerta nod-alerta--erro" role="alert">
                    {erro}
                </div>
            )}

            {carregando ? (
                <p>Carregando empresas...</p>
            ) : empresas.length > 0 ? (
                <section className="empresas-grid">
                    {empresas.map((empresa) => {
                        const suspensa = empresa.status !== 'ATIVA';

                        return (
                            <div key={empresa.id} className="empresa-card-wrapper">
                                <button
                                    type="button"
                                    className="empresa-card"
                                    onClick={() => abrirEmpresa(empresa)}
                                    disabled={suspensa}
                                    title={suspensa ? 'Empresa suspensa' : 'Abrir empresa'}
                                >
                                    <h2>{empresa.nome_fantasia || empresa.razao_social}</h2>

                                    {empresa.nome_fantasia && (
                                        <small>{empresa.razao_social}</small>
                                    )}

                                    <div className="empresa-card-rodape">
                                        <span className="empresa-etiqueta">
                                            {nomeDoCargo(empresa)}
                                        </span>

                                        {suspensa && (
                                            <span className="empresa-etiqueta empresa-etiqueta--suspensa">
                                                Suspensa
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* Só o proprietário pode excluir */}
                                {empresa.cargo === 'PROPRIETARIO' && (
                                    <button
                                        type="button"
                                        className="empresa-excluir"
                                        onClick={() => setParaExcluir(empresa)}
                                        aria-label={`Excluir ${empresa.nome_fantasia || empresa.razao_social}`}
                                        title="Excluir empresa"
                                    >
                                        <FontAwesomeIcon icon={faTrash} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </section>
            ) : !erro ? (
                <section className="empresas-vazio">
                    <div className="empresas-icone">+</div>

                    <h2>Nenhuma empresa cadastrada</h2>

                    <p>
                        Comece cadastrando sua empresa para configurar
                        seu negócio e acessar as ferramentas da NODSystems.
                    </p>

                    <button
                        className="adicionar-empresa"
                        onClick={() => navigate('/tipo-empresa')}
                    >
                        Adicionar minha primeira empresa
                    </button>
                </section>
            ) : null}
            {paraExcluir && (
                <ExcluirEmpresaModal
                    empresa={paraExcluir}
                    onCancelar={() => setParaExcluir(null)}
                    onExcluida={aoExcluir}
                />
            )}
        </main>
    );
}

export default MinhasEmpresas;
