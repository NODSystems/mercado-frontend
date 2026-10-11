import { useState } from "react";
import logo from "../assets/NodLogo(maior).jpeg";
import "../styles/components/navbar.css"
import { NavLink, useNavigate } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleUser, faRightFromBracket, faUserEdit } from "@fortawesome/free-solid-svg-icons";

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

    return (
        <nav className="navbar">
            <div className="container-fluid row" style={{ padding: "0 1%", display: "flex", alignItems: "center" }}>

                <div className="navbar-brand" style={{ flex: 1 }}>
                    <img src={logo} alt="Logo" style={{ width: '180px', height: '60px', objectFit: 'contain' }} />
                </div>

                <div className="menu-navbar" style={{ flex: 4 }}>

                    <NavLink to={'/'} className="nav-link abas-navbar">Visão Geral</NavLink>

                    <NavLink to={'/1'} className="nav-link abas-navbar">PDV</NavLink>

                    <NavLink to={'/2'} className="nav-link abas-navbar">Estoque</NavLink>

                    <NavLink to={'/3'} className="nav-link abas-navbar">Financeiro</NavLink>

                    <NavLink to={'/4'} className="nav-link abas-navbar">Equipe</NavLink>

                    <NavLink to={'/5'} className="nav-link abas-navbar" >Relatórios</NavLink>

                </div>

                <div className="perfil-container">
                    <button className={`perfil-botao ${menu ? 'ativo' : ''}`} style={{ width: '100%', justifyContent: 'space-between' }} onClick={() => setMenu(!menu)}>
                        <div className="perfil">
                            {foto ? (
                                <img src={foto} alt="Foto do funcionário" className="perfil-foto" />
                            ) : (
                                <FontAwesomeIcon icon={faCircleUser} className="perfil-foto-padrao" />
                            )}
                            <div className="perfil-informacoes">
                                <strong style={{ fontSize: '16px' }}>Nome</strong>
                                <span style={{ fontSize: '15px' }}>Cargo</span>
                            </div>
                        </div>
                        <span className={`perfil-seta ${menu ? 'open' : ''}`}>&#9013;</span>
                    </button>

                    {menu && (
                        <div className="perfil-menu">
                            <button onClick={perfil}>
                                <FontAwesomeIcon icon={faUserEdit} /> Editar perfil
                            </button>
                            <button onClick={sair}>
                                <FontAwesomeIcon icon={faRightFromBracket} /> Sair
                            </button>
                        </div>
                    )}
                </div>
            </div >
        </nav >
    );
}

export default Navbar;