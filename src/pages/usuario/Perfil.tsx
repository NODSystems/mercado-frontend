
import { useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleUser,
    faCamera,
    faEye,
    faEyeSlash
} from "@fortawesome/free-solid-svg-icons";

import "../../styles/usuario/perfil.css";

function Perfil() {
    const navigate = useNavigate();

    const dadosSalvos = JSON.parse(localStorage.getItem("perfilNOD") || "{}");

    const [nome, setNome] = useState(dadosSalvos.nome || "Nome");
    const [cargo, setCargo] = useState(dadosSalvos.cargo || "Cargo");
    const [email, setEmail] = useState(dadosSalvos.email || "email@nodsystems.com");
    const [foto, setFoto] = useState<string | null>(dadosSalvos.foto || null);
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    const [mensagem, setMensagem] = useState("");

    const logins = [
        { data: "10/11/2026", horario: "09:30", dispositivo: "Windows - Chrome" },
        { data: "09/11/2026", horario: "14:20", dispositivo: "Windows - Chrome" },
        { data: "08/11/2026", horario: "08:15", dispositivo: "Android - Chrome" }
    ];

    function alterarFoto(event: ChangeEvent<HTMLInputElement>) {
        const arquivo = event.target.files?.[0];

        if (arquivo) {
            const leitor = new FileReader();

            leitor.onload = () => {
                setFoto(leitor.result as string);
            };

            leitor.readAsDataURL(arquivo);
        }
    }

    function salvar() {
        if (!nome.trim() || !cargo.trim() || !email.trim()) {
            setMensagem("Preencha todos os campos obrigatórios.");
            return;
        }

        localStorage.setItem("perfilNOD", JSON.stringify({
            nome,
            cargo,
            email,
            foto
        }));

        setMensagem("Perfil atualizado com sucesso!");
    }

    return (
        <main className="perfil-pagina">
            <section className="perfil-conteudo">

                <h2>Editar perfil</h2>

                {/* Foto, nome e cargo */}
                <div className="perfil-topo">

                    <label
                        className="perfil-foto-editar"
                        data-tooltip="Clique para alterar sua foto"
                        title="Alterar foto do perfil"
                    >
                        {foto ? (
                            <img src={foto} alt="Foto do funcionário" />
                        ) : (
                            <FontAwesomeIcon icon={faCircleUser} />
                        )}

                        <span>
                            <FontAwesomeIcon icon={faCamera} />
                        </span>

                        <input
                            type="file"
                            accept="image/*"
                            onChange={alterarFoto}
                            hidden
                        />
                    </label>

                    <div className="perfil-campos-topo">

                        <div className="campo-perfil">
                            <label>Nome</label>
                            <input
                                type="text"
                                value={nome}
                                onChange={e => setNome(e.target.value)}
                            />
                        </div>

                        <div className="campo-perfil">
                            <label>Cargo</label>
                            <input
                                type="text"
                                value={cargo}
                                onChange={e => setCargo(e.target.value)}
                            />
                        </div>

                    </div>
                </div>

                {/* E-mail */}
                <div className="campo-perfil">
                    <label>E-mail</label>
                    <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />
                </div>

                {/* Senha */}
                <div className="campo-perfil">
                    <label>Senha</label>

                    <div className="senha-container">
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            value={senha}
                            placeholder="Digite uma nova senha"
                            onChange={e => setSenha(e.target.value)}
                        />

                        <button
                            type="button"
                            onClick={() => setMostrarSenha(!mostrarSenha)}
                        >
                            <FontAwesomeIcon
                                icon={mostrarSenha ? faEyeSlash : faEye}
                            />
                        </button>
                    </div>
                </div>

                {/* Histórico de logins */}
                <div className="historico-logins">
                    <h3>Últimos logins</h3>

                    <table>
                        <thead>
                            <tr>
                                <th>Data</th>
                                <th>Horário</th>
                                <th>Dispositivo</th>
                            </tr>
                        </thead>

                        <tbody>
                            {logins.map((login, index) => (
                                <tr key={index}>
                                    <td>{login.data}</td>
                                    <td>{login.horario}</td>
                                    <td>{login.dispositivo}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mensagem */}
                {mensagem && (
                    <p className="perfil-mensagem">{mensagem}</p>
                )}

                {/* Botões */}
                <div className="perfil-acoes">
                    <button
                        className="botao-voltar"
                        onClick={() => navigate("/")}
                    >
                        Voltar
                    </button>

                    <button
                        className="botao-salvar"
                        onClick={salvar}
                    >
                        Salvar alterações
                    </button>
                </div>

            </section>
        </main>
    );
}

export default Perfil;
