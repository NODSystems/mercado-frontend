
// App.tsx é responsável por organizar e direcionar as páginas do sistema.
import { Routes, Route } from 'react-router-dom';

// Páginas públicas e de acesso.
import Home from './pages/home/Home';
import Login from './pages/usuario/Login';
import Cadastro from './pages/usuario/Cadastro';
import RecuperarSenha from './pages/usuario/RecuperarSenha';

// Componentes e páginas principais do sistema.
import Navbar from './components/navbar';
import VisaoGeral from './pages/nodSystems/visaoGeral';
import PDV from './pages/nodSystems/PDV';
import Estoque from './pages/nodSystems/Estoque';
import Financeiro from './pages/nodSystems/Financeiro';
import Equipe from './pages/nodSystems/Equipe';
import Relatorios from './pages/nodSystems/Relatorios';

// Páginas de gerenciamento de empresas.
import MinhasEmpresas from './pages/empresa/MinhasEmpresas';
import TipoEmpresa from './pages/empresa/TipoEmpresa';
import ConfigurarEmpresa from './pages/empresa/ConfigurarEmpresa';

import Perfil from './pages/usuario/Perfil';
import AceitarConvite from './pages/usuario/AceitarConvite';
import RotaProtegida from './components/RotaProtegida';

import './App.css';

function App() {
    return (
        <Routes>
            {/* Páginas públicas e de acesso */}
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route
                path="/recuperar-senha"
                element={<RecuperarSenha />}
            />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Link do e-mail de convite de funcionário */}
            <Route path="/aceitar-convite" element={<AceitarConvite />} />

            {/* Configuração de empresas */}
            <Route
                path="/minhas-empresas"
                element={
                    <RotaProtegida>
                        <MinhasEmpresas />
                    </RotaProtegida>
                }
            />
            <Route
                path="/tipo-empresa"
                element={
                    <RotaProtegida>
                        <TipoEmpresa />
                    </RotaProtegida>
                }
            />
            <Route
                path="/configurar-empresa"
                element={
                    <RotaProtegida>
                        <ConfigurarEmpresa />
                    </RotaProtegida>
                }
            />

            {/* Visão geral */}
            <Route
                path="/"
                element={
                    <RotaProtegida exigeEmpresa>
                        <Navbar />
                        <VisaoGeral />
                    </RotaProtegida>
                }
            />

            {/* Ponto de Venda */}
            <Route
                path="/pdv"
                element={
                    <RotaProtegida exigeEmpresa>
                        <Navbar />
                        <PDV />
                    </RotaProtegida>
                }
            />

            {/* Controle de estoque */}
            <Route
                path="/estoque"
                element={
                    <RotaProtegida exigeEmpresa>
                        <Navbar />
                        <Estoque />
                    </RotaProtegida>
                }
            />

            {/* Controle financeiro */}
            <Route
                path="/financeiro"
                element={
                    <RotaProtegida exigeEmpresa>
                        <Navbar />
                        <Financeiro />
                    </RotaProtegida>
                }
            />

            {/* Gerenciamento da equipe */}
            <Route
                path="/equipe"
                element={
                    <RotaProtegida exigeEmpresa>
                        <Navbar />
                        <Equipe />
                    </RotaProtegida>
                }
            />

            {/* Relatórios gerais da empresa */}
            <Route
                path="/relatorios"
                element={
                    <RotaProtegida exigeEmpresa>
                        <Navbar />
                        <Relatorios />
                    </RotaProtegida>
                }
            />

            {/* Edição de perfil */}
            <Route
                path="/perfil"
                element={
                    <RotaProtegida>
                        <Perfil />
                    </RotaProtegida>
                }
            />
        </Routes>
    );
}

export default App;
