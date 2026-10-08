//App.jsx é o arquivo responsável por organizar e direcionar as páginas do sistema.
//Ele funciona como um “redirecionador”: define qual página deve ser exibida de acordo com a URL acessada.
//Por exemplo, / leva para a Home, /login leva para o Login e /cadastro leva para o Cadastro.
//Ele não é responsável pelo conteúdo de cada página, apenas conecta e organiza essas rotas.
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import Login from './pages/Login'
import Cadastro from './pages/Cadastro'

import './App.css'

function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route path="/" element={<Home />} />

        <Route path="/login" element={<Login />} />

        <Route path="/cadastro" element={<Cadastro />} />

      </Routes>

    </BrowserRouter>
  )
}

export default App