// Leitor de código de barras USB/Bluetooth: o aparelho funciona como um
// teclado que digita os números muito rápido e aperta Enter no final.
// Este hook escuta o teclado da página e reconhece essa "rajada", mesmo
// sem nenhum campo focado. Quando o foco está num campo de texto, o
// próprio campo recebe os números (e trata o Enter), então ignoramos.
import { useEffect, useRef } from "react";

const INTERVALO_MAXIMO_MS = 60; // humano digita bem mais devagar que isso
const TAMANHO_MINIMO = 6;

function ehCampoDeTexto(alvo: EventTarget | null): boolean {
    if (!(alvo instanceof HTMLElement)) return false;
    const tag = alvo.tagName;
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || alvo.isContentEditable;
}

export function useLeitorUSB(onCodigo: (codigo: string) => void, ativo = true) {
    const callback = useRef(onCodigo);
    callback.current = onCodigo;

    useEffect(() => {
        if (!ativo) return;

        let buffer = "";
        let ultimaTecla = 0;

        function aoTeclar(evento: KeyboardEvent) {
            if (ehCampoDeTexto(evento.target) || evento.ctrlKey || evento.metaKey || evento.altKey) return;

            const agora = performance.now();
            if (agora - ultimaTecla > INTERVALO_MAXIMO_MS) buffer = "";
            ultimaTecla = agora;

            if (evento.key === "Enter") {
                if (buffer.length >= TAMANHO_MINIMO) {
                    evento.preventDefault();
                    callback.current(buffer);
                }
                buffer = "";
                return;
            }

            if (/^[0-9A-Za-z]$/.test(evento.key)) buffer += evento.key;
        }

        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [ativo]);
}
