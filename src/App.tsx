
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

            {/* Configuração de empresas */}
            <Route
                path="/minhas-empresas"
                element={<MinhasEmpresas />}
            />
            <Route
                path="/tipo-empresa"
                element={<TipoEmpresa />}
            />
            <Route
                path="/configurar-empresa"
                element={<ConfigurarEmpresa />}
            />

            {/* Visão geral */}
            <Route
                path="/"
                element={
                    <>
                        <Navbar />
                        <VisaoGeral />
                    </>
                }
            />

            {/* Ponto de Venda */}
            <Route
                path="/pdv"
                element={
                    <>
                        <Navbar />
                        <PDV />
                    </>
                }
            />

            {/* Controle de estoque */}
            <Route
                path="/estoque"
                element={
                    <>
                        <Navbar />
                        <Estoque />
                    </>
                }
            />

            {/* Controle financeiro */}
            <Route
                path="/financeiro"
                element={
                    <>
                        <Navbar />
                        <Financeiro />
                    </>
                }
            />

            {/* Gerenciamento da equipe */}
            <Route
                path="/equipe"
                element={
                    <>
                        <Navbar />
                        <Equipe />
                    </>
                }
            />

            {/* Relatórios gerais da empresa */}
            <Route
                path="/relatorios"
                element={
                    <>
                        <Navbar />
                        <Relatorios />
                    </>
                }
            />
        </Routes>
    );
}

export default App;
