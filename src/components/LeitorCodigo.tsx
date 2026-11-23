// Leitura de código de barras pela câmera (celular ou webcam).
//
// Usa a biblioteca ZXing, carregada só quando a janela abre (não pesa
// no resto do site). Lê EAN-13/EAN-8 (os códigos de mercado), UPC,
// Code 128 e QR Code. O navegador só libera a câmera em páginas
// https:// ou em http://localhost.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faCamera, faKeyboard } from "@fortawesome/free-solid-svg-icons";

import "../styles/components/LeitorCodigo.css";

type Props = {
    titulo?: string;
    onLido: (codigo: string) => void;
    onFechar: () => void;
};

type Controles = { stop: () => void };

// Bipe curto de confirmação (sem arquivo de áudio)
function bipar() {
    try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        const osc = ctx.createOscillator();
        const ganho = ctx.createGain();
        osc.frequency.value = 1400;
        ganho.gain.value = 0.08;
        osc.connect(ganho).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.09);
        osc.onended = () => ctx.close();
    } catch {
        /* sem áudio, segue o jogo */
    }
    navigator.vibrate?.(60);
}

function mensagemDaCamera(erro: unknown): string {
    const nome = (erro as { name?: string })?.name;
    if (nome === "NotAllowedError" || nome === "SecurityError") {
        return "A permissão da câmera foi negada. Libere a câmera no cadeado da barra de endereço e tente de novo.";
    }
    if (nome === "NotFoundError" || nome === "OverconstrainedError") {
        return "Nenhuma câmera foi encontrada neste aparelho.";
    }
    if (nome === "NotReadableError") {
        return "A câmera está sendo usada por outro aplicativo. Feche-o e tente de novo.";
    }
    return "Não foi possível abrir a câmera.";
}

function LeitorCodigo({ titulo = "Ler código de barras", onLido, onFechar }: Props) {
    const video = useRef<HTMLVideoElement>(null);
    const controles = useRef<Controles | null>(null);
    const jaLeu = useRef(false);

    const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
    const [cameraId, setCameraId] = useState<string | undefined>(undefined);
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(true);
    const [manual, setManual] = useState("");

    const semSeguranca = !window.isSecureContext;
    const semCamera = !navigator.mediaDevices?.getUserMedia;

    useEffect(() => {
        if (semSeguranca || semCamera) {
            setCarregando(false);
            return;
        }

        let cancelado = false;

        (async () => {
            setCarregando(true);
            setErro("");
            try {
                const [{ BrowserMultiFormatReader }, { DecodeHintType, BarcodeFormat }] = await Promise.all([
                    import("@zxing/browser"),
                    import("@zxing/library"),
                ]);
                if (cancelado || !video.current) return;

                const dicas = new Map();
                dicas.set(DecodeHintType.POSSIBLE_FORMATS, [
                    BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A,
                    BarcodeFormat.UPC_E, BarcodeFormat.CODE_128, BarcodeFormat.QR_CODE,
                ]);
                const leitor = new BrowserMultiFormatReader(dicas, { delayBetweenScanAttempts: 120 });

                // Sem câmera escolhida, pede a traseira (no celular)
                const restricoes: MediaStreamConstraints = {
                    audio: false,
                    video: cameraId
                        ? { deviceId: { exact: cameraId } }
                        : { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
                };

                // O 3º parâmetro são os controles: a leitura pode acontecer
                // no primeiro quadro, antes de decodeFromConstraints terminar.
                const ctrl = await leitor.decodeFromConstraints(restricoes, video.current, (resultado, _erro, controlesLeitura) => {
                    if (!resultado || jaLeu.current) return;
                    jaLeu.current = true;
                    bipar();
                    controlesLeitura.stop();
                    onLido(resultado.getText().trim());
                });

                if (cancelado) {
                    ctrl.stop();
                    return;
                }
                controles.current = ctrl;

                // Depois da permissão, os nomes das câmeras ficam disponíveis
                const dispositivos = await navigator.mediaDevices.enumerateDevices();
                if (!cancelado) setCameras(dispositivos.filter((d) => d.kind === "videoinput"));
            } catch (e) {
                if (!cancelado) setErro(mensagemDaCamera(e));
            } finally {
                if (!cancelado) setCarregando(false);
            }
        })();

        return () => {
            cancelado = true;
            controles.current?.stop();
            controles.current = null;
        };
        // onLido muda a cada render do pai; a câmera só reinicia ao trocar de câmera
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cameraId, semSeguranca, semCamera]);

    // Esc fecha
    useEffect(() => {
        const aoTeclar = (e: KeyboardEvent) => e.key === "Escape" && onFechar();
        window.addEventListener("keydown", aoTeclar);
        return () => window.removeEventListener("keydown", aoTeclar);
    }, [onFechar]);

    function enviarManual(evento: FormEvent) {
        evento.preventDefault();
        const codigo = manual.replace(/\s/g, "");
        if (!codigo) return;
        jaLeu.current = true;
        onLido(codigo);
    }

    const aviso = semSeguranca
        ? "A câmera só funciona com o site aberto em https:// ou em http://localhost. Digite o código abaixo ou use um leitor USB."
        : semCamera
            ? "Este navegador não dá acesso à câmera. Digite o código abaixo."
            : erro;

    return (
        <div className="leitor-fundo" role="dialog" aria-modal="true" aria-label={titulo} onMouseDown={(e) => e.target === e.currentTarget && onFechar()}>
            <div className="leitor-janela">
                <header className="leitor-cabecalho">
                    <strong><FontAwesomeIcon icon={faCamera} /> {titulo}</strong>
                    <button type="button" className="leitor-fechar" onClick={onFechar} aria-label="Fechar">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </header>

                {aviso ? (
                    <div className="leitor-aviso">{aviso}</div>
                ) : (
                    <div className="leitor-video">
                        <video ref={video} muted playsInline />
                        <div className="leitor-mira" aria-hidden="true"><span /></div>
                        {carregando && <div className="leitor-carregando">Abrindo a câmera…</div>}
                    </div>
                )}

                {!aviso && (
                    <p className="leitor-dica">
                        Aponte para o código de barras da embalagem, a uns 15 cm. Com pouca luz, aproxime de uma janela.
                    </p>
                )}

                {cameras.length > 1 && (
                    <label className="leitor-camera">
                        Câmera
                        <select value={cameraId ?? ""} onChange={(e) => setCameraId(e.target.value || undefined)}>
                            <option value="">Automática (traseira)</option>
                            {cameras.map((c, i) => (
                                <option key={c.deviceId} value={c.deviceId}>{c.label || `Câmera ${i + 1}`}</option>
                            ))}
                        </select>
                    </label>
                )}

                <form className="leitor-manual" onSubmit={enviarManual}>
                    <label htmlFor="leitor-manual">
                        <FontAwesomeIcon icon={faKeyboard} /> Ou digite os números
                    </label>
                    <div>
                        <input
                            id="leitor-manual"
                            inputMode="numeric"
                            autoComplete="off"
                            value={manual}
                            onChange={(e) => setManual(e.target.value.replace(/[^\dA-Za-z]/g, "").slice(0, 50))}
                            placeholder="7891234567895"
                            autoFocus={Boolean(aviso)}
                        />
                        <button type="submit" disabled={!manual}>Usar</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default LeitorCodigo;
