import { useEffect, useState } from "react";
import "../styles/components/carrossel.css";

const informacoes = [
    {
        titulo: "Vendas do dia",
        valor: "R$ 2.450,00",
        descricao: "Total vendido hoje"
    },
    {
        titulo: "Produtos em estoque",
        valor: "320",
        descricao: "Produtos disponíveis"
    },
    {
        titulo: "Pedidos pendentes",
        valor: "12",
        descricao: "Pedidos aguardando conclusão"
    }
];

function Carrossel() {
    const [indice, setIndice] = useState(0);

    function proximo() {
        setIndice((atual) => (atual + 1) % informacoes.length);
    }

    function anterior() {
        setIndice((atual) =>
            (atual - 1 + informacoes.length) % informacoes.length
        );
    }

    const info = informacoes[indice];

    useEffect(() => {
        const intervalo = setTimeout(() => {
            setIndice((atual) => (atual + 1) % informacoes.length);
        }, 5000);

        return () => clearInterval(intervalo);
    }, [indice]);

    return (
        <div className="card card-carrossel shadow-sm">
            <div className="card-body">

                <button className="btn btn-light seta-anterior" onClick={anterior} aria-label="Informação anterior"                >
                    &#10094;
                </button>

                <div className="carrossel-conteudo">
                    <div className="text-center">
                        <h5 className="card-title" style={{ color: 'white' }}>
                            {info.titulo}
                        </h5>
                        <h2>{info.valor}</h2>
                        <p className="card-text mb-0" style={{ color: 'white' }}>
                            {info.descricao}
                        </p>
                    </div>

                    <div className="indicadores-carrossel">
                        {informacoes.map((_, i) => (
                            <button key={i} className={`indicador ${i === indice ? "selecionado" : ""}`}
                                onClick={() => setIndice(i)} aria-label={`Ir para informação ${i + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <button className="btn btn-light seta-proxima" onClick={proximo} aria-label="Próxima informação"               >
                    &#10095;
                </button>

            </div>
        </div>
    );
}

export default Carrossel;