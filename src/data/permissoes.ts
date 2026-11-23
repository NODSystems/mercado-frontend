// Permissão necessária para cada área do sistema.
// Mesmas chaves da tabela "permissoes" do backend.
export const PERMISSAO_DA_AREA = {
    pdv: "vendas.realizar",
    estoque: "estoque.visualizar",
    financeiro: "financeiro.visualizar",
    equipe: "funcionarios.visualizar",
    relatorios: "relatorios.visualizar",
} as const;
