import * as ort from 'onnxruntime-web';

ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.31.1/dist/';

const INPUT = 640;
const MODELO = '/models/face_detector.onnx';

let sessionPromise = null;

const carregar = () => {
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(MODELO, {
      executionProviders: ['wasm'],
      graphOptimizationLevel: 'all',
    });
  }
  return sessionPromise;
};

export const precarregarDetector = () => carregar().then(() => true).catch(() => false);

let canvas = null;
let ctx = null;
const contexto = () => {
  if (!ctx) {
    canvas = document.createElement('canvas');
    canvas.width = INPUT;
    canvas.height = INPUT;
    ctx = canvas.getContext('2d', { willReadFrequently: true });
  }
  return ctx;
};

export async function detectarRosto(video) {
  if (!video || !video.videoWidth) return null;
  const session = await carregar();
  const c = contexto();
  c.drawImage(video, 0, 0, INPUT, INPUT);
  const { data } = c.getImageData(0, 0, INPUT, INPUT);

  const plane = INPUT * INPUT;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i += 1) {
    input[i] = data[i * 4] / 255;
    input[plane + i] = data[i * 4 + 1] / 255;
    input[2 * plane + i] = data[i * 4 + 2] / 255;
  }

  const tensor = new ort.Tensor('float32', input, [1, 3, INPUT, INPUT]);
  const saida = await session.run({ [session.inputNames[0]]: tensor });
  const out = saida[session.outputNames[0]];
  const arr = out.data;
  const channels = out.dims[1];
  const anchors = out.dims[2];
  if (channels < 5) return null;

  let melhor = null;
  for (let i = 0; i < anchors; i += 1) {
    const score = arr[4 * anchors + i];
    if (score < 0.5) continue;
    if (!melhor || score > melhor.score) {
      melhor = {
        score,
        cx: arr[i] / INPUT,
        cy: arr[anchors + i] / INPUT,
        w: arr[2 * anchors + i] / INPUT,
        h: arr[3 * anchors + i] / INPUT,
      };
    }
  }
  return melhor;
}

export function rostoBemEnquadrado(rosto) {
  if (!rosto) return false;
  const tamanhoOk = rosto.w > 0.22 && rosto.w < 0.95 && rosto.h > 0.22;
  const centralizado = Math.abs(rosto.cx - 0.5) < 0.22 && Math.abs(rosto.cy - 0.5) < 0.24;
  return tamanhoOk && centralizado;
}
