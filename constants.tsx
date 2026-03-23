import { Article, Sponsorship, User, Brand, SponsorshipType, SocialAccount, CategoryConfig, Role } from './types';

export const DEFAULT_AI_PROMPT = `Actúa como un periodista deportivo de élite de Santa Fe o Rosario para la plataforma A1TOQUE. Escribe una noticia moderna y emocionante.
Si la noticia es de Unión, Colón, Central o Newell's, refléjalo en el tono.
Tu estilo debe ser directo, dinámico y atractivo para una audiencia joven. Utiliza frases cortas y potentes.
CRÍTICO: Debes escribir el texto de forma natural, con espacios en blanco separando cada palabra. NUNCA escribas palabras pegadas (ejemplo incorrecto: "Elpróximo27demarzo").
Estructura el contenido con subtítulos (headings) y párrafos (text).
Genera una palabra clave corta en inglés para buscar una imagen relacionada en Unsplash.
Tu respuesta debe ser un único objeto JSON válido, sin texto adicional fuera de él.`;

export const DEFAULT_SOCIAL_COPY_PROMPT = `Crea un texto completo para la descripción del post (ej. Instagram) de A1TOQUE. Este debe tener un gancho fuerte, desarrollar la idea, incluir 2-4 emojis, una llamada a la acción (pregunta) y 3-5 hashtags relevantes (#A1Toque siempre primero).`;

export const INITIAL_CATEGORIES: CategoryConfig[] = [
  { id: 'union', name: 'Unión', type: 'club', visible: true, order: 0 },
  { id: 'colon', name: 'Colón', type: 'club', visible: true, order: 1 },
  { id: 'central', name: 'Central', type: 'club', visible: true, order: 2 },
  { id: 'newells', name: 'Newell\'s', type: 'club', visible: true, order: 3 },
  { id: 'noticias', name: 'Noticias', type: 'section', visible: true, order: 4 },
  { id: 'virales', name: 'Virales', type: 'section', visible: true, order: 5 },
  { id: 'programas', name: 'Programas', type: 'section', visible: true, order: 6 },
  { id: 'femenino', name: 'Fútbol Femenino', type: 'section', visible: true, order: 7 },
  { id: 'entrevistas', name: 'Entrevistas', type: 'section', visible: true, order: 8 },
];

export const PERMISSION_DEFINITIONS = [
    { id: 'home', label: 'Inicio' },
    { id: 'news', label: 'Gestión de Noticias' },
    { id: 'social', label: 'Gestión de Redes Sociales' },
    { id: 'research', label: 'Investigación con IA' },
    { id: 'ads', label: 'Gestión de Publicidad' },
    { id: 'metrics', label: 'Visualización de Métricas' },
    { id: 'users', label: 'Gestión de Usuarios' },
    { id: 'config', label: 'Configuración del Sitio' },
    { id: 'permissions', label: 'Gestión de Permisos' },
    { id: 'tasks', label: 'Mi Trabajo' },
    { id: 'admin_tasks', label: 'Gestión de Tareas (Admin)' },
    { id: 'chat', label: 'Chat Interno' },
];

export const INITIAL_ROLES: Role[] = [
    { id: 'admin', name: 'Administrator', permissions: PERMISSION_DEFINITIONS.map(p => p.id), isSystemRole: true },
    { id: 'editor', name: 'Editor', permissions: ['home', 'news', 'social', 'research', 'metrics', 'tasks', 'chat'], isSystemRole: true },
    { id: 'cm', name: 'Community Manager', permissions: ['home', 'social', 'metrics', 'tasks', 'chat'], isSystemRole: true },
    { id: 'user', name: 'End User', permissions: ['home', 'tasks', 'chat'], isSystemRole: true },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'admin01',
    name: 'Admin General',
    email: 'admin@a1toque.com',
    password: 'admin',
    roleId: 'admin',
    avatar: 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?auto=format&fit=crop&q=80&w=200',
    registrationDate: '2023-01-15'
  },
  {
    id: 'admin03',
    name: 'Nico Barrilis',
    email: 'nicobarrilis@gmail.com',
    password: 'adminpass',
    roleId: 'admin',
    avatar: 'https://images.unsplash.com/photo-1531123414780-f74242c2b052?auto=format&fit=crop&q=80&w=200',
    registrationDate: '2023-02-01',
    publicRole: 'Columnista Invitado',
    bio: 'Analista senior del fútbol argentino. Opinión calificada y sin cassette sobre Rosario Central y Newell\'s.',
    twitter: '@a1toque'
  },
  {
    id: 'editor01',
    name: 'Fede Domínguez',
    email: 'editor@a1toque.com',
    password: 'editor',
    roleId: 'editor',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    registrationDate: '2023-03-20',
    publicRole: 'Cronista Sabalero',
    bio: 'Periodista deportivo apasionado por la táctica y la estrategia. Siguiendo la campaña de Colón desde hace 10 años.',
    twitter: '@feded',
    managedSocialAccountIds: ['sa2']
  },
  {
    id: 'redaccion01',
    name: 'Redacción A1Toque',
    email: 'redaccion@a1toque.com',
    password: 'redaccion',
    roleId: 'editor',
    avatar: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=200',
    registrationDate: '2023-01-01',
    publicRole: 'Equipo Editorial',
    bio: 'El equipo de periodistas especializados de A1Toque, cubriendo la actualidad deportiva de Santa Fe y la región minuto a minuto.',
    twitter: '@a1toque',
    instagram: '@a1toque'
  },
  {
    id: 'cm01',
    name: 'Community Manager',
    email: 'cm@a1toque.com',
    password: 'cm',
    roleId: 'cm',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    registrationDate: '2023-04-05',
    managedSocialAccountIds: ['sa1', 'sa2', 'sa3', 'sa4', 'sa5']
  },
  {
    id: 'user01',
    name: 'Juan Perez',
    email: 'user@a1toque.com',
    password: 'user',
    roleId: 'user',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    registrationDate: '2024-05-20'
  },
  {
    id: 'admin_km',
    name: 'Estudio KM',
    email: 'holaestudiokm@gmail.com',
    password: 'admin',
    roleId: 'admin',
    avatar: 'https://ui-avatars.com/api/?name=Estudio+KM&background=00ff9d&color=000&bold=true',
    registrationDate: '2024-03-10'
  }
];


export const INITIAL_BRANDS: Brand[] = [
  { id: 'quini6', name: 'Quini 6', logoUrl: 'https://seeklogo.com/images/Q/quini-6-logo-1526E350E3-seeklogo.com.png', socialHandle: '@quini6oficial' },
  { id: 'loteria', name: 'Lotería de Santa Fe', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Loter%C3%ADa_de_Santa_Fe_logo.svg/2048px-Loter%C3%ADa_de_Santa_Fe_logo.svg.png', socialHandle: '@loteriasantafe' },
  { id: 'nike', name: 'Nike', logoUrl: 'https://static.vecteezy.com/system/resources/previews/010/994/232/non_2x/nike-logo-black-with-name-brand-symbol-with-name-clothes-design-icon-abstract-football-illustration-with-black-background-free-vector.jpg', socialHandle: '@nike' },
  { id: 'gatorade', name: 'Gatorade', logoUrl: 'https://seeklogo.com/images/G/gatorade-logo-132DE5A222-seeklogo.com.png', socialHandle: '@gatorade' }
];

export const INITIAL_SOCIAL_ACCOUNTS: SocialAccount[] = [
    { 
        id: 'sa-1', 
        name: 'A1Toque Oficial', 
        handle: '@a1toque_oficial', 
        platform: 'instagram', 
        profileImageUrl: 'https://ui-avatars.com/api/?name=A1&background=222&color=00ff9d&bold=true',
        instagramId: '',
        facebookId: '',
        placidId: '',
        systemPrompt: 'Eres la voz oficial de A1Toque. Tu tono es profesional, informativo y emocionante. Te enfocas en las noticias más importantes del deporte santafesino.',
        copyPrompt: 'Escribe un copy que resuma la noticia de forma impactante. Usa emojis deportivos y termina con una pregunta para fomentar la interacción. #A1Toque'
    },
    { 
        id: 'sa-2', 
        name: 'Colón A1Toque', 
        handle: '@colona1toque', 
        platform: 'twitter', 
        profileImageUrl: 'https://ui-avatars.com/api/?name=C&background=b91c1c&color=fff&bold=true',
        instagramId: '',
        facebookId: '',
        placidId: '',
        systemPrompt: 'Eres un fanático e informador especializado en Colón de Santa Fe. Tu tono es apasionado, cercano al hincha sabalero y muy dinámico.',
        copyPrompt: 'Crea un tweet corto y al pie. Usa hashtags como #Colon #Sabalero y emojis rojos y negros.'
    },
    { 
        id: 'sa-3', 
        name: 'Unión A1Toque', 
        handle: '@uniona1toque', 
        platform: 'twitter', 
        profileImageUrl: 'https://ui-avatars.com/api/?name=U&background=ef4444&color=fff&bold=true',
        instagramId: '',
        facebookId: '',
        placidId: '',
        systemPrompt: 'Eres un informador especializado en Unión de Santa Fe. Tu tono es enérgico, fiel al sentimiento tatengue y siempre al día con la actualidad del club.',
        copyPrompt: 'Crea un tweet con la última info del Tate. Usa #Union #Tatengue y emojis rojos y blancos.'
    },
    { 
        id: 'sa-4', 
        name: 'Central A1Toque', 
        handle: '@centrala1toque', 
        platform: 'instagram', 
        profileImageUrl: 'https://ui-avatars.com/api/?name=C&background=fbbf24&color=000&bold=true',
        instagramId: '',
        facebookId: '',
        placidId: '',
        systemPrompt: 'Eres la voz de A1Toque para Rosario Central. Tu tono es canalla, vibrante y muy enfocado en la pasión de Arroyito.',
        copyPrompt: 'Escribe un copy para Instagram que destaque la mística de Central. Usa emojis amarillos y azules y hashtags como #RosarioCentral #Canalla.'
    },
    { 
        id: 'sa-5', 
        name: 'Newell\'s A1Toque', 
        handle: '@newellsa1toque', 
        platform: 'instagram', 
        profileImageUrl: 'https://ui-avatars.com/api/?name=N&background=991b1b&color=fff&bold=true',
        instagramId: '',
        facebookId: '',
        placidId: '',
        systemPrompt: 'Eres la voz de A1Toque para Newell\'s Old Boys. Tu tono es leproso, orgulloso de la cantera y siempre conectado con el sentimiento del Parque.',
        copyPrompt: 'Escribe un copy para Instagram que celebre el orgullo de Newell\'s. Usa emojis rojos y negros y hashtags como #Newells #LaLepra.'
    },
];

export const INITIAL_SPONSORSHIPS: Sponsorship[] = [
  {
    id: 'placeholder-popup', name: 'Placeholder - Home Popup', brandId: 'gatorade', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/800x600/00ff9d/000000?text=HOME_POPUP+(800x600)',
    link: '#', position: 'HOME_POPUP', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-home1', name: 'Placeholder - Home Nivel 1', brandId: 'nike', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/1140x250/00ff9d/000000?text=HOME_LVL_1+(1140x250)',
    link: '#', position: 'HOME_LVL_1', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-home2', name: 'Placeholder - Home Nivel 2', brandId: 'quini6', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/728x300/00ff9d/000000?text=HOME_LVL_2+(728x300)',
    link: '#', position: 'HOME_LVL_2', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-home3', name: 'Placeholder - Home Nivel 3 (Lateral)', brandId: 'loteria', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/300x600/00ff9d/000000?text=HOME_LVL_3+(300x600)',
    link: '#', position: 'HOME_LVL_3', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-news-top', name: 'Placeholder - Noticias Cabecera', brandId: 'gatorade', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/970x250/00ff9d/000000?text=NEWS_TOP_LVL_1+(970x250)',
    link: '#', position: 'NEWS_TOP_LVL_1', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-news-side1', name: 'Placeholder - Noticias Lateral Vertical', brandId: 'nike', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/300x600/00ff9d/000000?text=NEWS_SIDE_LVL_1+(300x600)',
    link: '#', position: 'NEWS_SIDE_LVL_1', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-news-side2', name: 'Placeholder - Noticias Lateral Cuadrado', brandId: 'quini6', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/300x250/00ff9d/000000?text=NEWS_SIDE_LVL_2+(300x250)',
    link: '#', position: 'NEWS_SIDE_LVL_2', active: true, impressions: 0, clicks: 0
  },
  {
    id: 'placeholder-landing', name: 'Placeholder - Landing Page', brandId: 'loteria', type: SponsorshipType.EXCLUSIVE,
    imageUrl: 'https://placehold.co/1280x300/00ff9d/000000?text=LANDING_PAGE+(1280x300)',
    link: '#', position: 'LANDING_PAGE', active: true, impressions: 0, clicks: 0
  }
];