// Página aberta pelo link do e-mail de convite de funcionário.
// Se a pessoa não estiver logada, manda para o login/cadastro e volta
// para cá depois. Logada, aceita o convite com um clique.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import nodsystems from '../../assets/nodsystems.png'
import GrowthBackground from '../../components/GrowthBackground'
import { useAuth } from '../../contexts/AuthContext'
import { api, ApiError, mensagemDeErro } from '../../services/api'

import '../../styles/usuario/Login.css'
import '../../styles/components/GrowthBackground.css'

const CHAVE_CONVITE = 'nod:convitePendente'

function AceitarConvite() {
  const { usuario, carregando, sair } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()

  const token = params.get('token') || ''
  const voltarPara = `/aceitar-convite?token=${encodeURIComponent(token)}`

  const [erro, setErro] = useState('')
  const [aceitando, setAceitando] = useState(false)
  const [aceito, setAceito] = useState(false)

  // Guarda o convite: se a pessoa precisar criar conta e confirmar o
  // e-mail, a tela "Minhas empresas" lembra dele depois do login.
  useEffect(() => {
    try {
      if (token) localStorage.setItem(CHAVE_CONVITE, token)
    } catch {
      // Sem localStorage: segue sem lembrar o convite.
    }
  }, [token])

  async function aceitar() {
    setErro('')
    setAceitando(true)

    try {
      await api.post('/empresas/convites/aceitar', { token })
      setAceito(true)

      try {
        localStorage.removeItem(CHAVE_CONVITE)
      } catch {
        // ignora
      }
    } catch (e) {
      setErro(mensagemDeErro(e))

      // Convite inexistente, já usado ou expirado: não precisa lembrar dele
      if (e instanceof ApiError && [404, 409, 410].includes(e.status)) {
        try {
          localStorage.removeItem(CHAVE_CONVITE)
        } catch {
          // ignora
        }
      }
    } finally {
      setAceitando(false)
    }
  }

  async function trocarConta() {
    await sair()
    navigate(`/login?redirect=${encodeURIComponent(voltarPara)}`)
  }

  function conteudo() {
    if (!token) {
      return (
        <>
          <h1>Convite inválido</h1>
          <p>O link do convite está incompleto. Abra novamente o link do e-mail.</p>
          <Link to="/login">Ir para o login</Link>
        </>
      )
    }

    if (carregando) {
      return <p>Carregando...</p>
    }

    if (aceito) {
      return (
        <>
          <h1>Convite aceito!</h1>
          <div className="nod-alerta nod-alerta--sucesso" role="status">
            Agora você faz parte da equipe.
          </div>
          <form onSubmit={(e) => { e.preventDefault(); navigate('/minhas-empresas') }}>
            <button type="submit">Ver minhas empresas</button>
          </form>
        </>
      )
    }

    if (!usuario) {
      return (
        <>
          <h1>Você recebeu um convite</h1>
          <p>
            Para entrar na equipe, acesse sua conta NODSystems. Se ainda não
            tem uma, crie com o mesmo e-mail que recebeu o convite.
          </p>

          <form onSubmit={(e) => {
            e.preventDefault()
            navigate(`/login?redirect=${encodeURIComponent(voltarPara)}`)
          }}>
            <button type="submit">Entrar para aceitar</button>
          </form>

          <span className="register-link">
            Não possui uma conta?{' '}
            <Link to={`/cadastro?redirect=${encodeURIComponent(voltarPara)}`}>
              Cadastre-se
            </Link>
          </span>
        </>
      )
    }

    return (
      <>
        <h1>Você recebeu um convite</h1>
        <p>
          Entrando como <strong>{usuario.email}</strong>. Aceite para fazer
          parte da equipe da empresa.
        </p>

        {erro && (
          <div className="nod-alerta nod-alerta--erro" role="alert">
            {erro}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); aceitar() }}>
          <button type="submit" disabled={aceitando}>
            {aceitando ? 'Aceitando...' : 'Aceitar convite'}
          </button>
        </form>

        <span className="register-link">
          Não é você?{' '}
          <button type="button" className="nod-link-botao" onClick={trocarConta}>
            Entrar com outra conta
          </button>
        </span>
      </>
    )
  }

  return (
    <main className="login-page login-page--login">
      <section className="login-form">
        <img src={nodsystems} alt="NODSystems" className="login-logo" />
        <div className="login-content">{conteudo()}</div>
      </section>

      <section className="login-visual">
        <GrowthBackground />
      </section>
    </main>
  )
}

export default AceitarConvite
