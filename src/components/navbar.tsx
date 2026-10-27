import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faCircleUser,
    faRightFromBracket,
    faUserEdit,
} from "@fortawesome/free-solid-svg-icons";

import logo from "../assets/NodLogo(maior).jpeg";
import "../styles/components/navbar.css";

function Navbar() {
    const [menu, setMenu] = useState(false);
    const [foto, setFoto] = useState<string | null>(null);

    const navigate = useNavigate();

    function perfil() {
        setMenu(false);
        navigate("/perfil");
    }

    function sair() {
        setMenu(false);
        navigate("/login");
    }

    const abas = [
        { nome: "Visão Geral", rota: "/" },
        { nome: "PDV", rota: "/pdv" },
        { nome: "Estoque", rota: "/estoque" },
        { nome: "Financeiro", rota: "/financeiro" },
        { nome: "Equipe", rota: "/equipe" },
        { nome: "Relatórios", rota: "/relatorios" },
    ];

    return (
        <nav className="navbar">
            <div className="container-fluid navbar-conteudo">
                <div className="navbar-brand">
                    <img src={logo} alt="Logo NODSystems" />
                </div>

                <div className="menu-navbar">
                    {abas.map((aba) => (
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
                                <strong>Nome</strong>
                                <span>Cargo</span>
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