const SRC = 'https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js';

let scriptPromise = null;
let initialized = false;

const loadScript = () => {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve, reject) => {
    if (window.mapkit) {
      resolve(window.mapkit);
      return;
    }
    const existing = document.querySelector(`script[src="${SRC}"]`);
    const script = existing || document.createElement('script');
    script.addEventListener('load', () => resolve(window.mapkit));
    script.addEventListener('error', () => reject(new Error('Falha ao carregar o mapa')));
    if (!existing) {
      script.src = SRC;
      script.crossOrigin = 'anonymous';
      script.async = true;
      document.head.appendChild(script);
    }
  });
  return scriptPromise;
};

export default async function loadMapKit(token) {
  const mapkit = await loadScript();
  if (!mapkit) throw new Error('Mapa indisponível');
  if (!initialized) {
    mapkit.init({ authorizationCallback: (done) => done(token) });
    initialized = true;
  }
  return mapkit;
}
