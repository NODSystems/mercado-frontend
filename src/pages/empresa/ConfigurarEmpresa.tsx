
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import '../../styles/empresa/ConfigurarEmpresa.css';
import { api, ApiError, mensagemDeErro } from '../../services/api';
import { NOMES_TIPOS } from '../../data/tiposEmpresa';
import {
    cepValido,
    cnpjValido,
    emailValido,
    ESTADOS,
    LIMITES,
    mascaraCep,
    mascaraCnpj,
    mascaraTelefone,
    somenteDigitos,
    telefoneValido,
} from '../../utils/validacao';

type DadosEmpresa = {
    nome: string;
    nomeFantasia: string;
    cnpj: string;
    telefone: string;
    email: string;
    cep: string;
    endereco: string;
    numero: string;
    cidade: string;
    estado: string;
};

const dadosIniciais: DadosEmpresa = {
    nome: '',
    nomeFantasia: '',
    cnpj: '',
    telefone: '',
    email: '',
    cep: '',
    endereco: '',
    numero: '',
    cidade: '',
    estado: '',
};


type Erros = Partial<Record<keyof DadosEmpresa, string>>;

// Campos de cada etapa (para saber para qual etapa voltar quando houver erro)
const camposPorEtapa: Record<number, (keyof DadosEmpresa)[]> = {
    1: ['nome', 'nomeFantasia', 'cnpj'],
    2: ['telefone', 'email', 'cep', 'estado', 'endereco', 'numero', 'cidade'],
};

// Nome do campo no backend → nome do campo nesta tela
const campoDoBackend: Record<string, keyof DadosEmpresa> = {
    razao_social: 'nome',
    nome_fantasia: 'nomeFantasia',
    cnpj: 'cnpj',
    telefone: 'telefone',
    email_comercial: 'email',
    cep: 'cep',
    estado: 'estado',
    cidade: 'cidade',
    rua: 'endereco',
    numero: 'numero',
};

// Mesmas regras do backend: o erro aparece no campo, na hora.
function validarCampo(campo: keyof DadosEmpresa, valor: string): string {
    const texto = valor.trim();

    switch (campo) {
        case 'nome':
            if (!texto) return 'Informe a razão social ou o nome do responsável.';
            if (texto.length > LIMITES.razaoSocial) return `Máximo de ${LIMITES.razaoSocial} caracteres.`;
            return '';
        case 'nomeFantasia':
            return texto.length > LIMITES.nomeFantasia ? `Máximo de ${LIMITES.nomeFantasia} caracteres.` : '';
        case 'cnpj':
            if (!texto) return '';
            if (somenteDigitos(texto).length !== 14) return 'O CNPJ deve ter 14 dígitos.';
            return cnpjValido(texto) ? '' : 'CNPJ inválido. Confira os números.';
        case 'telefone':
            if (!texto) return 'Informe o telefone.';
            return telefoneValido(texto) ? '' : 'Informe DDD + número (10 ou 11 dígitos).';
        case 'email':
            if (!texto) return 'Informe o e-mail comercial.';
            if (texto.length > LIMITES.email) return `Máximo de ${LIMITES.email} caracteres.`;
            return emailValido(texto) ? '' : 'Informe um e-mail válido.';
        case 'cep':
            if (!texto) return 'Informe o CEP.';
            return cepValido(texto) ? '' : 'O CEP deve ter 8 dígitos.';
        case 'estado':
            return ESTADOS.includes(texto) ? '' : 'Selecione o estado.';
        case 'endereco':
            if (!texto) return 'Informe a rua ou avenida.';
            return texto.length > LIMITES.rua ? `Máximo de ${LIMITES.rua} caracteres.` : '';
        case 'numero':
            if (!texto) return 'Informe o número (ou "S/N").';
            return texto.length > LIMITES.numero ? `Máximo de ${LIMITES.numero} caracteres.` : '';
        case 'cidade':
            if (!texto) return 'Informe a cidade.';
            return texto.length > LIMITES.cidade ? `Máximo de ${LIMITES.cidade} caracteres.` : '';
        default:
            return '';
    }
}

// Máscaras aplicadas enquanto a pessoa digita
const mascaras: Partial<Record<keyof DadosEmpresa, (v: string) => string>> = {
    cnpj: mascaraCnpj,
    telefone: mascaraTelefone,
    cep: mascaraCep,
};

function ConfigurarEmpresa() {
    const navigate = useNavigate();
    const location = useLocation();

    const tipoEmpresa =
        (location.state as { tipoEmpresa?: string } | null)?.tipoEmpresa ?? '';

    const [etapa, setEtapa] = useState(1);
    const [dados, setDados] = useState<DadosEmpresa>(dadosIniciais);
    const [erros, setErros] = useState<Erros>({});
    const [erro, setErro] = useState('');
    const [concluido, setConcluido] = useState(false);
    const [salvando, setSalvando] = useState(false);

    // Campo com erro que deve receber o cursor depois que a tela atualizar
    // (inclusive quando o erro manda de volta para outra etapa)
    const [campoParaFocar, setCampoParaFocar] = useState<string | null>(null);

    useEffect(() => {
        if (!campoParaFocar) return;

        const elemento = document.getElementById(campoParaFocar);

        if (elemento) {
            elemento.focus();
            elemento.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }

        setCampoParaFocar(null);
    }, [campoParaFocar, etapa]);

    function atualizarCampo(campo: keyof DadosEmpresa, valor: string) {
        const mascara = mascaras[campo];
        const novoValor = mascara ? mascara(valor) : valor;

        setDados((anterior) => ({
            ...anterior,
            [campo]: novoValor,
        }));

        // Se o campo já estava marcado com erro, revalida enquanto digita
        if (erros[campo]) {
            setErros((anterior) => ({ ...anterior, [campo]: validarCampo(campo, novoValor) }));
        }

        setErro('');
    }

    // Valida ao sair do campo, para avisar antes de clicar em Continuar
    function sairDoCampo(campo: keyof DadosEmpresa) {
        const valor = dados[campo];

        // Campo obrigatório ainda vazio: só avisa no Continuar
        if (!valor.trim() && campo !== 'estado') return;

        setErros((anterior) => ({ ...anterior, [campo]: validarCampo(campo, valor) }));
    }

    function validarEtapa(numero: number): boolean {
        const novosErros: Erros = {};

        for (const campo of camposPorEtapa[numero] ?? []) {
            const mensagem = validarCampo(campo, dados[campo]);
            if (mensagem) novosErros[campo] = mensagem;
        }

        setErros((anterior) => {
            const atualizados = { ...anterior };
            for (const campo of camposPorEtapa[numero] ?? []) delete atualizados[campo];
            return { ...atualizados, ...novosErros };
        });

        const primeiro = Object.keys(novosErros)[0];

        if (primeiro) {
            setErro('Corrija os campos destacados para continuar.');
            setCampoParaFocar(primeiro);
            return false;
        }

        return true;
    }

    function continuar() {
        if (!validarEtapa(etapa)) return;

        setErro('');
        setEtapa((anterior) => Math.min(anterior + 1, 3));
    }

    async function concluirCadastro() {
        setErro('');

        // Confere tudo de novo antes de enviar
        if (!validarEtapa(1)) {
            setEtapa(1);
            return;
        }

        if (!validarEtapa(2)) {
            setEtapa(2);
            return;
        }

        setSalvando(true);

        try {
            // Converte os campos da tela para o formato do backend.
            await api.post('/empresas/criar', {
                razao_social: dados.nome.trim(),
                nome_fantasia: dados.nomeFantasia.trim() || null,
                cnpj: dados.cnpj.trim() || null,
                tipo_negocio: NOMES_TIPOS[tipoEmpresa] || 'Outro comércio',
                telefone: dados.telefone,
                email_comercial: dados.email.trim(),
                cep: dados.cep,
                estado: dados.estado,
                cidade: dados.cidade.trim(),
                rua: dados.endereco.trim(),
                numero: dados.numero.trim(),
            });

            setConcluido(true);
        } catch (e) {
            // Erros por campo vindos do backend: marca o campo e volta
            // para a etapa dele
            if (e instanceof ApiError && e.erros.length > 0) {
                const doBackend: Erros = {};

                for (const item of e.erros) {
                    const campo = campoDoBackend[item.campo];
                    if (campo && !doBackend[campo]) doBackend[campo] = item.mensagem;
                }

                const campos = Object.keys(doBackend) as (keyof DadosEmpresa)[];

                if (campos.length > 0) {
                    setErros(doBackend);
                    setEtapa(camposPorEtapa[1].includes(campos[0]) ? 1 : 2);
                    setCampoParaFocar(campos[0]);
                    setErro('Corrija os campos destacados.');
                    return;
                }
            }

            setErro(mensagemDeErro(e));
        } finally {
            setSalvando(false);
        }
    }

    function voltar() {
        if (etapa > 1) {
            setEtapa((anterior) => anterior - 1);
            setErro('');
        } else {
            navigate('/tipo-empresa', {
                state: { tipoEmpresa },
            });
        }
    }

    // Sem isto, ao clicar no botão o campo perde o foco, a mensagem de
    // erro do campo aparece, o botão "desce" e o clique se perde.
    // O botão valida tudo de qualquer forma.
    function manterFoco(evento: { preventDefault: () => void }) {
        evento.preventDefault();
    }

    // Propriedades comuns de cada campo (valor, erro, acessibilidade)
    function campo(nome: keyof DadosEmpresa) {
        return {
            id: nome,
            value: dados[nome],
            onChange: (e: { target: { value: string } }) => atualizarCampo(nome, e.target.value),
            onBlur: () => sairDoCampo(nome),
            'aria-invalid': erros[nome] ? true : undefined,
            'aria-describedby': erros[nome] ? `${nome}-erro` : undefined,
            className: erros[nome] ? 'campo-invalido' : undefined,
        };
    }

    function erroDoCampo(nome: keyof DadosEmpresa) {
        return erros[nome] ? (
            <small id={`${nome}-erro`} className="campo-erro" role="alert">
                {erros[nome]}
            </small>
        ) : null;
    }

    // Sem o tipo (ex.: recarregou a página), volta para escolher
    if (!tipoEmpresa && !concluido) {
        return <Navigate to="/tipo-empresa" replace />;
    }

    return (
        <main className="configurar-empresa">
            <header className="configurar-header">
                <button
                    type="button"
                    className="configurar-voltar"
                    onClick={() => navigate('/minhas-empresas')}
                >
                    ← Minhas empresas
                </button>

                <span className="configurar-marca">NODSystems</span>
            </header>

            {concluido ? (
                <section className="configurar-sucesso">
                    <div className="sucesso-icone">✓</div>

                    <h1>Empresa configurada!</h1>

                    <p>
                        <strong>{dados.nomeFantasia.trim() || dados.nome}</strong>{' '}
                        foi cadastrada com sucesso. Abra a empresa na lista
                        para começar a usar a NODSystems.
                    </p>

                    <button
                        type="button"
                        className="configurar-botao principal"
                        onClick={() => navigate('/minhas-empresas')}
                    >
                        Voltar para minhas empresas
                    </button>
                </section>
            ) : (
                <section className="configurar-conteudo">
                    <div className="configurar-introducao">
                        <span className="configurar-etiqueta">
                            CONFIGURAÇÃO DA EMPRESA
                        </span>

                        <h1>Vamos configurar seu negócio</h1>

                        <p>
                            Preencha os dados para preparar a NODSystems
                            para a sua empresa.
                        </p>
                    </div>

                    <div className="configurar-progresso">
                        {[1, 2, 3].map((numero) => (
                            <div
                                key={numero}
                                className={`progresso-etapa ${
                                    etapa >= numero ? 'ativa' : ''
                                }`}
                            >
                                <span className="progresso-numero">
                                    {etapa > numero ? '✓' : numero}
                                </span>

                                <span className="progresso-texto">
                                    {numero === 1
                                        ? 'Empresa'
                                        : numero === 2
                                          ? 'Contato e endereço'
                                          : 'Revisão'}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div className="configurar-card">
                        {etapa === 1 && (
                            <div className="configurar-formulario">
                                <h2>Dados da empresa</h2>

                                <p className="configurar-descricao">
                                    Primeiro, conte um pouco sobre o seu negócio.
                                </p>

                                <div className="campo-configurar">
                                    <label htmlFor="nome">
                                        Razão social ou nome do responsável *
                                    </label>
                                    <input
                                        {...campo('nome')}
                                        placeholder="Digite o nome completo"
                                        autoComplete="organization"
                                        maxLength={LIMITES.razaoSocial}
                                    />
                                    {erroDoCampo('nome')}
                                </div>

                                <div className="campo-configurar">
                                    <label htmlFor="nomeFantasia">
                                        Nome fantasia
                                    </label>
                                    <input
                                        {...campo('nomeFantasia')}
                                        placeholder="Como sua empresa é conhecida?"
                                        maxLength={LIMITES.nomeFantasia}
                                    />
                                    {erroDoCampo('nomeFantasia')}
                                </div>

                                <div className="campo-configurar">
                                    <label htmlFor="cnpj">
                                        CNPJ <span>(opcional)</span>
                                    </label>
                                    <input
                                        {...campo('cnpj')}
                                        placeholder="00.000.000/0000-00"
                                        inputMode="numeric"
                                    />
                                    {erroDoCampo('cnpj')}
                                    <small>
                                        Você pode continuar mesmo se seu negócio
                                        ainda não tiver CNPJ.
                                    </small>
                                </div>

                                <div className="campo-configurar">
                                    <label>Tipo de negócio</label>
                                    <div className="tipo-empresa-resumo">
                                        {NOMES_TIPOS[tipoEmpresa] || 'Não informado'}
                                    </div>
                                </div>
                            </div>
                        )}

                        {etapa === 2 && (
                            <div className="configurar-formulario">
                                <h2>Contato e endereço</h2>

                                <p className="configurar-descricao">
                                    Como podemos entrar em contato e localizar
                                    sua empresa?
                                </p>

                                <div className="configurar-duas-colunas">
                                    <div className="campo-configurar">
                                        <label htmlFor="telefone">Telefone *</label>
                                        <input
                                            {...campo('telefone')}
                                            type="tel"
                                            placeholder="(12) 99999-9999"
                                            autoComplete="tel"
                                        />
                                        {erroDoCampo('telefone')}
                                    </div>

                                    <div className="campo-configurar">
                                        <label htmlFor="email">
                                            E-mail comercial *
                                        </label>
                                        <input
                                            {...campo('email')}
                                            type="email"
                                            placeholder="contato@empresa.com"
                                            autoComplete="email"
                                            maxLength={LIMITES.email}
                                        />
                                        {erroDoCampo('email')}
                                    </div>
                                </div>

                                <div className="configurar-duas-colunas">
                                    <div className="campo-configurar">
                                        <label htmlFor="cep">CEP *</label>
                                        <input
                                            {...campo('cep')}
                                            placeholder="00000-000"
                                            autoComplete="postal-code"
                                        />
                                        {erroDoCampo('cep')}
                                    </div>

                                    <div className="campo-configurar">
                                        <label htmlFor="estado">Estado (UF) *</label>
                                        <select {...campo('estado')}>
                                            <option value="">Selecione</option>
                                            {ESTADOS.map((uf) => (
                                                <option key={uf} value={uf}>{uf}</option>
                                            ))}
                                        </select>
                                        {erroDoCampo('estado')}
                                    </div>
                                </div>

                                <div className="campo-configurar">
                                    <label htmlFor="endereco">Rua ou avenida *</label>
                                    <input
                                        {...campo('endereco')}
                                        placeholder="Nome da rua ou avenida"
                                        autoComplete="street-address"
                                        maxLength={LIMITES.rua}
                                    />
                                    {erroDoCampo('endereco')}
                                </div>

                                <div className="configurar-duas-colunas">
                                    <div className="campo-configurar">
                                        <label htmlFor="numero">Número *</label>
                                        <input
                                            {...campo('numero')}
                                            placeholder="Número"
                                            maxLength={LIMITES.numero}
                                        />
                                        {erroDoCampo('numero')}
                                    </div>

                                    <div className="campo-configurar">
                                        <label htmlFor="cidade">Cidade *</label>
                                        <input
                                            {...campo('cidade')}
                                            placeholder="Sua cidade"
                                            autoComplete="address-level2"
                                            maxLength={LIMITES.cidade}
                                        />
                                        {erroDoCampo('cidade')}
                                    </div>
                                </div>
                            </div>
                        )}

                        {etapa === 3 && (
                            <div className="configurar-formulario">
                                <h2>Revise os dados</h2>

                                <p className="configurar-descricao">
                                    Confira as informações antes de concluir.
                                </p>

                                <div className="revisao-grupo">
                                    <h3>Empresa</h3>
                                    <p>
                                        <strong>Nome:</strong> {dados.nome}
                                    </p>
                                    <p>
                                        <strong>Nome fantasia:</strong>{' '}
                                        {dados.nomeFantasia || 'Não informado'}
                                    </p>
                                    <p>
                                        <strong>CNPJ:</strong>{' '}
                                        {dados.cnpj || 'Não informado'}
                                    </p>
                                    <p>
                                        <strong>Tipo:</strong>{' '}
                                        {NOMES_TIPOS[tipoEmpresa] || 'Não informado'}
                                    </p>
                                </div>

                                <div className="revisao-grupo">
                                    <h3>Contato</h3>
                                    <p><strong>Telefone:</strong> {dados.telefone}</p>
                                    <p><strong>E-mail:</strong> {dados.email}</p>
                                </div>

                                <div className="revisao-grupo">
                                    <h3>Endereço</h3>
                                    <p>
                                        {dados.endereco}, {dados.numero}
                                    </p>
                                    <p>
                                        {dados.cidade} - {dados.estado}
                                    </p>
                                    <p><strong>CEP:</strong> {dados.cep}</p>
                                </div>

                            </div>
                        )}

                        {erro && (
                            <p className="configurar-erro" role="alert">
                                {erro}
                            </p>
                        )}

                        <footer className="configurar-acoes">
                            <button
                                type="button"
                                className="configurar-botao secundario"
                                onClick={voltar}
                                    onMouseDown={manterFoco}
                            >
                                Voltar
                            </button>

                            {etapa < 3 ? (
                                <button
                                    type="button"
                                    className="configurar-botao principal"
                                    onClick={continuar}
                                    onMouseDown={manterFoco}
                                >
                                    Continuar →
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    className="configurar-botao principal"
                                    onClick={concluirCadastro}
                                    onMouseDown={manterFoco}
                                    disabled={salvando}
                                >
                                    {salvando ? 'Salvando...' : 'Concluir configuração'}
                                </button>
                            )}
                        </footer>
                    </div>
                </section>
            )}
        </main>
    );
}

export default ConfigurarEmpresa;
