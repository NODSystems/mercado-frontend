
import { useEffect, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleUser,
    faCamera,
    faEye,
    faEyeSlash
} from "@fortawesome/free-solid-svg-icons";

import "../../styles/usuario/perfil.css";
import { useAuth } from "../../contexts/AuthContext";
import { api, mensagemDeErro, nomeDoCargo, type Sessao } from "../../services/api";
import { LIMITES } from "../../utils/validacao";

// Transforma o "user agent" do navegador em algo legível (ex.: "Windows - Chrome")
function descreverDispositivo(userAgent: string | null): string {
    if (!userAgent) return "Desconhecido";

    const sistema =
        /Android/i.test(userAgent) ? "Android" :
        /iPhone|iPad/i.test(userAgent) ? "iOS" :
        /Windows/i.test(userAgent) ? "Windows" :
        /Mac OS/i.test(userAgent) ? "macOS" :
        /Linux/i.test(userAgent) ? "Linux" : "";

    const navegador =
        /Edg\//i.test(userAgent) ? "Edge" :
        /OPR\//i.test(userAgent) ? "Opera" :
        /Chrome\//i.test(userAgent) ? "Chrome" :
        /Firefox\//i.test(userAgent) ? "Firefox" :
        /Safari\//i.test(userAgent) ? "Safari" : "";

    if (!sistema && !navegador) return userAgent.slice(0, 40);

    return [sistema, navegador].filter(Boolean).join(" - ");
}

function Perfil() {
    const navigate = useNavigate();

    const { usuario, empresaAtual, recarregarUsuario } = useAuth();

    // A foto ainda não tem rota no backend: fica salva neste navegador.
    const dadosSalvos = (() => {
        try {
            return JSON.parse(localStorage.getItem("perfilNOD") || "{}");
        } catch {
            return {};
        }
    })();

    const [nome, setNome] = useState(usuario?.nome ?? "");
    const cargo = empresaAtual ? nomeDoCargo(empresaAtual) : "Sem empresa selecionada";
    const email = usuario?.email ?? "";
    const [foto, setFoto] = useState<string | null>(dadosSalvos.foto || null);
    const [senhaAtual, setSenhaAtual] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha, setMostrarSenha] = useState(false);
    // Antes toda mensagem saía em azul, inclusive os erros
    const [mensagem, setMensagemTexto] = useState("");
    const [tipoMensagem, setTipoMensagem] = useState<"sucesso" | "erro">("sucesso");
    const setMensagem = (texto: string, tipo: "sucesso" | "erro" = "erro") => {
        setMensagemTexto(texto);
        setTipoMensagem(tipo);
    };
    const [salvando, setSalvando] = useState(false);

    // Últimos logins = sessões registradas no backend
    const [sessoes, setSessoes] = useState<Sessao[]>([]);

    useEffect(() => {
        api.get<Sessao[]>("/auth/sessoes")
            .then((lista) => setSessoes(
                [...lista]
                    .sort((a, b) => b.created_at.localeCompare(a.created_at))
                    .slice(0, 5)
            ))
            .catch(() => setSessoes([]));
    }, []);

    const logins = sessoes.map((sessao) => {
        const data = new Date(sessao.created_at);

        return {
            data: data.toLocaleDateString("pt-BR"),
            horario: data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
            dispositivo: descreverDispositivo(sessao.user_agent)
        };
    });

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

    async function salvar() {
        setMensagem("");

        if (nome.trim().length < 3) {
            setMensagem("O nome deve ter pelo menos 3 caracteres.");
            return;
        }

        if (nome.trim().length > LIMITES.nomeUsuario) {
            setMensagem(`O nome deve ter no máximo ${LIMITES.nomeUsuario} caracteres.`);
            return;
        }

        if (senha && !senhaAtual) {
            setMensagem("Para trocar a senha, informe também a senha atual.");
            return;
        }

        if (senha && senha.length < LIMITES.senhaMin) {
            setMensagem(`A nova senha deve ter pelo menos ${LIMITES.senhaMin} caracteres.`);
            return;
        }

        if (senha && new TextEncoder().encode(senha).length > LIMITES.senhaMax) {
            setMensagem(`A nova senha deve ter no máximo ${LIMITES.senhaMax} caracteres.`);
            return;
        }

        setSalvando(true);

        try {
            if (nome.trim() !== usuario?.nome) {
                await api.put("/auth/editar", { nome });
            }

            // Trocar senha exige confirmar a senha atual (reautenticação)
            if (senha) {
                await api.post("/auth/reauth", { senhaAtual });
                await api.put("/auth/alterar-senha", { senhaNova: senha });
                setSenha("");
                setSenhaAtual("");
            }

            try {
                localStorage.setItem("perfilNOD", JSON.stringify({ foto }));
            } catch {
                // Foto grande demais para o navegador: ignora
            }

            await recarregarUsuario();
            setMensagem("Perfil atualizado com sucesso!", "sucesso");
        } catch (e) {
            setMensagem(mensagemDeErro(e));
        } finally {
            setSalvando(false);
        }
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
                                maxLength={LIMITES.nomeUsuario}
                            />
                        </div>

                        <div className="campo-perfil">
                            <label>Cargo</label>
                            <input
                                type="text"
                                value={cargo}
                                readOnly
                                title="O cargo é definido pela empresa"
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
                        readOnly
                        title="A troca de e-mail ainda não está disponível"
                    />
                </div>

                {/* Senha atual (necessária para trocar a senha) */}
                <div className="campo-perfil">
                    <label>Senha atual</label>
                    <input
                        type={mostrarSenha ? "text" : "password"}
                        value={senhaAtual}
                        placeholder="Preencha só se for trocar a senha"
                        onChange={e => setSenhaAtual(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>

                {/* Nova senha */}
                <div className="campo-perfil">
                    <label>Nova senha</label>

                    <div className="senha-container">
                        <input
                            type={mostrarSenha ? "text" : "password"}
                            value={senha}
                            placeholder="Mínimo de 8 caracteres"
                            onChange={e => setSenha(e.target.value)}
                            autoComplete="new-password"
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
                            {logins.length === 0 && (
                                <tr>
                                    <td colSpan={3}>Nenhum login encontrado.</td>
                                </tr>
                            )}
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
                    <p
                        className={`nod-alerta nod-alerta--${tipoMensagem}`}
                        role={tipoMensagem === "erro" ? "alert" : "status"}
                        style={{ marginTop: 15 }}
                    >
                        {mensagem}
                    </p>
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
                        disabled={salvando}
                    >
                        {salvando ? "Salvando..." : "Salvar alterações"}
                    </button>
                </div>

            </section>
        </main>
    );
}

export default Perfil;
