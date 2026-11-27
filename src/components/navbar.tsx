import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faBuilding,
    faCircleUser,
    faRightFromBracket,
    faUserEdit,
} from "@fortawesome/free-solid-svg-icons";

import { useAuth } from "../contexts/AuthContext";
import { nomeDoCargo } from "../services/api";
import { PERMISSAO_DA_AREA } from "../data/permissoes";

import logo from "../assets/NodLogo(maior).jpeg";
import "../styles/components/navbar.css";

type Props = {
    // Versão sem abas, para telas fora de uma empresa (Minhas empresas, Perfil)
    simples?: boolean;
};

function Navbar({ simples = false }: Props) {
    const [menu, setMenu] = useState(false);
    const { usuario, empresaAtual, sair: encerrarSessao, pode } = useAuth();

    // A foto ainda não é salva no backend: fica neste navegador (tela Perfil).
    const [foto] = useState<string | null>(() => {
        try {
            return JSON.parse(localStorage.getItem("perfilNOD") || "{}").foto || null;
        } catch {
            return null;
        }
    });

    const navigate = useNavigate();

    function trocarEmpresa() {
        setMenu(false);
        navigate("/minhas-empresas");
    }

    function perfil() {
        setMenu(false);
        navigate("/perfil");
    }

    async function sair() {
        setMenu(false);
        await encerrarSessao();
        navigate("/login");
    }

    // Só aparecem as abas que o cargo pode abrir
    const abas = [
        { nome: "Visão Geral", rota: "/", permissao: null },
        { nome: "PDV", rota: "/pdv", permissao: PERMISSAO_DA_AREA.pdv },
        { nome: "Estoque", rota: "/estoque", permissao: PERMISSAO_DA_AREA.estoque },
        { nome: "Financeiro", rota: "/financeiro", permissao: PERMISSAO_DA_AREA.financeiro },
        { nome: "Equipe", rota: "/equipe", permissao: PERMISSAO_DA_AREA.equipe },
        { nome: "Relatórios", rota: "/relatorios", permissao: PERMISSAO_DA_AREA.relatorios },
    ].filter((aba) => aba.permissao === null || pode(aba.permissao));

    const mostrarAbas = !simples && empresaAtual;

    return (
        <nav className="navbar">
            <div className="container-fluid navbar-conteudo">
                <button
                    type="button"
                    className="navbar-brand"
                    onClick={() => navigate(mostrarAbas ? "/" : "/minhas-empresas")}
                    aria-label="Ir para o início"
                >
                    <img src={logo} alt="Logo NODSystems" />
                </button>

                <div className="menu-navbar">
                    {mostrarAbas && abas.map((aba) => (
                        <NavLink
                            key={aba.rota}
                            to={aba.rota}
                            end={aba.rota === "/"}
                            className="nav-link abas-navbar"
                        >
                            {aba.nome}
                        </NavLink>
                    ))}
                </div>

                <div className="perfil-container">
                    <button
                        type="button"
                        className={`perfil-botao ${menu ? "ativo" : ""}`}
                        onClick={() => setMenu(!menu)}
                        aria-expanded={menu}
                        aria-label="Abrir menu do perfil"
                    >
                        <div className="perfil">
                            {foto ? (
                                <img
                                    src={foto}
                                    alt="Foto do funcionário"
                                    className="perfil-foto"
                                />
                            ) : (
                                <FontAwesomeIcon
                                    icon={faCircleUser}
                                    className="perfil-foto-padrao"
                                />
                            )}

                            <div className="perfil-informacoes">
                                <strong>{usuario?.nome.split(" ")[0] ?? ""}</strong>
                                <span>
                                    {mostrarAbas && empresaAtual
                                        ? `${nomeDoCargo(empresaAtual)} · ${empresaAtual.nome_fantasia || empresaAtual.razao_social}`
                                        : usuario?.email ?? ""}
                                </span>
                            </div>
                        </div>

                        <span
                            className={`perfil-seta ${menu ? "open" : ""}`}
                        >
                            &#9013;
                        </span>
                    </button>

                    {menu && (
                        <div className="perfil-menu">
                            <button type="button" onClick={perfil}>
                                <FontAwesomeIcon icon={faUserEdit} />
                                Editar perfil
                            </button>

                            <button type="button" onClick={trocarEmpresa}>
                                <FontAwesomeIcon icon={faBuilding} />
                                {mostrarAbas ? "Trocar de empresa" : "Minhas empresas"}
                            </button>

                            <button type="button" onClick={sair}>
                                <FontAwesomeIcon icon={faRightFromBracket} />
                                Sair
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

export default Navbar;