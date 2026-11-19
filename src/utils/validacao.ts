// Validações e máscaras dos formulários.
// As regras são as mesmas do backend (src/utils/validacao.ts lá),
// para o erro aparecer na hora, no campo certo, antes de enviar.

export const LIMITES = {
    nomeUsuario: 120,
    email: 120,
    senhaMin: 8,
    senhaMax: 72,
    razaoSocial: 150,
    nomeFantasia: 150,
    cidade: 100,
    rua: 150,
    numero: 20,
    nomeFuncionario: 120,
} as const;

export const ESTADOS = [
    "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES",
    "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR",
    "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC",
    "SP", "SE", "TO",
];

export function somenteDigitos(valor: string): string {
    return valor.replace(/\D/g, "");
}

export function emailValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function telefoneValido(valor: string): boolean {
    const d = somenteDigitos(valor);
    return /^\d{10,11}$/.test(d) && !d.startsWith("0");
}

export function cepValido(valor: string): boolean {
    return /^\d{8}$/.test(somenteDigitos(valor));
}

export function cnpjValido(valor: string): boolean {
    const cnpj = somenteDigitos(valor);

    if (!/^\d{14}$/.test(cnpj) || /^(\d)\1{13}$/.test(cnpj)) return false;

    const calcular = (base: string, pesos: number[]) => {
        const soma = base.split("").reduce((t, d, i) => t + Number(d) * pesos[i], 0);
        const resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    };

    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const d1 = calcular(cnpj.slice(0, 12), pesos1);
    const d2 = calcular(cnpj.slice(0, 12) + d1, [6, ...pesos1]);

    return cnpj.endsWith(`${d1}${d2}`);
}

export function cpfValido(valor: string): boolean {
    const cpf = somenteDigitos(valor);

    if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false;

    for (const tamanho of [9, 10]) {
        let soma = 0;
        for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i);
        if (((soma * 10) % 11) % 10 !== Number(cpf[tamanho])) return false;
    }

    return true;
}

// Converte valores digitados no formato brasileiro para número:
// "2.500,50" → 2500.5 | "2500,50" → 2500.5 | "2500.50" → 2500.5
export function numeroBR(valor: string): number {
    const texto = valor.trim().replace(/\s|R\$/g, "");

    if (!texto) return NaN;

    // Com vírgula: os pontos são separadores de milhar
    if (texto.includes(",")) {
        return Number(texto.replace(/\./g, "").replace(",", "."));
    }

    // Só pontos: "2.500" (milhar) ou "2500.50" (decimal)
    const partes = texto.split(".");
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3)) {
        return Number(texto.replace(/\./g, ""));
    }

    return Number(texto);
}

// ---------------------------------------------------------------------
// Máscaras (formatam enquanto a pessoa digita)
// ---------------------------------------------------------------------

export function mascaraTelefone(valor: string): string {
    const d = somenteDigitos(valor).slice(0, 11);

    if (d.length <= 2) return d.length ? `(${d}` : "";
    if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
    if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function mascaraCep(valor: string): string {
    const d = somenteDigitos(valor).slice(0, 8);
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

export function mascaraCnpj(valor: string): string {
    const d = somenteDigitos(valor).slice(0, 14);

    return d
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
}

export function mascaraCpf(valor: string): string {
    const d = somenteDigitos(valor).slice(0, 11);

    return d
        .replace(/^(\d{3})(\d)/, "$1.$2")
        .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1-$2");
}
