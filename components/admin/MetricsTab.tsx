import React, { useState, useMemo, useEffect } from 'react';
import { Article, Sponsorship, User, SocialPost, Brand, SocialAccount, AdSlotConfig } from '../../types';
import { formatArgentinaTimestamp, parseArgentinaDate } from '../../services/dateUtils';
import { Newspaper, Users, MousePointerClick, Eye, Percent, ExternalLink, Send, Star, AtSign, Calendar, Filter, RotateCcw, ShoppingBag, BarChart3 } from 'lucide-react';
import { AdsTab } from './AdsTab';

interface MetricsTabProps {
  articles: Article[];
  users: User[];
  sponsorships: Sponsorship[];
  socialPosts: SocialPost[];
  brands: Brand[];
  brandMap: Map<string, Brand>;
  socialAccountMap: Map<string, SocialAccount>;
  adSlots: AdSlotConfig[];
  onOpenDetail: (post: SocialPost) => void;
  onOpenBrandEditor: (brand?: Brand) => void;
  onOpenSponsorshipEditor: (sponsorship?: Partial<Sponsorship>) => void;
  onOpenAdSlotEditor: (slot: AdSlotConfig) => void;
  onDeleteBrand: (id: string) => void;
  onDeleteSponsorship: (id: string) => void;
  onToggleSponsorshipStatus: (id: string) => void;
}

type MetricsView = 'sponsorships' | 'posts' | 'ads';
const DATE_PRESETS = [
    { label: '7D', days: 7 },
    { label: '14D', days: 14 },
    { label: '30D', days: 30 },
    { label: '90D', days: 90 },
    { label: 'TODOS', days: null },
];

const formatDateForInput = (date: Date) => {
  return date.toISOString().split('T')[0];
};

export const MetricsTab: React.FC<MetricsTabProps> = ({ 
  articles, 
  users, 
  sponsorships,
  socialPosts,
  brands,
  brandMap,
  socialAccountMap,
  adSlots,
  onOpenDetail,
  onOpenBrandEditor,
  onOpenSponsorshipEditor,
  onOpenAdSlotEditor,
  onDeleteBrand,
  onDeleteSponsorship,
  onToggleSponsorshipStatus
}) => {
  const [view, setView] = useState<MetricsView>('posts');

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSponsor, setSelectedSponsor] = useState('all');
  const [selectedAuthor, setSelectedAuthor] = useState('all');
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [activePreset, setActivePreset] = useState<number | null>(null);

  const handleSetDatePreset = (days: number | null) => {
      if (days === null) {
          setDateRange({ start: '', end: '' });
      } else {
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(endDate.getDate() - days);
        setDateRange({ start: formatDateForInput(startDate), end: formatDateForInput(endDate) });
      }
      setActivePreset(days);
  };
  
  useEffect(() => {
    handleSetDatePreset(null); // Set default to 'TODOS'
  }, []);

  const filteredPosts = useMemo(() => {
    return socialPosts.filter(post => {
      if (!post.postedAt) return false;
      const postDate = new Date(post.postedAt);
      if (isNaN(postDate.getTime())) return false;
      
      if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          startDate.setHours(0, 0, 0, 0);
          if (postDate < startDate) return false;
      }
      if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999);
          if (postDate > endDate) return false;
      }
      if (selectedSponsor !== 'all' && !(post.associatedSponsors || []).includes(selectedSponsor)) return false;
      if (selectedAuthor !== 'all' && post.postedBy !== selectedAuthor) return false;
      if (selectedAccount !== 'all' && !(post.postedToAccounts || []).includes(selectedAccount)) return false;
      
      return true;
    });
  }, [socialPosts, dateRange, selectedSponsor, selectedAuthor, selectedAccount]);

  const dashboardMetrics = useMemo(() => {
    const totalPosts = filteredPosts.length;
    if (totalPosts === 0) return { totalPosts, mostActiveAuthor: 'N/A', mostUsedAccount: 'N/A', mostFeaturedSponsor: 'N/A' };
    
    const authorCounts = filteredPosts.reduce((acc: Record<string, number>, post) => { 
      acc[post.postedBy] = (acc[post.postedBy] || 0) + 1; 
      return acc; 
    }, {} as Record<string, number>);
    const mostActiveAuthorId = Object.keys(authorCounts).sort((a, b) => (authorCounts[b] ?? 0) - (authorCounts[a] ?? 0))[0];
    const mostActiveAuthor = users.find(u => u.id === mostActiveAuthorId)?.name || 'N/A';
    
    const accountCounts = filteredPosts.flatMap(p => p.postedToAccounts || []).reduce((acc: Record<string, number>, id) => { 
      acc[id] = (acc[id] || 0) + 1; 
      return acc; 
    }, {} as Record<string, number>);
    const mostUsedAccountId = Object.keys(accountCounts).sort((a,b) => (accountCounts[b] ?? 0) - (accountCounts[a] ?? 0))[0];
    const mostUsedAccount = socialAccountMap.get(mostUsedAccountId)?.name || 'N/A';
    
    const sponsorCounts = filteredPosts.flatMap(p => p.associatedSponsors || []).reduce((acc: Record<string, number>, id) => { 
      acc[id] = (acc[id] || 0) + 1; 
      return acc; 
    }, {} as Record<string, number>);
    const mostFeaturedSponsorId = Object.keys(sponsorCounts).sort((a,b) => (sponsorCounts[b] ?? 0) - (sponsorCounts[a] ?? 0))[0];
    const mostFeaturedSponsor = brandMap.get(mostFeaturedSponsorId)?.name || 'N/A';
    
    return { totalPosts, mostActiveAuthor, mostUsedAccount, mostFeaturedSponsor };
  }, [filteredPosts, users, socialAccountMap, brandMap]);

  const chartData = useMemo(() => {
    const countsByDay: { [key: string]: number } = {};
    filteredPosts.forEach(post => {
        if (!post.postedAt) return;
        const postDate = new Date(post.postedAt);
        if (isNaN(postDate.getTime())) return;
        const day = postDate.toISOString().split('T')[0];
        countsByDay[day] = (countsByDay[day] || 0) + 1;
    });
    const dataPoints = Object.entries(countsByDay).map(([date, count]) => ({ date, count })).sort((a, b) => parseArgentinaDate(a.date).getTime() - parseArgentinaDate(b.date).getTime());
    const maxCount = Math.max(...dataPoints.map(d => d.count), 0);
    return { dataPoints, maxCount };
  }, [filteredPosts]);
  
  const postsByAccountChartData = useMemo(() => {
    if (filteredPosts.length === 0) return [];
    
    const counts = filteredPosts.flatMap(p => p.postedToAccounts || []).reduce((acc: Record<string, number>, accountId) => {
        acc[accountId] = (acc[accountId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const totalCount = Object.values(counts).reduce((sum: number, val: number) => sum + val, 0);
    if (totalCount === 0) return [];

    return Object.entries(counts)
        .map(([accountId, count]) => {
            const account = socialAccountMap.get(accountId);
            return {
                name: account?.name || 'Desconocida',
                count: count as number,
                percentage: ((count as number) / (totalCount as number)) * 100,
            };
        })
        .sort((a, b) => b.count - a.count);
  }, [filteredPosts, socialAccountMap]);

  const postsByAuthorChartData = useMemo(() => {
    if (filteredPosts.length === 0) return [];
    
    const counts = filteredPosts.reduce((acc: Record<string, number>, post) => {
        acc[post.postedBy] = (acc[post.postedBy] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const total = filteredPosts.length;
    return Object.entries(counts)
        .map(([authorId, count]) => {
            const author = users.find(u => u.id === authorId);
            return {
                name: author?.name || 'Desconocido',
                count: count as number,
                percentage: ((count as number) / total) * 100,
            };
        })
        .sort((a, b) => b.count - a.count);
  }, [filteredPosts, users]);


  const handleResetFilters = () => {
    handleSetDatePreset(null);
    setSelectedSponsor('all');
    setSelectedAuthor('all');
    setSelectedAccount('all');
  };

  const renderSponsorshipsView = () => (
    <><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><Newspaper size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Artículos Totales</h4></div><p className="text-4xl font-black text-white">{articles.length}</p></div><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><Users size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Usuarios Registrados</h4></div><p className="text-4xl font-black text-white">{users.length}</p></div><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><MousePointerClick size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Clicks en Ads</h4></div><p className="text-4xl font-black text-neon">{sponsorships.reduce((acc, s) => acc + (s.clicks || 0), 0)}</p></div><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><Eye size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Impresiones de Ads</h4></div><p className="text-4xl font-black text-white">{sponsorships.reduce((acc, s) => acc + (s.impressions || 0), 0)}</p></div></div><div><h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Rendimiento de Campañas</h3><div className="space-y-2">{sponsorships.map(s => { const ctr = (s.impressions || 0) > 0 ? (((s.clicks || 0) / (s.impressions || 1)) * 100).toFixed(2) : '0.00'; return (<div key={s.id} className="bg-white/5 p-3 rounded-lg grid grid-cols-12 items-center gap-4 text-sm"><div className="col-span-4 flex items-center gap-3">{s.imageUrl && <img src={s.imageUrl} alt={s.name} className="w-12 h-8 object-cover rounded" />}<span className="font-bold text-white truncate">{s.name}</span></div><div className="col-span-2 text-gray-400 flex items-center gap-2"><Eye size={14} /> <span>{s.impressions || 0}</span></div><div className="col-span-2 text-gray-400 flex items-center gap-2"><MousePointerClick size={14} /> <span>{s.clicks || 0}</span></div><div className="col-span-2 text-neon font-bold flex items-center gap-2"><Percent size={14} /> <span>{ctr}% CTR</span></div><div className="col-span-2 text-right"><a href={s.link} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">Ver Ad <ExternalLink size={12} className="inline" /></a></div></div>)})}</div></div></>
  );
  
  const NoDataMessage = () => <div className="w-full h-full flex items-center justify-center text-center text-gray-500 text-sm font-bold">No hay datos<br/>para el período seleccionado.</div>;

  const renderPostsView = () => (
    <><div className="bg-white/5 p-4 rounded-xl border border-white/10 mb-8 flex flex-wrap items-center gap-4"><div className="flex items-center gap-2 text-sm text-gray-400 font-bold"><Calendar size={16}/><span>Rango:</span></div><div className="flex items-center bg-black/50 border border-white/10 rounded-lg p-1">{DATE_PRESETS.map(p => (<button key={p.label} onClick={() => handleSetDatePreset(p.days)} className={`px-3 py-1 text-[10px] font-black uppercase rounded-md transition ${activePreset === p.days ? 'bg-neon text-black' : 'text-gray-400 hover:bg-white/10'}`}>{p.label}</button>))}</div><input type="date" value={dateRange.start} onChange={e => { setDateRange(p => ({...p, start: e.target.value})); setActivePreset(null); }} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white"/><input type="date" value={dateRange.end} onChange={e => { setDateRange(p => ({...p, end: e.target.value})); setActivePreset(null); }} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white"/><div className="h-6 w-px bg-white/10 mx-2"></div><div className="flex items-center gap-2 text-sm text-gray-400 font-bold"><Filter size={16}/><span>Filtros:</span></div><select value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white"><option value="all">Todas las Cuentas</option>{Array.from(socialAccountMap.values()).map((acc: SocialAccount) => <option key={acc.id} value={acc.id}>{acc.name}</option>)}</select><select value={selectedSponsor} onChange={e => setSelectedSponsor(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white"><option value="all">Todos los Sponsors</option>{brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}</select><select value={selectedAuthor} onChange={e => setSelectedAuthor(e.target.value)} className="bg-black border border-white/10 rounded-lg p-2 text-xs text-white"><option value="all">Todos los Autores</option>{users.filter(u => ['admin', 'editor', 'cm'].includes(u.roleId)).map(u => <option key={u.id} value={u.id}>{u.name}</option>)}</select><button onClick={handleResetFilters} className="p-2 bg-white/10 rounded-lg text-gray-400 hover:text-white"><RotateCcw size={14}/></button></div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><Send size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Redes Sociales</h4></div><p className="text-4xl font-black text-white">{dashboardMetrics.totalPosts}</p></div><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><Users size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Autor Principal</h4></div><p className="text-3xl font-black text-white truncate">{dashboardMetrics.mostActiveAuthor}</p></div><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><AtSign size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Cuenta Principal</h4></div><p className="text-3xl font-black text-neon truncate">{dashboardMetrics.mostUsedAccount}</p></div><div className="bg-white/5 p-6 rounded-xl border border-white/10"><div className="flex items-center gap-4 text-gray-400 mb-4"><Star size={20} /><h4 className="text-sm font-bold uppercase tracking-widest">Sponsor Principal</h4></div><p className="text-3xl font-black text-neon truncate">{dashboardMetrics.mostFeaturedSponsor}</p></div></div>
    
    <div className="mb-8">
        <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Actividad en Redes</h3>
        <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-80 flex gap-1 items-end">{chartData.dataPoints.length > 0 ? chartData.dataPoints.map(d => (<div key={d.date} className="flex-1 flex flex-col items-center group relative"><div className="absolute bottom-full mb-2 bg-black text-white px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10"><span className="font-bold">{d.count}</span> posts el {d.date}</div><div className="w-full bg-neon/40 hover:bg-neon transition-colors" style={{ height: `calc(${(chartData.maxCount > 0 ? (d.count / chartData.maxCount) * 98 : 0)}% + 2px)` }}></div><span className="text-[8px] text-gray-500 mt-1 transform -rotate-45 whitespace-nowrap">{d.date.slice(5)}</span></div>)) : <NoDataMessage />}</div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div>
            <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Posteos por Cuentas</h3>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-80 overflow-y-auto custom-scrollbar space-y-3">{postsByAccountChartData.length > 0 ? postsByAccountChartData.map(item => (<div key={item.name} className="flex items-center gap-4 text-xs"><span className="w-1/4 font-bold text-gray-300 truncate">{item.name}</span><div className="w-3/4 bg-black/50 rounded-full h-4"><div className="bg-neon h-4 rounded-full flex items-center justify-end px-2" style={{ width: `${item.percentage}%` }}><span className="text-black font-black text-[10px]">{item.count}</span></div></div></div>)) : <NoDataMessage />}</div>
        </div>
         <div>
            <h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Posteos por Autor</h3>
            <div className="bg-white/5 p-4 rounded-lg border border-white/10 h-80 overflow-y-auto custom-scrollbar space-y-3">{postsByAuthorChartData.length > 0 ? postsByAuthorChartData.map(item => (<div key={item.name} className="flex items-center gap-4 text-xs"><span className="w-1/4 font-bold text-gray-300 truncate">{item.name}</span><div className="w-3/4 bg-black/50 rounded-full h-4"><div className="bg-neon h-4 rounded-full flex items-center justify-end px-2" style={{ width: `${item.percentage}%` }}><span className="text-black font-black text-[10px]">{item.count}</span></div></div></div>)) : <NoDataMessage />}</div>
        </div>
    </div>

    <div><h3 className="text-xl font-oswald font-black italic uppercase text-neon mb-4">Tabla de Posteos</h3><div className="overflow-x-auto bg-white/5 rounded-lg border border-white/10"><table className="w-full text-sm text-left"><thead className="bg-white/5 text-xs text-gray-400 uppercase"><tr className="border-b border-white/10"><th className="px-4 py-3">Posteo</th><th className="px-4 py-3">Autor</th><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Cuentas</th><th className="px-4 py-3">Sponsors</th><th className="px-4 py-3 text-center">Estado</th></tr></thead><tbody>{filteredPosts.map(post => (<tr key={post.id} onClick={() => onOpenDetail(post)} className="border-b border-white/5 hover:bg-white/10 transition-colors cursor-pointer"><td className="px-4 py-2"><div className="flex items-center gap-3">{post.imageUrl && <img src={post.imageUrl} alt={post.titleOverlay} className="w-10 h-10 object-cover rounded flex-shrink-0" />}<span className="font-bold text-white truncate max-w-xs">{post.titleOverlay}</span></div></td><td className="px-4 py-2 text-gray-300">{users.find(u => u.id === post.postedBy)?.name || 'N/A'}</td><td className="px-4 py-2 text-gray-400">{post.postedAt ? formatArgentinaTimestamp(post.postedAt, { day: '2-digit', month: '2-digit', year: '2-digit' }) : 'S/F'}</td><td className="px-4 py-2"><div className="flex items-center -space-x-2">{(post.postedToAccounts || []).map(id => socialAccountMap.get(id)).filter((acc): acc is SocialAccount => !!acc).map(acc => (acc.profileImageUrl && <img key={acc.id} src={acc.profileImageUrl} title={acc.name} className="w-6 h-6 rounded-full border-2 border-black" />))}</div></td><td className="px-4 py-2"><div className="flex items-center -space-x-2">{(post.associatedSponsors || []).map(id => brandMap.get(id)).filter((brand): brand is Brand => !!brand).map(brand => (brand.logoUrl && <img key={brand.id} src={brand.logoUrl} title={brand.name} className="w-6 h-6 rounded-full border-2 border-black bg-neutral-800 p-0.5 object-contain" />))}</div></td><td className="px-4 py-2 text-center"><span className={`px-2 py-0.5 text-[9px] font-black uppercase rounded-full ${post.status === 'success' ? 'bg-green-500/20 text-green-300' : post.status === 'draft' ? 'bg-yellow-500/20 text-yellow-300' : 'bg-red-500/20 text-red-300'}`}>{post.status}</span></td></tr>))}</tbody></table></div></div></>
  );

  return (
    <div className="max-w-7xl mx-auto pb-24 px-4 md:px-0 pt-4 md:pt-8">
      <div className="sticky top-16 lg:top-20 z-40 bg-black/95 backdrop-blur-md pt-1 md:pt-4 pb-2 md:pb-6 mb-4 md:mb-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 md:gap-6 -mx-4 px-4 md:mx-0 md:px-0">
        <div>
          <h2 className="text-xl md:text-4xl font-oswald font-black italic uppercase text-white tracking-tighter flex items-center gap-2 md:gap-3">
            <BarChart3 className="text-neon w-5 h-5 md:w-8 md:h-8" /> MÉTRICAS
          </h2>
          <p className="hidden md:block text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1">Rendimiento y estadísticas del portal</p>
        </div>

        <div className="flex bg-black/40 p-0.5 md:p-1 rounded-lg md:rounded-2xl border border-white/5 self-stretch md:self-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setView('sponsorships')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${view === 'sponsorships' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            CAMPAÑAS
          </button>
          <button 
            onClick={() => setView('posts')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${view === 'posts' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            REDES
          </button>
          <button 
            onClick={() => setView('ads')} 
            className={`flex-1 md:flex-none flex items-center justify-center gap-1.5 md:gap-2 px-3 md:px-6 py-1.5 md:py-2.5 rounded-md md:rounded-xl text-[8px] md:text-[10px] font-black uppercase italic tracking-widest transition-all whitespace-nowrap ${view === 'ads' ? 'bg-neon text-black shadow-[0_0_20px_rgba(0,255,157,0.2)]' : 'text-gray-500 hover:text-white'}`}
          >
            ADS
          </button>
        </div>
      </div>

      <div className="pt-14 md:pt-18 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {view === 'sponsorships' ? renderSponsorshipsView() : view === 'posts' ? renderPostsView() : <AdsTab brands={brands} sponsorships={sponsorships} adSlots={adSlots} brandMap={brandMap} onOpenBrandEditor={onOpenBrandEditor} onOpenSponsorshipEditor={onOpenSponsorshipEditor} onOpenAdSlotEditor={onOpenAdSlotEditor} onDeleteBrand={onDeleteBrand} onDeleteSponsorship={onDeleteSponsorship} onToggleSponsorshipStatus={onToggleSponsorshipStatus} />}
      </div>
    </div>
  );
};
