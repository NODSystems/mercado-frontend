
 // App.tsx é responsável por organizar e direcionar as páginas do sistema.
import { Routes, Route } from 'react-router-dom';

import Home from './pages/home/Home';
import Login from './pages/usuario/Login';
import Cadastro from './pages/usuario/Cadastro';

import Navbar from './components/navbar';
import VisaoGeral from './pages/nodSystems/visaoGeral';

import MinhasEmpresas from './pages/empresa/MinhasEmpresas';
import TipoEmpresa from './pages/empresa/TipoEmpresa';
import ConfigurarEmpresa from './pages/empresa/ConfigurarEmpresa';

import './App.css';

function App() {
    return (
        <Routes>
            {/* Páginas de acesso */}
            <Route path="/home" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />

            {/* Configuração de empresas */}
            <Route path="/minhas-empresas" element={<MinhasEmpresas />} />
            <Route path="/tipo-empresa" element={<TipoEmpresa />} />
            <Route path="/configurar-empresa" element={<ConfigurarEmpresa />} />

            {/* Sistema principal */}
            <Route
                path="/"
                element={
                    <>
                        <Navbar />
                        <VisaoGeral />
                    </>
                }
            />

            {/* Futuras páginas do sistema */}
            {/* <Route path="/pdv" element={<PDV />} /> */}
            {/* <Route path="/estoque" element={<Estoque />} /> */}
            {/* <Route path="/financeiro" element={<Financeiro />} /> */}
            {/* <Route path="/equipe" element={<Equipe />} /> */}
            {/* <Route path="/relatorios" element={<Relatorios />} /> */}
        </Routes>
    );
}

export default App;
