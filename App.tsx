import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { ViewMode, Article, Sponsorship, Category, User, Brand, SponsorshipType, SocialAccount, SocialPost, CategoryConfig, Role, SiteConfig, AdSlotConfig, INITIAL_AD_SLOTS, WorkLog, Task, ChatMessage } from './types';
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
import { db } from './services/firebase';
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc, writeBatch, getDoc } from 'firebase/firestore';
import { A1ToqueLoader } from './components/A1ToqueLoader';

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
  const [view, setView] = useState<ViewMode>(ViewMode.HOME);
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
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(DEFAULT_SITE_CONFIG);
  const [adSlots, setAdSlots] = useState<AdSlotConfig[]>([]);
  
  // AI Settings
  const [aiSystemPrompt, setAiSystemPrompt] = useState<string>(DEFAULT_AI_PROMPT);

  const [isLoading, setIsLoading] = useState(true);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState('');

  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [adminTab, setAdminTab] = useState<string | undefined>(undefined);
  const [adminTargetId, setAdminTargetId] = useState<string | undefined>(undefined);

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
        };
        
        const [articlesSnapshot, sponsorshipsSnapshot, brandsSnapshot, usersSnapshot, socialAccountsSnapshot, socialPostsSnapshot, categoriesSnapshot, rolesSnapshot, adSlotsSnapshot, workLogsSnapshot, tasksSnapshot, chatMessagesSnapshot] = await Promise.all([
          getDocs(collections.articles),
          getDocs(collections.sponsorships),
          getDocs(collections.brands),
          getDocs(collections.users),
          getDocs(collections.social_accounts),
          getDocs(collections.social_posts),
          getDocs(collections.categories),
          getDocs(collections.roles),
          getDocs(collections.ad_slots),
          getDocs(collections.work_logs),
          getDocs(collections.tasks),
          getDocs(collections.chat_messages),
        ]);

        setWorkLogs(workLogsSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as WorkLog)));
        setTasks(tasksSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Task)));
        setChatMessages(chatMessagesSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChatMessage)));

        // Load or create Site Config
        const siteConfigDoc = await getDoc(doc(db, 'config', 'site'));
        if (siteConfigDoc.exists()) {
          setSiteConfig({ ...DEFAULT_SITE_CONFIG, ...siteConfigDoc.data() } as SiteConfig);
        } else {
          await setDoc(doc(db, 'config', 'site'), DEFAULT_SITE_CONFIG);
          setSiteConfig(DEFAULT_SITE_CONFIG);
        }
        
        if (adSlotsSnapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_AD_SLOTS.forEach(item => batch.set(doc(db, "ad_slots", item.id), item));
          await batch.commit();
          setAdSlots(INITIAL_AD_SLOTS);
        } else {
          setAdSlots(adSlotsSnapshot.docs.map(doc => doc.data() as AdSlotConfig));
        }

        if (articlesSnapshot.empty) {
          setArticles([]);
        } else {
          const list = articlesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
          setArticles(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        }
        
        if (sponsorshipsSnapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_SPONSORSHIPS.forEach(item => batch.set(doc(db, "sponsorships", item.id), item));
          await batch.commit();
          setSponsorships(INITIAL_SPONSORSHIPS);
        } else {
          setSponsorships(sponsorshipsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Sponsorship)));
        }

        if (brandsSnapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_BRANDS.forEach(item => batch.set(doc(db, "brands", item.id), item));
          await batch.commit();
          setBrands(INITIAL_BRANDS);
        } else {
          setBrands(brandsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Brand)));
        }

        if (usersSnapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_USERS.forEach(item => batch.set(doc(db, "users", item.id), item));
          await batch.commit();
          setUsers(INITIAL_USERS);
        } else {
          setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User)));
        }

        if (socialAccountsSnapshot.empty) {
            const batch = writeBatch(db);
            INITIAL_SOCIAL_ACCOUNTS.forEach(item => batch.set(doc(db, "social_accounts", item.id), item));
            await batch.commit();
            setSocialAccounts(INITIAL_SOCIAL_ACCOUNTS);
        } else {
            setSocialAccounts(socialAccountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialAccount)));
        }

        if (categoriesSnapshot.empty) {
          const batch = writeBatch(db);
          INITIAL_CATEGORIES.forEach(item => batch.set(doc(db, "categories", item.id), item));
          await batch.commit();
          setCategories(INITIAL_CATEGORIES);
        } else {
          const fetchedCategories = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CategoryConfig));
          setCategories(fetchedCategories.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
        }

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

        const socialPostsList = socialPostsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SocialPost));
        setSocialPosts(socialPostsList.sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()));

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
  }, []);
  
  useEffect(() => {
    if (view === ViewMode.HOME && !isLoading) {
      const hasSeen = sessionStorage.getItem('a1toque_popup_seen');
      if (!hasSeen) {
        const timer = setTimeout(() => setShowPopup(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [view, isLoading]);

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
    setCurrentUser(null);
    setView(ViewMode.HOME);
  };

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
    const docRef = await addDoc(collection(db, 'articles'), cleanArticle);
    setArticles([{ ...cleanArticle, id: docRef.id } as Article, ...articles]);
  };
  const updateArticle = async (article: Article) => {
    const cleanArticle = removeUndefinedFields(article);
    await setDoc(doc(db, 'articles', article.id), cleanArticle, { merge: true });
    setArticles(articles.map(a => a.id === article.id ? cleanArticle as Article : a));
  };
  const deleteArticle = async (id: string) => {
    await deleteDoc(doc(db, 'articles', id));
    setArticles(articles.filter(a => a.id !== id));
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
    setUsers([...users, { ...cleanUser, id: docRef.id }]);
    return docRef;
  };
  const updateUser = async (user: User) => {
    const userToUpdate = removeUndefinedFields({ ...user });
    if (!user.password) {
      delete userToUpdate.password;
    }
    await setDoc(doc(db, 'users', user.id), userToUpdate, { merge: true });
    setUsers(users.map(u => u.id === user.id ? removeUndefinedFields(user) : u));
    if (currentUser?.id === user.id) {
        setCurrentUser(removeUndefinedFields(user));
    }
  };
  const deleteUser = async (id: string) => {
    await deleteDoc(doc(db, 'users', id));
    setUsers(users.filter(u => u.id !== id));
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
    const newPost = { ...cleanPost, id: docRef.id };
    setSocialPosts(prev => [newPost, ...prev].sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()));
    return newPost;
  };
  const updateSocialPost = async (post: SocialPost) => {
    const cleanPost = removeUndefinedFields(post);
    await setDoc(doc(db, 'social_posts', post.id), cleanPost, { merge: true });
    setSocialPosts(socialPosts.map(p => p.id === post.id ? cleanPost : p).sort((a, b) => new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()));
  };
  const deleteSocialPost = async (id: string) => {
    await deleteDoc(doc(db, 'social_posts', id));
    setSocialPosts(prev => prev.filter(p => p.id !== id));
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
    const docRef = await addDoc(collection(db, 'tasks'), cleanTask);
    setTasks(prev => [{ ...cleanTask, id: docRef.id }, ...prev]);
  };
  const updateTask = async (task: Task) => {
    const cleanTask = removeUndefinedFields(task);
    await setDoc(doc(db, 'tasks', task.id), cleanTask, { merge: true });
    setTasks(prev => prev.map(t => t.id === task.id ? cleanTask : t));
  };
  const deleteTask = async (id: string) => {
    await deleteDoc(doc(db, 'tasks', id));
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const addChatMessage = async (msg: Omit<ChatMessage, 'id'>) => {
    const cleanMsg = removeUndefinedFields(msg);
    const docRef = await addDoc(collection(db, 'chat_messages'), cleanMsg);
    setChatMessages(prev => [...prev, { ...cleanMsg, id: docRef.id }]);
  };

  const markChatAsRead = async (senderId: string) => {
    if (!currentUser) return;
    const unreadMsgs = chatMessages.filter(m => m.senderId === senderId && m.receiverId === currentUser.id && !m.isRead);
    if (unreadMsgs.length === 0) return;

    const batch = writeBatch(db);
    unreadMsgs.forEach(m => {
      batch.update(doc(db, 'chat_messages', m.id), { isRead: true });
    });
    await batch.commit();
    setChatMessages(prev => prev.map(m => (m.senderId === senderId && m.receiverId === currentUser.id) ? { ...m, isRead: true } : m));
  };

  const markTaskAsViewed = async (taskId: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === taskId);
    if (!task || (task.viewedByUserIds || []).includes(currentUser.id)) return;

    const updatedViewed = [...(task.viewedByUserIds || []), currentUser.id];
    await setDoc(doc(db, 'tasks', taskId), { viewedByUserIds: updatedViewed }, { merge: true });
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, viewedByUserIds: updatedViewed } : t));
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

  const activeColor = useMemo(() => {
    if (selectedCategory === 'All') return CLUB_COLORS['Default'];
    return CLUB_COLORS[selectedCategory] || CLUB_COLORS['Default'];
  }, [selectedCategory]);
  
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

  const showMainContent = !isLoading;
  
  const homeFeedItems = useMemo(() => {
    if (selectedCategory !== 'All' || homeLvl2Ads.length === 0 || !homeLvl2AdSlot) {
      return filteredArticles.map(art => <ArticleCard key={art.id} article={art} users={users} onClick={handleArticleClick} />);
    }

    const items: React.ReactNode[] = [];
    let adCounter = 0;
    const interval = homeLvl2AdSlot.injectInterval || siteConfig.homeAdInterval || 4;
    
    filteredArticles.forEach((art, index) => {
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
  }, [filteredArticles, selectedCategory, homeLvl2Ads, users, handleArticleClick, siteConfig.homeAdInterval, homeLvl2AdSlot, handleSponsorshipImpression, handleSponsorshipClick]);

  return (
    <div className="min-h-screen selection:bg-neon selection:text-black bg-black">
      {showLoginModal && <LoginModal onClose={() => setShowLoginModal(false)} onLogin={handleLogin} onRegister={handleRegister} />}
      {showWelcomeModal && <WelcomeModal userName={welcomeUserName} onClose={() => setShowWelcomeModal(false)} />}
      
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
              users={users}
              currentUser={currentUser}
              onClose={closeArticleModal} 
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
              chatMessages={chatMessages}
              tasks={tasks}
              users={users}
              onOpenAdminTab={handleOpenAdminTab}
            />
          )}

          {view === ViewMode.LANDING ? (
            <LandingPage onBack={() => setView(ViewMode.HOME)} />
          ) : (
            <main className="max-w-7xl mx-auto px-4 py-8">
                {selectedCategory === 'All' && (
                    <HeroSlider 
                        articles={publishedArticles.filter(a => !a.isPublinota).slice(0, 4)} 
                        onArticleClick={handleArticleClick}
                    />
                )}

                <SponsorshipBanner sponsorship={homeLvl1Ad} onImpression={handleSponsorshipImpression} onClickEvent={handleSponsorshipClick} slotConfig={homeLvl1AdSlot} />

                <div className="mt-12 grid grid-cols-1 lg:grid-cols-4 gap-12">
                <div className="lg:col-span-3">
                    <div className="mb-8">
                    {selectedCategory !== 'All' && (
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                        <h2 className="text-3xl font-oswald font-black italic uppercase text-white tracking-tighter">
                            NOTICIAS: {selectedCategory} <span style={{ color: activeColor }}>A1TOQUE</span>
                        </h2>
                        <button 
                            onClick={() => setSelectedCategory('All')}
                            className="px-4 py-1 bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase italic tracking-widest hover:text-neon transition-colors"
                        >
                            Limpiar Filtro
                        </button>
                        </div>
                    )}
                    </div>
                    
                    {homeFeedItems.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {homeFeedItems}
                      </div>
                    ) : (
                    <div className="py-20 text-center text-gray-500 font-oswald font-bold uppercase italic text-xl border border-dashed border-white/10 rounded-3xl">
                        No hay noticias en <span style={{ color: activeColor }}>{selectedCategory}</span> todavía.
                    </div>
                    )}
                </div>

                <aside className="lg:col-span-1 space-y-12">
                    <SponsorshipBanner sponsorship={homeLvl3Ad} onImpression={handleSponsorshipImpression} onClickEvent={handleSponsorshipClick} slotConfig={homeLvl3AdSlot} />
                    <div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] mb-8" style={{ color: activeColor }}>Tendencias</h3>
                    <div className="space-y-10">
                        {trendingArticles.map((art, idx) => (
                        <div 
                            key={art.id} 
                            onClick={() => handleArticleClick(art.id)}
                            className="flex items-start space-x-6 cursor-pointer group"
                        >
                            <span className="text-3xl font-oswald font-black text-white/10 group-hover:text-neon/20 transition-colors">
                            0{idx + 1}
                            </span>
                            <div>
                            <h4 className="font-oswald font-bold text-white group-hover:text-neon transition-colors leading-tight uppercase italic text-base">
                                {art.title}
                            </h4>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">{art.category}</span>
                                <span className="text-gray-700 text-[10px]">•</span>
                                <span className="text-[9px] text-neon/40 font-black uppercase tracking-widest">{art.views || 0} LECTURAS</span>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                    </div>
                </aside>
                </div>
            </main>
          )}
          
          {view !== ViewMode.LANDING && !isLoading && (
            <footer className="bg-black border-t border-white/10 py-20 mt-32">
              <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-16">
                <div className="col-span-1 md:col-span-2">
                  {siteConfig.logoUrl && (
                    <img 
                      src={siteConfig.logoUrl} 
                      alt={siteConfig.siteName} 
                      className="h-20 w-auto object-contain mb-8 opacity-90"
                    />
                  )}
                  <p className="mt-8 text-gray-500 text-sm max-w-sm font-medium uppercase tracking-widest leading-relaxed">
                    {siteConfig.footerText}
                  </p>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-white uppercase text-xs tracking-[0.4em] mb-6">Navegación</h4>
                  <ul className="text-gray-500 space-y-4 text-[10px] font-black uppercase tracking-widest">
                    <li><button onClick={() => setSelectedCategory('Unión')} className="hover:text-neon transition">Unión</button></li>
                    <li><button onClick={() => setSelectedCategory('Colón')} className="hover:text-neon transition">Colón</button></li>
                    <li><button onClick={() => setSelectedCategory('Central')} className="hover:text-neon transition">Central</button></li>
                    <li><button onClick={() => setSelectedCategory('Newell\'s')} className="hover:text-neon transition">Newell's</button></li>
                    <li><button onClick={() => setView(ViewMode.LANDING)} className="hover:text-neon transition">Inner Circle</button></li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-white uppercase text-xs tracking-[0.4em] mb-6">Legal</h4>
                  <ul className="text-gray-500 space-y-4 text-[10px] font-black uppercase tracking-widest">
                    <li><a href="#" className="hover:text-neon transition">Privacidad</a></li>
                    <li><a href="#" className="hover:text-neon transition">Términos</a></li>
                    <li><a href="#" className="hover:text-neon transition">Cookies</a></li>
                  </ul>
                </div>
              </div>
            </footer>
          )}
        </div>
      )}
    </div>
  );
};

export default App;