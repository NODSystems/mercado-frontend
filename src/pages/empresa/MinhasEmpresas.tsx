
import { useNavigate } from 'react-router-dom';
import '../../styles/empresa/MinhasEmpresas.css';

function MinhasEmpresas() {
    const navigate = useNavigate();

    return (
        <main className="minhas-empresas">
            <header className="empresas-header">
                <div>
                    <h1>Minhas empresas</h1>
                    <p>
                        Gerencie seus negócios em um só lugar com a NODSystems.
                    </p>
                </div>

                <button
                    className="adicionar-empresa"
                    onClick={() => navigate('/tipo-empresa')}
                >
                    <span>+</span> Adicionar empresa
                </button>
            </header>

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
        </main>
    );
}

export default MinhasEmpresas;
