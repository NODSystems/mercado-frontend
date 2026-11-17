import Carrossel from "../../components/carrosel";
import { useAuth } from "../../contexts/AuthContext";
import "../../App.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGears, faWarning } from "@fortawesome/free-solid-svg-icons";

function VisaoGeral() {
    const { usuario } = useAuth();

    return (
        <div className="container-fluid" style={{ padding: "0 1%" }}>
            <div className="row">
                <div className="col-12">
                    <h2>Bem-vindo, {usuario?.nome.split(" ")[0] ?? "Usuário"}!</h2>
                </div>
            </div>

            <div className="row">
                <div className="col-12">
                    <Carrossel />
                </div>
            </div>

            <div className="row">
                <div className="col-md-6">
                    <div className="cards">
                        <h6 className="card-titulo"><FontAwesomeIcon icon={faGears} style={{color: 'gray'}}></FontAwesomeIcon> Operações</h6>
                        <div className="card-conteudo">
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                            <div className="card-item">
                                Caixa
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="cards">
                        <h6 className="card-titulo"><FontAwesomeIcon icon={faWarning} style={{color: 'orange'}}></FontAwesomeIcon> Atenções</h6>
                        <div className="card-conteudo">
                            <div className="card-item">
                                Caixa
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VisaoGeral;