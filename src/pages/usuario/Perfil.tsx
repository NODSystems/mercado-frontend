
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
import Navbar from "../../components/navbar";
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

    const { usuario, empresaAtual, recarregarUsuario, sair } = useAuth();

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

    // Sessões (aparelhos onde a conta está logada)
    const [sessoes, setSessoes] = useState<Sessao[]>([]);
    const [mensagemSessoes, setMensagemSessoes] = useState("");
    const [ocupado, setOcupado] = useState("");

    function carregarSessoes() {
        api.get<Sessao[]>("/auth/sessoes")
            .then((lista) => setSessoes(
                [...lista].sort((a, b) => b.created_at.localeCompare(a.created_at))
            ))
            .catch(() => setSessoes([]));
    }

    useEffect(() => { carregarSessoes(); }, []);

    const agora = Date.now();
    const situacao = (s: Sessao) =>
        s.revoked_at ? "Encerrada" : new Date(s.expires_at).getTime() < agora ? "Expirada" : "Ativa";

    async function acaoSessao(chave: string, executar: () => Promise<{ mensagem?: string }>, desconecta = false) {
        setOcupado(chave);
        setMensagemSessoes("");
        try {
            const r = await executar();
            if (desconecta) {
                await sair();
                navigate("/login");
                return;
            }
            setMensagemSessoes(r?.mensagem ?? "Pronto.");
            carregarSessoes();
        } catch (e) {
            setMensagemSessoes(mensagemDeErro(e));
        } finally {
            setOcupado("");
        }
    }

    const encerrarSessao = (s: Sessao) =>
        acaoSessao(`encerrar-${s.id}`, () => api.post(`/auth/sessoes/desativar/${s.id}`), Boolean(s.atual));
    const apagarSessao = (s: Sessao) =>
        acaoSessao(`apagar-${s.id}`, () => api.delete(`/auth/sessoes/${s.id}`), Boolean(s.atual));
    const encerrarOutras = () =>
        acaoSessao("outras", () => api.post("/auth/sessoes/encerrar-outras"));
    const apagarEncerradas = () =>
        acaoSessao("limpar", () => api.delete("/auth/sessoes/encerradas"));
    const encerrarTodas = () => {
        if (!window.confirm("Sair de todos os aparelhos, inclusive deste?")) return;
        acaoSessao("todas", () => api.post("/auth/sessoes/logout-todas"), true);
    };

    const ativas = sessoes.filter((s) => situacao(s) === "Ativa");
    const encerradas = sessoes.length - ativas.length;

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
        <>
        <Navbar simples={!empresaAtual} />
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

                {/* Sessões: onde a conta está logada */}
                <div className="historico-logins">
                    <div className="sessoes-cabecalho">
                        <h3>Sessões e acessos</h3>
                        <div className="sessoes-acoes">
                            <button type="button" onClick={encerrarOutras} disabled={ativas.length <= 1 || ocupado !== ""}>
                                Encerrar outras sessões
                            </button>
                            <button type="button" onClick={apagarEncerradas} disabled={encerradas === 0 || ocupado !== ""}>
                                Limpar encerradas
                            </button>
                            <button type="button" className="perigo" onClick={encerrarTodas} disabled={ocupado !== ""}>
                                Sair de todos
                            </button>
                        </div>
                    </div>

                    {mensagemSessoes && <p className="nod-alerta nod-alerta--info" role="status">{mensagemSessoes}</p>}

                    <div className="sessoes-tabela">
                    <table>
                        <thead>
                            <tr>
                                <th>Entrou em</th>
                                <th>Dispositivo</th>
                                <th>Situação</th>
                                <th aria-label="Ações" />
                            </tr>
                        </thead>

                        <tbody>
                            {sessoes.length === 0 && (
                                <tr>
                                    <td colSpan={4}>Nenhuma sessão encontrada.</td>
                                </tr>
                            )}
                            {sessoes.map((s) => {
                                const data = new Date(s.created_at);
                                const estado = situacao(s);
                                return (
                                    <tr key={s.id} className={estado !== "Ativa" ? "sessao-encerrada" : ""}>
                                        <td>
                                            {data.toLocaleDateString("pt-BR")}{" "}
                                            {data.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                        </td>
                                        <td>
                                            {descreverDispositivo(s.user_agent)}
                                            {s.atual && <span className="sessao-atual">este aparelho</span>}
                                        </td>
                                        <td>
                                            <span className={`sessao-status sessao-status--${estado.toLowerCase()}`}>{estado}</span>
                                        </td>
                                        <td className="sessao-botoes">
                                            {estado === "Ativa" ? (
                                                <button type="button" onClick={() => encerrarSessao(s)} disabled={ocupado !== ""}>
                                                    {s.atual ? "Sair" : "Encerrar"}
                                                </button>
                                            ) : (
                                                <button type="button" onClick={() => apagarSessao(s)} disabled={ocupado !== ""}>
                                                    Excluir
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    </div>
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
                        onClick={() => navigate(empresaAtual ? "/" : "/minhas-empresas")}
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
        </>
    );
}

export default Perfil;
