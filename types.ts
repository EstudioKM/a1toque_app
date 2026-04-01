export type Category = string;

export interface CategoryConfig {
  id: string;
  name: string;
  type: 'club' | 'section';
  visible: boolean;
  order: number;
}

export interface SiteConfig {
  id: string;
  logoUrl: string;
  siteName: string;
  footerText: string;
  homeAdInterval?: number;
  adminMessage?: string;
  searchDomains?: string[]; // Dominios permitidos para búsqueda IA
  isLiveActive?: boolean;
  liveVideoUrl?: string;
}

export type BlockType = 'text' | 'image' | 'youtube' | 'instagram' | 'quote' | 'heading';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string; // URL para media, Texto para párrafos
  caption?: string; // Epígrafe o autor de la cita
}

export interface Article {
  id: string;
  title: string;
  excerpt: string;
  content: string | ContentBlock[]; // Soporte híbrido para migración
  author: string; // Ahora esto será el User ID
  date: string;
  category: Category;
  imageUrl: string;
  isPublished: boolean; // Nuevo estado para borradores
  isBreaking?: boolean;
  isPremium?: boolean; // Contenido solo para suscriptores
  sources?: Source[]; // Fuentes utilizadas por la IA
  views?: number; // Contador de visualizaciones para tendencias

  isPublinota?: boolean;
  highlightColor?: string;
}

export interface Comment {
  id: string;
  user: string;
  avatar?: string;
  text: string;
  timestamp: string;
  isAdmin?: boolean;
}

// --- NUEVOS TIPOS PARA AUSPICIOS Y MARCAS ---

export interface Brand {
  id: string;
  name: string;
  logoUrl: string;
  socialHandle?: string;
}

export enum SponsorshipType {
  EXCLUSIVE = 'Exclusivo',
  ROTATING = 'Rotativo',
}

export type SponsorshipPosition = 
  | 'HOME_POPUP' 
  | 'HOME_LVL_1' 
  | 'HOME_LVL_2' 
  | 'HOME_LVL_3' 
  | 'NEWS_TOP_LVL_1' 
  | 'NEWS_SIDE_LVL_1' 
  | 'NEWS_SIDE_LVL_2' 
  | 'LANDING_PAGE';

// --- NUEVOS TIPOS PARA CONFIGURACIÓN DE ESPACIOS PUBLICITARIOS ---
export type AdSlotBehavior = 'rotate' | 'stack' | 'inject';

export interface AdSlotConfig {
  id: SponsorshipPosition;
  name: string;
  group: string;
  order: number;
  width: number;
  height: number;
  behavior: AdSlotBehavior;
  injectInterval?: number; // Usado para 'inject' en listas de noticias
  visible: boolean;
}

export const INITIAL_AD_SLOTS: AdSlotConfig[] = [
  { id: 'HOME_POPUP', name: 'HOME - VENTANA POPUP', group: 'HOME', order: 0, width: 800, height: 600, behavior: 'rotate', visible: true },
  { id: 'HOME_LVL_1', name: 'HOME - HEADER PREMIUM', group: 'HOME', order: 1, width: 1140, height: 250, behavior: 'rotate', visible: true },
  { id: 'HOME_LVL_2', name: 'HOME - BANNER CENTRAL (FEED)', group: 'HOME', order: 2, width: 728, height: 300, behavior: 'inject', injectInterval: 4, visible: true },
  { id: 'HOME_LVL_3', name: 'HOME - LATERAL DERECHO', group: 'HOME', order: 3, width: 300, height: 600, behavior: 'stack', visible: true },
  { id: 'NEWS_TOP_LVL_1', name: 'NOTICIA - BANNER SUPERIOR', group: 'NEWS', order: 1, width: 970, height: 250, behavior: 'rotate', visible: true },
  { id: 'NEWS_SIDE_LVL_1', name: 'NOTICIA - LATERAL SKYSCRAPER', group: 'NEWS', order: 2, width: 300, height: 600, behavior: 'rotate', visible: true },
  { id: 'NEWS_SIDE_LVL_2', name: 'NOTICIA - LATERAL CUADRADO', group: 'NEWS', order: 3, width: 300, height: 250, behavior: 'stack', visible: true },
  { id: 'LANDING_PAGE', name: 'LANDING - BANNER FOOTER', group: 'LANDING', order: 1, width: 1280, height: 300, behavior: 'rotate', visible: true },
];

// FIX: Add missing POSITION_FRIENDLY_NAMES and POSITION_RECOMMENDATIONS exports.
export const POSITION_FRIENDLY_NAMES: Record<SponsorshipPosition, { name: string }> = INITIAL_AD_SLOTS.reduce((acc, slot) => {
  acc[slot.id] = { name: slot.name };
  return acc;
}, {} as Record<SponsorshipPosition, { name: string }>);

export const POSITION_RECOMMENDATIONS: Record<SponsorshipPosition, string> = INITIAL_AD_SLOTS.reduce((acc, slot) => {
  acc[slot.id] = `${slot.width}x${slot.height}`;
  return acc;
}, {} as Record<SponsorshipPosition, string>);


export interface Sponsorship {
  id: string;
  name: string; // Nombre de la campaña, ej: "Campaña Verano 2024"
  imageUrl: string;
  link: string;
  position: SponsorshipPosition;
  active: boolean;
  brandId: string; // Vinculado a una Marca
  type: SponsorshipType; // Exclusivo o Rotativo
  description?: string;
  // Métricas de rendimiento
  impressions: number;
  clicks: number;
}

export enum ViewMode {
  HOME = 'home',
  ARTICLE = 'article',
  ADMIN = 'admin',
  LANDING = 'landing'
}

export interface UserRegistration {
  name: string;
  email: string;
  interest: string;
}

// --- NUEVOS TIPOS PARA USUARIOS Y ROLES ---
export interface Role {
  id: string;
  name: string;
  permissions: string[];
  isSystemRole?: boolean;
}

export interface UserAlert {
  id: string;
  message: string;
  seen: boolean;
  seenAt?: string;
  createdAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string; // Se usará para la simulación de login
  roleId: string;
  avatar?: string;
  registrationDate?: string;
  // Perfil de autor público (para roles de Editor/Admin)
  publicRole?: string; // Ej: Periodista Senior, Columnista
  bio?: string;
  twitter?: string;
  instagram?: string;
  managedSocialAccountIds?: string[];
  alertMessages?: UserAlert[];
  lastConnection?: string;
  isOnline?: boolean;
  currentSection?: string; // Tracks the current section the user is viewing
  totalActiveTime?: number; // Total active time in seconds
  dailyActiveTime?: Record<string, number>; // Active time per day (YYYY-MM-DD) in seconds
}

// --- NUEVOS TIPOS PARA GESTIÓN DE TIEMPO Y TAREAS ---
export interface WorkLog {
  id: string;
  userId: string;
  date: string;
  detail: string;
  account: string;
  hours: number;
  createdAt: string;
  taskId?: string | null; // Link to a specific task
}

export type TaskStatus = 'pending' | 'in_progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedUserIds: string[];
  status: TaskStatus;
  createdBy: string; // Admin User ID
  createdAt: string;
  viewedByUserIds?: string[];
  
  // Unified fields
  date: string;
  account: string;
  hours: number;

  // New fields
  notes: { userId: string; text: string; timestamp: string }[];
  history: { userId: string; action: string; timestamp: string }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // Puede ser un User ID o 'admin_group'
  text: string;
  timestamp: string;
  isRead: boolean;
}

// --- TIPOS PARA GESTIÓN DE CUENTAS SOCIALES ---
export type SocialPlatform = 'instagram' | 'twitter' | 'facebook';

export interface SocialAccount {
  id: string;
  name: string;
  handle: string;
  platform: SocialPlatform;
  profileImageUrl: string;
  instagramId?: string;
  facebookId?: string;
  placidId?: string;
  primaryColor?: string;
  secondaryColor?: string;
  systemPrompt?: string;
  copyPrompt?: string;
}


// --- NUEVO TIPO PARA PUBLICACIONES SOCIALES GUARDADAS ---
export interface SocialPost {
  id: string;
  originalArticleId: string;
  originalArticleTitle: string;
  postedAt: string;
  postedBy: string; // User ID
  imageUrl: string;
  imageUrls?: string[]; // Soporte para carrusel
  videoUrl?: string; // Nuevo campo para video
  postType?: 'post' | 'carousel' | 'reel'; // Tipo de posteo
  originalImageUrl?: string; // Imagen original cargada por el usuario
  originalImageUrls?: string[]; // Imágenes originales para carrusel
  titleOverlay: string;
  copy: string;
  postedToAccounts: string[]; // Array de SocialAccount IDs
  instagramId?: string;
  facebookId?: string;
  placidId?: string;
  imageCount?: number;
  associatedSponsors: string[]; // Array de Brand IDs
  status: 'success' | 'failed' | 'draft' | 'scheduled';
  scheduledAt?: string; // ISO string para la fecha/hora programada
  sources?: Source[]; // Fuentes utilizadas por la IA
}


// --- NUEVO TIPO PARA TAREAS ASÍNCRONAS DE IA ---
export interface Source {
  uri: string;
  title: string;
}

// FIX: Add 'analyzing' to GenerationStatus to reflect a more detailed generation process.
export type GenerationStatus = 'researching' | 'analyzing' | 'drafting' | 'completed' | 'failed';

export interface GenerationTask {
  id: string;
  userId: string;
  prompt: string;
  status: GenerationStatus;
  controller?: AbortController;
  researchData?: Source[];
  result?: {
    title: string;
    excerpt: string;
    category: Category;
    imageUrl?: string;
    blocks: ContentBlock[];
    sources?: Source[];
  };
  error?: string;
}

export interface SocialGenerationTask {
  id: string;
  userId: string;
  prompt: string;
  status: GenerationStatus;
  controller?: AbortController;
  accountId?: string;
  result?: {
    shortTitle: string;
    copy: string;
    imageUrl?: string;
    sources?: Source[];
  };
  error?: string;
}
