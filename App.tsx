import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ViewMode, Article, Sponsorship, Category, User, Brand, SponsorshipType, SocialAccount, SocialPost, CategoryConfig, Role, SiteConfig, AdSlotConfig, INITIAL_AD_SLOTS, WorkLog, Task, ChatMessage, GenerationTask, SocialGenerationTask } from './types';
import { INITIAL_SPONSORSHIPS, INITIAL_USERS, DEFAULT_AI_PROMPT, INITIAL_BRANDS, INITIAL_SOCIAL_ACCOUNTS, INITIAL_CATEGORIES, INITIAL_ROLES } from './constants';
import { Header } from './components/Header';
import { ArticleCard } from './components/ArticleCard';
import { ArticleModal } from './components/ArticleModal'; 
import { AdminPanel } from './components/admin/AdminPanel';
import { HeroSlider } from './components/HeroSlider';
import { SponsorshipBanner } from './components/SponsorshipBanner';
import { LandingPage } from './components/LandingPage';
import { LoginModal } from './components/LoginModal';
import { WelcomeModal } from './components/WelcomeModal';
import { PersonalNotificationsModal } from './components/PersonalNotificationsModal';
import { GroupChat } from './components/GroupChat';
import { db } from './services/firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, writeBatch, getDoc, onSnapshot, updateDoc } from 'firebase/firestore';
import { A1ToqueLoader } from './components/A1ToqueLoader';
import { Youtube, Instagram, Twitter, Facebook, ArrowUpRight, ChevronLeft, ChevronRight } from 'lucide-react';

const CLUB_COLORS: Record<string, string> = {
  'Unión': '#ef4444', 
  'Colón': '#b91c1c', 
  'Central': '#fbbf24', 
  'Newell\'s': '#991b1b', 
  'Default': '#00ff9d'
};

const DEFAULT_SITE_CONFIG: SiteConfig = {
  id: 'site_config',
  logoUrl: 'https://www.a1toque.com/wp-content/uploads/2020/06/Artboard-22-4.png',
  siteName: 'A1Toque',
  footerText: 'Periodismo de élite para una generación que no espera. Fusionando el deporte con la cultura urbana local.',
  homeAdInterval: 4,
  adminMessage: '¡Bienvenidos al nuevo panel operativo! Estamos optimizando los procesos para mejorar nuestra cobertura. No olviden registrar sus tareas diarias y revisar las tendencias antes de publicar.',
  searchDomains: ['ole.com.ar', 'tycsports.com', 'espn.com.ar', 'infobae.com', 'lanacion.com.ar'],
};

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>(() => {
    const saved = localStorage.getItem('currentView');
    return saved ? (saved as ViewMode) : ViewMode.HOME;
  });
  const [articles, setArticles] = useState<Article[]>([]);
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([]);
  const [socialPosts, setSocialPosts] = useState<SocialPost[]>([]);
  const [categories, setCategories] = useState<CategoryConfig[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [workLogs, setWorkLogs] = useState<WorkLog[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [aiNewsTasks, setAiNewsTasks] = useState<GenerationTask[]>([]);
  const [aiSocialTasks, setAiSocialTasks] = useState<SocialGenerationTask[]>([]);
  const [unreadGroupMessagesCount, setUnreadGroupMessagesCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [adSlots, setAdSlots] = useState<AdSlotConfig[]>([]);
  
  // AI Settings
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(DEFAULT_AI_PROMPT);

  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState('');
  const [showPersonalNotificationsModal, setShowPersonalNotificationsModal] = useState(false);
  const [hasShownPersonalNotifications, setHasShownPersonalNotifications] = useState(false);

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('currentView', view);
  }, [view]);

  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [adminTab, setAdminTab] = useState<string | undefined>(undefined);
  const [adminTargetId, setAdminTargetId] = useState<string | undefined>(undefined);

  useEffect(() => {
    setCurrentPage(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [selectedCategory]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const collections = {
          articles: collection(db, 'articles'),
          sponsorships: collection(db, 'sponsorships'),
          brands: collection(db, 'brands'),
          users: collection(db, 'users'),
          social_accounts: collection(db, 'social_accounts'),
          social_posts: collection(db, 'social_posts'),
          categories: collection(db, 'categories'),
          roles: collection(db, 'roles'),
          ad_slots: collection(db, 'ad_slots'),
          work_logs: collection(db, 'work_logs'),
          tasks: collection(db, 'tasks'),
          chat_messages: collection(db, 'chat_messages'),
          ai_news_tasks: collection(db, 'ai_news_tasks'),
          ai_social_tasks: collection(db, 'ai_social_tasks'),
        };
        
        const results = await Promise.allSettled([
          getDocs(collections.articles),
          getDocs(collections.sponsorships),
          getDocs(collections.brands),
          getDocs(collections.users),
          getDocs(collections.social_accounts),
          getDocs(collections.categories),
          getDocs(collections.roles),
          getDocs(collections.ad_slots),
          getDocs(collections.work_logs),
          getDocs(collections.tasks),
          getDocs(collections.chat_messages),
          getDocs(collections.ai_news_tasks),
          getDocs(collections.ai_social_tasks),
        ]);

        const getResult = (index: number) => {
          const res = results[index];
          if (res.status === 'fulfilled') return res.value;
          console.error(`Error fetching collection at index ${index}:`, res.reason);
          return { empty: true, docs: [] } as any;
        };

        const articlesSnapshot = getResult(0);
        const sponsorshipsSnapshot = getResult(1);
        const brandsSnapshot = getResult(2);
        const usersSnapshot = getResult(3);
        const socialAccountsSnapshot = getResult(4);
        const categoriesSnapshot = getResult(5);
        const rolesSnapshot = getResult(6);
        const adSlotsSnapshot = getResult(7);
        const workLogsSnapshot = getResult(8);
        const tasksSnapshot = getResult(9);
        const chatMessagesSnapshot = getResult(10);
        const aiNewsTasksSnapshot = getResult(11);
        const aiSocialTasksSnapshot = getResult(12);

        setWorkLogs(workLogsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkLog)));
        setTasks(tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));
        setChatMessages(chatMessagesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatMessage)));
        setAiNewsTasks(aiNewsTasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GenerationTask)));
        setAiSocialTasks(aiSocialTasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SocialGenerationTask)));

        // Load or create Site Config
        try {
          const siteConfigDoc = await getDoc(doc(db, 'config', 'site'));
          if (siteConfigDoc.exists()) {
            setSiteConfig({ ...DEFAULT_SITE_CONFIG, ...siteConfigDoc.data() } as SiteConfig);
          } else {
            await setDoc(doc(db, 'config', 'site'), DEFAULT_SITE_CONFIG);
            setSiteConfig(DEFAULT_SITE_CONFIG);
          }
        } catch (e) {
          console.error("Error with site config:", e);
        }
        
        try {
          if (adSlotsSnapshot.empty) {
            const batch = writeBatch(db);
            INITIAL_AD_SLOTS.forEach(item => batch.set(doc(db, "ad_slots", item.id), item));
            await batch.commit();
            setAdSlots(INITIAL_AD_SLOTS);
          } else {
            setAdSlots(adSlotsSnapshot.docs.map(doc => doc.data() as AdSlotConfig));
          }
        } catch (e) { console.error("Error seeding ad_slots:", e); setAdSlots(INITIAL_AD_SLOTS); }

        if (articlesSnapshot.empty) {
          setArticles([]);
        } else {
          const list = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
          setArticles(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        
        try {
          if (sponsorshipsSnapshot.empty) {
            const batch = writeBatch(db);
            INITIAL_SPONSORSHIPS.forEach(item => batch.set(doc(db, "sponsorships", item.id), item));
            await batch.commit();
            setSponsorships(INITIAL_SPONSORSHIPS);
          } else {
            setSponsorships(sponsorshipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsorship)));
          }
        } catch (e) { console.error("Error seeding sponsorships:", e); setSponsorships(INITIAL_SPONSORSHIPS); }

        try {
          if (brandsSnapshot.empty) {
            const batch = writeBatch(db);
            INITIAL_BRANDS.forEach(item => batch.set(doc(db, "brands", item.id), item));
            await batch.commit();
            setBrands(INITIAL_BRANDS);
          } else {
            setBrands(brandsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
          }
        } catch (e) { console.error("Error seeding brands:", e); setBrands(INITIAL_BRANDS); }

        try {
          if (usersSnapshot.empty) {
            const batch = writeBatch(db);
            INITIAL_USERS.forEach(item => batch.set(doc(db, "users", item.id), item));
            await batch.commit();
            setUsers(INITIAL_USERS);
          } else {
            const fetchedUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
            
            // MIGRATION: Ensure Estudio KM admin exists
            const kmUser = INITIAL_USERS.find(u => u.email === 'holaestudiokm@gmail.com');
            if (kmUser && !fetchedUsers.find(u => u.email === kmUser.email)) {
                await setDoc(doc(db, "users", kmUser.id), kmUser);
                setUsers([...fetchedUsers, kmUser]);
            } else {
                setUsers(fetchedUsers);
            }
          }
        } catch (e) { console.error("Error seeding users:", e); setUsers(INITIAL_USERS); }

        try {
          if (socialAccountsSnapshot.empty) {
              const batch = writeBatch(db);
              INITIAL_SOCIAL_ACCOUNTS.forEach(item => batch.set(doc(db, "social_accounts", item.id), item));
              await batch.commit();
              setSocialAccounts(INITIAL_SOCIAL_ACCOUNTS);
          } else {
              const fetchedAccounts = socialAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialAccount));
              
              // MIGRATION: Ensure social accounts have prompts if they are missing
              const batch = writeBatch(db);
              let needsUpdate = false;
              const updatedAccounts = fetchedAccounts.map(acc => {
                  const initialAcc = INITIAL_SOCIAL_ACCOUNTS.find(ia => ia.id === acc.id);
                  if (initialAcc && (!acc.systemPrompt || !acc.copyPrompt)) {
                      const updatedAcc = { 
                          ...acc, 
                          systemPrompt: acc.systemPrompt || initialAcc.systemPrompt,
                          copyPrompt: acc.copyPrompt || initialAcc.copyPrompt
                      };
                      batch.set(doc(db, "social_accounts", acc.id), updatedAcc, { merge: true });
                      needsUpdate = true;
                      return updatedAcc;
                  }
                  return acc;
              });

              if (needsUpdate) {
                  await batch.commit();
                  setSocialAccounts(updatedAccounts);
              } else {
                  setSocialAccounts(fetchedAccounts);
              }
          }
        } catch (e) { console.error("Error seeding social_accounts:", e); setSocialAccounts(INITIAL_SOCIAL_ACCOUNTS); }

        try {
          if (categoriesSnapshot.empty) {
            const batch = writeBatch(db);
            INITIAL_CATEGORIES.forEach(item => batch.set(doc(db, "categories", item.id), item));
            await batch.commit();
            setCategories(INITIAL_CATEGORIES);
          } else {
            const fetchedCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
            setCategories(fetchedCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
          }
        } catch (e) { console.error("Error seeding categories:", e); setCategories(INITIAL_CATEGORIES); }

        try {
          if (rolesSnapshot.empty) {
              const batch = writeBatch(db);
              INITIAL_ROLES.forEach(item => batch.set(doc(db, "roles", item.id), item));
              await batch.commit();
              setRoles(INITIAL_ROLES);
          } else {
              const fetchedRoles = rolesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
              
              // MIGRATION: Ensure system roles have the latest permissions from INITIAL_ROLES
              const batch = writeBatch(db);
              let needsUpdate = false;
              
              const updatedRoles = fetchedRoles.map(role => {
                const initialRole = INITIAL_ROLES.find(r => r.id === role.id);
                if (initialRole && initialRole.isSystemRole) {
                  // Check if permissions are different
                  const hasAllNewPermissions = initialRole.permissions.every(p => role.permissions.includes(p));
                  if (!hasAllNewPermissions) {
                    const updatedRole = { ...role, permissions: Array.from(new Set([...role.permissions, ...initialRole.permissions])) };
                    batch.set(doc(db, "roles", role.id), updatedRole, { merge: true });
                    needsUpdate = true;
                    return updatedRole;
                  }
                }
                return role;
              });

              if (needsUpdate) {
                await batch.commit();
                setRoles(updatedRoles);
              } else {
                setRoles(fetchedRoles);
              }
          }
        } catch (e) { console.error("Error seeding roles:", e); setRoles(INITIAL_ROLES); }

        // Social posts are handled by onSnapshot

      } catch (error) {
        console.error("Error fetching data:", error);
        setArticles([]);
        setSponsorships(INITIAL_SPONSORSHIPS);
        setBrands(INITIAL_BRANDS);
        setUsers(INITIAL_USERS);
        setSocialAccounts(INITIAL_SOCIAL_ACCOUNTS);
        setCategories(INITIAL_CATEGORIES);
        setRoles(INITIAL_ROLES);
        setSocialPosts([]);
        setAdSlots(INITIAL_AD_SLOTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Set up real-time listeners
    const unsubscribeArticles = onSnapshot(collection(db, 'articles'), (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, (error) => console.error("Error in articles snapshot:", error));

    const unsubscribeChat = onSnapshot(collection(db, 'chat_messages'), (snapshot) => {
      setChatMessages(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatMessage)));
    }, (error) => console.error("Error in chat_messages snapshot:", error));

    const unsubscribeConfig = onSnapshot(doc(db, 'config', 'site'), (docSnapshot) => {
      if (docSnapshot.exists()) {
        setSiteConfig({ ...DEFAULT_SITE_CONFIG, ...docSnapshot.data() } as SiteConfig);
      }
    }, (error) => console.error("Error in config snapshot:", error));

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const updatedUsers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
      if (updatedUsers.length > 0) {
        setUsers(updatedUsers);
        setCurrentUser(prev => {
          if (!prev) return prev;
          const updatedCurrentUser = updatedUsers.find(u => u.id === prev.id);
          return updatedCurrentUser || prev;
        });
      }
    }, (error) => console.error("Error in users snapshot:", error));

    const unsubscribeTasks = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      setTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));
    }, (error) => console.error("Error in tasks snapshot:", error));

    const unsubscribeAiNewsTasks = onSnapshot(collection(db, 'ai_news_tasks'), (snapshot) => {
      setAiNewsTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as GenerationTask)));
    }, (error) => console.error("Error in ai_news_tasks snapshot:", error));

    const unsubscribeAiSocialTasks = onSnapshot(collection(db, 'ai_social_tasks'), (snapshot) => {
      setAiSocialTasks(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SocialGenerationTask)));
    }, (error) => console.error("Error in ai_social_tasks snapshot:", error));

    const unsubscribeSocialPosts = onSnapshot(collection(db, 'social_posts'), (snapshot) => {
      const posts = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as SocialPost));
      setSocialPosts(posts.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()));
    }, (error) => console.error("Error in social_posts snapshot:", error));

    return () => {
      unsubscribeArticles();
      unsubscribeChat();
      unsubscribeConfig();
      unsubscribeUsers();
      unsubscribeTasks();
      unsubscribeAiNewsTasks();
      unsubscribeAiSocialTasks();
      unsubscribeSocialPosts();
    };
  }, []);
  
  useEffect(() => {
    const scroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTo(0, 0);
      document.body.scrollTo(0, 0);
    };
    scroll();
    const timer = setTimeout(scroll, 100);
    return () => clearTimeout(timer);
  }, [view, selectedCategory]);

  useEffect(() => {
    if (view === ViewMode.HOME && !isLoading) {
      const hasSeen = sessionStorage.getItem('a1toque_popup_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => setShowPopup(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [view, isLoading]);

  useEffect(() => {
    if (currentUser && !hasShownPersonalNotifications) {
      const activeAlerts = (currentUser.alertMessages || []).filter(a => !a.seen);
      if (activeAlerts.length > 0) {
        setShowPersonalNotificationsModal(true);
        setHasShownPersonalNotifications(true);
      }
    }
  }, [currentUser, hasShownPersonalNotifications]);

  const handleClosePopup = () => {
    setShowPopup(false);
    sessionStorage.setItem('a1toque_popup_seen', 'true');
  };

  const handleArticleClick = (id: string) => {
    const found = articles.find(a => a.id === id);
    if (found) {
      setSelectedArticle(found);
    }
  };

  const handleOpenAdminTab = (tab: string, targetId?: string) => {
    setAdminTab(tab);
    setAdminTargetId(targetId);
    setView(ViewMode.HOME); // Force a re-render if already in admin to trigger useEffect in AdminPanel
    setTimeout(() => setView(ViewMode.ADMIN), 0);
  };

  const closeArticleModal = () => setSelectedArticle(null);

  const handleLogin = (email: string, pass: string): User | null => {
    const user = users.find(u => u.email === email && u.password === pass);
    if (user) {
      setCurrentUser(user);
      setShowLoginModal(false);
      const userRole = roles.find(r => r.id === user.roleId);
      if (userRole && userRole.permissions.length > 0) {
          setView(ViewMode.ADMIN);
      }
      return user;
    }
    return null;
  };
  
  const handleSuperAdminLogin = () => {
    const superAdmin = users.find(u => u.email === 'nicobarrilis@gmail.com');
    if (superAdmin) {
      setCurrentUser({ ...superAdmin, roleId: 'admin' });
      setView(ViewMode.ADMIN);
    } else {
      alert("Error: No se encontró la cuenta de administrador por defecto.");
    }
  };

  const handleRegister = async (name: string, email: string, pass: string) => {
    const newUser: Omit<User, 'id'> = {
        name,
        email,
        password: pass,
        roleId: 'user',
        avatar: `https://ui-avatars.com/api/?name=${name.replace(' ','+')}&background=random`,
        registrationDate: new Date().toISOString().split('T')[0]
    };
    const docRef = await addUser(newUser);
    const createdUser: User = { ...newUser, id: docRef.id };
    if(createdUser) {
        setCurrentUser(createdUser);
        setShowLoginModal(false);
        setWelcomeUserName(name);
        setShowWelcomeModal(true);
    }
    return true;
  };
  
  const handleLogout = () => {
    if (currentUser) {
      updateUser({ ...currentUser, isOnline: false });
    }
    setCurrentUser(null);
    setView(ViewMode.HOME);
  };

  // Heartbeat and Online Status Tracking
  useEffect(() => {
    if (!currentUser) return;

    const updateStatus = async (online: boolean) => {
      try {
        const userRef = doc(db, 'users', currentUser.id);
        await updateDoc(userRef, {
          isOnline: online,
          lastConnection: new Date().toISOString()
        });
        console.log(`User ${currentUser.name} status updated to ${online ? 'online' : 'offline'}`);
      } catch (error) {
        console.error("Error updating user status:", error);
        // If updateDoc fails (e.g. fields don't exist), try setDoc with merge
        try {
          const userRef = doc(db, 'users', currentUser.id);
          await setDoc(userRef, {
            isOnline: online,
            lastConnection: new Date().toISOString()
          }, { merge: true });
        } catch (innerError) {
          console.error("Error updating user status with setDoc:", innerError);
        }
      }
    };

    // Initial online status
    updateStatus(true);

    // Heartbeat every 30 seconds for better responsiveness
    const heartbeatInterval = setInterval(() => {
      updateStatus(true);
    }, 30000);

    const handleVisibilityChange = () => {
      updateStatus(document.visibilityState === 'visible');
    };

    const handleBeforeUnload = () => {
      // Try to set offline before leaving
      const userRef = doc(db, 'users', currentUser.id);
      setDoc(userRef, { isOnline: false, lastConnection: new Date().toISOString() }, { merge: true });
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Set offline on cleanup (logout or component unmount)
      updateStatus(false);
    };
  }, [currentUser?.id]);

  const removeUndefinedFields = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map(item => removeUndefinedFields(item));
    }
    if (obj !== null && typeof obj === 'object') {
      const newObj: any = {};
      Object.keys(obj).forEach(key => {
        if (obj[key] !== undefined) {
          newObj[key] = removeUndefinedFields(obj[key]);
        }
      });
      return newObj;
    }
    return obj;
  };

  const addArticle = async (article: Omit<Article, 'id'>) => {
    const cleanArticle = removeUndefinedFields(article);
    await addDoc(collection(db, 'articles'), cleanArticle);
  };
  const updateArticle = async (article: Article) => {
    const cleanArticle = removeUndefinedFields(article);
    await setDoc(doc(db, 'articles', article.id), cleanArticle, { merge: true });
  };
  const deleteArticle = async (id: string) => {
    await deleteDoc(doc(db, 'articles', id));
  };
  const toggleArticleStatus = async (id: string) => {
    const article = articles.find(a => a.id === id);
    if (article) await updateArticle({ ...article, isPublished: !article.isPublished });
  };
  
  const addSponsorship = async (sponsorship: Omit<Sponsorship, 'id' | 'impressions' | 'clicks'>) => {
    const newSponsorship = removeUndefinedFields({ ...sponsorship, impressions: 0, clicks: 0 });
    const docRef = await addDoc(collection(db, 'sponsorships'), newSponsorship);
    setSponsorships([...sponsorships, { ...newSponsorship, id: docRef.id }]);
  };
  const updateSponsorship = async (sponsorship: Sponsorship) => {
    const cleanSponsorship = removeUndefinedFields(sponsorship);
    await setDoc(doc(db, 'sponsorships', sponsorship.id), cleanSponsorship, { merge: true });
    setSponsorships(sponsorships.map(s => s.id === sponsorship.id ? cleanSponsorship : s));
  };
  const deleteSponsorship = async (id: string) => {
    await deleteDoc(doc(db, 'sponsorships', id));
    setSponsorships(sponsorships.filter(s => s.id !== id));
  };

  const toggleSponsorshipStatus = async (id: string) => {
    const sponsorship = sponsorships.find(s => s.id === id);
    if (sponsorship) {
      await updateSponsorship({ ...sponsorship, active: !sponsorship.active });
    }
  };

  const handleSponsorshipImpression = useCallback(async (id: string) => {
    setSponsorships(currentSponsorships => {
      const sponsorship = currentSponsorships.find(s => s.id === id);
      if (!sponsorship) return currentSponsorships;
      const updatedSponsorship = { ...sponsorship, impressions: (sponsorship.impressions || 0) + 1 };
      const sponsorshipRef = doc(db, 'sponsorships', id);
      setDoc(sponsorshipRef, { impressions: updatedSponsorship.impressions }, { merge: true })
          .catch(error => console.error("Failed to update impressions in Firestore:", error));
      return currentSponsorships.map(s => s.id === id ? updatedSponsorship : s);
    });
  }, []);

  const handleSponsorshipClick = useCallback(async (id: string) => {
    setSponsorships(currentSponsorships => {
      const sponsorship = currentSponsorships.find(s => s.id === id);
      if (!sponsorship) return currentSponsorships;
      const updatedSponsorship = { ...sponsorship, clicks: (sponsorship.clicks || 0) + 1 };
      const sponsorshipRef = doc(db, 'sponsorships', id);
      setDoc(sponsorshipRef, { clicks: updatedSponsorship.clicks }, { merge: true })
          .catch(error => console.error("Failed to update clicks in Firestore:", error));
      return currentSponsorships.map(s => s.id === id ? updatedSponsorship : s);
    });
  }, []);
  
  const addBrand = async (brand: Omit<Brand, 'id'>) => {
    const cleanBrand = removeUndefinedFields(brand);
    const docRef = await addDoc(collection(db, 'brands'), cleanBrand);
    setBrands([...brands, { ...cleanBrand, id: docRef.id }]);
  };
  const updateBrand = async (brand: Brand) => {
    const cleanBrand = removeUndefinedFields(brand);
    await setDoc(doc(db, 'brands', brand.id), cleanBrand, { merge: true });
    setBrands(brands.map(b => b.id === brand.id ? cleanBrand : b));
  };
  const deleteBrand = async (id: string) => {
    await deleteDoc(doc(db, 'brands', id));
    setBrands(brands.filter(b => b.id !== id));
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    const cleanUser = removeUndefinedFields(user);
    const docRef = await addDoc(collection(db, 'users'), cleanUser);
    return docRef;
  };
  const updateUser = async (user: User) => {
    const userToUpdate = removeUndefinedFields({ ...user });
    if (!user.password) {
      delete userToUpdate.password;
    }
    await setDoc(doc(db, 'users', user.id), userToUpdate, { merge: true });
  };
  const deleteUser = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'users', id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error al eliminar usuario. Es posible que no tengas permisos suficientes o que el usuario esté protegido.");
    }
  };

  const addSocialAccount = async (account: Omit<SocialAccount, 'id'>) => {
    const cleanAccount = removeUndefinedFields(account);
    const docRef = await addDoc(collection(db, 'social_accounts'), cleanAccount);
    setSocialAccounts([...socialAccounts, { ...cleanAccount, id: docRef.id }]);
  };
  const updateSocialAccount = async (account: SocialAccount) => {
      const cleanAccount = removeUndefinedFields(account);
      await setDoc(doc(db, 'social_accounts', account.id), cleanAccount, { merge: true });
      setSocialAccounts(socialAccounts.map(a => a.id === account.id ? cleanAccount : a));
  };
  const deleteSocialAccount = async (id: string) => {
      await deleteDoc(doc(db, 'social_accounts', id));
      setSocialAccounts(socialAccounts.filter(a => a.id !== id));
  };

  const addSocialPost = async (post: Omit<SocialPost, 'id'>) => {
    const cleanPost = removeUndefinedFields(post);
    const docRef = await addDoc(collection(db, 'social_posts'), cleanPost);
    return { ...cleanPost, id: docRef.id } as SocialPost;
  };
  const updateSocialPost = async (post: SocialPost) => {
    const cleanPost = removeUndefinedFields(post);
    await setDoc(doc(db, 'social_posts', post.id), cleanPost, { merge: true });
  };
  const deleteSocialPost = async (id: string) => {
    await deleteDoc(doc(db, 'social_posts', id));
  };
  
  const addCategory = async (category: Omit<CategoryConfig, 'id' | 'order'>) => {
    const newCategory = removeUndefinedFields({ ...category, order: categories.length });
    const docRef = await addDoc(collection(db, 'categories'), newCategory);
    setCategories([...categories, { ...newCategory, id: docRef.id }]);
  };
  const updateCategory = async (category: CategoryConfig) => {
    const cleanCategory = removeUndefinedFields(category);
    await setDoc(doc(db, 'categories', category.id), cleanCategory, { merge: true });
    setCategories(categories.map(c => c.id === category.id ? cleanCategory : c).sort((a,b) => (a.order ?? 0) - (b.order ?? 0)));
  };
  const onUpdateCategoriesOrder = async (reorderedCategories: CategoryConfig[]) => {
    const batch = writeBatch(db);
    const updatedCategoriesWithOrder = reorderedCategories.map((cat, index) => {
        const updatedCategory = { ...cat, order: index };
        batch.set(doc(db, 'categories', cat.id), updatedCategory, { merge: true });
        return updatedCategory;
    });
    await batch.commit();
    setCategories(updatedCategoriesWithOrder);
  };
  const deleteCategory = async (id: string) => {
    await deleteDoc(doc(db, 'categories', id));
    setCategories(categories.filter(c => c.id !== id));
  };

  const addRole = async (role: Omit<Role, 'id'>) => {
    const cleanRole = removeUndefinedFields(role);
    const docRef = await addDoc(collection(db, 'roles'), cleanRole);
    setRoles([...roles, { ...cleanRole, id: docRef.id }]);
  };
  const updateRole = async (role: Role) => {
    const cleanRole = removeUndefinedFields(role);
    await setDoc(doc(db, 'roles', role.id), cleanRole, { merge: true });
    setRoles(roles.map(c => c.id === role.id ? cleanRole : c));
  };
  const deleteRole = async (id: string) => {
    await deleteDoc(doc(db, 'roles', id));
    setRoles(roles.filter(c => c.id !== id));
  };

  const updateSiteConfig = async (config: SiteConfig) => {
    const cleanConfig = removeUndefinedFields(config);
    await setDoc(doc(db, 'config', 'site'), cleanConfig);
    setSiteConfig(cleanConfig);
  };
  
  const updateAdSlot = async (slot: AdSlotConfig) => {
    const cleanSlot = removeUndefinedFields(slot);
    await setDoc(doc(db, 'ad_slots', slot.id), cleanSlot, { merge: true });
    setAdSlots(prev => prev.map(s => s.id === slot.id ? cleanSlot : s));
  };

  const addWorkLog = async (log: Omit<WorkLog, 'id'>) => {
    const cleanLog = removeUndefinedFields(log);
    const docRef = await addDoc(collection(db, 'work_logs'), cleanLog);
    setWorkLogs(prev => [{ ...cleanLog, id: docRef.id }, ...prev]);
  };
  const deleteWorkLog = async (id: string) => {
    await deleteDoc(doc(db, 'work_logs', id));
    setWorkLogs(prev => prev.filter(l => l.id !== id));
  };
  const updateWorkLog = async (log: WorkLog) => {
    const cleanLog = removeUndefinedFields(log);
    await setDoc(doc(db, 'work_logs', log.id), cleanLog, { merge: true });
    setWorkLogs(prev => prev.map(l => l.id === log.id ? cleanLog : l));
  };

  const addTask = async (task: Omit<Task, 'id'>) => {
    const cleanTask = removeUndefinedFields(task);
    await addDoc(collection(db, 'tasks'), cleanTask);
  };
  const updateTask = async (task: Task) => {
    const cleanTask = removeUndefinedFields(task);
    await setDoc(doc(db, 'tasks', task.id), cleanTask, { merge: true });
  };
  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
  };

  const addChatMessage = async (msg: Omit<ChatMessage, 'id'>) => {
    const cleanMsg = removeUndefinedFields(msg);
    await addDoc(collection(db, 'chat_messages'), cleanMsg);
  };

  const markChatAsRead = useCallback(async (senderId: string) => {
    if (!currentUser) return;
    
    if (senderId === 'group') {
      localStorage.setItem('lastGroupChatView', new Date().toISOString());
      setUnreadGroupMessagesCount(0);
      return;
    }

    const unreadMsgs = chatMessages.filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.isRead);
    if (unreadMsgs.length === 0) return;

    const batch = writeBatch(db);
    unreadMsgs.forEach(m => {
      batch.update(doc(db, 'chat_messages', m.id), { isRead: true });
    });
    await batch.commit();
  }, [currentUser, chatMessages]);

  const markTaskAsViewed = async (taskId: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || (task.viewedByUserIds || []).includes(currentUser.id)) return;

    const updatedViewed = [...(task.viewedByUserIds || []), currentUser.id];
    await setDoc(doc(db, 'tasks', taskId), { viewedByUserIds: updatedViewed }, { merge: true });
  };

  const addAiNewsTask = async (task: Omit<GenerationTask, 'id'>) => {
    const { controller, ...cleanTask } = removeUndefinedFields(task);
    const docRef = await addDoc(collection(db, 'ai_news_tasks'), cleanTask);
    return docRef.id;
  };

  const updateAiNewsTask = async (id: string, task: Partial<GenerationTask>) => {
    const { controller, ...cleanTask } = removeUndefinedFields(task);
    await setDoc(doc(db, 'ai_news_tasks', id), cleanTask, { merge: true });
  };

  const deleteAiNewsTask = async (id: string) => {
    await deleteDoc(doc(db, 'ai_news_tasks', id));
  };

  const addAiSocialTask = async (task: Omit<SocialGenerationTask, 'id'>) => {
    const { controller, ...cleanTask } = removeUndefinedFields(task);
    const docRef = await addDoc(collection(db, 'ai_social_tasks'), cleanTask);
    return docRef.id;
  };

  const updateAiSocialTask = async (id: string, task: Partial<SocialGenerationTask>) => {
    const { controller, ...cleanTask } = removeUndefinedFields(task);
    await setDoc(doc(db, 'ai_social_tasks', id), cleanTask, { merge: true });
  };

  const deleteAiSocialTask = async (id: string) => {
    await deleteDoc(doc(db, 'ai_social_tasks', id));
  };
  
  const unreadChatCount = useMemo(() => {
    if (!currentUser) return 0;
    return chatMessages.filter(m => m.receiverId === currentUser.id && !m.isRead).length;
  }, [chatMessages, currentUser]);

  const pendingTasksCount = useMemo(() => {
    if (!currentUser) return 0;
    return tasks.filter(t => t.assignedUserIds.includes(currentUser.id) && t.status === 'pending' && !(t.viewedByUserIds || []).includes(currentUser.id)).length;
  }, [tasks, currentUser]);

  const totalNotifications = unreadChatCount + pendingTasksCount;
  
  const publishedArticles = useMemo(() => articles.filter(a => a.isPublished), [articles]);
  const currentUserRole = useMemo(() => currentUser ? roles.find(r => r.id === currentUser.roleId) : null, [currentUser, roles]);
  const canAccessAdminPanel = useMemo(() => currentUserRole && (currentUserRole.permissions || []).length > 0, [currentUserRole]);

  const filteredArticles = useMemo(() => {
    const articlesToDisplay = (canAccessAdminPanel && view === ViewMode.ADMIN) ? articles : publishedArticles;
    if (selectedCategory === 'All') return articlesToDisplay;
    return articlesToDisplay.filter(a => a.category === selectedCategory);
  }, [articles, publishedArticles, selectedCategory, view, canAccessAdminPanel]);

  // ORDENAR TENDENCIAS POR VISTAS (NO POR FECHA)
  const trendingArticles = useMemo(() => {
    return [...publishedArticles]
        .sort((a, b) => (b.views || 0) - (a.views || 0))
        .slice(0, 6);
  }, [publishedArticles]);

  const activeSocialAccount = useMemo(() => {
    if (selectedCategory === 'All') return null;
    const normalize = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    return socialAccounts.find(sa => normalize(sa.name).includes(normalize(selectedCategory)));
  }, [selectedCategory, socialAccounts]);

  const activeSecondaryColor = useMemo(() => {
    if (selectedCategory === 'All') return CLUB_COLORS['Default'];
    if (activeSocialAccount?.secondaryColor) return activeSocialAccount.secondaryColor;
    return CLUB_COLORS['Default'];
  }, [selectedCategory, activeSocialAccount]);

  const activeColor = useMemo(() => {
    if (selectedCategory === 'All') return CLUB_COLORS['Default'];
    if (activeSocialAccount?.primaryColor) return activeSocialAccount.primaryColor;
    return CLUB_COLORS[selectedCategory] || CLUB_COLORS['Default'];
  }, [selectedCategory, activeSocialAccount]);
  
  const getSponsorshipForPosition = (position: Sponsorship['position']) => {
    const candidates = sponsorships.filter(s => s.position === position && s.active);
    const exclusives = candidates.filter(c => c.type === SponsorshipType.EXCLUSIVE);
    if (exclusives.length > 0) return exclusives[0];
    
    const rotatives = candidates.filter(c => c.type === SponsorshipType.ROTATING);
    if (rotatives.length > 0) {
      return rotatives[Math.floor(Math.random() * rotatives.length)];
    }
    return undefined;
  };

  const popupAd = useMemo(() => getSponsorshipForPosition('HOME_POPUP'), [sponsorships]);
  const homeLvl1Ad = useMemo(() => getSponsorshipForPosition('HOME_LVL_1'), [sponsorships]);
  const homeLvl2Ads = useMemo(() => sponsorships.filter(s => s.position === 'HOME_LVL_2' && s.active), [sponsorships]);
  const homeLvl3Ad = useMemo(() => getSponsorshipForPosition('HOME_LVL_3'), [sponsorships]);
  
  const popupAdSlot = useMemo(() => adSlots.find(s => s.id === 'HOME_POPUP'), [adSlots]);
  const homeLvl1AdSlot = useMemo(() => adSlots.find(s => s.id === 'HOME_LVL_1'), [adSlots]);
  const homeLvl2AdSlot = useMemo(() => adSlots.find(s => s.id === 'HOME_LVL_2'), [adSlots]);
  const homeLvl3AdSlot = useMemo(() => adSlots.find(s => s.id === 'HOME_LVL_3'), [adSlots]);

  const ARTICLES_PER_PAGE = 10;
  const paginatedArticles = useMemo(() => {
    const startIndex = (currentPage - 1) * ARTICLES_PER_PAGE;
    return filteredArticles.slice(startIndex, startIndex + ARTICLES_PER_PAGE);
  }, [filteredArticles, currentPage]);

  const totalPages = Math.ceil(filteredArticles.length / ARTICLES_PER_PAGE);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const newsSection = document.getElementById('news-feed-section');
    if (newsSection) {
      newsSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const showMainContent = !isLoading;
  
  const homeFeedItems = useMemo(() => {
    if (selectedCategory !== 'All' || homeLvl2Ads.length === 0 || !homeLvl2AdSlot) {
      return paginatedArticles.map(art => <ArticleCard key={art.id} article={art} users={users} onClick={handleArticleClick} />);
    }

    const items: React.ReactNode[] = [];
    let adCounter = 0;
    const interval = homeLvl2AdSlot.injectInterval || siteConfig.homeAdInterval || 4;
    
    paginatedArticles.forEach((art, index) => {
      items.push(<ArticleCard key={art.id} article={art} users={users} onClick={handleArticleClick} priority={index < 4} />);
      if ((index + 1) % interval === 0) {
        const adToShow = homeLvl2Ads[adCounter % homeLvl2Ads.length];
        if (adToShow) {
          items.push(
             <SponsorshipBanner 
                key={`ad-${index}`}
                sponsorship={adToShow} 
                slotConfig={homeLvl2AdSlot} 
                onImpression={handleSponsorshipImpression} 
                onClickEvent={handleSponsorshipClick} 
            />
          );
          adCounter++;
        }
      }
    });
    
    return items;
  }, [paginatedArticles, selectedCategory, homeLvl2Ads, users, handleArticleClick, siteConfig.homeAdInterval, homeLvl2AdSlot, handleSponsorshipImpression, handleSponsorshipClick]);

  return (
    <div className="min-h-screen selection:bg-neon selection:text-black bg-black">
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} onRegister={handleRegister} />}
      {showWelcomeModal && <WelcomeModal userName={welcomeUserName} onClose={() => setShowWelcomeModal(false)} />}
      {showPersonalNotificationsModal && currentUser && (
        <PersonalNotificationsModal
          user={currentUser}
          onClose={() => setShowPersonalNotificationsModal(false)}
          onMarkAsSeen={(alertId) => {
            const updatedAlerts = (currentUser.alertMessages || []).map(a => 
              a.id === alertId ? { ...a, seen: true, seenAt: new Date().toISOString() } : a
            );
            updateUser({ ...currentUser, alertMessages: updatedAlerts });
          }}
          onMarkAllAsSeen={() => {
            const updatedAlerts = (currentUser.alertMessages || []).map(a => 
              ({ ...a, seen: true, seenAt: new Date().toISOString() })
            );
            updateUser({ ...currentUser, alertMessages: updatedAlerts });
            setShowPersonalNotificationsModal(false);
          }}
        />
      )}
      
      {!showMainContent && view === ViewMode.HOME && (
        <div className="fixed inset-0 z-[1000] bg-black flex items-center justify-center">
            <A1ToqueLoader />
        </div>
      )}

      {view === ViewMode.ADMIN && canAccessAdminPanel ? (
        <AdminPanel 
          articles={articles}
          sponsorships={sponsorships}
          brands={brands}
          users={users}
          socialAccounts={socialAccounts}
          socialPosts={socialPosts}
          categories={categories}
          roles={roles}
          adSlots={adSlots}
          onUpdateAdSlot={updateAdSlot}
          currentUser={currentUser!}
          currentUserRole={currentUserRole!}
          siteConfig={siteConfig}
          onUpdateSiteConfig={updateSiteConfig}
          aiSystemPrompt={aiSystemPrompt}
          onUpdateAiSystemPrompt={setAiSystemPrompt}
          onAddArticle={addArticle} 
          onUpdateArticle={updateArticle}
          onDeleteArticle={deleteArticle}
          onToggleArticleStatus={toggleArticleStatus}
          onViewArticle={handleArticleClick}
          onAddSponsorship={addSponsorship}
          onUpdateSponsorship={updateSponsorship}
          onDeleteSponsorship={deleteSponsorship}
          onToggleSponsorshipStatus={toggleSponsorshipStatus}
          onAddBrand={addBrand}
          onUpdateBrand={updateBrand}
          onDeleteBrand={deleteBrand}
          onAddUser={addUser}
          onUpdateUser={updateUser}
          onDeleteUser={deleteUser}
          onAddSocialAccount={addSocialAccount}
          onUpdateSocialAccount={updateSocialAccount}
          onDeleteSocialAccount={deleteSocialAccount}
          onAddSocialPost={addSocialPost}
          onUpdateSocialPost={updateSocialPost}
          onDeleteSocialPost={deleteSocialPost}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onUpdateCategoriesOrder={onUpdateCategoriesOrder}
          onDeleteCategory={deleteCategory}
          onAddRole={addRole}
          onUpdateRole={updateRole}
          onDeleteRole={deleteRole}
          workLogs={workLogs}
          onAddWorkLog={addWorkLog}
          onUpdateWorkLog={updateWorkLog}
          onDeleteWorkLog={deleteWorkLog}
          tasks={tasks}
          onAddTask={addTask}
          onUpdateTask={updateTask}
          onDeleteTask={deleteTask}
          chatMessages={chatMessages}
          onAddChatMessage={addChatMessage}
          onMarkChatAsRead={markChatAsRead}
          onMarkTaskAsViewed={markTaskAsViewed}
          aiNewsTasks={aiNewsTasks}
          aiSocialTasks={aiSocialTasks}
          unreadGroupMessagesCount={unreadGroupMessagesCount}
          onAddAiNewsTask={addAiNewsTask}
          onUpdateAiNewsTask={updateAiNewsTask}
          onDeleteAiNewsTask={deleteAiNewsTask}
          onAddAiSocialTask={addAiSocialTask}
          onUpdateAiSocialTask={updateAiSocialTask}
          onDeleteAiSocialTask={deleteAiSocialTask}
          onExit={() => {
            setView(ViewMode.HOME);
            setAdminTab(undefined);
            setAdminTargetId(undefined);
          }}
          initialTab={adminTab as any}
          initialTargetId={adminTargetId}
        />
      ) : (
        <div className={`transition-opacity duration-700 ${showMainContent ? 'opacity-100' : 'opacity-0'}`}>
          {showPopup && <SponsorshipBanner sponsorship={popupAd} slotConfig={popupAdSlot} onClosePopup={handleClosePopup} onImpression={handleSponsorshipImpression} onClickEvent={handleSponsorshipClick} />}
          {selectedArticle && (
            <ArticleModal 
              article={selectedArticle} 
              articles={articles}
              users={users}
              currentUser={currentUser}
              onClose={closeArticleModal} 
              onArticleClick={handleArticleClick}
              sponsorships={sponsorships} 
              adSlots={adSlots}
              onSponsorshipImpression={handleSponsorshipImpression}
              onSponsorshipClick={handleSponsorshipClick}
              onLoginClick={() => {
                closeArticleModal();
                setShowLoginModal(true);
              }}
            />
          )}

          {view !== ViewMode.LANDING && (
            <Header 
              currentView={view} 
              setView={setView} 
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
              categories={categories}
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              siteConfig={siteConfig}
              onLoginClick={() => setShowLoginModal(true)}
              onLogout={handleLogout}
              onSuperAdminRequest={handleSuperAdminLogin}
              tickerArticles={publishedArticles.slice(0, 8)}
              onArticleClick={handleArticleClick}
              unreadNotificationsCount={totalNotifications}
              unreadGroupMessagesCount={unreadGroupMessagesCount}
              chatMessages={chatMessages}
              tasks={tasks}
              users={users}
              socialAccounts={socialAccounts}
              onOpenAdminTab={handleOpenAdminTab}
            />
          )}

          {view === ViewMode.LANDING ? (
            <LandingPage onBack={() => setView(ViewMode.HOME)} />
          ) : (
            <main className="max-w-7xl mx-auto px-4 py-8">
                {selectedCategory === 'All' && (
                    <div className="space-y-12">
                      <HeroSlider 
                          articles={publishedArticles.filter(a => !a.isPublinota).slice(0, 4)} 
                          onArticleClick={handleArticleClick}
                      />
                    </div>
                )}

                <SponsorshipBanner sponsorship={homeLvl1Ad} onImpression={handleSponsorshipImpression} onClickEvent={handleSponsorshipClick} slotConfig={homeLvl1AdSlot} />

                <div className="mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <div id="news-feed-section" className="mb-8">
                    {selectedCategory !== 'All' && (
                        <div className="flex items-center gap-8 border-b border-white/10 pb-8">
                          {activeSocialAccount?.profileImageUrl && (
                            <img 
                              src={activeSocialAccount.profileImageUrl} 
                              alt={selectedCategory} 
                              className="w-20 h-20 rounded-full object-cover border-2 border-white/10 shadow-xl"
                            />
                          )}
                          <h2 className="text-4xl md:text-5xl font-oswald font-black italic uppercase text-white tracking-tighter">
                              {selectedCategory} A1TOQUE
                          </h2>
                        </div>
                    )}
                    </div>
                    
                    {homeFeedItems.length > 0 ? (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          {homeFeedItems}
                        </div>
                        
                        {totalPages > 1 && (
                          <div className="mt-12 flex flex-wrap justify-center items-center gap-4">
                            <button
                              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                              disabled={currentPage === 1}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all border border-white/10 flex items-center gap-2"
                            >
                              <ChevronLeft className="w-4 h-4" />
                              Anterior
                            </button>
                            
                            <div className="flex flex-wrap gap-2">
                              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                                // Show first, last, current, and neighbors
                                if (
                                  page === 1 || 
                                  page === totalPages || 
                                  (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => handlePageChange(page)}
                                      className={`w-10 h-10 rounded-lg font-bold transition-all border ${
                                        currentPage === page
                                          ? 'bg-neon text-black border-neon shadow-[0_0_15px_rgba(180,255,0,0.3)]'
                                          : 'bg-white/5 text-white border-white/10 hover:bg-white/10'
                                      }`}
                                    >
                                      {page}
                                    </button>
                                  );
                                }
                                
                                // Show dots
                                if (
                                  (page === 2 && currentPage > 3) || 
                                  (page === totalPages - 1 && currentPage < totalPages - 2)
                                ) {
                                  return <span key={page} className="text-white/20 self-center px-1">...</span>;
                                }
                                
                                return null;
                              })}
                            </div>

                            <button
                              onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                              disabled={currentPage === totalPages}
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-all border border-white/10 flex items-center gap-2"
                            >
                              Siguiente
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                    <div className="py-20 text-center text-gray-500 font-oswald font-bold uppercase italic text-xl border border-dashed border-white/10 rounded-3xl">
                        No hay noticias en <span style={{ color: activeColor }}>{selectedCategory}</span> todavía.
                    </div>
                    )}
                </div>

                <aside className="lg:col-span-1 space-y-12">
                    <SponsorshipBanner sponsorship={homeLvl3Ad} onImpression={handleSponsorshipImpression} onClickEvent={handleSponsorshipClick} slotConfig={homeLvl3AdSlot} />
                </aside>
                </div>
            </main>
          )}
          
          {view !== ViewMode.LANDING && !isLoading && (
            <footer className="bg-black border-t border-white/10 pt-24 pb-12 mt-32 relative overflow-hidden">
              {/* Background Accents */}
              <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-neon/50 to-transparent opacity-20"></div>
              
              <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-20">
                  
                  {/* Column 1: Brand */}
                  <div className="space-y-8">
                    {siteConfig.logoUrl && (
                      <img 
                        src={siteConfig.logoUrl} 
                        alt={siteConfig.siteName} 
                        className="h-12 w-auto object-contain opacity-90 hover:scale-105 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <h3 className="text-white font-oswald font-black italic text-3xl uppercase tracking-tighter leading-none">
                      10 AÑOS JUNTO <br /> AL HINCHA
                    </h3>
                  </div>
                  
                  {/* Column 2: Clubs */}
                  <div>
                    <h4 className="font-oswald font-black text-white uppercase italic text-sm tracking-widest mb-8 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-neon"></span> Clubes
                    </h4>
                    <ul className="space-y-4 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      {['Unión', 'Colón', 'Central', 'Newell\'s'].map(club => (
                        <li key={club}>
                          <button 
                            onClick={() => {
                              setSelectedCategory(club as Category);
                              window.scrollTo(0, 0);
                            }} 
                            className="hover:text-neon transition-all flex items-center gap-2 group"
                          >
                            <span className="w-0 group-hover:w-2 h-px bg-neon transition-all"></span> 
                            {club}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 3: Sections */}
                  <div>
                    <h4 className="font-oswald font-black text-white uppercase italic text-sm tracking-widest mb-8 flex items-center gap-2">
                      <span className="w-4 h-0.5 bg-neon"></span> Secciones
                    </h4>
                    <ul className="space-y-4 text-gray-500 text-[10px] font-black uppercase tracking-[0.2em]">
                      {['Noticias', 'Entrevistas', 'Programas', 'Virales'].map(section => (
                        <li key={section}>
                          <button 
                            onClick={() => {
                              setSelectedCategory(section as Category);
                              window.scrollTo(0, 0);
                            }} 
                            className="hover:text-neon transition-all flex items-center gap-2 group"
                          >
                            <span className="w-0 group-hover:w-2 h-px bg-neon transition-all"></span> 
                            {section}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Column 4: YouTube */}
                  <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-6 flex flex-col items-center text-center justify-center group hover:bg-white/[0.04] transition-all">
                    <Youtube size={40} className="text-red-600 mb-4 group-hover:scale-110 transition-transform" />
                    <h4 className="font-oswald font-black text-white uppercase italic text-lg tracking-tighter mb-4">
                      A1TOQUE TV
                    </h4>
                    <a 
                      href="https://www.youtube.com/@A1ToqueOficial" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-red-600 text-white font-black uppercase italic text-[9px] tracking-[0.2em] rounded-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
                    >
                      Suscribirse <ArrowUpRight size={12} />
                    </a>
                  </div>
                </div>

                {/* Social Bar */}
                <div className="py-12 border-y border-white/5 flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex items-center gap-4">
                    <span className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">Seguinos</span>
                    <div className="h-px w-8 bg-white/10"></div>
                    <div className="flex gap-4">
                      {socialAccounts.map(acc => (
                        <a 
                          key={acc.id} 
                          href={`https://instagram.com/${acc.handle.replace('@', '')}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="w-10 h-10 rounded-full overflow-hidden border border-white/10 hover:border-neon transition-all p-0.5 bg-black"
                          title={acc.name}
                        >
                          <img 
                            src={acc.profileImageUrl || 'https://placehold.co/100'} 
                            alt={acc.name} 
                            className="w-full h-full object-cover rounded-full"
                            referrerPolicy="no-referrer"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="text-neon/40 italic font-oswald text-lg tracking-tighter uppercase">
                    10 Años Junto al Hincha
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 flex flex-col md:flex-row justify-between items-center gap-4">
                  <div className="text-[9px] text-gray-700 font-black uppercase tracking-[0.4em]">
                    © {new Date().getFullYear()} A1TOQUE.
                  </div>
                  <div className="flex gap-6 text-[9px] text-gray-700 font-black uppercase tracking-[0.4em]">
                    <button className="hover:text-white transition-colors">Términos</button>
                    <button className="hover:text-white transition-colors">Privacidad</button>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </div>
      )}

      {currentUser && (view === ViewMode.HOME || view === ViewMode.ADMIN) && (
        <GroupChat 
          currentUser={currentUser} 
          allUsers={users} 
          onNewMessages={setUnreadGroupMessagesCount}
        />
      )}
    </div>
  );
};

export default App;