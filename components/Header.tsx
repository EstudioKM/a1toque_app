import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ViewMode, Category, User, Role, CategoryConfig, Article, SiteConfig, ChatMessage, Task, SocialAccount } from '../types';
import { LogOut, User as UserIcon, Menu, X as CloseIcon, Bell, MessageSquare, CheckSquare, Clock } from 'lucide-react';

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
  const clubs = categories.filter(c => c.type === 'club' && c.visible);
  const sections = categories.filter(c => c.type === 'section' && c.visible);
  
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
              className={`px-3 h-full flex items-center font-oswald font-black text-[11px] uppercase italic tracking-[0.2em] transition-all relative group ${selectedCategory === 'All' && currentView === ViewMode.HOME ? 'text-neon' : 'text-gray-500 hover:text-neon'}`}
            >
              Inicio
              <span className={`absolute -bottom-2 left-0 h-0.5 bg-neon transition-all ${selectedCategory === 'All' && currentView === ViewMode.HOME ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
            </button>
            
            {clubs.map(club => {
              const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
              const clubSocial = socialAccounts.find(sa => normalize(sa.name).includes(normalize(club.name)));
              return (
                <button 
                  key={club.id}
                  onClick={() => handleNavClick(club.name)}
                  className={`px-3 h-full flex items-center gap-2 font-oswald font-black text-[11px] uppercase italic tracking-[0.2em] transition-all relative group ${selectedCategory === club.name ? 'text-neon' : 'text-gray-500 hover:text-neon'}`}
                >
                  {clubSocial?.profileImageUrl && (
                    <img 
                      src={clubSocial.profileImageUrl} 
                      alt={club.name} 
                      className="w-4 h-4 rounded-full object-cover border border-white/10 group-hover:border-neon/50 transition-colors"
                    />
                  )}
                  {club.name}
                  <span className={`absolute -bottom-2 left-0 h-0.5 bg-neon transition-all ${selectedCategory === club.name ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
                </button>
              );
            })}

            <div className="h-4 w-px bg-white/10 mx-2"></div>

            {sections.map(section => (
              <button 
                key={section.id}
                onClick={() => handleNavClick(section.name)}
                className={`px-3 h-full flex items-center font-oswald font-black text-[11px] uppercase italic tracking-[0.2em] transition-all relative group ${selectedCategory === section.name ? 'text-neon' : 'text-gray-500 hover:text-neon'}`}
              >
                {section.name}
                <span className={`absolute -bottom-2 left-0 h-0.5 bg-neon transition-all ${selectedCategory === section.name ? 'w-full' : 'w-0 group-hover:w-full'}`}></span>
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
                className={`hidden md:block px-4 py-2 rounded-sm font-black text-[10px] uppercase italic tracking-widest transition shadow-lg ${currentView === ViewMode.ADMIN ? 'bg-white text-black' : 'bg-neon/10 text-neon border border-neon/30 hover:bg-neon hover:text-black'}`}
              >
                PANEL
              </button>
            )}
            
            {currentUser ? (
              <div className="relative" ref={userMenuRef}>
                <div 
                  className="h-9 w-9 rounded-full bg-gradient-to-tr from-neon to-blue-400 p-[2px] cursor-pointer shadow-xl hover:scale-105 transition-transform"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <div className="w-full h-full rounded-full bg-black flex items-center justify-center text-[9px] font-black text-white">
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
        <div className="fixed inset-0 z-[100] bg-black/95 animate-in fade-in duration-300">
           <div className="flex flex-col h-full">
              <div className="flex justify-between items-center p-8 border-b border-white/10">
                  {siteConfig.logoUrl && (
                    <img src={siteConfig.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
                  )}
                  <button onClick={() => setIsMobileMenuOpen(false)} className="text-white hover:text-neon transition-colors">
                    <CloseIcon size={32} />
                  </button>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-8 font-oswald text-3xl font-black italic uppercase text-white">
                  <button onClick={() => handleNavClick('All')} className={`block w-full text-left ${selectedCategory === 'All' ? 'text-neon' : ''}`}>Inicio</button>
                  <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase mb-4">// CLUBES</p>
                      {clubs.map(c => {
                        const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
                        const clubSocial = socialAccounts.find(sa => normalize(sa.name).includes(normalize(c.name)));
                        return (
                          <button 
                            key={c.id} 
                            onClick={() => handleNavClick(c.name)} 
                            className={`flex items-center gap-4 w-full text-left ${selectedCategory === c.name ? 'text-neon' : ''}`}
                          >
                            {clubSocial?.profileImageUrl && (
                              <img 
                                src={clubSocial.profileImageUrl} 
                                alt={c.name} 
                                className="w-8 h-8 rounded-full object-cover border border-white/10"
                              />
                            )}
                            {c.name}
                          </button>
                        );
                      })}
                  </div>
                  <div className="space-y-4">
                      <p className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase mb-4">// SECCIONES</p>
                      {sections.map(c => (
                        <button key={c.id} onClick={() => handleNavClick(c.name)} className={`block w-full text-left ${selectedCategory === c.name ? 'text-neon' : ''}`}>{c.name}</button>
                      ))}
                  </div>
                  {canAccessControlPanel && (
                    <button onClick={() => { setView(ViewMode.ADMIN); setIsMobileMenuOpen(false); }} className="block w-full text-left text-neon/60 border-t border-white/10 pt-8">Panel de Control</button>
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