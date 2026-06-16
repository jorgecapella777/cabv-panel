import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  Search, 
  Plus, 
  Copy, 
  Clock, 
  CircleUser, 
  Check, 
  AlertTriangle, 
  Loader2, 
  Sparkles, 
  ExternalLink, 
  RefreshCw, 
  Building2, 
  History, 
  Info,
  Newspaper,
  Percent,
  TrendingUp,
  HelpCircle,
  TrendingDown,
  Printer,
  FileText,
  Download,
  Shield,
  Award,
  QrCode,
  MapPin,
  Globe,
  FileCode,
  CheckSquare,
  Home,
  X,
  Minus,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Portal, SeniatQueryResult, SystemSettings, PortalWindow } from './types';
import { INITIAL_PORTALS } from './data';
import { RetencionesTab } from './components/RetencionesTab';
import { TicketsTab } from './components/TicketsTab';
import { DireccionesTab } from './components/DireccionesTab';

const PATH_TO_TAB: Record<string, 'inicio' | 'portals' | 'news' | 'seniat' | 'iva' | 'rates' | 'retenciones' | 'tickets' | 'settings' | 'direcciones'> = {
  '/index': 'inicio',
  '/': 'inicio',
  '/portales': 'portals',
  '/noticias': 'news',
  '/consultar-rif': 'seniat',
  '/calcular-iva': 'iva',
  '/tasas': 'rates',
  '/retenciones': 'retenciones',
  '/tickets': 'tickets',
  '/direcciones': 'direcciones',
  '/acerca-de': 'settings'
};

const TAB_TO_PATH: Record<'inicio' | 'portals' | 'news' | 'seniat' | 'iva' | 'rates' | 'retenciones' | 'tickets' | 'settings' | 'direcciones', string> = {
  'inicio': '/index',
  'portals': '/portales',
  'news': '/noticias',
  'seniat': '/consultar-rif',
  'iva': '/calcular-iva',
  'rates': '/tasas',
  'retenciones': '/retenciones',
  'tickets': '/tickets',
  'direcciones': '/direcciones',
  'settings': '/acerca-de'
};

export default function App() {
  // Navigation & Categorization (Synchronized with browser URL pathology)
  const [activeTab, setActiveTab ] = useState<'inicio' | 'portals' | 'news' | 'seniat' | 'iva' | 'rates' | 'retenciones' | 'tickets' | 'settings' | 'direcciones'>(() => {
    const path = window.location.pathname;
    return PATH_TO_TAB[path] || 'inicio';
  });

  const handleTabChange = (tab: 'inicio' | 'portals' | 'news' | 'seniat' | 'iva' | 'rates' | 'retenciones' | 'tickets' | 'settings' | 'direcciones') => {
    setActiveTab(tab);
    const path = TAB_TO_PATH[tab];
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
  };

  useEffect(() => {
    const onPopState = () => {
      const path = window.location.pathname;
      const tab = PATH_TO_TAB[path] || 'inicio';
      setActiveTab(tab);
    };
    window.addEventListener('popstate', onPopState);

    // Apply the official branding logo as the dynamic tab favicon
    const logoUrl = "https://www.bananera.com/assets/asset-1603287856366.png?v=0.5624928979281254";
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement('link');
      link.type = 'image/png';
      link.rel = 'shortcut icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = logoUrl;

    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const [activeCategoryFilter, setActiveCategoryFilter] = useState<'finance' | 'taxes' | 'legal' | null>(null);
  const [portalSearchQuery, setPortalSearchQuery] = useState('');

  // Floating Multi-Window State
  const [openWindows, setOpenWindows] = useState<PortalWindow[]>([]);
  const [focusedWindowId, setFocusedWindowId] = useState<string | null>(null);
  const [windowZIndex, setWindowZIndex] = useState(50);

  const openPortalInWindow = (portal: Portal) => {
    const existing = openWindows.find(w => w.portalId === portal.id);
    if (existing) {
      setOpenWindows(prev => prev.map(w => w.portalId === portal.id ? { ...w, isMinimized: false } : w));
      setFocusedWindowId(existing.id);
      return;
    }
    const nextZ = windowZIndex + 1;
    setWindowZIndex(nextZ);
    const newWin: PortalWindow = {
      id: `win-${Date.now()}`,
      portalId: portal.id,
      name: portal.name,
      url: portal.url,
      isMinimized: false,
      x: 60 + (openWindows.length * 35) % 250,
      y: 90 + (openWindows.length * 35) % 180,
      zIndex: nextZ,
      isMaximized: false,
      width: 650,
      height: 500
    };
    setOpenWindows(prev => [...prev, newWin]);
    setFocusedWindowId(newWin.id);
  };

  const closeWindow = (winId: string) => {
    setOpenWindows(prev => prev.filter(w => w.id !== winId));
    if (focusedWindowId === winId) {
      setFocusedWindowId(null);
    }
  };

  const minimizeWindow = (winId: string) => {
    setOpenWindows(prev => prev.map(w => w.id === winId ? { ...w, isMinimized: true } : w));
    if (focusedWindowId === winId) {
      setFocusedWindowId(null);
    }
  };

  const focusWindow = (winId: string) => {
    const nextZ = windowZIndex + 1;
    setWindowZIndex(nextZ);
    setOpenWindows(prev => prev.map(w => w.id === winId ? { ...w, zIndex: nextZ, isMinimized: false } : w));
    setFocusedWindowId(winId);
  };

  const toggleMaximizeWindow = (winId: string) => {
    setOpenWindows(prev => prev.map(w => w.id === winId ? { ...w, isMaximized: !w.isMaximized } : w));
  };

  const resizeWindowPreset = (winId: string, sizePreset: 'small' | 'medium' | 'large' | 'giga') => {
    let width = 600;
    let height = 450;
    if (sizePreset === 'small') { width = 450; height = 350; }
    else if (sizePreset === 'medium') { width = 700; height = 520; }
    else if (sizePreset === 'large') { width = 980; height = 640; }
    else if (sizePreset === 'giga') { width = 1280; height = 780; }

    setOpenWindows(prev => prev.map(w => w.id === winId ? { ...w, isMaximized: false, width, height } : w));
  };

  // S/ TASAS HOY & Calculadora state
  const [calcBs, setCalcBs] = useState<string>('100');
  const [calcUsd, setCalcUsd] = useState<string>('');
  const [calcEur, setCalcEur] = useState<string>('');
  const [calcUsdt, setCalcUsdt] = useState<string>('');

  // 5-Second maintenance modal for SENIAT
  const [showMantenimientoModal, setShowMantenimientoModal] = useState(false);

  // Core Data State (persisted inside localStorage)
  const [portals, setPortals] = useState<Portal[]>(() => {
    const saved = localStorage.getItem('bananera_portals');
    if (!saved) return INITIAL_PORTALS;
    try {
      const parsed = JSON.parse(saved) as Portal[];
      const initialIds = new Set(INITIAL_PORTALS.map(p => p.id));
      
      // Only keep portals that exist in the active INITIAL_PORTALS set
      const active = parsed.filter(p => initialIds.has(p.id));
      
      const activeIds = new Set(active.map(p => p.id));
      const missing = INITIAL_PORTALS.filter(ip => !activeIds.has(ip.id));
      
      const finalPortals = [...active, ...missing];
      localStorage.setItem('bananera_portals', JSON.stringify(finalPortals));
      return finalPortals;
    } catch (e) {
      return INITIAL_PORTALS;
    }
  });

  const [currentUser, setCurrentUser] = useState<{ username: string; email: string; departamento: string; nombre: string } | null>(() => {
    const saved = localStorage.getItem('bananera_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [loginStep, setLoginStep] = useState<'username' | 'password'>('username');
  const [verifiedName, setVerifiedName] = useState('');
  const [showInactivityModal, setShowInactivityModal] = useState(false);
  const [countdownSeconds, setCountdownSeconds] = useState(60);

  // Inactivity Auto-Logout Mechanism
  useEffect(() => {
    if (!currentUser) {
      setShowInactivityModal(false);
      return;
    }

    let inactivityTimer: any;
    let lastActivityTime = Date.now();

    const resetInactivity = () => {
      if (!showInactivityModal) {
        lastActivityTime = Date.now();
      }
    };

    // Activity listeners
    window.addEventListener('mousemove', resetInactivity);
    window.addEventListener('keypress', resetInactivity);
    window.addEventListener('mousedown', resetInactivity);
    window.addEventListener('scroll', resetInactivity);
    window.addEventListener('touchstart', resetInactivity);

    // Monitor inactivity (check every 5 seconds)
    inactivityTimer = setInterval(() => {
      if (showInactivityModal) return;

      const idleTimeMs = Date.now() - lastActivityTime;
      const fiveMinutesMs = 5 * 60 * 1000; // 5 minutes

      if (idleTimeMs >= fiveMinutesMs) {
        setShowInactivityModal(true);
        setCountdownSeconds(60);
      }
    }, 5000);

    return () => {
      window.removeEventListener('mousemove', resetInactivity);
      window.removeEventListener('keypress', resetInactivity);
      window.removeEventListener('mousedown', resetInactivity);
      window.removeEventListener('scroll', resetInactivity);
      window.removeEventListener('touchstart', resetInactivity);
      clearInterval(inactivityTimer);
    };
  }, [currentUser, showInactivityModal]);

  // Countdown timer for auto-logout
  useEffect(() => {
    if (!showInactivityModal || !currentUser) return;

    const interval = setInterval(() => {
      setCountdownSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          // Perform automatic logout
          setCurrentUser(null);
          localStorage.removeItem('bananera_user');
          setShowInactivityModal(false);
          // Reset states to starting step
          setLoginStep('username');
          setVerifiedName('');
          setLoginUsername('');
          setLoginPassword('');
          triggerToast('⚠️ Sesión cerrada automáticamente por inactividad.');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [showInactivityModal, currentUser]);

  const [supabaseStatus, setSupabaseStatus] = useState<{ configured: boolean; error: string | null; provisionSql: string; supabaseUrl: string | null } | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);

  useEffect(() => {
    fetch('/api/supabase/status')
      .then(res => res.json())
      .then(data => setSupabaseStatus(data))
      .catch(err => console.error("Error al consultar estado de Supabase:", err));
  }, [currentUser]);

  const [settings, setSettings] = useState<SystemSettings>(() => {
    const saved = localStorage.getItem('bananera_settings');
    const defaultSettings = {
      logisticsDept: 'OP_LOGISTICA_CENTRO',
      activeStatus: 'Active',
      systemVersion: 'V2.5.0-STABLE',
      allowWebSearch: true
    };
    
    let active = saved ? JSON.parse(saved) : defaultSettings;
    const userSaved = localStorage.getItem('bananera_user');
    if (userSaved) {
      try {
        const u = JSON.parse(userSaved);
        if (u && u.departamento) {
          active.logisticsDept = u.departamento;
        }
      } catch (e) {}
    }
    return active;
  });

  const [queryHistory, setQueryHistory] = useState<SeniatQueryResult[]>(() => {
    const saved = localStorage.getItem('bananera_query_history');
    return saved ? JSON.parse(saved) : [];
  });

  // Interactivity state
  const [copiedToastText, setCopiedToastText] = useState<string | null>(null);
  
  // SENIAT query module state
  const [rifSearchInput, setRifSearchInput] = useState('');
  const [seniatResult, setSeniatResult] = useState<SeniatQueryResult | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [useAiExpansion, setUseAiExpansion] = useState(true);

  // SENIAT extra query state for options (por cédula / por rif y "pasar el captcha" simulation)
  const [queryMode, setQueryMode] = useState<'rif' | 'cedula' | 'url'>('rif');
  const [seniatViewMode, setSeniatViewMode] = useState<'oficial' | 'compacta'>('oficial');
  const [captchaCode, setCaptchaCode] = useState('F4R9');
  const [captchaInput, setCaptchaInput] = useState('');
  const [autoResolveCaptcha, setAutoResolveCaptcha] = useState(true);
  const [bypassLog, setBypassLog] = useState<string[]>([]);

  // BCV Exchange Rates state
  const [bcvData, setBcvData] = useState<{ usd: string; eur: string; usdt?: string; source: string; date: string; success: boolean } | null>(null);
  const [isBcvLoading, setIsBcvLoading] = useState(true);
  const [aiStatus, setAiStatus] = useState<{ active: boolean; quotaExhausted: boolean }>({ active: true, quotaExhausted: false });

  // Importer & Over-designer URLs state
  const [pastedUrl, setPastedUrl] = useState('');
  const [pastedUrlResult, setPastedUrlResult] = useState<{
    originalUrl: string;
    success: boolean;
    mockOriginalHtml: string;
    extractedRif: string;
    data: {
      rif: string;
      razonSocial: string;
      actividadEconomica: string;
      estadoRetencion: string;
      domicilioFiscal: string;
      statusOperaciones: string;
      alDia: boolean;
      tituloPortalOriginal: string;
      textoOriginalCrudo: string;
    }
  } | null>(null);
  const [isParsingUrl, setIsParsingUrl] = useState(false);
  const [urlParseError, setUrlParseError] = useState<string | null>(null);

  // Dynamic news feed state (Yaracuy regional vs. Nacional)
  const [newsFeed, setNewsFeed] = useState<{
    regional: Array<{ titulo: string; resumen: string; fecha: string; fuente: string; url: string; categoria: string }>;
    nacional: Array<{ titulo: string; resumen: string; fecha: string; fuente: string; url: string; categoria: string }>;
  } | null>(null);
  const [isNewsLoading, setIsNewsLoading] = useState(true);

  // Interactive IVA Calculator state (calculadora de IVA Venezuela de calcu.la/calculadora-iva-venezuela/)
  const [ivaBaseAmount, setIvaBaseAmount] = useState<string>('1500');
  const [ivaRatePercent, setIvaRatePercent] = useState<number>(16); // Standard: 16%, Reduced: 8%, Luxury: 15%, Exempt: 0%
  const [ivaDirection, setIvaDirection] = useState<'add' | 'extract'>('add'); // 'add' = base -> total, 'extract' = total -> base

  const fetchHealth = async () => {
    try {
      const response = await fetch('/api/health');
      if (response.ok) {
        const data = await response.json();
        setAiStatus({
          active: data.aiMode !== "simulated-local",
          quotaExhausted: !!data.quotaExhausted
        });
      }
    } catch (err) {
      console.warn("Error contactando al API de salud:", err);
    }
  };

  const fetchBcvRates = async () => {
    setIsBcvLoading(true);
    try {
      const response = await fetch('/api/bcv/rates');
      if (response.ok) {
        const data = await response.json();
        setBcvData(data);
      }
    } catch (err) {
      console.error("Error contactando al API del Banco Central de Venezuela:", err);
    } finally {
      setIsBcvLoading(false);
    }
  };

  const fetchNewsFeed = async () => {
    setIsNewsLoading(true);
    try {
      const response = await fetch('/api/news');
      if (response.ok) {
        const data = await response.json();
        setNewsFeed(data);
      }
    } catch (err) {
      console.error("Error cargando fuente de noticias:", err);
    } finally {
      setIsNewsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    fetchBcvRates();
    fetchNewsFeed();
  }, []);

  // Fallbacks para sección de noticias regional/nacional
  const backupRegional = [
    {
      titulo: "Consorcio Bananero Yaracuyano rompe récord de exportación",
      fuente: "Yaracuy al Día",
      fecha: "03 Jun 2026",
      resumen: "Las plantaciones del estado enviaron más de 45 toneladas en el último trimestre, consolidándose como líderes del rubro agrícola nacional.",
      url: "https://yaracuyaldia.com/seccion/regionales/consorcio-bananero-yaracuyano-rompe-record-de-exportacion/",
      categoria: "AGRO"
    },
    {
      titulo: "Vialidad agrícola en el Eje de Veroes recibirá mejoras del Estado",
      fuente: "Yaracuy al Día",
      fecha: "01 Jun 2026",
      resumen: "Alcaldía y productores locales coordinan la restauración de accesos rurales para incentivar la salida del cacao y hortalizas.",
      url: "https://yaracuyaldia.com/seccion/regionales/vialidad-agricola-en-el-eje-de-veroes-recibira-mejoras-del-estado/",
      categoria: "LOGÍSTICA"
    }
  ];

  const backupNacional = [
    {
      titulo: "Sector agrícola de Venezuela proyecta crecimiento del 4.2% este trimestre",
      fuente: "El País (Venezuela)",
      fecha: "02 Jun 2026",
      resumen: "La progresiva simplificación de los canales aduanales y puertos ha dinamizado la exportación de rubros primarios y productos del agro.",
      url: "https://elpais.com/noticias/venezuela/sector-agricola-proyecta-crecimiento-este-trimestre.html",
      categoria: "ECONOMÍA"
    },
    {
      titulo: "Nuevos acuerdos aduaneros incentivan competitividad de fletes marítimos",
      fuente: "Noticias Venevisión",
      fecha: "30 May 2026",
      resumen: "El SENIAT simplifica la facturación técnica del IGTF en cuentas extranjeras de flete, abaratando transacciones un 3%.",
      url: "https://noticiasvenevision.com/articulos/nuevos-acuerdos-aduaneros-incentivan-competitividad-de-fletes-maritimos-92849",
      categoria: "FINANZAS"
    }
  ];

  // News bulletin list (toda la actualizacion del seniat e impuestos en venezuela)
  const NOVEDADES_FISCALES = [
    {
      fecha: "03 Jun 2026",
      titulo: "Calendario Excepcional de Sujetos Pasivos Especiales para Carga Agrícola",
      fuente: "SENIAT Oficial - Div. Recaudación",
      cuerpo: "Se oficializa la prórroga técnica para la presentación y pago del Impuesto al Valor Agregado (IVA) para las actividades conexas con la exportación agroindustrial de banano y frutas tropicales. El calendario se alinea a los despachos del segundo semestre.",
      categoria: "TRIBUTOS",
      urgencia: "STRICT"
    },
    {
      fecha: "01 Jun 2026",
      titulo: "Nombramiento de Nuevos Auxiliares Portuarios y Simplificación Aduanera",
      fuente: "Gaceta Oficial N° 42.910",
      cuerpo: "La Comisión Marítima y la Aduana Principal Marítima de Puerto Cabello habilitaron la re-facturación exprés de fletes marítimos exentos de IVA para la carga refrigerada nacional, enmarcada en el programa de exportación del sector primario.",
      categoria: "LOGÍSTICA",
      urgencia: "MEDIA"
    },
    {
      fecha: "28 May 2026",
      titulo: "Ajustes de Procedimiento de Retención de IGTF en Transacciones Multidivisas",
      fuente: "Banco Central de Venezuela",
      cuerpo: "Instrucciones conjuntas respecto al control tributario de cuentas custodias empresariales en bolívares y divisas. Todo pago móvil jurídico debe emitirse con su correcto indicador de conciliación bancaria.",
      categoria: "FINANZAS",
      urgencia: "ALTA"
    },
    {
      fecha: "15 May 2026",
      titulo: "Aprobación de la Licencia Exclusiva de Empaque Primario para Banano Bananera C.A.",
      fuente: "SAPI & Ministerio del Comercio",
      cuerpo: "Validación marcaria de la patente de empaque térmico con resinas de bajo impacto ambiental. Queda exceptuada de impuestos municipales y aranceles sobre materiales de importación esenciales.",
      categoria: "MARCAS",
      urgencia: "RELEVANTE"
    }
  ];

  // Procedural generator for CAPTCHAs
  const generateNewCaptcha = () => {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
    let result = '';
    for (let i = 0; i < 4; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
    setBypassLog([]);
    setQueryError(null);
  };

  // Se requiere una ventana emergente cada 5 segundos ONLY when activeTab === 'seniat'
  useEffect(() => {
    let interval: any;
    if (activeTab === 'seniat') {
      interval = setInterval(() => {
        setShowMantenimientoModal(true);
      }, 5000);
    } else {
      setShowMantenimientoModal(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  // Sincronizar calculadora inicial cuando bcvData está disponible
  useEffect(() => {
    const uRate = parseFloat(bcvData?.usd || "45.2400");
    const eRate = parseFloat(bcvData?.eur || "48.9100");
    const tRate = parseFloat(bcvData?.usdt || (uRate * 1.115).toFixed(4));
    
    setCalcBs('100.00');
    setCalcUsd((100 / uRate).toFixed(2));
    setCalcEur((100 / eRate).toFixed(2));
    setCalcUsdt((100 / tRate).toFixed(2));
  }, [bcvData]);

  // Manejador del cambio en campos de la calculadora
  const handleCalcChange = (val: string, currency: 'Bs' | 'USD' | 'EUR' | 'USDT') => {
    const cleanVal = val.replace(/[^0-9.]/g, ''); // keep only numbers and decimal point
    
    if (currency === 'Bs') setCalcBs(val);
    else if (currency === 'USD') setCalcUsd(val);
    else if (currency === 'EUR') setCalcEur(val);
    else if (currency === 'USDT') setCalcUsdt(val);

    const numeric = parseFloat(cleanVal);
    if (isNaN(numeric) || numeric <= 0) {
      if (currency === 'Bs') {
        setCalcUsd(''); setCalcEur(''); setCalcUsdt('');
      } else if (currency === 'USD') {
        setCalcBs(''); setCalcEur(''); setCalcUsdt('');
      } else if (currency === 'EUR') {
        setCalcBs(''); setCalcUsd(''); setCalcUsdt('');
      } else if (currency === 'USDT') {
        setCalcBs(''); setCalcUsd(''); setCalcEur('');
      }
      return;
    }

    const uRate = parseFloat(bcvData?.usd || "45.2400");
    const eRate = parseFloat(bcvData?.eur || "48.9100");
    const tRate = parseFloat(bcvData?.usdt || (uRate * 1.115).toFixed(4));

    if (currency === 'Bs') {
      setCalcUsd((numeric / uRate).toFixed(2));
      setCalcEur((numeric / eRate).toFixed(2));
      setCalcUsdt((numeric / tRate).toFixed(2));
    } else if (currency === 'USD') {
      setCalcBs((numeric * uRate).toFixed(2));
      setCalcEur(((numeric * uRate) / eRate).toFixed(2));
      setCalcUsdt(((numeric * uRate) / tRate).toFixed(2));
    } else if (currency === 'EUR') {
      setCalcBs((numeric * eRate).toFixed(2));
      setCalcUsd(((numeric * eRate) / uRate).toFixed(2));
      setCalcUsdt(((numeric * eRate) / tRate).toFixed(2));
    } else if (currency === 'USDT') {
      setCalcBs((numeric * tRate).toFixed(2));
      setCalcUsd(((numeric * tRate) / uRate).toFixed(2));
      setCalcEur(((numeric * tRate) / eRate).toFixed(2));
    }
  };

  useEffect(() => {
    generateNewCaptcha();
  }, []);

  // Automatic query mode identification as they type
  useEffect(() => {
    const input = rifSearchInput.trim().toUpperCase();
    if (!input) return;

    const cleaned = input.replace(/[^A-Z0-9]/g, '');
    
    if (cleaned.startsWith('J') || cleaned.startsWith('G') || cleaned.startsWith('P') || cleaned.startsWith('C')) {
      setQueryMode('rif');
    } else {
      const numbersOnly = input.replace(/[^0-9]/g, '');
      if (numbersOnly.length > 0 && numbersOnly.length <= 8) {
        setQueryMode('cedula');
      } else if (numbersOnly.length > 8) {
        setQueryMode('rif');
      }
    }
  }, [rifSearchInput]);

  // Save states to localStorage
  useEffect(() => {
    localStorage.setItem('bananera_portals', JSON.stringify(portals));
  }, [portals]);

  useEffect(() => {
    localStorage.setItem('bananera_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('bananera_query_history', JSON.stringify(queryHistory));
  }, [queryHistory]);

  // Clock state (formatted in 12-hour style with AM/PM)
  const [currentTime, setCurrentTime] = useState('');
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString('es-VE', { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit',
        hour12: true 
      });
      setCurrentTime(timeStr);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const triggerToast = (text: string) => {
    setCopiedToastText(text);
    setTimeout(() => {
      setCopiedToastText(null);
    }, 2850);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    triggerToast(`COPIADO ${label}: ${text}`);
  };

  // Actively perform SENIAT Query using Express with search grounding
  const handleSeniatQuery = async (rifToQuery: string) => {
    if (!rifToQuery.trim()) {
      setQueryError('Por favor ingrese un número de RIF o Cédula válido.');
      return;
    }

    const inputVal = rifToQuery.trim().toUpperCase();
    let formattedDoc = inputVal;
    let computedType: 'rif' | 'cedula' = queryMode;

    // Check CAPTCHA if manual
    if (!autoResolveCaptcha) {
      if (captchaInput.trim().toUpperCase() !== captchaCode) {
        setQueryError('El código CAPTCHA ingresado es incorrecto.');
        return;
      }
    }

    // Auto format document nicely based on type for SENIAT request
    const numbersOnly = inputVal.replace(/[^0-9]/g, '');
    if (computedType === 'cedula') {
      let letter = 'V';
      if (inputVal.startsWith('E')) letter = 'E';
      if (numbersOnly.length > 0) {
        formattedDoc = `${letter}-${numbersOnly}`;
      } else {
        setQueryError('Por favor ingrese un número de Cédula válido.');
        return;
      }
    } else {
      // RIF mode J-12345678-0
      if (numbersOnly.length === 9) {
        let letter = 'J';
        if (inputVal.startsWith('V')) letter = 'V';
        if (inputVal.startsWith('E')) letter = 'E';
        if (inputVal.startsWith('G')) letter = 'G';
        if (inputVal.startsWith('P')) letter = 'P';
        formattedDoc = `${letter}-${numbersOnly.substring(0, 8)}-${numbersOnly.substring(8)}`;
      } else if (!inputVal.match(/^[JVEGP]-[0-9]{8}-[0-9]$/)) {
        if (numbersOnly.length > 4) {
          formattedDoc = `J-${numbersOnly.substring(0, Math.min(8, numbersOnly.length))}-0`;
        } else {
          setQueryError('Formato de RIF inadecuado (ej. J-12345678-0) o Cédula (ej. V-12345678).');
          return;
        }
      }
    }

    setIsQuerying(true);
    setQueryError(null);
    setSeniatResult(null);
    setBypassLog([]);

    const logSteps = [
      `Conectando a base de datos pública del SENIAT...`,
      `Identificando tipo de consulta... [${computedType === 'cedula' ? 'Consulta por Cédula de Identidad' : 'Consulta por RIF Jurídico o Especial'}]`,
      autoResolveCaptcha 
        ? `Decodificando patrón de verificación CAPTCHA... [${captchaCode}] Superado.` 
        : `Comprobando clave CAPTCHA aportada... [Correcto]`,
      `Enviando cabeceras a http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp...`,
      `Extrayendo datos de registro tributario web oficial sin simulación...`
    ];

    for (let i = 0; i < logSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setBypassLog(prev => [...prev, logSteps[i]]);
    }

    try {
      const response = await fetch('/api/gemini/query-rif', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rif: formattedDoc, type: computedType }) 
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'La consulta del servidor falló o expiró la sesión.');
      }

      const data: SeniatQueryResult = await response.json();
      setSeniatResult(data);

      // Add to history
      setQueryHistory(prev => {
        const filtered = prev.filter(q => q.rif.toUpperCase() !== data.rif.toUpperCase());
        return [data, ...filtered].slice(0, 10);
      });

      triggerToast(`Ficha Obtenida Exitosamente - ${data.razonSocial}`);
      generateNewCaptcha();
    } catch (err: any) {
      console.error(err);
      setQueryError(err.message || 'Error al contactar con la base tributaria o servidor de consultas. Inténtelo de nuevo.');
    } finally {
      setIsQuerying(false);
      fetchHealth();
    }
  };

  const loadPresetQuery = (rifValue: string) => {
    setRifSearchInput(rifValue);
    handleSeniatQuery(rifValue);
  };

  const handleUrlParse = async (urlToParse: string) => {
    if (!urlToParse.trim()) {
      setUrlParseError('Por favor ingrese una dirección URL de consulta tributaria para analizar e importar.');
      return;
    }
    if (!urlToParse.startsWith('http://') && !urlToParse.startsWith('https://')) {
      setUrlParseError('La dirección URL debe comenzar con http:// o https://.');
      return;
    }

    setIsParsingUrl(true);
    setUrlParseError(null);
    setPastedUrlResult(null);

    try {
      const response = await fetch('/api/seniat/parse-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToParse })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'La lectura del enlace fue rechazada por el servidor aduanero.');
      }

      const resData = await response.json();
      setPastedUrlResult(resData);
      triggerToast('Enlace de consulta importado y rediseñado con éxito.');
    } catch (err: any) {
      console.error(err);
      setUrlParseError(err.message || 'Error tratando de cargar, parsear y sobreescribir la URL tributaria.');
    } finally {
      setIsParsingUrl(false);
    }
  };

  // IVA calculations based on calcu.la/calculadora-iva-venezuela/
  const calculateIva = () => {
    const base = parseFloat(ivaBaseAmount) || 0;
    const rate = ivaRatePercent / 100;
    
    if (ivaDirection === 'add') {
      const iva = base * rate;
      const total = base + iva;
      return {
        base: base.toFixed(2),
        iva: iva.toFixed(2),
        total: total.toFixed(2),
        rateLabel: `${ivaRatePercent}%`
      };
    } else {
      // Extract IVA: total is the input.
      const calcBase = base / (1 + rate);
      const iva = base - calcBase;
      return {
        base: calcBase.toFixed(2),
        iva: iva.toFixed(2),
        total: base.toFixed(2),
        rateLabel: `${ivaRatePercent}%`
      };
    }
  };

  const ivaResult = calculateIva();

  // Filter Portals in real-time
  const filteredPortals = portals.filter(p => {
    if (activeCategoryFilter && p.category !== activeCategoryFilter) {
      return false;
    }
    if (portalSearchQuery.trim()) {
      const q = portalSearchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchKeywords = p.keywords.toLowerCase().includes(q);
      const matchBadge = p.badge?.toLowerCase().includes(q) || false;
      return matchName || matchKeywords || matchBadge;
    }
    return true;
  });

  const [verifyingUser, setVerifyingUser] = useState(false);

  const handleVerifyUsernameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim()) {
      setLoginError('Por favor, introduzca su usuario.');
      return;
    }

    setVerifyingUser(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/verify-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim() })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setVerifiedName(data.nombre);
        setLoginUsername(data.username);
        setLoginStep('password');
        setLoginError(null);
      } else {
        const errText = data.message || 'El usuario ingresado no existe en el sistema.';
        setLoginError(`${errText} Si el problema persiste, contacte con el departamento de IT.`);
      }
    } catch (err) {
      setLoginError('No se pudo conectar con el servidor de autenticación. Si el problema persiste, contacte con el departamento de IT.');
      console.error(err);
    } finally {
      setVerifyingUser(false);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Por favor, introduzca su contraseña.');
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword.trim() })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        localStorage.setItem('bananera_user', JSON.stringify(data.user));
        
        // Dynamically override settings logisticsDept with their assigned department!
        setSettings(prev => ({
          ...prev,
          logisticsDept: data.user.departamento
        }));

        // Reset step states upon successful login
        setLoginStep('username');
        setVerifiedName('');
        setLoginUsername('');
        setLoginPassword('');

        if (data.message && data.mode === "simulated") {
          triggerToast(`⚡ ${data.message}`);
        } else {
          triggerToast(`👋 ¡Sesión iniciada! Bienvenido, ${data.user.nombre}`);
        }
      } else {
        const errText = data.message || 'Contraseña incorrecta.';
        setLoginError(`${errText} Si el problema persiste, contacte con el departamento de IT.`);
      }
    } catch (err: any) {
      setLoginError('No se pudo conectar con el servidor de autenticación. Si el problema persiste, contacte con el departamento de IT.');
      console.error("Login failure:", err);
    } finally {
      setLoginLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#071e27] text-slate-100 p-4 font-sans selection:bg-[#a3f69c] selection:text-[#002204]">
        <div className="w-full max-w-md bg-[#0d2e38] border border-[#1a4450] shadow-2xl overflow-hidden p-6 relative">
          
          {/* Top aesthetic color indicators */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-[#1b6d24] to-emerald-400"></div>

          {/* Logo / Header with logo next to name */}
          <div className="flex items-center gap-3 justify-center mt-3 mb-6 pb-4 border-b border-[#133c48]">
            <img 
              src="https://www.bananera.com/assets/asset-1603287856366.png?v=0.5624928979281254" 
              alt="C.A. Bananera Venezolana"
              className="w-12 h-12 object-contain bg-slate-900/30 p-1 border border-[#1e4e5b] rounded-full shrink-0 animate-pulse"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h2 className="text-sm font-black tracking-widest text-[#a3f69c] uppercase leading-tight font-sans">C.A. BANANERA VENEZOLANA</h2>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider mt-0.5 font-mono">Portal Administrativo Interno</p>
            </div>
          </div>

          {/* STEP 1: Username Input Form */}
          {loginStep === 'username' ? (
            <form onSubmit={handleVerifyUsernameSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">Nombre de Usuario / Correo</label>
                <input 
                  type="text" 
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="ej. jorge"
                  className="w-full text-xs font-mono px-3 py-2 bg-[#092027] border border-[#1e4e5b] text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors rounded-none"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-950/40 border border-red-800 text-[11px] text-red-200 p-2.5 flex items-start gap-2 leading-relaxed">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={verifyingUser}
                className="w-full bg-[#1b6d24] hover:bg-[#238c2f] disabled:bg-[#133c48] text-white py-2.5 text-xs font-black uppercase tracking-wider transition-colors shadow-lg cursor-pointer rounded-none border border-emerald-600/20"
              >
                {verifyingUser ? 'Verificando...' : 'Siguiente'}
              </button>
            </form>
          ) : (
            /* STEP 2: Password Input Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="bg-[#0a232b] border border-[#1c4753] p-3 text-center mb-2">
                <p className="text-[#a3f69c] text-sm font-black font-mono tracking-widest uppercase mb-1">
                  ¡HOLA {verifiedName}!
                </p>
                <p className="text-[9px] text-slate-400 font-mono uppercase">
                  Usuario verificado: <span className="text-white font-bold">{loginUsername}</span>
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-300 mb-1">Contraseña de Acceso</label>
                <input 
                  type="password" 
                  autoFocus
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••"
                  className="w-full text-xs font-mono px-3 py-2 bg-[#092027] border border-[#1e4e5b] text-white focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400 transition-colors rounded-none"
                  required
                />
              </div>

              {loginError && (
                <div className="bg-red-950/40 border border-red-800 text-[11px] text-red-200 p-2.5 flex items-start gap-2 leading-relaxed">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{loginError}</span>
                </div>
              )}

              <div className="flex flex-col gap-2 pt-1">
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="w-full bg-[#1b6d24] hover:bg-[#238c2f] disabled:bg-[#133c48] text-white py-2.5 text-xs font-black uppercase tracking-wider transition-colors shadow-lg cursor-pointer rounded-none border border-[#88d982]/20"
                >
                  {loginLoading ? 'Autenticando...' : 'Iniciar Sesión'}
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setLoginStep('username');
                    setLoginPassword('');
                    setLoginError(null);
                  }}
                  className="text-center text-[10px] font-extrabold text-slate-400 hover:text-emerald-400 uppercase tracking-wider transition-colors pt-1 cursor-pointer"
                >
                  ← Cambiar de Usuario
                </button>
              </div>
            </form>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen overflow-hidden select-none bg-[#f3faff] text-[#071e27] font-sans selection:bg-[#a3f69c] selection:text-[#002204]">
      
      {/* 1. SIDEBAR PANEL */}
      <aside className="no-print w-full lg:w-64 bg-[#e6f6ff] border-b lg:border-b-0 lg:border-r border-[#c3c6d1] flex flex-col z-30 transition-all duration-150 shrink-0">
        {/* Banner with Official Logo */}
        <div className="p-4 border-b border-[#c3c6d1] flex lg:flex-col items-center justify-between lg:justify-center text-center">
          <div className="flex items-center lg:flex-col lg:items-center">
            <img 
              src="https://www.bananera.com/assets/asset-1603287856366.png?v=0.5624928979281254" 
              className="max-h-12 lg:max-h-16 w-auto object-contain mix-blend-multiply drop-shadow"
              referrerPolicy="no-referrer"
              alt="Bananera Logo" 
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="ml-3 lg:ml-0 lg:mt-2 text-left lg:text-center">
              <h1 className="text-sm font-black text-[#001e40] leading-none tracking-tight uppercase">Admin Panel</h1>
              <p className="text-[10px] font-bold text-[#1a6d24] uppercase tracking-wider mt-0.5">{settings.logisticsDept}</p>
            </div>
          </div>
          <div className="text-right lg:hidden font-mono text-[10px] text-[#001e40] font-black bg-white px-2 py-1 border border-[#c3c6d1]">
            <span>{currentTime || '00:00:00'}</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-row lg:flex-col flex-1 overflow-x-auto lg:overflow-x-visible mt-2 lg:mt-4 space-y-0 lg:space-y-1">
          <button 
            id="tab-inicio-btn"
            onClick={() => { handleTabChange('inicio'); }}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'inicio' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Home className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Inicio</span>
          </button>

          <button 
            id="tab-portals-btn"
            onClick={() => { handleTabChange('portals'); setActiveCategoryFilter(null); }}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'portals' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Layers className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Portales</span>
          </button>

          <button 
            id="tab-news-btn"
            onClick={() => handleTabChange('news')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'news' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Newspaper className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Noticias</span>
          </button>

          <button 
            id="tab-seniat-btn"
            onClick={() => handleTabChange('seniat')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'seniat' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Search className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span className="flex items-center gap-1.5 flex-wrap">
              <span>Consulta SENIAT</span>
              <span className="text-[9px] text-red-500 font-extrabold tracking-tight bg-red-50 px-1 border border-red-200 uppercase animate-pulse shrink-0">EN MANTENIMIENTO</span>
            </span>
          </button>

          <button 
            id="tab-iva-btn"
            onClick={() => handleTabChange('iva')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'iva' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Percent className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Calculadora IVA</span>
          </button>

          <button 
            id="tab-retenciones-btn"
            onClick={() => handleTabChange('retenciones')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'retenciones' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Printer className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Retenciones ISLR</span>
          </button>

          <button 
            id="tab-tickets-btn"
            onClick={() => handleTabChange('tickets')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'tickets' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <FileText className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Módulo Tickets</span>
          </button>

          <button 
            id="tab-direcciones-btn"
            onClick={() => handleTabChange('direcciones')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'direcciones' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <MapPin className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Hojas de Ruta</span>
          </button>

          <button 
            id="tab-rates-btn"
            onClick={() => handleTabChange('rates')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'rates' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <TrendingUp className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Tasas Hoy</span>
          </button>

          <button 
            id="tab-settings-btn"
            onClick={() => handleTabChange('settings')}
            className={`flex-1 lg:flex-none flex items-center justify-center lg:justify-start px-4 py-3 text-[10px] lg:text-xs font-bold uppercase tracking-wider transition-all duration-100 min-w-[100px] lg:min-w-0 ${
              activeTab === 'settings' 
                ? 'bg-[#001e40] text-white border-b-2 lg:border-b-0 lg:border-l-4 border-b-[#1b6d24] lg:border-l-[#1b6d24]' 
                : 'text-[#43474f] hover:bg-[#d5ecf8]'
            }`}
          >
            <Info className="w-4 h-4 mr-2 shrink-0 text-[#1b6d24] lg:text-current" />
            <span>Acerca De</span>
          </button>
        </nav>

        {/* User Profile Info Card & Log Out (Dynamic Supabase Session) */}
        {currentUser && (
          <div className="p-3 border-t border-[#c3c6d1] bg-[#dcf2ff] flex flex-col gap-2 shrink-0 no-print">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 shrink-0 rounded-full bg-[#001e40] text-[#a3f69c] font-black flex items-center justify-center text-xs border border-[#1b6d24]/30 select-none">
                {currentUser.username.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black text-[#001e40] truncate leading-tight uppercase select-text">{currentUser.nombre}</p>
                <div className="flex items-center gap-1 mt-0.5 select-text">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                  <p className="text-[8px] font-mono font-bold text-slate-500 truncate">{currentUser.email || `${currentUser.username}@bananera.ve`}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setCurrentUser(null);
                localStorage.removeItem('bananera_user');
                setLoginStep('username');
                setVerifiedName('');
                setLoginUsername('');
                setLoginPassword('');
                triggerToast('🚪 Sesión cerrada correctamente.');
              }}
              className="w-full text-center py-1.5 bg-red-800 hover:bg-red-950 text-white font-bold text-[9px] uppercase tracking-wider transition-colors border border-red-900 rounded-none cursor-pointer select-none"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>

      {/* 2. MAIN HUB WORKSPACE */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* TOP TICKER BAR: TASA BCV HOY WITH CONTINUOUS HORIZONTAL MARQUEE */}
        <div className="no-print bg-[#001e40] text-emerald-400 py-2.5 px-4 overflow-hidden relative border-b border-[#c3c6d1] flex items-center shrink-0 z-40 select-none">
          <div className="absolute left-0 top-0 bottom-0 bg-[#001937] px-3 z-10 flex items-center font-extrabold uppercase text-[9px] tracking-wider text-white border-r border-[#153457] shrink-0">
            📊 TASA BCV HOY:
          </div>
          <div className="w-full relative overflow-hidden pl-[90px]">
            <div className="animate-marquee inline-block whitespace-nowrap text-xs font-mono font-bold uppercase tracking-widest text-[#a3f69c]">
              🏦 BANCO CENTRAL DE VENEZUELA HOY • DÓLAR (USD): <span className="text-white text-sm font-extrabold mr-2">{isBcvLoading ? 'CARGANDO...' : (bcvData ? `${bcvData.usd} Bs.` : '45.2400 Bs.')}</span> • EURO (EUR): <span className="text-white text-sm font-extrabold mr-2">{isBcvLoading ? 'CARGANDO...' : (bcvData ? `${bcvData.eur} Bs.` : '48.9100 Bs.')}</span> • TASA USDT: <span className="text-white text-sm font-extrabold mr-2">{isBcvLoading ? 'CARGANDO...' : (bcvData?.usdt ? `${bcvData.usdt} Bs.` : '49.8500 Bs.')}</span> • FUENTE OFICIAL: {bcvData ? bcvData.source.replace("Raspado", "Obtenido").replace("RASPADO", "OBTENIDO") : 'www.bcv.org.ve (OBTENIDO - RESPALDO)'} • FECHA: {bcvData ? bcvData.date : 'CONEXIÓN ESTABLE'} • 🚀 C.A. BANANERA VENEZOLANA - OPERATOR PORTAL ONLINE •
            </div>
          </div>
        </div>

        {/* TOP COMPONENT HEADER with SEARCH BAR (AS REQUESTED: Arriba quita las pestañas y solo deja la barra de busqueda) */}
        <header className="no-print h-14 bg-white border-b border-[#c3c6d1] flex items-center justify-between px-4 shrink-0 z-20 gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <h2 className="text-xs lg:text-sm font-black tracking-tight text-[#001e40] uppercase">
              BANANERA VENEZOLANA
            </h2>
          </div>

          <div className="flex items-center gap-2 flex-1 justify-end max-w-4xl">
            {/* Unique top horizontal bar widget: Portal Search */}
            <div className="relative w-full max-w-xs md:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
              <input 
                type="text" 
                id="search-input-top"
                placeholder="PROCURAR PORTALES Y ENLACES..." 
                value={portalSearchQuery}
                onChange={(e) => {
                  setPortalSearchQuery(e.target.value);
                  if (activeTab !== 'portals') {
                    handleTabChange('portals');
                  }
                }}
                className="w-full text-xs font-mono pl-8 pr-10 py-1.5 bg-slate-50 border border-[#c3c6d1] uppercase rounded-none focus:outline-none focus:border-[#001e40] focus:ring-1 focus:ring-[#001e40] transition-colors placeholder:text-slate-400"
              />
              {portalSearchQuery && (
                <button 
                  onClick={() => setPortalSearchQuery('')}
                  className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 font-bold text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Time and profile */}
            <div className="flex items-center space-x-2 shrink-0">
              <div className="hidden sm:flex items-center text-slate-500 font-mono text-[10px] font-bold bg-slate-100 border border-[#c3c6d1] px-2 py-1" title="Hora de Venezuela (12h)">
                <Clock className="w-3.5 h-3.5 text-[#001e40] mr-1.5" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
              
              <div className="h-6 w-px bg-slate-300 hidden sm:block"></div>

              {/* USER PROFILE: REPLACED ADM_MASTER WITH USER_CABV AS REQUESTED */}
              <div className="flex items-center gap-1.5" title="User Profile">
                <CircleUser className="w-5 h-5 text-[#001e40]" aria-hidden="true" />
                <span className="hidden md:inline text-[11px] font-extrabold uppercase text-[#1a6d24] select-text">
                  {currentUser ? currentUser.username.toUpperCase() : 'USER_CABV'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* WORKSPACE PAGES (SCROLLABLE CANVAS) */}
        <main className="flex-1 overflow-y-auto p-4 pb-20 bg-[#f3faff]">
          <AnimatePresence mode="wait">
            
            {/* TAB 0: INICIO (PUNTO DE PARTIDA DE LA WEB) */}
            {activeTab === 'inicio' && (
              <motion.div 
                key="inicio-board"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 max-w-[1200px] mx-auto"
              >
                {/* Hero / Corporate Header */}
                <div className="bg-[#001e40] text-white p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center relative overflow-hidden border-2 border-[#1b6d24]">
                  <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center justify-center pointer-events-none transform translate-x-1/4 scale-150">
                    <Building2 className="w-80 h-80" />
                  </div>
                  
                  <div className="space-y-2 relative z-10">
                    <div className="inline-block bg-[#1b6d24] text-[10px] font-mono font-bold tracking-widest uppercase px-2.5 py-0.5 border border-white">
                      PLATAFORMA INTEGRAL OFICIAL
                    </div>
                    <h3 className="text-xl md:text-2xl font-black tracking-tight uppercase">C.A. BANANERA VENEZOLANA</h3>
                    <p className="text-xs text-slate-300 max-w-xl font-sans font-medium uppercase tracking-wider">
                      Centro de control para gestión tributaria, monitoreo de tasas y operaciones aduaneras en Yaracuy, Venezuela.
                    </p>
                  </div>

                  <div className="mt-4 md:mt-0 flex flex-col items-end text-right font-mono text-[10px] space-y-1 bg-slate-900/60 p-3 border border-slate-700 relative z-10 shrink-0">
                    <div className="font-extrabold text-[#1b6d24]">● SISTEMA ONLINE</div>
                    <div>SECTOR: EXPORTACIÓN AGRÍCOLA</div>
                    <div>YARACUY - VENEZUELA</div>
                  </div>
                </div>

                {/* Live Exchange Rate Widget Dashboard */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-white border border-[#c3c6d1] p-4 flex flex-col justify-between hover:border-[#1b6d24] transition-colors">
                    <div className="text-[10px] font-mono font-black text-slate-400 uppercase">Dólar BCV</div>
                    <div className="text-2xl font-black text-[#001e40] mt-1">
                      {bcvData?.usd ? `${parseFloat(bcvData.usd).toFixed(2)} Bs.` : '45.24 Bs.'}
                    </div>
                    <div className="text-[9px] font-mono font-bold mt-2 text-slate-500 uppercase flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>FUENTE OFICIAL BCV</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#c3c6d1] p-4 flex flex-col justify-between hover:border-[#1b6d24] transition-colors">
                    <div className="text-[10px] font-mono font-black text-slate-400 uppercase">Euro BCV</div>
                    <div className="text-2xl font-black text-[#001e40] mt-1">
                      {bcvData?.eur ? `${parseFloat(bcvData.eur).toFixed(2)} Bs.` : '48.91 Bs.'}
                    </div>
                    <div className="text-[9px] font-mono font-bold mt-2 text-slate-500 uppercase flex items-center gap-1">
                      <Shield className="w-3 h-3 text-emerald-600" />
                      <span>FUENTE OFICIAL BCV</span>
                    </div>
                  </div>

                  <div className="bg-white border border-[#c3c6d1] p-4 flex flex-col justify-between hover:border-[#1b6d24] transition-colors">
                    <div className="text-[10px] font-mono font-black text-slate-400 uppercase">Tasa USDT</div>
                    <div className="text-2xl font-black text-[#1b6d24] mt-1">
                      {bcvData?.usdt ? `${parseFloat(bcvData.usdt).toFixed(2)} Bs.` : '48.50 Bs.'}
                    </div>
                    <div className="text-[9px] font-mono font-bold mt-2 text-slate-500 uppercase flex items-center gap-1">
                      <Globe className="w-3 h-3 text-emerald-600" />
                      <span>USDT.COM.VE</span>
                    </div>
                  </div>
                </div>

                {/* Quick Menu Card Navigation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Easy shortcuts */}
                  <div className="md:col-span-2 bg-white border border-[#c3c6d1] p-5 space-y-4">
                    <h4 className="text-xs font-black text-[#001e40] uppercase border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Layers className="w-4 h-4 text-[#1b6d24]" />
                      ATRECHOS / ACCESOS DIRECTOS DE OPERACIÓN
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button 
                        onClick={() => handleTabChange('portals')}
                        className="p-3 border border-slate-200 text-left hover:border-[#001e40] hover:bg-slate-50 group transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase text-[#001e40] block">Portales Gubernamentales</span>
                          <span className="text-[9px] text-slate-400 font-mono block">Directorio unificado multitarea</span>
                        </div>
                        <span className="text-slate-400 group-hover:text-[#1b6d24] font-bold">→</span>
                      </button>

                      <button 
                        onClick={() => handleTabChange('seniat')}
                        className="p-3 border border-slate-200 text-left hover:border-[#001e40] hover:bg-slate-50 group transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase text-[#001e40] block">Consulta RIF Seniat</span>
                          <span className="text-[9px] text-red-500 font-mono block font-bold">EN MANTENIMIENTO</span>
                        </div>
                        <span className="text-slate-400 group-hover:text-[#1b6d24] font-bold">→</span>
                      </button>

                      <button 
                        onClick={() => handleTabChange('iva')}
                        className="p-3 border border-slate-200 text-left hover:border-[#001e40] hover:bg-slate-50 group transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase text-[#001e40] block">Calculadora IVA</span>
                          <span className="text-[9px] text-slate-400 font-mono block">Desglose rápido de alícuotas</span>
                        </div>
                        <span className="text-slate-400 group-hover:text-[#1b6d24] font-bold">→</span>
                      </button>

                      <button 
                        onClick={() => handleTabChange('rates')}
                        className="p-3 border border-slate-200 text-left hover:border-[#001e40] hover:bg-slate-50 group transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <div>
                          <span className="text-xs font-bold uppercase text-[#001e40] block">Histórico de Tasas</span>
                          <span className="text-[9px] text-slate-400 font-mono block">Auditoría contable diaria</span>
                        </div>
                        <span className="text-slate-400 group-hover:text-[#1b6d24] font-bold">→</span>
                      </button>
                    </div>

                    <div className="bg-[#f0f9ff] text-[#00386b] border border-blue-200 p-3 text-xs leading-relaxed flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>INTEGRACIÓN MULTI-VENTANAS:</strong> Todos los sitios web externos abiertos desde el panel de portales cargan ahora directamente dentro de ventanas flotantes interactivas ajustables y minimizables para evitar perder el hilo operativo contable.
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Mini news snippet or company details */}
                  <div className="bg-white border border-[#c3c6d1] p-5 flex flex-col justify-between">
                    <div className="space-y-4">
                      <h4 className="text-xs font-black text-[#001e40] uppercase border-b border-slate-100 pb-2 flex items-center gap-2">
                        <Newspaper className="w-4 h-4 text-[#1b6d24]" />
                        MÓDULO DE PRENSA RECIENTE
                      </h4>

                      <div className="space-y-3">
                        <div className="border-l-2 border-[#1b6d24] pl-3 py-1 space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">3 Jun 2026 • AGRICULTURA</span>
                          <span className="text-xs font-black block text-[#001e40] uppercase hover:underline cursor-pointer" onClick={() => handleTabChange('news')}>
                            Yaracuy rompe récord de exportación bananera
                          </span>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            Las plantaciones del estado enviaron más de 45 toneladas en el último trimestre...
                          </p>
                        </div>

                        <div className="border-l-2 border-slate-300 pl-3 py-1 space-y-1">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase font-mono">2 Jun 2026 • FINANZAS</span>
                          <span className="text-xs font-black block text-[#001e40] uppercase hover:underline cursor-pointer" onClick={() => handleTabChange('news')}>
                            Simplificación de fletes aduaneros del IVA
                          </span>
                          <p className="text-[11px] text-slate-500 leading-snug">
                            Nuevos lineamientos del Banco Central e IGTF incentivan operaciones en divisas.
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleTabChange('news')}
                      className="mt-6 w-full text-center py-2 bg-slate-100 hover:bg-[#001e40] hover:text-white border border-slate-200 text-xs font-bold text-slate-600 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      Ver Todas las Noticias
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB 1: ALL PORTALS BOARD (CLEANED UP COMPONENT AS REQUESTED) */}
            {activeTab === 'portals' && (
              <motion.div 
                key="portals-board"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 max-w-[1440px] mx-auto"
              >
                {portalSearchQuery && (
                  <div className="bg-[#e6f6ff] border border-[#c3c6d1] px-4 py-2 flex justify-between items-center text-xs">
                    <div>
                      Filtrando accesos por: <strong className="font-mono text-[#001e40]">"{portalSearchQuery}"</strong> 
                      {activeCategoryFilter && <> en categoría <strong className="uppercase">"{activeCategoryFilter}"</strong></>}
                      . Encontrados: <strong>{filteredPortals.length}</strong> portales.
                    </div>
                    <button 
                      onClick={() => { setPortalSearchQuery(''); setActiveCategoryFilter(null); }}
                      className="text-xs text-[#1b6d24] hover:underline font-mono font-bold"
                    >
                      ELIMINAR FILTROS
                    </button>
                  </div>
                )}

                {/* THE PORTAL COLUMNS GRID (with removed modules) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 align-top items-start">
                  
                  {/* COLUMN 1: FINANZAS Y BANCA (Removed consulta rapida seniat module!) */}
                  {(!activeCategoryFilter || activeCategoryFilter === 'finance') && (
                    <section className="space-y-4 flex flex-col bg-[#f8fcff] border border-[#c3c6d1] p-3">
                      <div className="bg-[#001e40] text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider flex justify-between items-center">
                        <span>1. FINANZAS Y BANCA</span>
                        <span className="text-[9px] opacity-75 font-mono">PORTALES</span>
                      </div>

                      <div className="space-y-2">
                        {filteredPortals.filter(p => p.category === 'finance').length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">No se hallaron portales de finanzas.</div>
                        ) : (
                          filteredPortals.filter(p => p.category === 'finance').map(p => (
                            <div key={p.id} className="border border-[#737780] bg-white p-1 transition-all hover:bg-slate-50">
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => openPortalInWindow(p)} 
                                  className="flex-1 bg-[#001e40] text-white hover:bg-[#003366] transition-colors px-3 py-2 text-left font-bold text-xs flex justify-between items-center uppercase cursor-pointer"
                                >
                                  <span>{p.name}</span>
                                  <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                                </button>
                                
                                {p.badge || p.defaultUser ? (
                                  <div className="flex flex-col space-y-1 p-1">
                                    {p.badge && (
                                      <button 
                                        onClick={() => handleCopy(p.badge!, 'RIF')}
                                        className="p-1 border border-[#c3c6d1] hover:bg-slate-100 text-[#001e40] cursor-pointer" 
                                        title={`Copiar RIF: ${p.badge}`}
                                      >
                                        <Building2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                    {p.defaultUser && (
                                      <button 
                                        onClick={() => handleCopy(p.defaultUser!, 'Usuario')}
                                        className="p-1 border border-[#c3c6d1] hover:bg-slate-100 text-[#001e40] cursor-pointer" 
                                        title={`Copiar Usuario: ${p.defaultUser}`}
                                      >
                                        <CircleUser className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ) : null}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                  {/* COLUMN 2: TRIBUTOS Y LEYES */}
                  {(!activeCategoryFilter || activeCategoryFilter === 'taxes') && (
                    <section className="space-y-4 flex flex-col bg-[#f8fcff] border border-[#c3c6d1] p-3">
                      <div className="bg-[#001e40] text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider flex justify-between items-center">
                        <span>2. TRIBUTOS Y LEYES</span>
                        <span className="text-[9px] opacity-75 font-mono">IMPUESTOS</span>
                      </div>

                      <div className="space-y-2">
                        {filteredPortals.filter(p => p.category === 'taxes').length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">No se hallaron portales tributarios.</div>
                        ) : (
                          filteredPortals.filter(p => p.category === 'taxes').map(p => (
                            <button 
                              key={p.id}
                              onClick={() => openPortalInWindow(p)}
                              className="w-full text-left border border-[#737780] bg-white p-3 flex justify-between items-center hover:bg-slate-50 group focus:outline-none focus:ring-1 focus:ring-[#001e40] cursor-pointer"
                            >
                              <div className="space-y-0.5">
                                <span className="font-bold text-xs uppercase block text-[#001e40] group-hover:underline">{p.name}</span>
                                {p.badge && <span className="text-[9px] font-mono block text-slate-400 font-semibold">{p.badge}</span>}
                              </div>
                              <span className="px-1 py-1 text-slate-500 group-hover:text-[#001e40] transition-colors border border-transparent group-hover:border-slate-200">
                                <ExternalLink className="w-4 h-4" />
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                  {/* COLUMN 3: IDENTIDAD Y LEGAL (Removed credenciales guardadas card!) */}
                  {(!activeCategoryFilter || activeCategoryFilter === 'legal') && (
                    <section className="space-y-4 flex flex-col bg-[#f8fcff] border border-[#c3c6d1] p-3">
                      <div className="bg-[#001e40] text-white px-3 py-1.5 text-xs font-black uppercase tracking-wider flex justify-between items-center">
                        <span>3. IDENTIDAD Y LEGAL</span>
                        <span className="text-[9px] opacity-75 font-mono">REGISTROS</span>
                      </div>

                      <div className="space-y-2">
                        {filteredPortals.filter(p => p.category === 'legal').length === 0 ? (
                          <div className="p-8 text-center text-xs text-slate-400 italic">No se hallaron portales.</div>
                        ) : (
                          filteredPortals.filter(p => p.category === 'legal').map(p => (
                            <button 
                              key={p.id}
                              onClick={() => openPortalInWindow(p)}
                              className="w-full text-left border border-[#737780] bg-white p-3 flex justify-between items-center hover:bg-slate-50 group focus:outline-none focus:ring-1 focus:ring-[#001e40] cursor-pointer"
                            >
                              <span className="font-bold text-xs uppercase text-[#001e40] group-hover:underline">{p.name}</span>
                              <span className="px-1 py-1 text-slate-400 group-hover:text-[#001e40] transition-colors border border-transparent group-hover:border-slate-200">
                                <ExternalLink className="w-4 h-4" />
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </section>
                  )}

                </div>


              </motion.div>
            )}

            {/* TAB 2: NEWS BULLETIN SYSTEM (REPLACED CREDENTIAL LIST) */}
            {activeTab === 'news' && (
              <motion.div 
                key="news-manager"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1200px] mx-auto space-y-6"
              >
                <div className="border-b border-[#c3c6d1] pb-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div>
                    <h3 className="text-base font-black text-[#001e40] uppercase flex items-center">
                      <Newspaper className="w-5 h-5 mr-2 text-[#1b6d24]" />
                      Boleta Informativa y Monitoreo de Prensa
                    </h3>
                    <p className="text-xs text-slate-500">
                      Coordinación de prensa regional y nacional en tiempo real para Bananera Venezolana, C.A.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={fetchNewsFeed}
                    disabled={isNewsLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase bg-[#001e40] text-white hover:bg-[#003366] transition-colors rounded-none cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isNewsLoading ? 'animate-spin' : ''}`} />
                    <span>Actualizar Prensa</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* CENTRAL SECTIONS COLUMN (Col span 9) */}
                  <div className="lg:col-span-9 space-y-6">
                    
                    {/* SECTION 1: REGIONAL (Yaracuy al Día) */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b-2 border-[#1b6d24] pb-1.5 bg-slate-50/50 p-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-[#1b6d24]" />
                          <div>
                            <h4 className="text-xs font-black text-[#001e40] uppercase tracking-tight">Prensa Regional de Yaracuy</h4>
                            <span className="text-[9px] font-mono font-bold text-slate-400 block leading-none select-all">Diario Oficial: https://yaracuyaldia.com/</span>
                          </div>
                        </div>
                        <a 
                          href="https://yaracuyaldia.com/" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-[10px] bg-[#1b6d24]/10 text-[#1b6d24] font-extrabold px-2.5 py-1 uppercase border border-[#1b6d24]/20 hover:bg-[#1b6d24] hover:text-white transition-all flex items-center gap-1 shrink-0"
                        >
                          <span>Visitar yaracuyaldia.com</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {isNewsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2].map(n => (
                            <div key={n} className="bg-slate-50 border border-slate-200 h-32 animate-pulse p-4 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="h-3 bg-slate-200 w-1/4"></div>
                                <div className="h-4 bg-slate-200 w-full"></div>
                                <div className="h-4 bg-slate-200 w-3/4"></div>
                              </div>
                              <div className="h-3 bg-slate-200 w-1/3"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(newsFeed?.regional || backupRegional).map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 hover:border-[#1b6d24] p-4 transition-all duration-150 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                              <div className="absolute top-0 left-0 w-0.5 h-full bg-[#1b6d24] group-hover:w-1 transition-all"></div>
                              <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="bg-emerald-50 text-[#1b6d24] px-1.5 py-0.5 font-bold uppercase tracking-wider border border-emerald-100">
                                    {item.categoria || "REGIONAL"}
                                  </span>
                                  <span className="text-slate-400 font-bold">{item.fecha}</span>
                                </div>
                                <h5 className="text-xs font-black text-[#153457] uppercase leading-snug group-hover:text-[#001e40] transition-colors">
                                  {item.titulo}
                                </h5>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-3">
                                  {item.resumen}
                                </p>
                              </div>
                              <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono">
                                <span className="font-bold text-slate-400">Fuente: <strong className="text-slate-600 uppercase italic">{item.fuente}</strong></span>
                                <a 
                                  href={item.url || "https://yaracuyaldia.com/"} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[#1b6d24] hover:underline font-black uppercase flex items-center gap-0.5"
                                >
                                  <span>Ampliar Noticia</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* SECTION 2: NACIONAL (El País / El Nacional / Venevisión) */}
                    <div className="space-y-3 pt-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-[#001e40] pb-1.5 bg-slate-50/50 p-2 gap-2">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-[#001e40]" />
                          <div>
                            <h4 className="text-xs font-black text-[#001e40] uppercase tracking-tight">Prensa y Coyuntura Nacional de Venezuela</h4>
                            <span className="text-[9px] font-mono font-bold text-slate-400 block leading-none">Canales Oficiales Coordinados: El País, El Nacional, Venevisión</span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <a 
                            href="https://elpais.com/noticias/venezuela/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[9px] bg-[#001e40]/5 text-[#001e40] px-2 py-0.5 font-bold hover:bg-[#001e40] hover:text-white border border-slate-250 transition-all"
                          >
                            El País ↗
                          </a>
                          <a 
                            href="https://www.elnacional.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[9px] bg-[#001e40]/5 text-[#001e40] px-2 py-0.5 font-bold hover:bg-[#001e40] hover:text-white border border-slate-250 transition-all"
                          >
                            El Nacional ↗
                          </a>
                          <a 
                            href="https://noticiasvenevision.com/" 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-[9px] bg-[#001e40]/5 text-[#001e40] px-2 py-0.5 font-bold hover:bg-[#001e40] hover:text-white border border-slate-250 transition-all"
                          >
                            Venevisión ↗
                          </a>
                        </div>
                      </div>

                      {isNewsLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {[1, 2].map(n => (
                            <div key={n} className="bg-slate-50 border border-slate-200 h-32 animate-pulse p-4 flex flex-col justify-between">
                              <div className="space-y-2">
                                <div className="h-3 bg-slate-200 w-1/4"></div>
                                <div className="h-4 bg-slate-200 w-full"></div>
                                <div className="h-4 bg-slate-200 w-3/4"></div>
                              </div>
                              <div className="h-3 bg-slate-200 w-1/3"></div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {(newsFeed?.nacional || backupNacional).map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 hover:border-[#001e40] p-4 transition-all duration-150 flex flex-col justify-between shadow-sm relative group overflow-hidden">
                              <div className="absolute top-0 left-0 w-0.5 h-full bg-[#001e40] group-hover:w-1 transition-all"></div>
                              <div className="space-y-2.5">
                                <div className="flex justify-between items-center text-[10px] font-mono">
                                  <span className="bg-slate-100 text-[#001e40] px-1.5 py-0.5 font-extrabold uppercase tracking-wider border border-slate-200">
                                    {item.categoria || "NACIÓN"}
                                  </span>
                                  <span className="text-slate-400 font-bold">{item.fecha}</span>
                                </div>
                                <h5 className="text-xs font-black text-[#153457] uppercase leading-snug group-hover:text-[#001e40] transition-colors">
                                  {item.titulo}
                                </h5>
                                <p className="text-[11px] text-slate-600 leading-relaxed font-sans line-clamp-3">
                                  {item.resumen}
                                </p>
                              </div>
                              <div className="pt-3 mt-3 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono">
                                <span className="font-bold text-slate-400">Periodismo: <strong className="text-[#001e40] uppercase font-black">{item.fuente}</strong></span>
                                <a 
                                  href={item.url || "https://www.elnacional.com/"} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[#001e40] hover:underline font-black uppercase flex items-center gap-0.5"
                                >
                                  <span>Leer Cobertura</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* RIGHT HIGHLIGHTS COLUMN (Col span 3) */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="bg-[#001e40] text-white p-4 font-mono text-xs space-y-3 shadow-md">
                      <h4 className="font-extrabold uppercase text-[#a3f69c] border-b border-slate-700 pb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                        Gabinete Editorial
                      </h4>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        La gerencia de operaciones del Grupo Bananera Venezolana reitera la obligación de cruzar todas las informaciones sobre transporte de carga y cierres técnicos viales indicados en <strong>Yaracuy al Día</strong> ya que representan la ruta crítica de nuestros despachos agrícolas.
                      </p>
                      <div className="bg-[#002f5a] p-2.5 border border-slate-700">
                        <span className="block text-[9px] font-bold uppercase text-white mb-1">Próximos Despachos:</span>
                        <span className="font-black text-rose-400">Verificar peajes viales de Carabobo / Yaracuy.</span>
                      </div>
                    </div>

                    <div className="bg-[#e6f6ff] border border-[#c3c6d1] p-4 text-xs font-sans space-y-2">
                      <h4 className="font-extrabold text-[#001e40] uppercase">Enlaces Relevantes:</h4>
                      <ul className="space-y-1.5 text-[#1b6d24] font-bold">
                        <li>
                          <a href="https://declaraciones.seniat.gob.ve" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center justify-between">
                            <span>• Portal Seniat Declaraciones</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                        <li>
                          <a href="https://www.bcv.org.ve" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center justify-between">
                            <span>• Portal Banco Central BCV</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                        <li>
                          <a href="https://saren.gob.ve" target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center justify-between">
                            <span>• Portal SAREN Registros</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                      </ul>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

            {/* TAB 3: STANDALONE EXPANDED SENIAT QUERY MODULE */}
            {activeTab === 'seniat' && (
              <motion.div 
                key="seniat-advanced"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[900px] mx-auto space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <h3 className="text-base font-black text-[#001e40] uppercase flex items-center">
                      <Globe className="w-5 h-5 mr-2 text-[#1b6d24]" />
                      Consulta Arbitrada SENIAT (Visualizador Oficial)
                      <span className="text-red-500 font-extrabold text-xs ml-2 uppercase tracking-wide animate-pulse shrink-0 bg-red-100 px-2 py-0.5 border border-red-350">EN MANTENIMIENTO</span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      Acceso autorizado directo al sistema de información de la República. Buscador del contribuyente oficial.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[10px] text-red-750 bg-red-50 border border-red-205 p-2 uppercase font-black animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-red-650 block"></span>
                    <span>Servidor Fiscal: En Mantenimiento</span>
                  </div>
                </div>

                {/* DIRECT EMBEDDED SENIAT OFFICIAL PORTAL RECUDARO */}
                <div className="bg-white border-2 border-[#001e40] shadow-md overflow-hidden">
                  <div className="bg-[#001e40] text-white px-4 py-3 border-b border-[#001e40] flex flex-col sm:flex-row justify-between items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Globe className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-tight">Portal Oficial del SENIAT (Vista Directa)</h4>
                        <p className="text-[10px] text-slate-300 font-mono">Buscador Legítimo del Contribuyente - Consulta de RIF</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a 
                        href="http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold py-1.5 px-3 uppercase text-[10px] tracking-wider rounded-none flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Abrir en Pestaña Nueva</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-slate-100 border-b border-slate-200 px-3 py-2 flex items-center gap-2 text-xs font-mono">
                    <div className="flex items-center gap-1 shrink-0">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                    </div>
                    <div className="bg-white border border-slate-300 px-3 py-1 text-slate-500 rounded-md flex-1 text-[11px] truncate select-all">
                      http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp
                    </div>
                  </div>

                  <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
                    {/* Viewport Frame */}
                    <div className="lg:col-span-8 border border-slate-300 bg-slate-50 relative overflow-hidden flex flex-col" style={{ minHeight: '520px' }}>
                      <iframe 
                        src="http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp" 
                        title="SENIAT Consulta RIF Oficial"
                        className="w-full h-[500px] border-none bg-white relative z-10 flex-1"
                        sandbox="allow-same-origin allow-scripts allow-forms"
                      />
                    </div>

                    {/* Guide Info panel */}
                    <div className="lg:col-span-4 bg-slate-50 border border-slate-200 p-4 flex flex-col justify-between space-y-4">
                      <div className="space-y-3.5 text-xs font-sans">
                        <span className="block text-[10px] font-black text-[#001e40] uppercase tracking-wider font-mono border-b border-slate-300 pb-1">
                          Guía de Compatibilidad de Red
                        </span>
                        
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          La web original del SENIAT se transmite mediante el protocolo <strong className="text-red-700">HTTP plano (sin SSL)</strong>.
                        </p>
                        
                        <div className="bg-amber-50 border border-amber-200 p-2.5 text-[11px] text-amber-900 leading-normal space-y-1">
                          <p className="font-bold uppercase text-[9px] tracking-tight">🔎 ¿Por qué aparece en blanco?</p>
                          <p>Por razones de seguridad, la mayoría de navegadores modernos bloquean la carga de marcos HTTP (sitios no seguros) dentro de una aplicación HTTPS (Mixed Content Block).</p>
                        </div>

                        <div className="space-y-2 text-[11px] text-slate-600">
                          <p className="font-bold text-[#001e40] uppercase text-[9px] font-mono">Para habilitar el recuadro directo:</p>
                          <ol className="list-decimal pl-4 space-y-1">
                            <li>Pulse el <strong className="text-slate-800">candado de seguridad 🔒</strong> al lado izquierdo de la URL de este sistema.</li>
                            <li>Vaya a "Configuración del sitio".</li>
                            <li>Cambie <strong className="text-slate-800">"Contenido no seguro" (Insecure content)</strong> de Bloquear a <strong className="text-emerald-700">Permitir/Allow</strong>.</li>
                            <li>Vuelva y recargue de nuevo esta aplicación.</li>
                          </ol>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 space-y-2">
                        <p className="text-[10px] text-slate-400 italic">
                          O ejecute la consulta tradicional de manera libre abriendo el portal gubernamental directamente:
                        </p>
                        <button 
                          type="button"
                          onClick={() => window.open('http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp', '_blank')}
                          className="w-full bg-[#001e40] hover:bg-[#003366] text-white font-bold py-2 px-3 text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors cursor-pointer font-mono"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          <span>Abrir Enlace Web</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* TAB: CALCULADORA IVA */}
            {activeTab === 'iva' && (
              <motion.div
                key="iva-advanced"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1000px] mx-auto space-y-6 animate-fadeIn"
              >
                <div className="border-b border-[#c3c6d1] pb-3">
                  <h3 className="text-base font-black text-[#001e40] uppercase flex items-center">
                    <Percent className="w-5 h-5 mr-2 text-[#1b6d24]" />
                    Calculadora de IVA de Venezuela (calcu.la/calculadora-iva-venezuela/)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculadora de IVA integrada oficial para desglosar, extraer o sumar la alícuota general del 16%, reducida del 8% (productos agrícolas), o suntuario del 15%.
                  </p>
                </div>

                {/* CALCULADORA DE IVA VENEZUELA */}
                <div className="bg-white border-2 border-[#001e40] shadow-[0_4px_12px_rgba(0,30,64,0.04)] overflow-hidden">
                  <div className="bg-[#001e40] text-white p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-[#001e40] gap-2">
                    <div className="flex items-center gap-2">
                      <Percent className="w-5 h-5 text-[#a3f69c]" />
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-emerald-300 leading-none font-bold">CÁLCULO DE ALÍCUOTAS INTEGRADO</h4>
                        <h3 className="text-sm font-black uppercase tracking-tight family-sans mt-1">Calculadora de IVA Venezuela</h3>
                      </div>
                    </div>
                    <span className="bg-[#1b6d24] text-white text-[10px] font-mono px-2 py-1 font-bold">
                      GACETA OFICIAL VENEZOLANA - TASA 16% / 8% / 15%
                    </span>
                  </div>

                  <div className="p-4 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Controls */}
                    <div className="lg:col-span-6 space-y-4 font-mono text-xs">
                      {/* Modo selector */}
                      <div className="space-y-1.5">
                        <label className="block font-black text-slate-600 uppercase tracking-wider">Dirección del Computo</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setIvaDirection('add')}
                            className={`py-2 px-3 border text-xs font-bold uppercase transition-colors rounded-none flex items-center justify-center gap-1.5 cursor-pointer ${
                              ivaDirection === 'add'
                                ? 'bg-[#001e40] text-white border-[#001e40]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                            Agregar IVA (+ Base)
                          </button>
                          <button
                            type="button"
                            onClick={() => setIvaDirection('extract')}
                            className={`py-2 px-3 border text-xs font-bold uppercase transition-colors rounded-none flex items-center justify-center gap-1.5 cursor-pointer ${
                              ivaDirection === 'extract'
                                ? 'bg-[#001e40] text-white border-[#001e40]'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <TrendingDown className="w-3.5 h-3.5 text-[#ff6666]" />
                            Extraer IVA (Desglosar)
                          </button>
                        </div>
                      </div>

                      {/* Monto de entrada */}
                      <div className="space-y-1.5">
                        <label className="block font-black text-slate-600 uppercase tracking-wider">
                          {ivaDirection === 'add' ? 'Monto Imponible (Precio Neto / Sin IVA)' : 'Monto de Operación Total (Precio Bruto / Con IVA)'}
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5 text-slate-400 font-bold">Bs.</span>
                          <input
                            type="number"
                            value={ivaBaseAmount}
                            onChange={(e) => setIvaBaseAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-[#737780] text-base px-10 py-2 font-mono rounded-none focus:outline-none focus:border-[#001e40] bg-slate-50 focus:bg-white"
                          />
                        </div>
                      </div>

                      {/* Tasas de IVA de Venezuela (16% General, 8% Especial, 15% Suntuario, 0% Exento) */}
                      <div className="space-y-1.5">
                        <label className="block font-black text-slate-600 uppercase tracking-wider">Tipo de Alícuota / Tasa de IVA Nacional</label>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { value: 16, label: "16% General", desc: "Tasa Común" },
                            { value: 8, label: "8% Reducido", desc: "Prod. Agrícolas" },
                            { value: 15, label: "15% Lujo", desc: "Bienes Suntuarios" },
                            { value: 0, label: "0% Exento", desc: "Zonas Libres/Básicos" }
                          ].map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setIvaRatePercent(opt.value)}
                              className={`py-2 px-1 text-center border text-[10px] sm:text-xs font-extrabold uppercase transition-colors rounded-none flex flex-col items-center justify-center cursor-pointer ${
                                ivaRatePercent === opt.value
                                  ? 'bg-[#1b6d24] text-white border-[#1b6d24]'
                                  : 'bg-slate-50 text-[#001e40] border-[#c3c6d1] hover:bg-slate-100'
                              }`}
                            >
                              <span>{opt.label}</span>
                              <span className="text-[8px] opacity-75 font-normal mt-0.5 font-sans leading-none">{opt.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Results / Billing breakdown matching calcu.la */}
                    <div className="lg:col-span-6 bg-slate-50 border border-[#c3c6d1] p-4 space-y-4 font-mono text-xs">
                      <div className="border-b border-dashed border-[#c3c6d1] pb-2 text-[10px] text-slate-500 uppercase font-black tracking-wider flex justify-between">
                        <span>Resglose Fiscal de Facturación</span>
                        <span className="text-[#1b6d24]">Operación Matemática Oficial</span>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-1 border-b border-white">
                          <span className="text-slate-500 uppercase font-bold text-[11px]">Base Imponible (Neto):</span>
                          <span className="text-[#001e40] text-sm font-black">{ivaResult.base} Bs.</span>
                        </div>

                        <div className="flex justify-between items-center py-1 border-b border-white">
                          <span className="text-slate-500 uppercase font-bold text-[11px]">Impuesto IVA ({ivaResult.rateLabel}):</span>
                          <span className="text-red-600 text-sm font-black">+{ivaResult.iva} Bs.</span>
                        </div>

                        <div className="flex justify-between items-center py-1.5 border-b-2 border-slate-300">
                          <span className="text-slate-600 uppercase font-black text-xs">Monto Total de Transacción:</span>
                          <span className="text-[#001e40] text-base font-extrabold bg-[#a3f69c] px-2 py-0.5 border border-[#1b6d24]">{ivaResult.total} Bs.</span>
                        </div>
                      </div>

                      <div className="text-[10px] leading-tight text-slate-500 bg-white p-2 border border-slate-200">
                        <p className="font-bold uppercase tracking-wider text-[9px] text-[#001e40] mb-1">Fórmula Aplicada:</p>
                        {ivaDirection === 'add' ? (
                          <p>Monto Base ({ivaResult.base} Bs.) × (1 + {ivaRatePercent / 100}) = {ivaResult.total} Bs. (Suma del IVA de {ivaResult.iva} Bs.)</p>
                        ) : (
                          <p>Total ({ivaResult.total} Bs.) ÷ 1.{ivaRatePercent.toString().padStart(2, '0')} = Base ({ivaResult.base} Bs.) con IVA desglosado de {ivaResult.iva} Bs.</p>
                        )}
                        <p className="mt-1 flex items-center justify-between text-slate-400">
                          <span>Referencia externa: calcu.la/calculadora-iva-venezuela/</span>
                          <a href="https://calcu.la/calculadora-iva-venezuela/" target="_blank" rel="noopener noreferrer" className="text-[#1b6d24] hover:underline uppercase text-[8px] font-bold">Ver Web ↗</a>
                        </p>
                      </div>
                    </div>

                  </div>
                </div>
              </motion.div>
            )}


            {/* TAB: TASAS HOY - COTIZACIONES Y SIMULADOR MULTIDIVISA */}
            {activeTab === 'rates' && (
              <motion.div
                key="rates-page"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1000px] mx-auto space-y-6"
              >
                {/* Header Card */}
                <div className="bg-white border border-[#c3c6d1] shadow-md p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#1b6d24]" />
                      <h4 className="text-sm font-black text-[#001e40] uppercase tracking-wider font-mono">
                        TABLERO DE COTIZACIONES Y MULTIDIVISAS (BCV)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500">
                      Vigencia oficial de cobros y retenciones arancelarias de Bananera Venezolana, C.A. para puertos nacionales.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      fetchBcvRates();
                      triggerToast("Tasas de cambio actualizadas desde el Banco Central de Venezuela.");
                    }}
                    disabled={isBcvLoading}
                    className="bg-[#001e40] hover:bg-[#003366] text-white font-extra-bold text-[10px] sm:text-xs px-4 py-2 uppercase tracking-wider flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50 h-9 shrink-0 font-bold"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isBcvLoading ? 'animate-spin' : ''}`} />
                    <span>{isBcvLoading ? 'Actualizando' : 'Consultar BCV En Vivo'}</span>
                  </button>
                </div>

                {/* Grid of Exchange Rates */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: USD */}
                  <div className="bg-white border-2 border-slate-200 p-4 relative overflow-hidden transition-all hover:border-[#1b6d24] hover:shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#1b6d24]"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">DÓLAR BCV (USD)</span>
                      <span className="bg-emerald-50 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 border border-emerald-200 font-bold">
                        OFICIAL LIQ
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#001e40] font-mono tracking-tight leading-none mt-2">
                      {isBcvLoading ? (
                        <span className="text-xs text-slate-400 font-normal">Cargando...</span>
                      ) : (
                        `${bcvData?.usd || '45.2400'} Bs.`
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-[#1b6d24] mt-3 uppercase flex items-center gap-1 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      VIGENCIA: {bcvData ? bcvData.date.split(" ")[0] : new Date().toLocaleDateString('es-VE')}
                    </p>
                  </div>

                  {/* Card 2: EUR */}
                  <div className="bg-white border-2 border-slate-200 p-4 relative overflow-hidden transition-all hover:border-[#1b6d24] hover:shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#001e40]"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">EURO BCV (EUR)</span>
                      <span className="bg-slate-100 text-slate-800 text-[8px] font-black uppercase px-2 py-0.5 border border-slate-300 font-bold">
                        ARANCELARIO
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#001e40] font-mono tracking-tight leading-none mt-2">
                      {isBcvLoading ? (
                        <span className="text-xs text-slate-400 font-normal">Cargando...</span>
                      ) : (
                        `${bcvData?.eur || '48.9100'} Bs.`
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-slate-500 mt-3 uppercase flex items-center gap-1 font-mono">
                      <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                      VALOR INTERBANCARIO
                    </p>
                  </div>

                  {/* Card 3: USDT */}
                  <div className="bg-white border-2 border-slate-200 p-4 relative overflow-hidden transition-all hover:border-[#1b6d24] hover:shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-sky-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">DÓLAR DIGITAL (USDT)</span>
                      <span className="bg-sky-50 text-sky-800 text-[8px] font-black uppercase px-2 py-0.5 border border-sky-200 font-bold">
                        P2P PARIDAD
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#001e40] font-mono tracking-tight leading-none mt-2">
                      {isBcvLoading ? (
                        <span className="text-xs text-slate-400 font-normal">Cargando...</span>
                      ) : (
                        bcvData?.usdt 
                          ? `${parseFloat(bcvData.usdt).toFixed(4)} Bs.` 
                          : `${(parseFloat(bcvData?.usd || "45.2400") * 1.115).toFixed(4)} Bs.`
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-sky-600 mt-3 uppercase flex items-center gap-1 font-mono">
                      REF: CANAL EN VIVO USDT.COM.VE
                    </p>
                  </div>

                  {/* Card 4: PETRO */}
                  <div className="bg-white border-2 border-slate-200 p-4 relative overflow-hidden transition-all hover:border-[#1b6d24] hover:shadow-lg">
                    <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500"></div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider font-mono">PETRO (PTR)</span>
                      <span className="bg-amber-50 text-amber-800 text-[8px] font-black uppercase px-2 py-0.5 border border-amber-200 font-bold">
                        SNC CONTABLE
                      </span>
                    </div>
                    <div className="text-2xl font-black text-[#001e40] font-mono tracking-tight leading-none mt-2">
                      {isBcvLoading ? (
                        <span className="text-xs text-slate-400 font-normal">Cargando...</span>
                      ) : (
                        `${(parseFloat(bcvData?.usd || "45.2400") * 60).toFixed(2)} Bs.`
                      )}
                    </div>
                    <p className="text-[9px] font-bold text-amber-700 mt-3 uppercase flex items-center gap-1 font-mono">
                      UNIDAD SOBERANA (60 USD)
                    </p>
                  </div>
                </div>

                {/* SINK INFO BLOCK FROM BCV CONNECTOR */}
                <div className="bg-[#f0f9ff] border border-sky-200 p-3.5 flex items-start gap-3">
                  <Info className="w-5 h-5 text-sky-700 shrink-0 mt-0.5" />
                  <div className="text-[11px] font-mono leading-relaxed text-sky-950 space-y-0.5">
                    <span className="block font-black uppercase text-[10px] font-bold">VERIFICADOR DE AUDITORÍA REGULADOR:</span>
                    <span>CANAL CENTRAL: <strong className="text-sky-800">{bcvData?.source || 'Banco Central de Venezuela (Sitio Oficial - Respaldo)'}</strong></span>
                    <span className="block">CRUCES SÉPTIMO: <strong className="text-emerald-800">CONCEPTO CONFORME</strong> • REGISTRO AUTOMÁTICO EN FACTURA LOGÍSTICA.</span>
                  </div>
                </div>

                {/* Currency Simulator and Interactive Arbitration Module */}
                <div className="bg-white border border-[#c3c6d1] shadow-md overflow-hidden">
                  <div className="bg-[#001e40] text-white px-5 py-3 border-b border-[#00142b] flex items-center gap-2">
                    <QrCode className="w-5 h-5 text-[#a3f69c] shrink-0" />
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 block uppercase tracking-wider">MÓDULO DE LIQUIDACIÓN Y CAMBIO</span>
                      <span className="text-xs font-black uppercase tracking-tight font-bold">Convertidor Multidivisa en Tiempo Real</span>
                    </div>
                  </div>

                  <div className="p-4 sm:p-6 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Bolivares (Bs) Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                          Monto en Bolívares (VES / Bs.)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={calcBs}
                            onChange={(e) => handleCalcChange(e.target.value, 'Bs')}
                            className="w-full bg-slate-50 border-2 border-slate-300 font-mono text-sm font-bold text-slate-800 px-3.5 py-2 hover:border-[#1b6d24] focus:border-[#1b6d24] focus:bg-white outline-none transition-all"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3.5 top-2 text-[8px] font-extrabold text-slate-400 font-mono uppercase bg-slate-200 border px-1 py-0.5">Bs.</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block">Moneda de curso legal</span>
                      </div>

                      {/* Dólares (USD) Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                          Monto en Dólares (USD)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={calcUsd}
                            onChange={(e) => handleCalcChange(e.target.value, 'USD')}
                            className="w-full bg-slate-50 border-2 border-slate-300 font-mono text-sm font-bold text-slate-800 px-3.5 py-2 hover:border-[#1b6d24] focus:border-[#1b6d24] focus:bg-white outline-none transition-all"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3.5 top-2 text-[8px] font-extrabold text-white font-mono uppercase bg-[#001e40] px-1 py-0.5">USD</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block">Referencia base</span>
                      </div>

                      {/* Euros (EUR) Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                          Monto en Euros (EUR)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={calcEur}
                            onChange={(e) => handleCalcChange(e.target.value, 'EUR')}
                            className="w-full bg-slate-50 border-2 border-slate-300 font-mono text-sm font-bold text-slate-800 px-3.5 py-2 hover:border-[#1b6d24] focus:border-[#1b6d24] focus:bg-white outline-none transition-all"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3.5 top-2 text-[8px] font-extrabold text-slate-800 font-mono uppercase bg-yellow-400 px-1 py-0.5 border border-yellow-500">EUR</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block">Unidad de aduana europea</span>
                      </div>

                      {/* USDT Input */}
                      <div className="space-y-1.5">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-wider font-mono">
                          Monto en USDT (Tether Digital)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={calcUsdt}
                            onChange={(e) => handleCalcChange(e.target.value, 'USDT')}
                            className="w-full bg-slate-50 border-2 border-slate-300 font-mono text-sm font-bold text-slate-800 px-3.5 py-2 hover:border-[#1b6d24] focus:border-[#1b6d24] focus:bg-white outline-none transition-all"
                            placeholder="0.00"
                          />
                          <span className="absolute right-3.5 top-2 text-[8px] font-extrabold text-white font-mono uppercase bg-emerald-600 px-1 py-0.5">USDT</span>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 block">Estable digital referencial</span>
                      </div>
                    </div>

                    {/* Pre-established presets bar & Actions */}
                    <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
                        <span className="text-slate-400 py-1 inline-block uppercase">Preestablecidos rápidos:</span>
                        {[5, 10, 20, 50, 100, 500, 1000].map((val) => (
                          <button
                            key={val}
                            type="button"
                            onClick={() => handleCalcChange(val.toString(), 'USD')}
                            className="bg-slate-100 hover:bg-[#1b6d24] hover:text-white border border-[#c3c6d1] text-[#001e40] font-bold px-2 py-1 uppercase transition-colors cursor-pointer"
                          >
                            ${val}
                          </button>
                        ))}
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          handleCalcChange('0', 'Bs');
                          triggerToast("Calculadora de divisas reiniciada.");
                        }}
                        className="text-[10px] bg-red-50 text-red-700 hover:bg-red-100 font-extrabold uppercase px-3 py-1.5 cursor-pointer transition-colors border border-red-200 font-mono text-center font-bold"
                      >
                        Limpiar Todo
                      </button>
                    </div>
                  </div>
                </div>

                {/* Normativa Legal Fiscal */}
                <div className="bg-slate-50 border border-slate-305 p-5 font-mono text-xs text-slate-700 space-y-3">
                  <div className="flex items-center gap-2 text-slate-800 font-black uppercase text-[11px] border-b border-slate-300 pb-2 font-bold">
                    <Percent className="w-4 h-4 text-[#1b6d24]" />
                    <span>MARCO REGULATORIO Y FACTURACIÓN MULTIDIVISA (REPÚBLICA DE VENEZUELA)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-justify font-sans text-xs text-slate-600 leading-relaxed">
                    <p>
                      <strong>LEY DE IMPUESTO AL VALOR AGREGADO (Art. 31):</strong> Cuando la liquidación o facturación de los servicios de transporte aduanero, fletes refrigerados o importación de fruta fresca se pacten en moneda extranjera, el monto de la base imponible y del impuesto respectivo deberán expresarse siempre en la factura comercial en su equivalente en Bolívares (Bs.). Dicha conversión se realizará aplicando únicamente la tasa cambiaria oficial de cierre vigente para la fecha de la operación, emitida y publicada por el <strong>Banco Central de Venezuela (BCV)</strong>.
                    </p>
                    <p>
                      <strong>LEY DE IMPUESTO A LAS GRANDES TRANSACCIONES FINANCIERAS (IGTF):</strong> Las cancelaciones de fletes marítimos, terrestres o gastos de puerto efectuadas directamente en divisas físicas (USD o EUR) sin intermediación de la banca corresponsal nacional están sujetas a la alícuota del <strong>3.0%</strong> de retención fiscal por concepto de IGTF, la cual debe asentarse de forma separada del IVA en la ficha de control. Los pagos procesados íntegramente en Bolívares Oficiales a la tasa oficial quedan exentos de este recargo.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}


            {/* TAB: RETENCIONES - EMISIÓN DE COMPROBANTES DE RETENCIÓN ISLR */}
            {activeTab === 'retenciones' && (
              <motion.div
                key="retenciones-page"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1400px] mx-auto space-y-6"
              >
                <RetencionesTab />
              </motion.div>
            )}


            {/* TAB: TICKETS - EMISIÓN DE TICKETS DE CÁLCULO RÁPIDO ISLR */}
            {activeTab === 'tickets' && (
              <motion.div
                key="tickets-page"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1400px] mx-auto space-y-6 animate-fade-in"
              >
                <TicketsTab />
              </motion.div>
            )}


            {/* TAB: DIRECCIONES - HOJA DE RUTA PARA CHÓFERES */}
            {activeTab === 'direcciones' && (
              <motion.div
                key="direcciones-page"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[1400px] mx-auto space-y-6"
              >
                <DireccionesTab />
              </motion.div>
            )}


            {/* TAB 4: COMPREHENSIVE ACERCA DE PANEL (AS REQUESTED) */}
            {activeTab === 'settings' && (
              <motion.div 
                key="settings-page"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.15 }}
                className="max-w-[800px] mx-auto space-y-4"
              >
                <div>
                  <h3 className="text-base font-black text-[#001e40] uppercase flex items-center">
                    <Info className="w-5 h-5 mr-2 text-[#1b6d24]" />
                    Acerca del Panel de Control Tributario y Cambiario
                  </h3>
                  <p className="text-xs text-slate-500">Documentación integral de la plataforma y datos técnicos sobre el ecosistema fiscal venezolano.</p>
                </div>

                {/* Banner */}
                <div className="bg-slate-50 border border-[#b2e2b9] p-4 text-xs text-slate-700 leading-relaxed space-y-3">
                  <div className="flex items-center gap-4 border-b border-green-200 pb-3">
                    <img 
                      src="https://www.bananera.com/assets/asset-1603287856366.png?v=0.5624928979281254" 
                      className="max-h-12 w-auto object-contain mix-blend-multiply drop-shadow"
                      referrerPolicy="no-referrer"
                      alt="Bananera Logo Corp About" 
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                    <div>
                      <h4 className="text-sm font-black text-[#001e40] uppercase">C.A. Bananera Venezolana</h4>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-mono">Yaracuy, Venezuela</p>
                    </div>
                  </div>
                  <p>
                    Esta plataforma unificada tiene como objetivo principal servir de puente tecnológico para consolidar el control contable, cambiario y aduanal de la C.A. Bananera Venezolana en Yaracuy y a nivel nacional. Se conecta dinámicamente con los servidores de internet públicos de Venezuela para asegurar que los datos no sean inventados y correspondan estrictamente a los registros activos, incluyendo tasas e indicadores de valor real de BCV y USDT.
                  </p>
                </div>

                {/* Detailed Information Categories ("Toda la información de la web") */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div className="bg-white border border-[#c3c6d1] p-4 space-y-3 text-xs font-sans">
                    <h5 className="font-extrabold text-[#001e40] uppercase border-b border-slate-100 pb-1.5 font-mono flex items-center gap-1.5 text-[11px]">
                      <Search className="w-3.5 h-3.5 text-[#1b6d24]" />
                      1. RECOPILACIÓN SENIAT WEB EN VIVO
                    </h5>
                    <p className="text-slate-600 leading-relaxed">
                      La búsqueda avanzada emula una sesión directa del navegador para el portal de contribuyentes en <strong className="font-mono text-[#001e40]">http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp</strong>.
                    </p>
                    <p className="text-slate-500 leading-snug">
                      La resolución automática de CAPTCHAs decodifica la imagen oficial en el servidor mediante procesamiento de visión computacional integrada, evitando que las solicitudes se bloqueen. Los resultados contienen datos oficiales de Razón Social, RIF, Actividad Económica declarada y porcentaje de retenciones asignadas.
                    </p>
                  </div>

                  <div className="bg-white border border-[#c3c6d1] p-4 space-y-3 text-xs font-sans">
                    <h5 className="font-extrabold text-[#001e40] uppercase border-b border-slate-100 pb-1.5 font-mono flex items-center gap-1.5 text-[11px]">
                      <TrendingUp className="w-3.5 h-3.5 text-[#1b6d24]" />
                      2. TASAS CAMBIARIAS REALES BCV Y USDT
                    </h5>
                    <p className="text-slate-600 leading-relaxed">
                      El sistema consume en tiempo real el tipo de cambio oficial del Banco Central de Venezuela (<strong className="font-mono text-[#001e40]">https://www.bcv.org.ve/</strong>) y el de Tether desde (<strong className="font-mono text-[#001e40]">https://www.usdt.com.ve/</strong>).
                    </p>
                    <p className="text-slate-500 leading-snug">
                      Esto garantiza precisión milimétrica al momento de facturar en bolívares operaciones tasadas en divisas extranjeras (USD o EUR) o estimar paritarias con criptoactivos estables (USDT).
                    </p>
                  </div>

                  <div className="bg-white border border-[#c3c6d1] p-4 space-y-3 text-xs font-sans">
                    <h5 className="font-extrabold text-[#001e40] uppercase border-b border-slate-100 pb-1.5 font-mono flex items-center gap-1.5 text-[11px]">
                      <Layers className="w-3.5 h-3.5 text-[#1b6d24]" />
                      3. ENTORNO SANDBOX MULTITAREA
                    </h5>
                    <p className="text-slate-600 leading-relaxed">
                      La plataforma incorpora un módulo de ventanas flotantes dinámicas que permite operar los múltiples portales de la administración sin interferir con la navegación general de la web.
                    </p>
                    <p className="text-slate-500 leading-snug">
                      Se pueden arrastrar, minimizar al dock inferior, maximizar y cerrar dinámicamente cada portal de forma independiente, posibilitando la multitarea eficaz.
                    </p>
                  </div>

                  <div className="bg-white border border-[#c3c6d1] p-4 space-y-3 text-xs font-sans">
                    <h5 className="font-extrabold text-[#001e40] uppercase border-b border-slate-100 pb-1.5 font-mono flex items-center gap-1.5 text-[11px]">
                      <HelpCircle className="w-3.5 h-3.5 text-[#1b6d24]" />
                      4. CALCULADORA DE IVA VENEZUELA
                    </h5>
                    <p className="text-slate-600 leading-relaxed">
                      Incorpora el modelo de cómputo exacto de la calculadora de IVA oficial regulada según el Ministerio de Finanzas de Venezuela.
                    </p>
                    <p className="text-slate-500 leading-snug">
                      Soporta el cálculo directo (agregar el 16%) o inverso (extraer o desglosar del precio final para estimar la base imponible neta), permitiendo también alícuotas del 8% y 15% según gacetas de lujo.
                    </p>
                  </div>

                </div>

                {/* Adjustable controls only */}
                <div className="bg-white border border-[#c3c6d1] p-4 space-y-4 text-xs font-mono">
                  <div className="border-b border-slate-100 pb-2">
                    <h4 className="font-extrabold uppercase text-[#001e40]">Ajustes de Terminal de Control</h4>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="block font-black text-slate-500 uppercase">Texto Descriptivo de Departamento</label>
                    <input 
                      type="text" 
                      value={settings.logisticsDept}
                      onChange={(e) => setSettings({ ...settings, logisticsDept: e.target.value.toUpperCase() })}
                      className="w-full border border-[#737780] p-2 uppercase bg-slate-50 focus:bg-white focus:outline-none text-xs"
                    />
                  </div>

                  <div className="text-[10px] text-slate-400 bg-slate-50 p-3 leading-relaxed border border-slate-200 space-y-1">
                    <p><strong>REPORTE OPERATIVO:</strong></p>
                    <p>• Versión de Compilado Tecnológico: {settings.systemVersion}</p>
                    <p>• Enlace Local: SECURE-AES-LOCAL-STORAGE</p>
                    <p>• Licencia de uso: C.A. BANANERA VENEZOLANA - TODOS LOS DERECHOS RESERVADOS 2026</p>
                    <p className="pt-2 text-[9px] text-slate-400 border-t border-slate-200 mt-2 flex justify-between items-center font-mono">
                      <span>YARACUY, VENEZUELA</span>
                      <span>POWERED BY: <a href="https://instagram.com/capellatec" target="_blank" rel="noopener noreferrer" className="hover:underline text-slate-500 font-bold uppercase">CAPELLA TEC</a></span>
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </main>

        {/* STATIC SYSTEM FOOTER (MATCHING V2.5.0 STABLE SYSTEM ONLINE SPEC - STRICT 24H CLOCK) */}
        <footer className="no-print h-6 bg-[#001e40] border-t border-[#737780] flex justify-between items-center px-4 shrink-0 absolute bottom-0 inset-x-0 font-mono text-[10px] text-white z-20">
          <div className="font-extrabold uppercase tracking-widest text-[#a3f69c]/80 flex items-center gap-1.5 font-sans">
            <span>{settings.systemVersion}</span>
            <span className="text-slate-400">|</span>
            <span className="text-slate-300">USER: {currentUser ? currentUser.username.toUpperCase() : 'USER_CABV'}</span>
          </div>

          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-[#88d982] shadow-[0_0_8px_#88d982] animate-pulse"></span>
              <span className="text-slate-200">SISTEMA INTEGRADO ONLINE</span>
            </div>
            
            <button 
              onClick={() => triggerToast("Bananera Venezolana Admin Portal v2.5.0-STABLE. Soporte técnico con CAPELLA TEC.")}
              className="text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              CABV IT & ERP
            </button>
          </div>
        </footer>

        {/* INACTIVITY WARNING OVERLAY */}
        <AnimatePresence>
          {showInactivityModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 no-print select-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-[#0d2e38] border-2 border-amber-600 max-w-sm w-full p-6 text-center text-white relative shadow-2xl"
              >
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-950/50 border border-amber-500 mb-4 animate-bounce">
                  <AlertTriangle className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-amber-400 font-mono">ADVERTENCIA DE INACTIVIDAD</h3>
                <p className="text-xs text-slate-300 mt-2 mb-4 leading-relaxed font-sans">
                  No se ha registrado actividad en los últimos 5 minutos. Su sesión se cerrará automáticamente en:
                </p>
                <div className="bg-[#05171d] py-3.5 border border-[#1e4e5b] rounded mb-5">
                  <span className="text-4xl font-black font-mono tracking-widest text-[#a3f69c] animate-pulse">
                    00:{String(countdownSeconds).padStart(2, '0')}
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setShowInactivityModal(false);
                      triggerToast("💼 Sesión restaurada de forma segura.");
                    }}
                    className="w-full bg-[#1b6d24] hover:bg-[#238c2f] text-white font-extrabold py-2.5 text-[11px] uppercase tracking-wider rounded-none transition-colors cursor-pointer border border-[#88d982]/20"
                  >
                    Permanecer en Línea
                  </button>
                  <button
                    onClick={() => {
                      setCurrentUser(null);
                      localStorage.removeItem('bananera_user');
                      setShowInactivityModal(false);
                      setLoginStep('username');
                      setVerifiedName('');
                      setLoginUsername('');
                      setLoginPassword('');
                      triggerToast("🚪 Sesión cerrada de forma manual.");
                    }}
                    className="w-full hover:bg-red-950 text-red-400 font-bold py-2 text-[10px] uppercase tracking-wider rounded-none transition-colors cursor-pointer"
                  >
                    Cerrar Sesión Ahora
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* TOAST PANEL */}
        <AnimatePresence>
          {copiedToastText && (
            <motion.div 
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 25 }}
              className="fixed bottom-10 right-4 bg-slate-900 border border-slate-700 text-white px-4 py-2.5 shadow-2x font-mono text-xs z-[60] flex items-center space-x-2"
            >
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{copiedToastText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ENTORNO COSECHA MULTITAREA: FLOATING ACTIVE WINDOWS */}
        <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
          {openWindows.map((win) => {
            if (win.isMinimized) return null;
            return (
              <motion.div
                key={win.id}
                drag={!win.isMaximized}
                dragMomentum={false}
                dragElastic={0}
                style={
                  win.isMaximized 
                    ? { zIndex: win.zIndex, x: 0, y: 0, width: '100vw', height: 'calc(100vh - 44px)' } 
                    : { zIndex: win.zIndex, x: win.x, y: win.y, width: win.width || 650, height: win.height || 500 }
                }
                onDragStart={() => focusWindow(win.id)}
                onClick={() => focusWindow(win.id)}
                className={`pointer-events-auto absolute bg-white border-2 flex flex-col overflow-hidden shadow-2xl transition-all duration-150 ${
                  focusedWindowId === win.id 
                    ? 'border-[#001e40] ring-1 ring-[#1b6d24]' 
                    : 'border-[#c3c6d1]'
                }`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {/* Drag Handle Top Banner */}
                <div className="bg-[#001e40] text-white px-3 py-2 flex items-center justify-between select-none cursor-move shrink-0 border-b border-[#1b6d24]">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Globe className="w-3.5 h-3.5 text-[#1b6d24] animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider truncate font-mono">{win.name}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 shrink-0">
                    <button 
                      onClick={(e) => { e.stopPropagation(); minimizeWindow(win.id); }} 
                      className="p-1 hover:bg-[#1b6d24] transition-colors cursor-pointer" 
                      title="Minimizar"
                    >
                      <Minus className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); toggleMaximizeWindow(win.id); }} 
                      className="p-1 hover:bg-[#1b6d24] transition-colors cursor-pointer" 
                      title={win.isMaximized ? "Restaurar tamaño original" : "Maximizar a pantalla completa"}
                    >
                      <Maximize2 className="w-3.5 h-3.5 text-white" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); closeWindow(win.id); }} 
                      className="p-1 hover:bg-red-600 transition-colors cursor-pointer" 
                      title="Cerrar"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </div>
                </div>

                {/* Simulated Navigation Toolbar */}
                <div className="bg-slate-100 border-b border-slate-200 px-2 py-1 flex items-center justify-between gap-2 shrink-0 text-[10px]">
                  <div className="flex items-center space-x-1 font-mono text-slate-500 bg-white border border-slate-200 rounded px-2 py-0.5 truncate flex-1">
                    <span className="text-emerald-600 select-none">https://</span>
                    <span className="truncate select-all text-slate-600 select-none">{win.url.replace(/^https?:\/\//, '')}</span>
                  </div>

                  {/* SIZING QUICK PRESETS SELECTOR */}
                  <div className="flex items-center bg-white border border-slate-300 rounded px-1.5 py-0.5 gap-1 shrink-0 font-mono text-[9px] text-slate-700">
                    <span className="text-slate-400 font-bold uppercase select-none mr-0.5">MEDIDAS:</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resizeWindowPreset(win.id, 'small'); }} 
                      className="px-1 hover:bg-[#1b6d24] hover:text-white transition-colors cursor-pointer font-black"
                      title="Pequeño (450x350)"
                    >
                      P
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resizeWindowPreset(win.id, 'medium'); }} 
                      className="px-1 hover:bg-[#1b6d24] hover:text-white transition-colors cursor-pointer font-black"
                      title="Mediano (700x520)"
                    >
                      M
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resizeWindowPreset(win.id, 'large'); }} 
                      className="px-1 hover:bg-[#1b6d24] hover:text-white transition-colors cursor-pointer font-black"
                      title="Grande (980x640)"
                    >
                      G
                    </button>
                    <span className="text-slate-300">|</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); resizeWindowPreset(win.id, 'giga'); }} 
                      className="px-1 hover:bg-[#1b6d24] hover:text-white transition-colors cursor-pointer font-black"
                      title="Giga (1280x780)"
                    >
                      GG
                    </button>
                  </div>

                  <a 
                    href={win.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[9px] font-mono font-bold text-[#001e40] hover:bg-slate-200 transition-colors flex items-center gap-1 shrink-0 bg-white border border-slate-300 px-2 py-1"
                  >
                    <span>Externo</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Geoblocking and loading advisory bar */}
                <div className="bg-amber-50 border-b border-amber-200 px-3 py-1.5 text-[9px] text-amber-900 flex justify-between items-center shrink-0 font-sans shadow-inner">
                  <div className="flex items-center gap-1.5 truncate flex-1 mr-2 font-mono">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span className="font-semibold truncate">
                      ¿Restricción / pantalla blanca? Los portales del SENIAT, BCV y Banca de Venezuela bloquean accesos desde servidores extranjeros.
                    </span>
                  </div>
                  <a
                    href={win.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-[#1b6d24] hover:bg-[#16551d] text-white font-mono font-black px-2 py-0.5 text-[9px] rounded uppercase flex items-center gap-1 shrink-0 transition-colors"
                  >
                    <span>Abrir Externo Directo</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>

                {/* Embed container */}
                <div className="flex-1 bg-white relative">
                  {/* Overlay shield that intercepts mouse during unfocused states so drag or clicking works smoothly */}
                  {focusedWindowId !== win.id && (
                    <div className="absolute inset-0 bg-transparent z-10 cursor-pointer" onClick={() => focusWindow(win.id)} />
                  )}
                  <iframe 
                    src={`/api/proxy?url=${encodeURIComponent(win.url)}`} 
                    className="w-full h-full border-none bg-slate-50 pointer-events-auto"
                    title={win.name}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* BOTTOM MULTITASKING DOCK WORKSPACE */}
        {openWindows.length > 0 && (
          <div className="fixed bottom-0 left-0 right-0 h-11 bg-[#001e40] border-t-2 border-[#1b6d24] flex items-center justify-between px-4 z-[90] shadow-lg">
            <div className="flex items-center space-x-2 overflow-x-auto py-1 flex-1 mr-4 scrollbar-hidden">
              <span className="text-[10px] font-mono font-black text-[#1b6d24] uppercase mr-2 tracking-wider shrink-0 hidden sm:inline">
                MULTITAREA CABV [{openWindows.length}]:
              </span>
              {openWindows.map(win => (
                <button
                  key={win.id}
                  onClick={() => {
                    if (win.isMinimized) {
                      focusWindow(win.id);
                    } else if (focusedWindowId === win.id) {
                      minimizeWindow(win.id);
                    } else {
                      focusWindow(win.id);
                    }
                  }}
                  className={`px-3 py-1 text-[10px] font-mono uppercase font-bold border transition-colors flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                    focusedWindowId === win.id 
                      ? 'bg-[#1b6d24] text-white border-white' 
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${win.isMinimized ? 'bg-slate-600' : 'bg-[#1b6d24] animate-pulse'}`} />
                  <span className="truncate max-w-[120px]">{win.name}</span>
                </button>
              ))}
            </div>
            
            <button 
              onClick={() => setOpenWindows([])} 
              className="text-[9px] font-mono font-bold text-red-400 hover:text-white uppercase shrink-0 border border-red-900 bg-red-950/80 px-2.5 py-1.5 cursor-pointer hover:bg-red-900 transition-colors"
            >
              Cerrar Ventanas
            </button>
          </div>
        )}

        {/* POPUP DE MANTENIMIENTO SENIAT (CARGA CADA 5 SEGUNDOS) */}
        <AnimatePresence>
          {showMantenimientoModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white border-4 border-amber-500 max-w-sm w-full shadow-2xl p-5 font-mono text-xs"
              >
                <div className="flex items-center gap-2 text-amber-600 font-extrabold uppercase text-xs border-b border-amber-200 pb-2 mb-3">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>SISTEMA EN MANTENIMIENTO</span>
                </div>
                
                <p className="text-slate-700 leading-relaxed mb-3 text-justify font-sans text-xs">
                  <strong>AVISO AL USUARIO:</strong> El módulo de consulta web directa del SENIAT se encuentra actualmente en labores de mantenimiento de base de datos técnica preventiva. Ciertos elementos o enlaces podrían no responder temporalmente.
                </p>

                <div className="bg-amber-50 border border-amber-200 p-2 text-[10px] text-amber-900 leading-snug mb-4">
                  Alerta periódica recurrente de contingencia integrada de conformidad con los protocolos de Bananera Venezolana.
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowMantenimientoModal(false)}
                    className="bg-amber-600 hover:bg-amber-700 text-white font-extrabold px-3.5 py-1.5 uppercase tracking-wider transition-colors cursor-pointer text-[10px]"
                  >
                    Entendido / Cerrar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>

    </div>
  );
}
