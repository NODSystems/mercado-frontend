// Leitura do XML da NF-e (nota fiscal eletrônica do fornecedor).
// Tudo roda no navegador: o arquivo não é enviado, só os itens conferidos.

export type ItemNota = {
    numero: number;          // nItem
    codigoFornecedor: string; // cProd
    nome: string;            // xProd
    ean: string;             // cEAN (código da embalagem comercial)
    eanTributavel: string;   // cEANTrib (normalmente o da unidade)
    unidade: string;         // uCom
    quantidade: number;      // qCom
    valorUnitario: number;   // vUnCom
    valorTotal: number;      // vProd
    unidadeTributavel: string; // uTrib
    quantidadeTributavel: number; // qTrib
};

export type Nota = {
    numero: string;
    serie: string;
    chave: string;
    dataEmissao: string;
    fornecedor: string;
    cnpjFornecedor: string;
    valorTotal: number;
    itens: ItemNota[];
};

function filho(el: Element | null | undefined, nome: string): string {
    if (!el) return '';
    const achado = el.getElementsByTagName(nome)[0];
    return achado?.textContent?.trim() ?? '';
}

function num(v: string): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
}

// "SEM GTIN" ou vazio vira ''
export function eanValido(v: string): string {
    const limpo = v.replace(/\D/g, '');
    return /^\d{8,14}$/.test(limpo) && !/^0+$/.test(limpo) ? limpo : '';
}

export function lerNota(xml: string): Nota {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('O arquivo não é um XML válido.');
    }

    const inf = doc.getElementsByTagName('infNFe')[0];
    if (!inf) throw new Error('Este XML não parece ser uma NF-e (não tem a tag infNFe).');

    const ide = inf.getElementsByTagName('ide')[0];
    const emit = inf.getElementsByTagName('emit')[0];
    const total = inf.getElementsByTagName('ICMSTot')[0];

    const itens: ItemNota[] = Array.from(inf.getElementsByTagName('det')).map((det, i) => {
        const prod = det.getElementsByTagName('prod')[0];
        return {
            numero: num(det.getAttribute('nItem') ?? '') || i + 1,
            codigoFornecedor: filho(prod, 'cProd'),
            nome: filho(prod, 'xProd'),
            ean: eanValido(filho(prod, 'cEAN')),
            eanTributavel: eanValido(filho(prod, 'cEANTrib')),
            unidade: filho(prod, 'uCom').toUpperCase(),
            quantidade: num(filho(prod, 'qCom')),
            valorUnitario: num(filho(prod, 'vUnCom')),
            valorTotal: num(filho(prod, 'vProd')),
            unidadeTributavel: filho(prod, 'uTrib').toUpperCase(),
            quantidadeTributavel: num(filho(prod, 'qTrib')),
        };
    });

    if (itens.length === 0) throw new Error('A nota não tem itens.');

    return {
        numero: filho(ide, 'nNF'),
        serie: filho(ide, 'serie'),
        chave: (inf.getAttribute('Id') ?? '').replace(/^NFe/, ''),
        dataEmissao: filho(ide, 'dhEmi') || filho(ide, 'dEmi'),
        fornecedor: filho(emit, 'xFant') || filho(emit, 'xNome'),
        cnpjFornecedor: filho(emit, 'CNPJ'),
        valorTotal: num(filho(total, 'vNF')) || itens.reduce((s, it) => s + it.valorTotal, 0),
        itens,
    };
}

// Quantas unidades vêm em cada embalagem da nota.
// 1) qTrib/qCom quando a nota traz a unidade tributável (ex.: 2 CX = 24 UN)
// 2) "C/12", "CX12", "12X" no nome do produto
export function fatorEmbalagem(item: ItemNota): number {
    if (item.quantidade > 0 && item.quantidadeTributavel > item.quantidade) {
        const f = item.quantidadeTributavel / item.quantidade;
        if (Number.isInteger(Math.round(f * 1000) / 1000) && f <= 1000) return Math.round(f);
    }
    if (['CX', 'FD', 'PCT', 'PC', 'DZ', 'FARDO'].includes(item.unidade)) {
        const m = item.nome.match(/\b(?:C\/|CX\s?|FD\s?|PCT\s?)(\d{1,3})\b/i) ?? item.nome.match(/\b(\d{1,3})\s?X\s?\d/i);
        if (m) return Math.max(1, Number(m[1]));
        if (item.unidade === 'DZ') return 12;
    }
    return 1;
}

// Unidade com que o produto vai ser vendido na loja
export function unidadeDaLoja(item: ItemNota, fator: number): 'UN' | 'KG' | 'L' | 'CX' {
    const u = (fator > 1 ? item.unidadeTributavel || 'UN' : item.unidade).toUpperCase();
    if (u === 'KG') return 'KG';
    if (u === 'L' || u === 'LT') return 'L';
    return 'UN';
}

// "ARROZ TIO JOAO T1 5KG" -> "Arroz Tio Joao T1 5kg"
export function nomeBonito(nome: string): string {
    return nome
        // tira a embalagem do fornecedor: "CX C/12", "FD C/6", "C/24", "PCT 10"
        .replace(/\s+(?:CX|FD|PCT|PC|DZ|FARDO)?\s*C\/\s?\d{1,4}\b/gi, '')
        .replace(/\s+(?:CX|FD|PCT|FARDO)\s?\d{1,4}\s*$/i, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim()
        .replace(/(^|\s)([a-zà-ú])/g, (_, esp, l) => esp + l.toUpperCase())
        .replace(/\b(\d+)(Kg|G|Ml|L|Lt|Un)\b/g, (_, n, u) => n + u.toLowerCase())
        .slice(0, 150);
}

// Parecença entre nomes (0 a 1), para sugerir o produto já cadastrado
function palavras(nome: string): string[] {
    return nome
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/(\d+)\s*(kg|g|ml|l|lt|un)\b/g, '$1$2')
        .split(/[^a-z0-9]+/)
        .filter((p) => p.length >= 2 && !['de', 'da', 'do', 'com', 'tp', 'pct', 'cx', 'un'].includes(p));
}

export function parecenca(a: string, b: string): number {
    const pa = new Set(palavras(a));
    const pb = new Set(palavras(b));
    if (pa.size === 0 || pb.size === 0) return 0;
    let comuns = 0;
    pa.forEach((p) => { if (pb.has(p)) comuns++; });
    return comuns / Math.min(pa.size, pb.size);
}
