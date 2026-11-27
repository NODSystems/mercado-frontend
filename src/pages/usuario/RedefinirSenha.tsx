import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'

import { api, ApiError, mensagemDeErro } from '../../services/api'
import { LIMITES } from '../../utils/validacao'
import nodsystems from '../../assets/nodsystems.png'
import GrowthBackground from '../../components/GrowthBackground'

import '../../styles/usuario/Login.css'
import '../../styles/components/GrowthBackground.css'

// Aberta pelo link do e-mail de recuperação: /redefinir-senha?token=...
function RedefinirSenha() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const navigate = useNavigate()

  const [situacao, setSituacao] = useState<'conferindo' | 'valido' | 'invalido'>('conferindo')
  const [senha, setSenha] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [mostrar, setMostrar] = useState(false)
  const [erros, setErros] = useState<{ senha?: string; confirmar?: string }>({})
  const [erro, setErro] = useState('')
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    if (!/^[a-f0-9]{64}$/.test(token)) {
      setSituacao('invalido')
      return
    }
    api
      .get(`/auth/redefinir-senha?token=${token}`)
      .then(() => setSituacao('valido'))
      .catch(() => setSituacao('invalido'))
  }, [token])

  function validar() {
    const novos: { senha?: string; confirmar?: string } = {}
    if (senha.length < LIMITES.senhaMin) novos.senha = `A senha deve ter pelo menos ${LIMITES.senhaMin} caracteres.`
    else if (new TextEncoder().encode(senha).length > LIMITES.senhaMax) novos.senha = `A senha deve ter no máximo ${LIMITES.senhaMax} caracteres.`
    if (!confirmar) novos.confirmar = 'Confirme sua senha.'
    else if (confirmar !== senha) novos.confirmar = 'As senhas não conferem.'
    setErros(novos)
    return Object.keys(novos).length === 0
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setErro('')
    if (!validar()) return
    setSalvando(true)
    try {
      await api.post('/auth/redefinir-senha', { token, senha })
      navigate('/login?senhaAlterada=true', { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.status === 400 && e.erros.length === 0) setSituacao('invalido')
      setErro(mensagemDeErro(e))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <main className="login-page login-page--login">
      <section className="login-form">
        <img src={nodsystems} alt="NODSystems" className="login-logo" />

        <div className="login-content">
          {situacao === 'conferindo' && <p>Conferindo o link...</p>}

          {situacao === 'invalido' && (
            <>
              <h1>Link inválido ou expirado</h1>
              <p>Este link já foi usado ou passou dos 30 minutos. Peça um novo para criar sua senha.</p>
              <Link to="/recuperar-senha">Pedir um novo link</Link>
              <Link to="/login">Voltar para o login</Link>
            </>
          )}

          {situacao === 'valido' && (
            <>
              <h1>Crie uma nova senha</h1>
              <p>Depois de salvar, você sai de todos os aparelhos e entra com a senha nova.</p>

              {erro && <div className="nod-alerta nod-alerta--erro" role="alert">{erro}</div>}

              <form onSubmit={handleSubmit} noValidate>
                <label>
                  Nova senha
                  <input
                    type={mostrar ? 'text' : 'password'}
                    placeholder="Mínimo de 8 caracteres"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    autoComplete="new-password"
                    maxLength={LIMITES.senhaMax}
                    className={erros.senha ? 'nod-invalido' : undefined}
                    aria-invalid={erros.senha ? true : undefined}
                  />
                  {erros.senha && <small className="nod-campo-erro" role="alert">{erros.senha}</small>}
                </label>

                <label>
                  Confirmar nova senha
                  <input
                    type={mostrar ? 'text' : 'password'}
                    placeholder="Digite a senha novamente"
                    value={confirmar}
                    onChange={(e) => setConfirmar(e.target.value)}
                    autoComplete="new-password"
                    maxLength={LIMITES.senhaMax}
                    className={erros.confirmar ? 'nod-invalido' : undefined}
                    aria-invalid={erros.confirmar ? true : undefined}
                  />
                  {erros.confirmar && <small className="nod-campo-erro" role="alert">{erros.confirmar}</small>}
                </label>

                <button type="button" className="nod-link-botao" onClick={() => setMostrar((m) => !m)}>
                  {mostrar ? 'Ocultar senhas' : 'Mostrar senhas'}
                </button>

                <button type="submit" disabled={salvando}>
                  {salvando ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
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

export default RedefinirSenha
