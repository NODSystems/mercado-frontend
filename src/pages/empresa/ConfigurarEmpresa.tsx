
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import '../../styles/empresa/ConfigurarEmpresa.css';

type DadosEmpresa = {
    nome: string;
    nomeFantasia: string;
    cnpj: string;
    telefone: string;
    email: string;
    cep: string;
    endereco: string;
    numero: string;
    cidade: string;
    estado: string;
};

const dadosIniciais: DadosEmpresa = {
    nome: '',
    nomeFantasia: '',
    cnpj: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
};

const nomesTipos: Record<string, string> = {
    mercadinho: 'Mercadinho / Mercado',
    padaria: 'Padaria',
    academia: 'Academia',
    informatica: 'Loja de informática',
    roupas: 'Loja de roupas',
    salao: 'Salão / Barbearia',
    papelaria: 'Papelaria',
    assistencia: 'Assistência técnica',
    outros: 'Outro negócio',
};

function ConfigurarEmpresa() {
    const navigate = useNavigate();
    const location = useLocation();

    const tipoEmpresa =
        (location.state as { tipoEmpresa?: string } | null)?.tipoEmpresa ?? '';

    const [etapa, setEtapa] = useState(1);
    const [dados, setDados] = useState<DadosEmpresa>(dadosIniciais);
    const [erro, setErro] = useState('');
    const [concluido, setConcluido] = useState(false);

    function atualizarCampo(campo: keyof DadosEmpresa, valor: string) {
        setDados((anterior) => ({
            ...anterior,
            [campo]: valor,
        }));
        setErro('');
    }

    function continuar() {
        if (etapa === 1) {
            if (!dados.nome.trim()) {
                setErro('Informe a razão social ou o nome do responsável pelo negócio.');
                return;
            }
        }

        if (etapa === 2) {
            if (
                !dados.telefone.trim() ||
                !dados.email.trim() ||
                !dados.cep.trim() ||
                !dados.endereco.trim() ||
                !dados.numero.trim() ||
                !dados.cidade.trim() ||
                !dados.estado.trim()
            ) {
                setErro('Preencha todos os campos obrigatórios desta etapa.');
                return;
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
                setErro('Informe um e-mail válido.');
                return;
            }
        }

        setErro('');
        setEtapa((anterior) => Math.min(anterior + 1, 3));
    }

    function concluirCadastro() {
        // Protótipo: os dados ainda não são enviados ao servidor.
        setConcluido(true);
    }

    function voltar() {
        if (etapa > 1) {
            setEtapa((anterior) => anterior - 1);
            setErro('');
        } else {
            navigate('/tipo-empresa', {
                state: { tipoEmpresa },
            });
        }
    }

    return (
        <main className="configurar-empresa">
            <header className="configurar-header">
                <button
                    type="button"
                    className="configurar-voltar"
                    onClick={() => navigate('/minhas-empresas')}
                >
                    ← Minhas empresas
                </button>

                <span className="configurar-marca">NODSystems</span>
            </header>

            {concluido ? (
                <section className="configurar-sucesso">
                    <div className="sucesso-icone">✓</div>

                    <h1>Empresa configurada!</h1>

                    <p>
                        Os dados de <strong>{dados.nomeFantasia.trim() || dados.nome}</strong>{' '}
                        foram preenchidos. Como estamos na versão de demonstração,
                        as informações ainda não foram salvas no servidor.
                    </p>

                    <button
                        type="button"
                        className="configurar-botao principal"
                        onClick={() => navigate('/minhas-empresas')}
                    >
                        Voltar para minhas empresas
                    </button>
                </section>
            ) : (
                <section className="configurar-conteudo">
                    <div className="configurar-introducao">
                        <span className="configurar-etiqueta">
                            CONFIGURAÇÃO DA EMPRESA
                        </span>

                        <h1>Vamos configurar seu negócio</h1>

                        <p>
                            Preencha os dados para preparar a NODSystems
                            para a sua empresa.
                        </p>
                    </div>

                    <div className="configurar-progresso">
                        {[1, 2, 3].map((numero) => (
                            <div
                                key={numero}
                                className={`progresso-etapa ${
                                    etapa >= numero ? 'ativa' : ''
                                }`}
                            >
                                <span className="progresso-numero">
                                    {etapa > numero ? '✓' : numero}
                                </span>

                                <span className="progresso-texto">
                                    {numero === 1
                                        ? 'Empresa'
                                        : numero === 2
                                          ? 'Contato e endereço'
                                          : 'Revisão'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="configurar-card">
                        {etapa === 1 && (
                            <div className="configurar-formulario">
                                <h2>Dados da empresa</h2>

                                <p className="configurar-descricao">
                                    Primeiro, conte um pouco sobre o seu negócio.
                                </p>

                                <div className="campo-configurar">
                                    <label htmlFor="nome">
                                        Razão social ou nome do responsável *
                                    </label>
                                    <input
                                        id="nome"
                                        value={dados.nome}
                                        onChange={(e) =>
                                            atualizarCampo('nome', e.target.value)
                                        }
                                        placeholder="Digite o nome completo"
                                        autoComplete="organization"
                                    />
                                </div>

                                <div className="campo-configurar">
                                    <label htmlFor="nomeFantasia">
                                        Nome fantasia
                                    </label>
                                    <input
                                        id="nomeFantasia"
                                        value={dados.nomeFantasia}
                                        onChange={(e) =>
                                            atualizarCampo(
                                                'nomeFantasia',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Como sua empresa é conhecida?"
                                    />
                                </div>

                                <div className="campo-configurar">
                                    <label htmlFor="cnpj">
                                        CNPJ <span>(opcional)</span>
                                    </label>
                                    <input
                                        id="cnpj"
                                        value={dados.cnpj}
                                        onChange={(e) =>
                                            atualizarCampo('cnpj', e.target.value)
                                        }
                                        placeholder="00.000.000/0000-00"
                                        inputMode="numeric"
                                    />
                                    <small>
                                        Você pode continuar mesmo se seu negócio
                                        ainda não tiver CNPJ.
                                    </small>
                                </div>

                                <div className="campo-configurar">
                                    <label>Tipo de negócio</label>
                                    <div className="tipo-empresa-resumo">
                                        {nomesTipos[tipoEmpresa] || 'Não informado'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {etapa === 2 && (
                            <div className="configurar-formulario">
                                <h2>Contato e endereço</h2>

                                <p className="configurar-descricao">
                                    Como podemos entrar em contato e localizar
                                    sua empresa?
                                </p>

                                <div className="configurar-duas-colunas">
                                    <div className="campo-configurar">
                                        <label htmlFor="telefone">Telefone *</label>
                                        <input
                                            id="telefone"
                                            type="tel"
                                            value={dados.telefone}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    'telefone',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="(12) 99999-9999"
                                            autoComplete="tel"
                                        />
                                    </div>

                                    <div className="campo-configurar">
                                        <label htmlFor="email">
                                            E-mail comercial *
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={dados.email}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    'email',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="contato@empresa.com"
                                            autoComplete="email"
                                        />
                                    </div>
                                </div>

                                <div className="configurar-duas-colunas">
                                    <div className="campo-configurar">
                                        <label htmlFor="cep">CEP *</label>
                                        <input
                                            id="cep"
                                            value={dados.cep}
                                            onChange={(e) =>
                                                atualizarCampo('cep', e.target.value)
                                            }
                                            placeholder="00000-000"
                                            autoComplete="postal-code"
                                        />
                                    </div>

                                    <div className="campo-configurar">
                                        <label htmlFor="estado">Estado (UF) *</label>
                                        <input
                                            id="estado"
                                            value={dados.estado}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    'estado',
                                                    e.target.value.toUpperCase().slice(0, 2),
                                                )
                                            }
                                            placeholder="SP"
                                            maxLength={2}
                                            autoComplete="address-level1"
                                        />
                                    </div>
                                </div>

                                <div className="campo-configurar">
                                    <label htmlFor="endereco">Rua ou avenida *</label>
                                    <input
                                        id="endereco"
                                        value={dados.endereco}
                                        onChange={(e) =>
                                            atualizarCampo(
                                                'endereco',
                                                e.target.value,
                                            )
                                        }
                                        placeholder="Nome da rua ou avenida"
                                        autoComplete="street-address"
                                    />
                                </div>

                                <div className="configurar-duas-colunas">
                                    <div className="campo-configurar">
                                        <label htmlFor="numero">Número *</label>
                                        <input
                                            id="numero"
                                            value={dados.numero}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    'numero',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Número"
                                        />
                                    </div>

                                    <div className="campo-configurar">
                                        <label htmlFor="cidade">Cidade *</label>
                                        <input
                                            id="cidade"
                                            value={dados.cidade}
                                            onChange={(e) =>
                                                atualizarCampo(
                                                    'cidade',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Sua cidade"
                                            autoComplete="address-level2"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {etapa === 3 && (
                            <div className="configurar-formulario">
                                <h2>Revise os dados</h2>

                                <p className="configurar-descricao">
                                    Confira as informações antes de concluir.
                                </p>

                                <div className="revisao-grupo">
                                    <h3>Empresa</h3>
                                    <p>
                                        <strong>Nome:</strong> {dados.nome}
                                    </p>
                                    <p>
                                        <strong>Nome fantasia:</strong>{' '}
                                        {dados.nomeFantasia || 'Não informado'}
                                    </p>
                                    <p>
                                        <strong>CNPJ:</strong>{' '}
                                        {dados.cnpj || 'Não informado'}
                                    </p>
                                    <p>
                                        <strong>Tipo:</strong>{' '}
                                        {nomesTipos[tipoEmpresa] || 'Não informado'}
                                    </p>
                                </div>

                                <div className="revisao-grupo">
                                    <h3>Contato</h3>
                                    <p><strong>Telefone:</strong> {dados.telefone}</p>
                                    <p><strong>E-mail:</strong> {dados.email}</p>
                                </div>

                                <div className="revisao-grupo">
                                    <h3>Endereço</h3>
                                    <p>
                                        {dados.endereco}, {dados.numero}
                                    </p>
                                    <p>
                                        {dados.cidade} - {dados.estado}
                                    </p>
                                    <p><strong>CEP:</strong> {dados.cep}</p>
                                </div>

                                <p className="aviso-prototipo">
                                    Esta é uma demonstração. Ao concluir,
                                    os dados não serão enviados nem salvos
                                    no banco de dados.
                                </p>
                            </div>
                        )}

                        {erro && (
                            <p className="configurar-erro" role="alert">
                                {erro}
                            </p>
                        )}

                        <footer className="configurar-acoes">
                            <button
                                type="button"
                                className="configurar-botao secundario"
                                onClick={voltar}
                            >
                                Voltar
                            </button>

                            {etapa < 3 ? (
                                <button
                                    type="button"
                                    className="configurar-botao principal"
                                    onClick={continuar}
                                >
                                    Continuar →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="configurar-botao principal"
                                    onClick={concluirCadastro}
                                >
                                    Concluir configuração
                                </button>
                            )}
                        </footer>
                    </div>
                </section>
            )}
        </main>
    );
}

export default ConfigurarEmpresa;
