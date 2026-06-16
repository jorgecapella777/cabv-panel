import { Portal, CredentialItem } from './types';

export const INITIAL_PORTALS: Portal[] = [
  // 1. FINANZAS Y BANCA
  {
    id: 'bnc-personas',
    name: 'BNC Personas en Línea',
    category: 'finance',
    url: 'https://personas.bncenlinea.com/',
    icon: 'apps',
    keywords: 'bnc personas bncenlinea banco nacional de credito',
    defaultUser: 'USER_BNC_PERS'
  },
  {
    id: 'bdvenlinea-personas',
    name: 'BDV en Línea Personas',
    category: 'finance',
    url: 'https://bdvenlinea.banvenez.com/',
    icon: 'account_balance',
    keywords: 'bdv en linea venezuela personas banvenez',
    defaultUser: 'G_PERS_BDV'
  },
  {
    id: 'mercantil',
    name: 'Mercantil en Línea',
    category: 'finance',
    url: 'https://www.mercantilbanco.com/personas',
    icon: 'dns',
    keywords: 'mercantil en linea banco mercantil',
    defaultUser: 'USER_MERC',
    badge: 'J-12345678-0'
  },
  {
    id: 'bt-enlinea',
    name: 'Banco del Tesoro en Línea BT',
    category: 'finance',
    url: 'https://tesoroenlinea.bt.com.ve/lg',
    icon: 'account_balance',
    keywords: 'banco del tesoro bt en linea lg',
    defaultUser: 'TESORO_USER'
  },
  {
    id: 'bbva-provincial',
    name: 'BBVA Provinet Provincial',
    category: 'finance',
    url: 'https://www.bbvaprovinet.provincial.com/personas/BBVAProvincial.html',
    icon: 'apps',
    keywords: 'bbva provincial provinet personas banco provincial',
    defaultUser: 'BBVA_PERS_01'
  },
  {
    id: 'tarjeta-omega',
    name: 'Tarjeta Omega Bono Beneficiario',
    category: 'finance',
    url: 'https://servicio.tarjetaomega.com/BonoBeneficiario/acceso.aspx',
    icon: 'apps',
    keywords: 'tarjeta omega bono beneficiario alimentacion acceso',
    defaultUser: 'OMEGA_BENEF'
  },
  {
    id: 'patria-personas',
    name: 'Patria Portal de Personas',
    category: 'finance',
    url: 'https://persona.patria.org.ve/login/clave/',
    icon: 'apps',
    keywords: 'patria portal personas login clave carnet patria',
    defaultUser: 'PATRIA_V200'
  },
  {
    id: 'bcv-oficial',
    name: 'Banco Central de Venezuela (BCV)',
    category: 'finance',
    url: 'https://www.bcv.org.ve/',
    icon: 'account_balance',
    keywords: 'bcv banco central de venezuela tasa dolar euro oficial',
    defaultUser: 'BCV_PUBLIC'
  },

  // 2. TRIBUTOS Y LEYES
  {
    id: 'seniat-login',
    name: 'SENIAT Login Contribuyente',
    category: 'taxes',
    url: 'http://contribuyente.seniat.gob.ve/iseniatlogin/contribuyente.do',
    icon: 'account_balance_wallet',
    keywords: 'seniat iseniatlogin contribuyente do login oficial portal hilos',
    defaultUser: 'SENIAT_USER'
  },
  {
    id: 'seniat',
    name: 'SENIAT (Declaraciones)',
    category: 'taxes',
    url: 'https://seniatenlinea.seniat.gob.ve/',
    icon: 'account_balance_wallet',
    keywords: 'seniat impuestos tributos declaracion iva islr',
    defaultUser: 'SENIAT_BANANERA',
    badge: 'J-12345678-0'
  },
  {
    id: 'seniat-consulta-rif-directa',
    name: 'SENIAT Consulta RIF Directa',
    category: 'taxes',
    url: 'http://contribuyente.seniat.gob.ve/BuscaRif/BuscaRif.jsp',
    icon: 'account_balance_wallet',
    keywords: 'seniat consulta rif directa buscarif jsp buscador',
    defaultUser: 'SENIAT_PUBLIC'
  },
  {
    id: 'ivss-oficial',
    name: 'IVSS Portal Oficial',
    category: 'taxes',
    url: 'http://www.ivss.gov.ve/',
    icon: 'medical_services',
    keywords: 'ivss seguro social venezuela pensionados pensión cotizacion',
  },
  {
    id: 'banavih-faovel',
    name: 'BANAVIH (FAOV Elínea)',
    category: 'taxes',
    url: 'http://faovel.banavih.gob.ve/',
    icon: 'home',
    keywords: 'banavih faovel linea banavih faov habitacional',
  },
  {
    id: 'banavih-sirevih-elegibilidad',
    name: 'BANAVIH SIREVIH Elegibilidad',
    category: 'taxes',
    url: 'http://elegibilidad.banavih.gob.ve/sirevih_web.php/login_web',
    icon: 'home',
    keywords: 'banavih sirevih elegibilidad login sirevih web',
  },
  {
    id: 'inces',
    name: 'INCES',
    category: 'taxes',
    url: 'https://inces.gob.ve',
    icon: 'school',
    keywords: 'inces capacitacion formacion tributo inces',
    defaultUser: 'INC_ADMIN',
  },

  // 3. IDENTIDAD Y LEGAL
  {
    id: 'saime-siic',
    name: 'SAIME SIIC Extranjería',
    category: 'legal',
    url: 'https://siic.saime.gob.ve/',
    icon: 'id_card',
    keywords: 'saime siic extranjeria migracion pasaporte',
  },
  {
    id: 'saime-documentos',
    name: 'SAIME Documentos Oficiales',
    category: 'legal',
    url: 'https://documentos.saime.gob.ve/',
    icon: 'id_card',
    keywords: 'saime documentos oficiales certificaciones',
  },
  {
    id: 'sica-sunagro',
    name: 'SICA SUNAGRO Alimentos',
    category: 'legal',
    url: 'https://sica.sunagro.gob.ve/login',
    icon: 'gavel',
    keywords: 'sica sunagro login sistema control agroalimentario guias',
  },
  {
    id: 'sapi',
    name: 'SAPI',
    category: 'legal',
    url: 'https://sapi.gob.ve',
    icon: 'copyright',
    keywords: 'sapi propiedad intelectual patentes marcas derechos',
    defaultUser: 'SAPI_REG',
  },
  {
    id: 'saren-tramites',
    name: 'SAREN Trámites en Línea',
    category: 'legal',
    url: 'https://tramites.saren.gob.ve/',
    icon: 'gavel',
    keywords: 'saren tramites en linea registros notarias apostilla saren',
  },
  {
    id: 'movilnet-consulta',
    name: 'Movilnet Consulta de Abono',
    category: 'legal',
    url: 'http://www.movilnet.com.ve/sitio/minisitios/consulta/',
    icon: 'gavel',
    keywords: 'movilnet consulta abono balance saldo telefonia',
  }
];

export const INITIAL_CREDENTIALS: CredentialItem[] = [
  {
    id: 'cred-1',
    title: 'C.A. Bananera - Matriz',
    username: 'ADM_01',
    password: 'Pass123!',
    lastSync: '2h ago',
    category: 'finance'
  },
  {
    id: 'cred-2',
    title: 'Filial Occidente',
    username: 'REG_OCC_2',
    password: 'Occident24*',
    lastSync: '5h ago',
    category: 'finance'
  }
];

export const PRESET_SENIAT_COMPANIES: Record<string, { razonSocial: string; estadoRetencion: string; domicilioFiscal: string; actividadEconomica: string; statusOperaciones: string; alDia: boolean }> = {
  'J-12345678-0': {
    razonSocial: 'BANANERA VENEZOLANA, C.A.',
    estadoRetencion: 'CONTRIBUYENTE ESPECIAL (RETENCIÓN 75%)',
    domicilioFiscal: 'Av. Principal de Las Mercedes, Edif. Bananera, Piso 4, Caracas, Venezuela',
    actividadEconomica: 'Producción, Cosecha, Empaque y Exportación de Banano Orgánico y Frutas Tropicales.',
    statusOperaciones: 'SOLVENTE - ACTIVO',
    alDia: true
  },
  'J-30456123-4': {
    razonSocial: 'BANANERA FILIAL OCCIDENTE, C.A.',
    estadoRetencion: 'CONTRIBUYENTE ESPECIAL (RETENCIÓN 75%)',
    domicilioFiscal: 'Zona Industrial El Cheral, Galpón 12, Valera, Edo. Trujillo, Venezuela',
    actividadEconomica: 'Centro de Acopio Logístico y Almacenamiento Réfrigerado.',
    statusOperaciones: 'SOLVENTE - CON DECLARACIONES AL DÍA',
    alDia: true
  },
  'J-00000000-0': {
    razonSocial: 'EXPORTACIONES DE ORIENTE, S.A.',
    estadoRetencion: 'CONTRIBUYENTE ORDINARIO',
    domicilioFiscal: 'Puerto de Guanta, Calle Marina, Local 4B, Guanta, Edo. Anzoátegui',
    actividadEconomica: 'Agenciamiento de Carga Naviera y Envíos Marítimos Marítimos.',
    statusOperaciones: 'SOLVENTE - OPERATIVO',
    alDia: true
  },
  'J-07013380-5': {
    razonSocial: 'SUPERMERCADOS MODELO, S.A.',
    estadoRetencion: 'CONTRIBUYENTE ESPECIAL (RETENCIÓN 100%)',
    domicilioFiscal: 'Av. Bolívar Norte, Sector El Viñedo, Valencia, Edo. Carabobo',
    actividadEconomica: 'Venta al Detal de Alimentos y Consumo Masivo.',
    statusOperaciones: 'AL DÍA - AUDITORÍA MENSUAL COMPLETADA',
    alDia: true
  }
};
