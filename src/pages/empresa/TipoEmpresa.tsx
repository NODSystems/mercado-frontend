
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/empresa/TipoEmpresa.css';
import { TIPOS_EMPRESA } from '../../data/tiposEmpresa';


function TipoEmpresa() {
    const navigate = useNavigate();
    const [tipoSelecionado, setTipoSelecionado] = useState('');

    function continuar() {
        if (!tipoSelecionado) return;

        navigate('/configurar-empresa', {
            state: { tipoEmpresa: tipoSelecionado },
        });
    }

    return (
        <main className="tipo-empresa">
            <header className="tipo-empresa-header">
                <button
                    className="voltar-empresas"
                    onClick={() => navigate('/minhas-empresas')}
                >
                    ← Voltar
                </button>

                <span className="etapa-empresa">ETAPA 1 DE 2</span>
            </header>

            <section className="tipo-empresa-conteudo">
                <h1>Qual é o seu tipo de negócio?</h1>

                <p className="tipo-empresa-subtitulo">
                    Vamos personalizar a NODSystems para atender às
                    necessidades da sua empresa.
                </p>

                <div className="tipos-empresa-grid">
                    {TIPOS_EMPRESA.map((tipo) => (
                        <button
                            key={tipo.id}
                            type="button"
                            className={`tipo-empresa-card ${
                                tipoSelecionado === tipo.id ? 'selecionado' : ''
                            }`}
                            onClick={() => setTipoSelecionado(tipo.id)}
                            aria-pressed={tipoSelecionado === tipo.id}
                        >
                            <span className="tipo-empresa-icone">
                                {tipo.icone}
                            </span>

                            <span className="tipo-empresa-nome">
                                {tipo.nome}
                            </span>

                            <span className="tipo-empresa-descricao">
                                {tipo.descricao}
                            </span>

                            <span className="tipo-empresa-selecao">
                                {tipoSelecionado === tipo.id ? '✓' : ''}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="tipo-empresa-rodape">
                    <span>
                        {tipoSelecionado
                            ? 'Tipo de negócio selecionado.'
                            : 'Selecione uma opção para continuar.'}
                    </span>

                    <button
                        className="continuar-empresa"
                        onClick={continuar}
                        disabled={!tipoSelecionado}
                    >
                        Continuar →
                    </button>
                </div>
            </section>
        </main>
    );
}

export default TipoEmpresa;
