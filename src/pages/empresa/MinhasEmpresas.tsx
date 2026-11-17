import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../contexts/AuthContext';
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
    const { usuario, sair, selecionarEmpresa } = useAuth();

    const [empresas, setEmpresas] = useState<EmpresaResumo[]>([]);
    const [carregando, setCarregando] = useState(true);
    const [erro, setErro] = useState('');

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
                            <button
                                key={empresa.id}
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
        </main>
    );
}

export default MinhasEmpresas;
