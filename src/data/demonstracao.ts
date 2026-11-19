// Dados de demonstração usados enquanto o backend de vendas, estoque e
// financeiro não existe. As datas são geradas a partir de HOJE, para que
// "Hoje", "Últimos 7 dias" e "Este mês" sempre mostrem algo (antes os
// exemplos eram fixos em outubro e a tela de Relatórios abria zerada).
//
// Quando as rotas reais existirem, basta trocar estas funções por
// chamadas à API mantendo os mesmos tipos.

export type Venda = {
    data: string; // AAAA-MM-DD
    hora: string; // HH:MM
    produto: string;
    quantidade: number;
    valor: number;
    pagamento: "Pix" | "Dinheiro" | "Cartão";
};

export type MovimentoFinanceiro = {
    data: string;
    descricao: string;
    tipo: "Entrada" | "Saída";
    categoria: string;
    valor: number;
};

export type ProdutoEstoque = {
    nome: string;
    quantidade: number;
    minimo: number;
};

export const ESTA_EM_DEMONSTRACAO = true;

const catalogo = [
    { nome: "Arroz 5kg", preco: 27.9 },
    { nome: "Feijão 1kg", preco: 8.99 },
    { nome: "Óleo 900ml", preco: 7.49 },
    { nome: "Leite 1L", preco: 5.79 },
    { nome: "Café 500g", preco: 18.9 },
    { nome: "Açúcar 1kg", preco: 4.99 },
    { nome: "Macarrão 500g", preco: 4.29 },
    { nome: "Pão de forma", preco: 9.49 },
    { nome: "Detergente 500ml", preco: 2.79 },
    { nome: "Refrigerante 2L", preco: 9.99 },
];

const pagamentos: Venda["pagamento"][] = ["Pix", "Cartão", "Dinheiro", "Pix", "Cartão"];

// Gerador pseudoaleatório com semente fixa: os números não mudam a cada
// recarga da página.
function gerador(semente: number) {
    let estado = semente;
    return () => {
        estado = (estado * 1664525 + 1013904223) % 4294967296;
        return estado / 4294967296;
    };
}

export function dataISO(data: Date): string {
    return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
}

function diasAtras(dias: number): Date {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - dias);
    return d;
}

let cacheVendas: Venda[] | null = null;

// Vendas dos últimos 60 dias
export function vendasDemonstracao(): Venda[] {
    if (cacheVendas) return cacheVendas;

    const aleatorio = gerador(42);
    const vendas: Venda[] = [];
    const agora = new Date();

    for (let dia = 59; dia >= 0; dia--) {
        const data = diasAtras(dia);
        const fimDeSemana = data.getDay() === 0 || data.getDay() === 6;
        const quantidadeVendas = Math.floor(aleatorio() * 12) + (fimDeSemana ? 32 : 22);

        for (let i = 0; i < quantidadeVendas; i++) {
            const hora = 7 + Math.floor((i / quantidadeVendas) * 14);
            const minuto = Math.floor(aleatorio() * 60);

            // Hoje: só vendas até a hora atual
            if (dia === 0 && (hora > agora.getHours() || (hora === agora.getHours() && minuto > agora.getMinutes()))) {
                continue;
            }

            const item = catalogo[Math.floor(aleatorio() * catalogo.length)];
            const quantidade = Math.floor(aleatorio() * 4) + 1;

            vendas.push({
                data: dataISO(data),
                hora: `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`,
                produto: item.nome,
                quantidade,
                valor: Math.round(item.preco * quantidade * 100) / 100,
                pagamento: pagamentos[Math.floor(aleatorio() * pagamentos.length)],
            });
        }
    }

    cacheVendas = vendas;
    return vendas;
}

// Entradas (vendas do dia somadas) e despesas do período
export function financeiroDemonstracao(): MovimentoFinanceiro[] {
    const porDia = new Map<string, number>();

    for (const venda of vendasDemonstracao()) {
        porDia.set(venda.data, (porDia.get(venda.data) ?? 0) + venda.valor);
    }

    const movimentos: MovimentoFinanceiro[] = [...porDia.entries()].map(([data, valor]) => ({
        data,
        descricao: "Vendas do dia",
        tipo: "Entrada",
        categoria: "Vendas",
        valor: Math.round(valor * 100) / 100,
    }));

    const despesas: [number, string, string, number][] = [
        [52, "Compra de mercadorias", "Estoque", 1840],
        [45, "Aluguel do ponto", "Contas fixas", 1500],
        [40, "Conta de energia", "Contas fixas", 386.4],
        [33, "Compra de mercadorias", "Estoque", 2115.5],
        [24, "Internet e telefone", "Contas fixas", 129.9],
        [18, "Compra de mercadorias", "Estoque", 1690],
        [15, "Aluguel do ponto", "Contas fixas", 1500],
        [10, "Conta de energia", "Contas fixas", 402.15],
        [6, "Manutenção da geladeira", "Manutenção", 280],
        [3, "Compra de mercadorias", "Estoque", 1985.3],
    ];

    for (const [dias, descricao, categoria, valor] of despesas) {
        movimentos.push({ data: dataISO(diasAtras(dias)), descricao, tipo: "Saída", categoria, valor });
    }

    return movimentos.sort((a, b) => a.data.localeCompare(b.data));
}

export function estoqueDemonstracao(): ProdutoEstoque[] {
    return [
        { nome: "Arroz 5kg", quantidade: 18, minimo: 5 },
        { nome: "Feijão 1kg", quantidade: 3, minimo: 8 },
        { nome: "Óleo 900ml", quantidade: 12, minimo: 5 },
        { nome: "Leite 1L", quantidade: 4, minimo: 10 },
        { nome: "Café 500g", quantidade: 15, minimo: 5 },
        { nome: "Açúcar 1kg", quantidade: 22, minimo: 6 },
        { nome: "Macarrão 500g", quantidade: 2, minimo: 6 },
        { nome: "Pão de forma", quantidade: 9, minimo: 4 },
        { nome: "Detergente 500ml", quantidade: 30, minimo: 10 },
        { nome: "Refrigerante 2L", quantidade: 11, minimo: 8 },
    ];
}

// ---------------------------------------------------------------------
// Formatação compartilhada
// ---------------------------------------------------------------------

export const moeda = (valor: number) =>
    valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const dataBR = (data: string) =>
    new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR");
