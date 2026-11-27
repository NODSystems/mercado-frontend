import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import { api, mensagemDeErro } from '../../services/api'
import nodsystems from '../../assets/nodsystems.png'
import GrowthBackground from '../../components/GrowthBackground'

import '../../styles/usuario/Login.css'
import '../../styles/components/GrowthBackground.css'

// Esqueci minha senha: pede o e-mail e o servidor manda o link para criar
// uma senha nova. A resposta é sempre a mesma, exista ou não a conta.
function RecuperarSenha() {
  const [email, setEmail] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [erro, setErro] = useState('')

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    setEnviando(true)
    try {
      await api.post('/auth/recuperar-senha', { email: email.trim() })
      setEnviado(true)
    } catch (e) {
      setErro(mensagemDeErro(e))
    } finally {
      setEnviando(false)
    }
  }

  return (
    <main className="login-page login-page--login">
      <section className="login-form">
        <img src={nodsystems} alt="NODSystems" className="login-logo" />

        <div className="login-content">
          {enviado ? (
            <>
              <h1>Verifique seu e-mail</h1>

              <p>
                Se existir uma conta com <strong>{email.trim()}</strong>, enviamos um link para criar
                uma nova senha. Ele vale por 30 minutos.
              </p>

              <div className="nod-alerta nod-alerta--info" role="status">
                Não chegou? Confira a caixa de spam ou peça de novo em 1 minuto.
              </div>

              <button type="button" className="nod-link-botao" onClick={() => setEnviado(false)}>
                Enviar de novo
              </button>

              <Link to="/login">Voltar para o login</Link>
            </>
          ) : (
            <>
              <h1>Esqueceu sua senha?</h1>

              <p>Informe seu e-mail cadastrado e enviaremos um link para você criar uma nova senha.</p>

              {erro && <div className="nod-alerta nod-alerta--erro" role="alert">{erro}</div>}

              <form onSubmit={handleSubmit}>
                <label>
                  E-mail
                  <input
                    type="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    required
                  />
                </label>

                <button type="submit" disabled={enviando}>
                  {enviando ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>

              <span className="register-link">
                Lembrou sua senha? <Link to="/login">Voltar para o login</Link>
              </span>
            </>
          )}
        </div>
      </section>

      <section className="login-visual">
        <GrowthBackground />
      </section>
    </main>
  )
}

export default RecuperarSenha
