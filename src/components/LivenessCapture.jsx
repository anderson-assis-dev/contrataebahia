import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, X, Loader2, CheckCircle2, AlertCircle, ScanFace } from 'lucide-react';
import { submitLiveness } from '../services/auth';
import { detectarRosto, rostoBemEnquadrado, precarregarDetector } from '../utils/faceDetect';
import './LivenessCapture.css';

const NUM_FRAMES = 6;
const INTERVALO_MS = 180;
const LADO_MAX = 640;

const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

const mensagemDoErro = (erro) => {
  if (!window.isSecureContext) {
    return 'A câmera só funciona em conexão segura (https).';
  }
  if (erro?.name === 'NotAllowedError' || erro?.name === 'SecurityError') {
    return 'Você precisa permitir o acesso à câmera para fazer a prova de vida.';
  }
  if (erro?.name === 'NotFoundError' || erro?.name === 'OverconstrainedError') {
    return 'Nenhuma câmera encontrada neste dispositivo.';
  }
  if (erro?.name === 'NotReadableError') {
    return 'A câmera está sendo usada por outro aplicativo.';
  }
  return 'Não foi possível abrir a câmera. Tente novamente.';
};

export default function LivenessCapture({ onSuccess, onClose }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const analisandoRef = useRef(false);
  const [fase, setFase] = useState('abrindo');
  const [erro, setErro] = useState('');
  const [detectorAtivo, setDetectorAtivo] = useState(false);
  const [rostoOk, setRostoOk] = useState(false);

  const pararCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const abrirCamera = useCallback(async () => {
    setErro('');
    setFase('abrindo');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: LADO_MAX }, height: { ideal: LADO_MAX } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      setFase('pronto');
      precarregarDetector().then(setDetectorAtivo);
    } catch (e) {
      setErro(mensagemDoErro(e));
      setFase('erro');
    }
  }, []);

  useEffect(() => {
    abrirCamera();
    return pararCamera;
  }, [abrirCamera, pararCamera]);

  useEffect(() => {
    if (fase !== 'pronto' || !detectorAtivo) return undefined;
    let vivo = true;
    const id = setInterval(async () => {
      if (!vivo || analisandoRef.current || !videoRef.current) return;
      analisandoRef.current = true;
      try {
        const rosto = await detectarRosto(videoRef.current);
        if (vivo) setRostoOk(rostoBemEnquadrado(rosto));
      } catch {
        /* detector falhou: segue sem feedback ao vivo */
      } finally {
        analisandoRef.current = false;
      }
    }, 450);
    return () => { vivo = false; clearInterval(id); };
  }, [fase, detectorAtivo]);

  const capturarFrame = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;
    const escala = Math.min(1, LADO_MAX / video.videoWidth);
    const w = Math.round(video.videoWidth * escala);
    const h = Math.round(video.videoHeight * escala);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.82);
  }, []);

  const validar = useCallback(async () => {
    setFase('capturando');
    setErro('');
    const frames = [];
    for (let i = 0; i < NUM_FRAMES; i += 1) {
      const f = capturarFrame();
      if (f) frames.push(f);
      if (i < NUM_FRAMES - 1) await esperar(INTERVALO_MS); // eslint-disable-line no-await-in-loop
    }
    if (frames.length === 0) {
      setErro('Não conseguimos capturar a imagem. Tente novamente.');
      setFase('pronto');
      return;
    }

    setFase('enviando');
    try {
      const json = await submitLiveness(frames);
      if (json?.success) {
        pararCamera();
        setFase('sucesso');
        onSuccess?.(json.data);
      } else {
        setErro(json?.message || 'Prova de vida não aprovada.');
        setFase('pronto');
      }
    } catch (e) {
      setErro(e?.response?.data?.message || 'Prova de vida não aprovada. Tente de novo em boa luz.');
      setFase('pronto');
    }
  }, [capturarFrame, onSuccess, pararCamera]);

  const fechar = () => {
    pararCamera();
    onClose?.();
  };

  const capturando = fase === 'capturando' || fase === 'enviando';

  return (
    <div className="lc-overlay" role="dialog" aria-modal="true" aria-label="Prova de vida">
      <div className="lc-card">
        <button type="button" className="lc-close" onClick={fechar} aria-label="Fechar">
          <X size={18} />
        </button>

        {fase === 'sucesso' ? (
          <div className="lc-estado">
            <div className="lc-icone-ok"><CheckCircle2 size={44} /></div>
            <h2 className="lc-titulo">Prova de vida confirmada</h2>
            <p className="lc-texto">Seu perfil ganhou o selo de identidade verificada.</p>
            <button type="button" className="btn-primary lc-botao" onClick={fechar}>Concluir</button>
          </div>
        ) : fase === 'erro' ? (
          <div className="lc-estado">
            <div className="lc-icone-erro"><AlertCircle size={44} /></div>
            <h2 className="lc-titulo">Câmera indisponível</h2>
            <p className="lc-texto">{erro}</p>
            <button type="button" className="btn-primary lc-botao" onClick={abrirCamera}>Tentar de novo</button>
          </div>
        ) : (
          <>
            <div className="lc-cabecalho">
              <ScanFace size={20} aria-hidden="true" />
              <h2 className="lc-titulo">Prova de vida</h2>
            </div>
            <p className="lc-texto">
              Centralize o rosto no círculo, em boa luz, e mantenha-se parado. Não use foto nem tela.
            </p>

            <div className={`lc-palco${capturando ? ' lc-ativo' : ''}${detectorAtivo && rostoOk ? ' lc-rosto-ok' : ''}`}>
              <video ref={videoRef} className="lc-video" playsInline muted autoPlay />
              <div className="lc-anel" aria-hidden="true" />
              {fase === 'abrindo' && (
                <div className="lc-carregando"><Loader2 size={28} className="lc-girando" /></div>
              )}
              {capturando && (
                <div className="lc-carregando">
                  <Loader2 size={28} className="lc-girando" />
                  <span>{fase === 'enviando' ? 'Verificando...' : 'Segure firme...'}</span>
                </div>
              )}
            </div>

            {detectorAtivo && fase === 'pronto' && (
              <p className={`lc-dica${rostoOk ? ' lc-dica-ok' : ''}`}>
                {rostoOk ? 'Rosto detectado — pode validar.' : 'Aproxime e centralize o rosto no círculo.'}
              </p>
            )}

            {erro && <p className="lc-erro">{erro}</p>}

            <button
              type="button"
              className="btn-primary lc-botao"
              onClick={validar}
              disabled={fase !== 'pronto' || (detectorAtivo && !rostoOk && !erro)}
            >
              <Camera size={16} /> {erro ? 'Tentar de novo' : 'Validar agora'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
