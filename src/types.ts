export interface Portal {
  id: string;
  name: string;
  category: 'finance' | 'taxes' | 'legal';
  url: string;
  icon: string;
  keywords: string;
  badge?: string;
  defaultUser?: string;
}

export interface CredentialItem {
  id: string;
  title: string;
  username: string;
  password?: string;
  lastSync: string;
  category: 'finance' | 'taxes' | 'legal' | 'general';
}

export interface SeniatQueryResult {
  rif: string;
  razonSocial: string;
  estadoRetencion: string;
  domicilioFiscal: string;
  actividadEconomica: string;
  statusOperaciones: string;
  alDia: boolean;
  comentariosDictamen?: string;
}

export interface SystemSettings {
  logisticsDept: string;
  activeStatus: string;
  systemVersion: string;
  allowWebSearch: boolean;
}

export interface PortalWindow {
  id: string;
  portalId: string;
  name: string;
  url: string;
  isMinimized: boolean;
  x: number;
  y: number;
  zIndex: number;
  isMaximized?: boolean;
  width?: number;
  height?: number;
}
