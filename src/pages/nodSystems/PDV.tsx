// Importa o useState para controlar os dados da tela.
import { useState } from "react";

// Importa o CSS exclusivo da página de PDV.
import "../../styles/nodSystems/PDV.css";

// Define a estrutura de um produto disponível para venda.
interface Produto {
    id: number;
    nome: string;
    codigo: string;
    preco: number;
    estoque: number;
}

// Define a estrutura de um item adicionado ao carrinho.
interface ItemCarrinho {
    produto: Produto;
    quantidade: number;
}

// Produtos de exemplo para testar o funcionamento do PDV.
// Depois, esses dados poderão vir do banco de dados.
const produtosExemplo: Produto[] = [
    {
        id: 1,
        nome: "Arroz 5 kg",
        codigo: "1001",
        preco: 28.90,
        estoque: 15,
    },
    {
        id: 2,
        nome: "Feijão 1 kg",
        codigo: "1002",
        preco: 8.50,
        estoque: 20,
    },
    {
        id: 3,
        nome: "Leite integral",
        codigo: "1003",
        preco: 5.49,
        estoque: 30,
    },
    {
        id: 4,
        nome: "Óleo de soja",
        codigo: "1004",
        preco: 7.99,
        estoque: 12,
    },
    {
        id: 5,
        nome: "Açúcar 1 kg",
        codigo: "1005",
        preco: 4.79,
        estoque: 18,
    },
    {
        id: 6,
        nome: "Macarrão 500 g",
        codigo: "1006",
        preco: 4.25,
        estoque: 25,
    },
];

// Componente principal da tela de vendas.
function PDV() {
    // Guarda o texto digitado na pesquisa de produtos.
    const [pesquisa, setPesquisa] = useState("");

    // Guarda os produtos adicionados ao carrinho.
    const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([]);

    // Guarda a forma de pagamento selecionada.
    const [pagamento, setPagamento] = useState("Dinheiro");

    // Guarda o valor recebido do cliente.
    const [valorRecebido, setValorRecebido] = useState("");

    // Guarda uma mensagem temporária sobre as ações realizadas.
    const [mensagem, setMensagem] = useState("");

    // Formata os valores numéricos como moeda brasileira.
    function formatarMoeda(valor: number) {
        return valor.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
        });
    }

    // Filtra os produtos pelo nome ou pelo código.
    const produtosFiltrados = produtosExemplo.filter((produto) =>
        produto.nome.toLowerCase().includes(pesquisa.toLowerCase()) ||
        produto.codigo.includes(pesquisa)
    );

    // Soma o preço de todos os itens do carrinho.
    const total = carrinho.reduce(
        (soma, item) => soma + item.produto.preco * item.quantidade,
        0
    );

    // Soma a quantidade de unidades presentes no carrinho.
    const quantidadeItens = carrinho.reduce(
        (soma, item) => soma + item.quantidade,
        0
    );

    // Adiciona um produto ao carrinho ou aumenta sua quantidade.
    function adicionarProduto(produto: Produto) {
        // Verifica quantas unidades desse produto já estão no carrinho.
        const itemAtual = carrinho.find(
            (item) => item.produto.id === produto.id
        );

        // Impede adicionar mais unidades do que o estoque disponível.
        if (itemAtual && itemAtual.quantidade >= produto.estoque) {
            setMensagem("Quantidade máxima disponível em estoque.");
            return;
        }

        // Atualiza o carrinho sem modificar diretamente o estado anterior.
        setCarrinho((itensAtuais) => {
            const itemExistente = itensAtuais.find(
                (item) => item.produto.id === produto.id
            );

            // Se o produto já existe, aumenta sua quantidade.
            if (itemExistente) {
                return itensAtuais.map((item) =>
                    item.produto.id === produto.id
                        ? { ...item, quantidade: item.quantidade + 1 }
                        : item
                );
            }

            // Se for um novo produto, adiciona uma unidade ao carrinho.
            return [
                ...itensAtuais,
                { produto, quantidade: 1 },
            ];
        });

        // Limpa mensagens anteriores após adicionar o produto.
        setMensagem("");
    }

    // Altera a quantidade de um produto no carrinho.
    function alterarQuantidade(id: number, quantidade: number) {
        // Localiza o produto original para consultar seu estoque.
        const produto = produtosExemplo.find((item) => item.id === id);

        // Não permite quantidade menor que uma unidade.
        if (quantidade < 1) {
            removerProduto(id);
            return;
        }

        // Impede que a quantidade ultrapasse o estoque disponível.
        if (produto && quantidade > produto.estoque) {
            setMensagem("Quantidade máxima disponível em estoque.");
            return;
        }

        // Atualiza somente o item que teve sua quantidade alterada.
        setCarrinho((itensAtuais) =>
            itensAtuais.map((item) =>
                item.produto.id === id
                    ? { ...item, quantidade }
                    : item
            )
        );

        setMensagem("");
    }

    // Remove completamente um produto do carrinho.
    function removerProduto(id: number) {
        setCarrinho((itensAtuais) =>
            itensAtuais.filter((item) => item.produto.id !== id)
        );

        setMensagem("");
    }

    // Limpa a venda atual e os campos de pagamento.
    function cancelarVenda() {
        setCarrinho([]);
        setValorRecebido("");
        setPagamento("Dinheiro");
        setMensagem("");
    }

    // Finaliza apenas uma simulação de venda no frontend.
    function finalizarVenda() {
        // Impede finalizar uma venda sem produtos.
        if (carrinho.length === 0) {
            setMensagem("Adicione pelo menos um produto à venda.");
            return;
        }

        // No pagamento em dinheiro, verifica se o valor recebido é suficiente.
        if (
            pagamento === "Dinheiro" &&
            Number(valorRecebido.replace(",", ".")) < total
        ) {
            setMensagem("O valor recebido é insuficiente.");
            return;
        }

        // Informa que a operação foi simulada, sem registrar no banco.
        setMensagem("Venda simulada com sucesso!");

        // Limpa o carrinho após a simulação.
        setCarrinho([]);
        setValorRecebido("");
    }

    // Calcula o troco quando o pagamento é em dinheiro.
    const troco =
        pagamento === "Dinheiro"
            ? Math.max(
                0,
                Number(valorRecebido.replace(",", ".")) - total
            )
            : 0;

    return (
        <main className="pdv-page">
            {/* Cabeçalho da página de vendas. */}
            <header className="pdv-header">
                <div>
                    <span className="pdv-subtitulo">VENDAS</span>
                    <h1>Ponto de Venda</h1>
                    <p>Encontre produtos e registre suas vendas.</p>
                </div>

                {/* Mostra a quantidade de unidades no carrinho. */}
                <div className="pdv-contador">
                    <span>Itens no carrinho</span>
                    <strong>{quantidadeItens}</strong>
                </div>
            </header>

            {/* Exibe mensagens de validação e resultado das ações. */}
            {mensagem && (
                <div className="pdv-mensagem" role="status">
                    {mensagem}
                </div>
            )}

            {/* Divide a tela entre a lista de produtos e o carrinho. */}
            <div className="pdv-layout">
                <section className="pdv-produtos">
                    <div className="pdv-secao-header">
                        <div>
                            <h2>Produtos</h2>
                            <p>Selecione um produto para adicionar à venda.</p>
                        </div>
                    </div>

                    {/* Campo de busca por nome ou código. */}
                    <input
                        className="pdv-pesquisa"
                        type="text"
                        placeholder="Pesquisar por nome ou código..."
                        value={pesquisa}
                        onChange={(evento) => setPesquisa(evento.target.value)}
                        aria-label="Pesquisar produtos"
                    />

                    {/* Lista de produtos disponíveis. */}
                    <div className="pdv-lista-produtos">
                        {produtosFiltrados.length > 0 ? (
                            produtosFiltrados.map((produto) => (
                                <article
                                    className="pdv-produto-card"
                                    key={produto.id}
                                >
                                    <div className="pdv-produto-info">
                                        <h3>{produto.nome}</h3>
                                        <span>Código: {produto.codigo}</span>
                                        <span>
                                            Estoque: {produto.estoque} unidades
                                        </span>
                                    </div>

                                    <div className="pdv-produto-compra">
                                        <strong>
                                            {formatarMoeda(produto.preco)}
                                        </strong>

                                        {/* Adiciona o produto ao carrinho. */}
                                        <button
                                            type="button"
                                            onClick={() => adicionarProduto(produto)}
                                            disabled={produto.estoque <= 0}
                                        >
                                            + Adicionar
                                        </button>
                                    </div>
                                </article>
                            ))
                        ) : (
                            <div className="pdv-vazio">
                                Nenhum produto encontrado.
                            </div>
                        )}
                    </div>
                </section>

                {/* Painel lateral com os itens e o pagamento. */}
                <aside className="pdv-carrinho">
                    <div className="pdv-secao-header">
                        <div>
                            <h2>Venda atual</h2>
                            <p>Confira os produtos selecionados.</p>
                        </div>
                    </div>

                    {/* Lista dos itens adicionados ao carrinho. */}
                    <div className="pdv-itens-carrinho">
                        {carrinho.length > 0 ? (
                            carrinho.map((item) => (
                                <article
                                    className="pdv-item-carrinho"
                                    key={item.produto.id}
                                >
                                    <div className="pdv-item-info">
                                        <strong>{item.produto.nome}</strong>
                                        <span>
                                            {formatarMoeda(item.produto.preco)} cada
                                        </span>
                                    </div>

                                    <div className="pdv-item-acoes">
                                        {/* Diminui a quantidade do item. */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                alterarQuantidade(
                                                    item.produto.id,
                                                    item.quantidade - 1
                                                )
                                            }
                                            aria-label={`Diminuir ${item.produto.nome}`}
                                        >
                                            −
                                        </button>

                                        <span>{item.quantidade}</span>

                                        {/* Aumenta a quantidade do item. */}
                                        <button
                                            type="button"
                                            onClick={() =>
                                                alterarQuantidade(
                                                    item.produto.id,
                                                    item.quantidade + 1
                                                )
                                            }
                                            aria-label={`Aumentar ${item.produto.nome}`}
                                        >
                                            +
                                        </button>

                                        {/* Remove o produto inteiro da venda. */}
                                        <button
                                            type="button"
                                            className="pdv-remover"
                                            onClick={() =>
                                                removerProduto(item.produto.id)
                                            }
                                            aria-label={`Remover ${item.produto.nome}`}
                                        >
                                            ×
                                        </button>
                                    </div>

                                    <strong className="pdv-item-subtotal">
                                        {formatarMoeda(
                                            item.produto.preco * item.quantidade
                                        )}
                                    </strong>
                                </article>
                            ))
                        ) : (
                            <div className="pdv-carrinho-vazio">
                                <p>Nenhum produto adicionado.</p>
                                <span>Selecione um produto para começar.</span>
                            </div>
                        )}
                    </div>

                    {/* Resumo e total da venda. */}
                    <div className="pdv-resumo">
                        <div className="pdv-total">
                            <span>Total da venda</span>
                            <strong>{formatarMoeda(total)}</strong>
                        </div>

                        {/* Seleção da forma de pagamento. */}
                        <label className="pdv-label" htmlFor="pdv-pagamento">
                            Forma de pagamento
                        </label>

                        <select
                            id="pdv-pagamento"
                            value={pagamento}
                            onChange={(evento) => setPagamento(evento.target.value)}
                        >
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Pix">Pix</option>
                            <option value="Cartão de débito">Cartão de débito</option>
                            <option value="Cartão de crédito">Cartão de crédito</option>
                        </select>

                        {/* O valor recebido e o troco aparecem em dinheiro. */}
                        {pagamento === "Dinheiro" && (
                            <div className="pdv-dinheiro">
                                <label
                                    className="pdv-label"
                                    htmlFor="pdv-recebido"
                                >
                                    Valor recebido (R$)
                                </label>

                                <input
                                    id="pdv-recebido"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={valorRecebido}
                                    onChange={(evento) =>
                                        setValorRecebido(evento.target.value)
                                    }
                                />

                                <div className="pdv-troco">
                                    <span>Troco</span>
                                    <strong>{formatarMoeda(troco)}</strong>
                                </div>
                            </div>
                        )}

                        {/* Ações disponíveis para a venda atual. */}
                        <div className="pdv-botoes">
                            <button
                                type="button"
                                className="pdv-botao-cancelar"
                                onClick={cancelarVenda}
                            >
                                Cancelar venda
                            </button>

                            <button
                                type="button"
                                className="pdv-botao-finalizar"
                                onClick={finalizarVenda}
                            >
                                Finalizar venda
                            </button>
                        </div>
                    </div>
                </aside>
            </div>
        </main>
    );
}

export default PDV;
