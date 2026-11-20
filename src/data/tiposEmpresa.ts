// Tipos de negócio atendidos pela NODSystems.
// Todos são comércios: cadastram produtos, controlam estoque e vendem no
// caixa, usando os mesmos módulos. Negócios de serviço (academia, salão,
// assistência técnica) precisariam de outros módulos (agenda,
// mensalidades, ordens de serviço) e por isso não aparecem aqui.
// Lista única usada na escolha do tipo e no cadastro da empresa.

export type TipoEmpresa = {
    id: string;
    nome: string;
    descricao: string;
    icone: string;
};

export const TIPOS_EMPRESA: TipoEmpresa[] = [
    { id: 'mercadinho', nome: 'Mercadinho / Mercado', descricao: 'Produtos, estoque e vendas', icone: '🛒' },
    { id: 'padaria', nome: 'Padaria', descricao: 'Produtos, estoque e vendas no balcão', icone: '🥖' },
    { id: 'papelaria', nome: 'Papelaria', descricao: 'Materiais e controle de produtos', icone: '📚' },
    { id: 'roupas', nome: 'Loja de roupas', descricao: 'Peças, estoque e vendas', icone: '👕' },
    { id: 'informatica', nome: 'Loja de informática', descricao: 'Equipamentos, peças e acessórios', icone: '💻' },
    { id: 'outros', nome: 'Outro comércio', descricao: 'Qualquer loja que venda produtos', icone: '🏪' },
];

// id → nome (o nome é o que vai para o backend em tipo_negocio)
export const NOMES_TIPOS: Record<string, string> = Object.fromEntries(
    TIPOS_EMPRESA.map((tipo) => [tipo.id, tipo.nome]),
);
