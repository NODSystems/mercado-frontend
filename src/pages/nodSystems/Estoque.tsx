import { useState } from 'react';
import '../../styles/nodSystems/Estoque.css';

interface Produto {
    id: number;
    nome: string;
    categoria: string;
    quantidade: number;
    preco: number;
}

function Estoque() {
    const [produtos, setProdutos] = useState<Produto[]>([]);
    const [pesquisa, setPesquisa] = useState('');
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    const [nome, setNome] = useState('');
    const [categoria, setCategoria] = useState('');
    const [quantidade, setQuantidade] = useState('');
    const [preco, setPreco] = useState('');

    function cadastrarProduto(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const novoProduto: Produto = {
            id: Date.now(),
            nome: nome.trim(),
            categoria: categoria.trim(),
            quantidade: Number(quantidade),
            preco: Number(preco),
        };

        setProdutos((atuais) => [...atuais, novoProduto]);

        setNome('');
        setCategoria('');
        setQuantidade('');
        setPreco('');
        setMostrarFormulario(false);
    }

    function excluirProduto(id: number) {
        setProdutos((atuais) => atuais.filter((produto) => produto.id !== id));
    }

    const produtosFiltrados = produtos.filter((produto) =>
        produto.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        produto.categoria.toLowerCase().includes(pesquisa.toLowerCase())
    );

    const totalProdutos = produtos.length;
    const unidadesEstoque = produtos.reduce(
        (total, produto) => total + produto.quantidade,
        0
    );
    const estoqueBaixo = produtos.filter(
        (produto) => produto.quantidade <= 5
    ).length;

    return (
        <main className="estoque-page">
            <header className="estoque-header">
                <div>
                    <span className="estoque-subtitulo">GERENCIAMENTO</span>
                    <h1>Estoque</h1>
                    <p>Organize seus produtos e acompanhe as quantidades disponíveis.</p>
                </div>

                <button
                    className="estoque-botao-principal"
                    onClick={() => setMostrarFormulario(!mostrarFormulario)}
                >
                    + Novo produto
                </button>
            </header>

            <section className="estoque-resumo">
                <article className="estoque-resumo-card">
                    <span>Produtos cadastrados</span>
                    <strong>{totalProdutos}</strong>
                </article>

                <article className="estoque-resumo-card">
                    <span>Unidades em estoque</span>
                    <strong>{unidadesEstoque}</strong>
                </article>

                <article className="estoque-resumo-card">
                    <span>Estoque baixo</span>
                    <strong>{estoqueBaixo}</strong>
                </article>
            </section>

            {mostrarFormulario && (
                <form className="estoque-formulario" onSubmit={cadastrarProduto}>
                    <h2>Novo produto</h2>

                    <div className="estoque-formulario-grid">
                        <label>
                            Nome do produto
                            <input
                                value={nome}
                                onChange={(event) => setNome(event.target.value)}
                                placeholder="Ex.: Arroz 5 kg"
                                required
                            />
                        </label>

                        <label>
                            Categoria
                            <input
                                value={categoria}
                                onChange={(event) => setCategoria(event.target.value)}
                                placeholder="Ex.: Alimentos"
                                required
                            />
                        </label>

                        <label>
                            Quantidade
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={quantidade}
                                onChange={(event) => setQuantidade(event.target.value)}
                                required
                            />
                        </label>

                        <label>
                            Preço de venda (R$)
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={preco}
                                onChange={(event) => setPreco(event.target.value)}
                                required
                            />
                        </label>
                    </div>

                    <div className="estoque-formulario-acoes">
                        <button type="button" onClick={() => setMostrarFormulario(false)}>
                            Cancelar
                        </button>
                        <button type="submit">Cadastrar produto</button>
                    </div>
                </form>
            )}

            <section className="estoque-lista">
                <div className="estoque-lista-header">
                    <h2>Produtos</h2>

                    <input
                        className="estoque-pesquisa"
                        value={pesquisa}
                        onChange={(event) => setPesquisa(event.target.value)}
                        placeholder="Pesquisar produto..."
                        aria-label="Pesquisar produto"
                    />
                </div>

                {produtosFiltrados.length === 0 ? (
                    <div className="estoque-vazio">
                        <h3>
                            {pesquisa ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}
                        </h3>
                        <p>
                            {pesquisa
                                ? 'Tente pesquisar por outro nome ou categoria.'
                                : 'Clique em “Novo produto” para começar a organizar seu estoque.'}
                        </p>
                    </div>
                ) : (
                    <div className="estoque-tabela-container">
                        <table className="estoque-tabela">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Categoria</th>
                                    <th>Quantidade</th>
                                    <th>Preço</th>
                                    <th>Situação</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>

                            <tbody>
                                {produtosFiltrados.map((produto) => (
                                    <tr key={produto.id}>
                                        <td>{produto.nome}</td>
                                        <td>{produto.categoria}</td>
                                        <td>{produto.quantidade}</td>
                                        <td>
                                            {produto.preco.toLocaleString('pt-BR', {
                                                style: 'currency',
                                                currency: 'BRL',
                                            })}
                                        </td>
                                        <td>
                                            <span
                                                className={
                                                    produto.quantidade <= 5
                                                        ? 'estoque-status estoque-status--baixo'
                                                        : 'estoque-status estoque-status--normal'
                                                }
                                            >
                                                {produto.quantidade <= 5 ? 'Estoque baixo' : 'Disponível'}
                                            </span>
                                        </td>
                                        <td>
                                            <button
                                                className="estoque-botao-excluir"
                                                onClick={() => excluirProduto(produto.id)}
                                            >
                                                Excluir
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>
        </main>
    );
}

export default Estoque;