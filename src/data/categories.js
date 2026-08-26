import {
  Sparkles, Hammer, Zap, Waves, Paintbrush, Leaf, HardHat, Monitor,
  Wrench, Package, Truck, ShieldCheck, Scissors, Camera, Building2,
  KeyRound, Wind, LayoutGrid, TreePine, Home, Briefcase, Settings,
  Cpu, Layers, Thermometer, Palette, Droplets,
} from 'lucide-react';

const BLUE = { bg: 'var(--blue-50)', color: 'var(--blue)' };
const BLUE_DEEP = { bg: 'var(--blue-100)', color: 'var(--blue-800)' };
const RED = { bg: 'var(--red-50)', color: 'var(--red)' };
const NEUTRAL = { bg: '#F1F4FA', color: 'var(--text-soft)' };

export const FEATURED_CATEGORIES = [
  {
    id: 'Limpeza',
    label: 'Limpeza & Organização',
    sub: 'Residencial, comercial, pós-obra',
    tone: 'blue',
  },
  {
    id: 'Reparos',
    label: 'Reparos & Reformas',
    sub: 'Elétrica, hidráulica, alvenaria',
    tone: 'red',
  },
];

export const STATIC_CATEGORIES = [
  { label: 'Limpeza & Organização', icon: Sparkles, ...BLUE },
  { label: 'Reparos & Reformas', icon: Hammer, ...RED },
  { label: 'Elétrica', icon: Zap, ...BLUE },
  { label: 'Hidráulica', icon: Waves, ...BLUE_DEEP },
  { label: 'Pintura', icon: Paintbrush, ...RED },
  { label: 'Jardinagem', icon: Leaf, ...BLUE },
  { label: 'Construção', icon: HardHat, ...BLUE_DEEP },
  { label: 'Assistência Técnica', icon: Monitor, ...RED },
  { label: 'Montagem de Móveis', icon: Package, ...BLUE },
  { label: 'Ar-condicionado', icon: Wind, ...BLUE_DEEP },
  { label: 'Mudanças & Fretes', icon: Truck, ...RED },
  { label: 'Serviços Gerais', icon: Wrench, ...NEUTRAL },
];

const ICON_MAP = [
  { match: /elétric|eletric/i, icon: Zap, ...BLUE },
  { match: /hidráulic|hidraulic|encanador/i, icon: Waves, ...BLUE_DEEP },
  { match: /pintura|pintor/i, icon: Paintbrush, ...RED },
  { match: /limpeza|diarista|faxin/i, icon: Sparkles, ...BLUE },
  { match: /reparo|reforma/i, icon: Hammer, ...RED },
  { match: /jardin|paisag/i, icon: Leaf, ...BLUE },
  { match: /constru|pedreiro|alvenar/i, icon: HardHat, ...BLUE_DEEP },
  { match: /assistência|assistencia|técnica|tecnica|informát|informat/i, icon: Monitor, ...RED },
  { match: /montagem|móveis|moveis/i, icon: Package, ...BLUE },
  { match: /ar condic|ar-condic|climatiz|refriger/i, icon: Wind, ...BLUE_DEEP },
  { match: /mudança|mudanca|frete|transport/i, icon: Truck, ...RED },
  { match: /marcenaria|carpint|madeira/i, icon: TreePine, ...NEUTRAL },
  { match: /serralheria|chavei/i, icon: KeyRound, ...NEUTRAL },
  { match: /segurança|seguranca|monitor/i, icon: ShieldCheck, ...BLUE_DEEP },
  { match: /câmera|camera|cftv/i, icon: Camera, ...BLUE },
  { match: /piso|revestimento|azulej/i, icon: LayoutGrid, ...NEUTRAL },
  { match: /automação|automacao|elétron|eletron/i, icon: Cpu, ...BLUE },
  { match: /predial|manutenção|manutencao/i, icon: Wrench, ...NEUTRAL },
  { match: /gás|gas|aquec/i, icon: Thermometer, ...RED },
  { match: /decoração|decoracao|design/i, icon: Palette, ...RED },
  { match: /impermeabil|calha|telhad/i, icon: Droplets, ...BLUE_DEEP },
  { match: /comercial|empresa|escrit/i, icon: Building2, ...NEUTRAL },
  { match: /cabeleir|barbeir|estét|estet|beleza/i, icon: Scissors, ...RED },
  { match: /gesso|forro|drywall/i, icon: Layers, ...NEUTRAL },
  { match: /residencial|casa|domést|domest/i, icon: Home, ...BLUE },
];

const FALLBACKS = [
  { icon: Briefcase, ...BLUE },
  { icon: Settings, ...NEUTRAL },
  { icon: Wrench, ...BLUE_DEEP },
  { icon: Sparkles, ...RED },
];

export function resolveCategoryStyle(label) {
  const found = ICON_MAP.find((entry) => entry.match.test(label));
  if (found) return { icon: found.icon, bg: found.bg, color: found.color };
  return FALLBACKS[(label.codePointAt(0) ?? 0) % FALLBACKS.length];
}
