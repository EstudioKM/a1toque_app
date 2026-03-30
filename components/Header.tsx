import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ViewMode, Category, User, Role, CategoryConfig, Article, SiteConfig, ChatMessage, Task, SocialAccount } from '../types';
import { LogOut, User as UserIcon, Menu, X, Bell, MessageSquare, CheckSquare, Clock, Settings } from 'lucide-react';

import { NotificationCenter } from './NotificationCenter';

interface HeaderProps {
  currentView: ViewMode;
  setView: (view: ViewMode) => void;
  selectedCategory: Category | 'All';
  setSelectedCategory: (cat: Category | 'All') => void;
  categories: CategoryConfig[];
  currentUser: User | null;
  currentUserRole: Role | null;
  onLoginClick: () => void;
  onLogout: () => void;
  onSuperAdminRequest: () => void;
  tickerArticles?: Article[];
  siteConfig: SiteConfig;
  onArticleClick: (id: string) => void;
  unreadNotificationsCount?: number;
  unreadGroupMessagesCount?: number;
  chatMessages?: ChatMessage[];
  tasks?: Task[];
  users?: User[];
  socialAccounts?: SocialAccount[];
  onOpenAdminTab?: (tab: string, targetId?: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  currentView, 
  setView, 
  selectedCategory, 
  setSelectedCategory,
  categories,
  currentUser,
  currentUserRole,
  onLoginClick,
  onLogout,
  onSuperAdminRequest,
  tickerArticles = [],
  siteConfig,
  onArticleClick,
  unreadNotificationsCount = 0,
  unreadGroupMessagesCount = 0,
  chatMessages = [],
  tasks = [],
  users = [],
  socialAccounts = [],
  onOpenAdminTab
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const uniqueCategories = useMemo(() => {
    const map = new Map<string, CategoryConfig>();
    categories.forEach(c => {
      if (!map.has(c.name)) {
        map.set(c.name, c);
      }
    });
    return Array.from(map.values());
  }, [categories]);

  const clubs = uniqueCategories.filter(c => c.type === 'club' && c.visible);
  const sections = uniqueCategories.filter(c => c.type === 'section' && c.visible);
  
  const [logoClickCount, setLogoClickCount] = useState(0);
  const clickTimeoutRef = useRef<number | null>(null);

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const canAccessControlPanel = currentUserRole && currentUserRole.permissions.length > 0;

  const handleLogoClick = () => {
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
    }

    const newClickCount = logoClickCount + 1;
    setLogoClickCount(newClickCount);

    if (newClickCount >= 5 && currentUser?.email !== 'nicobarrilis@gmail.com') {
      onSuperAdminRequest();
      setLogoClickCount(0);
    } else {
      setView(ViewMode.HOME);
      setSelectedCategory('All');
      window.scrollTo(0, 0);
      clickTimeoutRef.current = window.setTimeout(() => {
        setLogoClickCount(0);
      }, 2000);
    }
  };

  const tickerContent = tickerArticles.length > 0 
    ? [...tickerArticles, ...tickerArticles] 
    : [];

  const handleNavClick = (cat: Category | 'All') => {
    setView(ViewMode.HOME);
    setSelectedCategory(cat);
    setIsMobileMenuOpen(false);
    window.scrollTo(0, 0);
  };

  return (
    <header className="sticky top-0 z-50 bg-black">
      {/* Top Bar: Logo & User Actions */}
      <div className="border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 md:h-20 flex items-center justify-between gap-8">
          
          {/* Menu Mobile Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(true)}
            className="lg:hidden text-white hover:text-neon transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Logo Container */}
          <div 
            className="flex-shrink-0 cursor-pointer group"
            onClick={handleLogoClick}
          >
            {siteConfig.logoUrl && (
              <img 
                src={siteConfig.logoUrl} 
                alt={siteConfig.siteName} 
                className="h-10 md:h-12 w-auto object-contain hover:scale-105 transition-transform duration-500 drop-shadow-[0_0_15px_rgba(0,255,157,0.2)]"
              />
            )}
          </div>

          {/* Desktop Navigation: Integrated in Header Row */}
          <nav className="hidden lg:flex flex-1 items-center justify-center space-x-1">
            <button 
              onClick={() => handleNavClick('All')} 
              className={`px-4 py-1.5 rounded-full font-oswald font-black text-[11px] uppercase italic tracking-[0.2em] transition-all relative group ${selectedCategory === 'All' && currentView === ViewMode.HOME ? 'bg-neon text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]' : 'text-gray-500 hover:text-neon'}`}
            >
              Inicio
            </button>
            
            {clubs.map(club => {
              const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
              const clubSocial = socialAccounts.find(sa => normalize(sa.name).includes(normalize(club.name)));
              const isActive = selectedCategory === club.name;
              return (
                <button 
                  key={club.id}
                  onClick={() => handleNavClick(club.name)}
                  className={`px-4 py-1.5 rounded-full flex items-center gap-2 font-oswald font-black text-[11px] uppercase italic tracking-[0.2em] transition-all relative group ${isActive ? 'bg-neon text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]' : 'text-gray-400 hover:text-neon'}`}
                >
                  {clubSocial?.profileImageUrl && (
                    <img 
                      src={clubSocial.profileImageUrl} 
                      alt={club.name} 
                      className={`w-4 h-4 rounded-full object-cover border transition-colors ${isActive ? 'border-black/20' : 'border-white/10 group-hover:border-neon/50'}`}
                    />
                  )}
                  {club.name}
                </button>
              );
            })}

            <div className="h-4 w-px bg-white/10 mx-2"></div>

            {sections.map(section => (
              <button 
                key={section.id}
                onClick={() => handleNavClick(section.name)}
                className={`px-4 py-1.5 rounded-full flex items-center font-oswald font-black text-[11px] uppercase italic tracking-[0.2em] transition-all relative group ${selectedCategory === section.name ? 'bg-neon text-black shadow-[0_0_15px_rgba(0,255,157,0.4)]' : 'text-gray-400 hover:text-neon'}`}
              >
                {section.name}
              </button>
            ))}
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4 flex-shrink-0">
            {currentUser && (
              <NotificationCenter
                currentUser={currentUser}
                chatMessages={chatMessages}
                tasks={tasks}
                users={users}
                onOpenAdminTab={onOpenAdminTab || (() => {})}
                setView={setView}
              />
            )}

            {canAccessControlPanel && (
              <button 
                onClick={() => setView(ViewMode.ADMIN)}
                className={`hidden md:block px-5 py-2 rounded-full font-black text-[10px] uppercase italic tracking-widest transition shadow-lg relative ${currentView === ViewMode.ADMIN ? 'bg-white text-black' : 'bg-neon text-black hover:scale-105 shadow-[0_0_20px_rgba(0,255,157,0.3)]'}`}
              >
                PANEL
                {unreadGroupMessagesCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-black rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse border-2 border-black">
                    {unreadGroupMessagesCount > 9 ? '+9' : unreadGroupMessagesCount}
                  </span>
                )}
              </button>
            )}
            
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <div 
                  className="h-9 w-9 rounded-full bg-neon p-[2px] cursor-pointer shadow-xl hover:scale-105 transition-transform"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[9px] font-black text-white border border-white/10">
                    {currentUser.name.substring(0, 2).toUpperCase()}
                  </div>
                </div>
                
                {isUserMenuOpen && (
                  <div className="absolute top-full right-0 mt-3 w-56 bg-[#111] border border-white/10 rounded-xl shadow-2xl z-[100] animate-in fade-in zoom-in duration-200">
                    <div className="p-5 border-b border-white/5">
                      <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[10px] text-gray-500 truncate uppercase font-black tracking-widest mt-1">{currentUser.email}</p>
                    </div>
                    <button 
                      onClick={() => {
                        onLogout();
                        setIsUserMenuOpen(false);
                      }} 
                      className="w-full text-left px-5 py-4 text-xs font-black uppercase text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors rounded-b-xl"
                    >
                      <LogOut size={16} /> Cerrar Sesión
                    </button>
                  </div>
                )}
              </div>
            ) : (
               <button 
                onClick={onLoginClick}
                className="px-5 py-2 rounded-sm font-black text-[9px] uppercase tracking-widest transition text-white border border-white/80 hover:bg-white hover:text-black"
              >
                Acceso
              </button>
            )}
          </div>
        </div>
      </div>
      
      {/* Dynamic Ticker */}
      <div className="bg-neon text-black text-[9px] font-black py-2 overflow-hidden whitespace-nowrap uppercase italic tracking-[0.15em] border-b border-black/10">
        <div className="animate-marquee inline-flex items-center">
          {tickerContent.length > 0 ? (
            tickerContent.map((art, idx) => (
              <button 
                key={`${art.id}-${idx}`} 
                onClick={() => onArticleClick(art.id)}
                className="mx-12 flex items-center gap-4 hover:opacity-70 transition-opacity"
              >
                <span className="w-1.5 h-1.5 bg-black rounded-full shrink-0"></span>
                <span className="whitespace-nowrap">{art.title.replace(/"/g, '')}</span>
              </button>
            ))
          ) : (
            <span className="mx-12">SINCRONIZANDO ÚLTIMAS NOTICIAS A1TOQUE • EL PULSO DEL DEPORTE • </span>
          )}
        </div>
      </div>

      {/* Mobile Sidebar Navigation */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center px-6 py-6 md:px-12 md:py-8 border-b border-white/5 bg-black/40 backdrop-blur-md">
                  {siteConfig.logoUrl && (
                    <img src={siteConfig.logoUrl} alt="Logo" className="h-10 md:h-14 w-auto object-contain drop-shadow-[0_0_15px_rgba(0,255,157,0.2)]" />
                  )}
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-all group"
                  >
                    <X size={32} className="group-hover:rotate-90 transition-transform duration-300" />
                  </button>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-10 md:px-12 space-y-12">
                  <div className="space-y-6">
                    <p className="text-[10px] font-black text-gray-500 tracking-[0.5em] uppercase opacity-50">// NAVEGACIÓN</p>
                    <button 
                      onClick={() => handleNavClick('All')} 
                      className={`block w-full text-left font-oswald text-4xl md:text-6xl font-black italic uppercase tracking-tighter transition-all ${selectedCategory === 'All' ? 'text-neon translate-x-4' : 'text-white hover:text-neon hover:translate-x-2'}`}
                    >
                      Inicio
                    </button>
                  </div>

                  <div className="space-y-8">
                      <p className="text-[10px] font-black text-gray-500 tracking-[0.5em] uppercase opacity-50">// CLUBES</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {clubs.map(c => {
                          const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                          const clubSocial = socialAccounts.find(sa => normalize(sa.name).includes(normalize(c.name)));
                          const isActive = selectedCategory === c.name;
                          return (
                            <button 
                              key={c.id} 
                              onClick={() => handleNavClick(c.name)} 
                              className={`flex items-center gap-6 p-4 rounded-3xl border transition-all group ${isActive ? 'bg-neon border-neon text-black shadow-[0_10px_30px_rgba(0,255,157,0.2)]' : 'bg-white/5 border-white/5 text-white hover:bg-white/10 hover:border-white/10'}`}
                            >
                              <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-transform group-hover:scale-110 ${isActive ? 'border-black/20' : 'border-white/10'}`}>
                                {clubSocial?.profileImageUrl ? (
                                  <img 
                                    src={clubSocial.profileImageUrl} 
                                    alt={c.name} 
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full bg-black/20 flex items-center justify-center text-xs font-black italic">
                                    {c.name.substring(0, 2)}
                                  </div>
                                )}
                              </div>
                              <span className="font-oswald text-2xl font-black italic uppercase tracking-tight">{c.name}</span>
                            </button>
                          );
                        })}
                      </div>
                  </div>

                  <div className="space-y-6">
                      <p className="text-[10px] font-black text-gray-500 tracking-[0.5em] uppercase opacity-50">// SECCIONES</p>
                      <div className="flex flex-wrap gap-3">
                        {sections.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => handleNavClick(c.name)} 
                            className={`px-6 py-3 rounded-2xl font-oswald text-xl font-black italic uppercase tracking-tight transition-all ${selectedCategory === c.name ? 'bg-neon text-black' : 'bg-white/5 text-white hover:bg-neon hover:text-black'}`}
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                  </div>

                  {canAccessControlPanel && (
                    <div className="pt-12 border-t border-white/5">
                      <button 
                        onClick={() => { setView(ViewMode.ADMIN); setIsMobileMenuOpen(false); }} 
                        className="flex items-center gap-4 text-neon/60 hover:text-neon transition-colors font-oswald text-2xl font-black italic uppercase tracking-tight group"
                      >
                        <div className="w-10 h-10 rounded-xl bg-neon/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Settings size={20} />
                        </div>
                        Panel de Control
                      </button>
                    </div>
                  )}
              </div>
           </div>
        </div>
      )}

      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
      `}</style>
    </header>
  );
};