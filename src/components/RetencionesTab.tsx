import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  RefreshCw, 
  FileText, 
  AlertTriangle, 
  Settings, 
  HelpCircle,
  TrendingDown,
  Percent,
  CheckCircle,
  Eye,
  Info
} from 'lucide-react';

interface RetencionData {
  // Datos Generales de la Empresa Emisora (C.A. BANANERA VENEZOLANA)
  agenteNombre: string;
  agenteRif: string;
  agenteDireccion: string;
  agenteTelefonos: string;

  // 1. Tipo de documento
  tipoDocumento: 'Factura' | 'Nota de Entrega' | 'Nota de Crédito' | 'Nota de Débito' | 'Certificaciones';
  // 2. Factura (Número se va a llamar)
  nroFactura: string;
  // 3. No. Control Factura
  nroControl: string;
  // 4. Proveedor
  beneficiarioNombre: string;
  // 5. RIF Proveedor
  beneficiarioRif: string;
  beneficiarioDireccion: string;
  beneficiarioTelefonos: string;
  // 6. Fecha (La de el momento por predeterminado)
  fechaEmision: string;
  // 7. Fecha Aplicacion
  fechaAplicacion: string;
  
  // 8. Tipo de Compra (Interna por Predeterminado)
  tipoCompra: 'Internas' | 'Importación' | 'Exentas' | 'Exoneradas' | 'No Sujetas' | 'Sin Derecho a crédito';
  creditoFiscal: 'Deducible' | 'Prorrateable' | 'No Deducible';

  // Casillas más de Importación
  nroPlanillaImportacion: string;
  nroExpedienteImportacion: string;
  fechaDeclaracionAduana: string;
  nroDeclaracionAduana: string;

  // 9. Tipo de Transacción (01 Registro por Predeterminado)
  tipoTransaccion: '01 Registro' | '02 Complemento' | '03 Anulación' | '04 Ajuste';
  // Casilla secreta
  nroFacturaAfectada: string;

  // Montos Manuales directos del tipo de compra
  montoExentas: number;
  montoMontoExento: number; // para Internas e Importación
  montoExoneradas: number;
  montoNoSujetas: number;
  montoSinDerechoCredito: number;

  // Base Imponible y Tasas (Solo se activa con Importación y Internas)
  tasaIvaSeleccionada: 16 | 8 | 31;
  baseImponibleIngresada: number;

  // Base Imponible I.G.T.F. (3% por defecto)
  aplicaIgtfBoolean: boolean;
  baseImponibleIgtf: number;

  // Parámetros de Retención (ISLR) del Certificado
  conceptoPago: string;
  porcentajeRetencion: number;
  sustraendo: number;

  // Observación (comentario del usuario)
  observacion: string;

  // Metadata del Comprobante
  nroComprobante: string;
  lugarEmision: string;
}

const DEFAULT_DATA: RetencionData = {
  agenteNombre: 'C.A. BANANERA VENEZOLANA',
  agenteRif: 'J000292965',
  agenteDireccion: 'CARRETERA PANAMERICANA HACIENDA LA ESPERANZA',
  agenteTelefonos: '2301561 0372142',

  tipoDocumento: 'Factura',
  nroFactura: '003380',
  nroControl: '00-00003380',
  beneficiarioNombre: 'ASOCIACION COOPERATIVA MULTISERVICIOS AGRICOLAS L.V, R.L',
  beneficiarioRif: 'J412560913',
  beneficiarioDireccion: 'CARRETERA MARIN-AROA KM 25 LOCAL NRO. S/N SECTOR LOS TOPITOS EL CHINO TARIA EDO YARACUY',
  beneficiarioTelefonos: '0426-5504274 /04265607401',

  fechaEmision: new Date().toISOString().split('T')[0],
  fechaAplicacion: new Date().toISOString().split('T')[0],

  tipoCompra: 'Internas',
  creditoFiscal: 'Deducible',

  nroPlanillaImportacion: '',
  nroExpedienteImportacion: '',
  fechaDeclaracionAduana: '',
  nroDeclaracionAduana: '',

  tipoTransaccion: '01 Registro',
  nroFacturaAfectada: '',

  montoExentas: 0,
  montoMontoExento: 0,
  montoExoneradas: 0,
  montoNoSujetas: 0,
  montoSinDerechoCredito: 0,

  tasaIvaSeleccionada: 16,
  baseImponibleIngresada: 213696.39,

  aplicaIgtfBoolean: false,
  baseImponibleIgtf: 0,

  conceptoPago: 'Pagos a Empresas Contratistas',
  porcentajeRetencion: 2.0,
  sustraendo: 0.0,

  observacion: '',

  nroComprobante: '32543',
  lugarEmision: 'EL GUAYABO',
};

// Tipos de Pago / Categorías Fiscales de Retención ISLR de tipo de pago de las imágenes
const TIPOS_DE_PAGO_ISLR = [
  { code: 'CONTRA', label: 'Pagos a Empresas Contratistas', porc: 2.0, sustraendo: 0 },
  { code: 'ACCION', label: 'Enajenación de Acciones de Sociedades', porc: 5.0, sustraendo: 0 },
  { code: 'ADQUIS', label: 'Adquisición de Fondos de Comercio', porc: 5.0, sustraendo: 0 },
  { code: 'ALQ-AD', label: 'Alquiler inmuebles. Pago por Administradora', porc: 5.0, sustraendo: 0 },
  { code: 'ALQUIL', label: 'Alquiler de inmuebles. Pago directo Propietario', porc: 5.0, sustraendo: 0 },
  { code: 'APUEST', label: 'Loterías e Hipódromos', porc: 16.0, sustraendo: 0 },
  { code: 'ARREND', label: 'Arrendamiento de Bienes Muebles', porc: 5.0, sustraendo: 0 },
  { code: 'BOLSA', label: 'Enajenación de Acciones Bolsa de Valores', porc: 1.0, sustraendo: 0 },
  { code: 'COMISI', label: 'Comisiones por la Venta Bienes Inmuebles', porc: 5.0, sustraendo: 0 },
  { code: 'GANANC', label: 'Juegos y Apuestas', porc: 34.0, sustraendo: 0 },
  { code: 'HONMAN', label: 'Honorarios Profesionales Mancomunados No Mercantil', porc: 5.0, sustraendo: 0 },
  { code: 'HONORA', label: 'Honorarios Profesionales', porc: 5.0, sustraendo: 0 },
  { code: 'INTERE', label: 'Intereses Capitales tomados en préstamo', porc: 5.0, sustraendo: 0 },
  { code: 'NORET', label: 'No aplica retención', porc: 0.0, sustraendo: 0 },
  { code: 'OTRAS', label: 'Otras Comisiones dist. accesorias Sueldo', porc: 5.0, sustraendo: 0 },
  { code: 'OTRASR', label: 'Otras Retenciones', porc: 0.0, sustraendo: 0 },
  { code: 'PREMIO', label: 'Premio Propietarios Animales de Carrera', porc: 5.0, sustraendo: 0 },
  { code: 'PUBLIC', label: 'Publicidad y Propaganda excepto Radio', porc: 5.0, sustraendo: 0 },
  { code: 'RADIO', label: 'Publicidad y Propaganda emisoras de Radio', porc: 3.0, sustraendo: 0 },
  { code: 'REPARA', label: 'Pago de Seguros por Reparación de Bienes', porc: 5.0, sustraendo: 0 },
  { code: 'SEGHOS', label: 'Pago de Seguros por Atención Hospitalaria', porc: 5.0, sustraendo: 0 },
  { code: 'SEGURO', label: 'Pagos a Corredores de Seguro', porc: 5.0, sustraendo: 0 },
  { code: 'TARJET', label: 'Tarjetas de Crédito o Consumo', porc: 5.0, sustraendo: 0 },
  { code: 'TARJ-G', label: 'Consumo Gasolina Estaciones de Servicio', porc: 1.0, sustraendo: 0 },
  { code: 'TRANSP', label: 'Gastos de Transporte por Fletes', porc: 3.0, sustraendo: 0 },
];

const FAKE_PROVEEDORES = [
  {
    nombre: "ASOCIACION COOPERATIVA MULTISERVICIOS AGRICOLAS L.V, R.L",
    rif: "J-41256091-3",
    direccion: "CARRETERA MARIN-AROA KM 25 LOCAL NRO. S/N SECTOR LOS TOPITOS EL CHINO TARIA EDO YARACUY",
    telefonos: "0426-5504274 / 0426-5607401"
  },
  {
    nombre: "DISTRIBUIDORA Y REPRESENTACIONES YARACUY, C.A.",
    rif: "J-30911543-2",
    direccion: "ZONA INDUSTRIAL SAN FELIPE, AV. INTERCOMUNAL, GALPON NRO 4, SAN FELIPE, EDO YARACUY",
    telefonos: "0254-2314562 / 0412-5123412"
  },
  {
    nombre: "AGROPECUARIA LA ESPERANZA 2012, C.A.",
    rif: "J-29875146-0",
    direccion: "CARRETERA NACIONAL VIA BARQUISIMETO, SECTOR EL DESVIO, CHIVACOA EDO YARACUY",
    telefonos: "0251-8831245 / 0414-5221998"
  },
  {
    nombre: "LOGISTICA Y TRANSPORTES CENTRO-OCCIDENTE F.P.",
    rif: "V-15648937-0",
    direccion: "CALLE 12 ENTRE AV. 5 Y 6, YARITAGUA EDO YARACUY",
    telefonos: "0251-4458912 / 0424-5110928"
  },
  {
    nombre: "REPUESTOS Y MAQUINARIAS SUTI-AGRO C.A.",
    rif: "J-40511234-9",
    direccion: "AV. LIBERTADOR, EDIF. BANCO LARA, PISO 1, BARQUISIMETO EDO LARA",
    telefonos: "0251-2524411 / 0416-6502213"
  },
  {
    nombre: "DISTRIBUIDORA DE ALIMENTOS Y VIVERES EL SOL, C.A.",
    rif: "J-31245678-9",
    direccion: "CALLE COMERCIO LOCAL NRO. 12, CHIVACOA EDO YARACUY",
    telefonos: "0251-6677881 / 0414-9988221"
  },
  {
    nombre: "INVERSIONES Y AGRICULTURA SAN JOSE 2010, F.P.",
    rif: "G-20012345-6",
    direccion: "ZONA INDUSTRIAL I, AV. PRINCIPAL CON CALLE 4, BARQUISIMETO EDO LARA",
    telefonos: "0251-2334455 / 0424-3210987"
  }
];

const MONSTRUO_LUGARES = ["EL GUAYABO", "SAN FELIPE", "CHIVACOA", "BARQUISIMETO", "YARITAGUA", "VALENCIA"];

const TIPOS_DOC = ["Factura", "Nota de Entrega", "Nota de Crédito", "Nota de Débito"];

function getRandomFictitiousData() {
  const proveedor = FAKE_PROVEEDORES[Math.floor(Math.random() * FAKE_PROVEEDORES.length)];
  const nroFactId = Math.floor(1000 + Math.random() * 90000);
  const nroControlId = Math.floor(1000 + Math.random() * 90000);
  const nroCompId = Math.floor(10000 + Math.random() * 89999);
  
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 25)); // last 25 days
  const dateStr = d.toISOString().split('T')[0];

  return {
    beneficiarioNombre: proveedor.nombre,
    beneficiarioRif: proveedor.rif,
    beneficiarioDireccion: proveedor.direccion,
    beneficiarioTelefonos: proveedor.telefonos,
    nroFactura: `00${nroFactId}`,
    nroControl: `00-000${nroControlId}`,
    nroComprobante: `${nroCompId}`,
    fechaEmision: dateStr,
    fechaAplicacion: dateStr,
    tipoDocumento: TIPOS_DOC[Math.floor(Math.random() * TIPOS_DOC.length)] as any,
    lugarEmision: MONSTRUO_LUGARES[Math.floor(Math.random() * MONSTRUO_LUGARES.length)]
  };
}

export function RetencionesTab() {
  const [data, setData] = useState<RetencionData>(() => {
    const saved = localStorage.getItem('bananera_retenciones_complete');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return DEFAULT_DATA; }
    }
    return DEFAULT_DATA;
  });

  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Fictitious data dynamic state
  const [fictitiousData, setFictitiousData] = useState(() => getRandomFictitiousData());

  useEffect(() => {
    localStorage.setItem('bananera_retenciones_complete', JSON.stringify(data));
  }, [data]);

  const triggerToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleChange = (field: keyof RetencionData, value: any) => {
    setData(prev => {
      let updatedSustraendo = prev.sustraendo;
      if (field === 'porcentajeRetencion') {
        const p = parseFloat(value) || 0;
        if (p === 1.0 || p === 1) {
          updatedSustraendo = 35.83;
        } else if (p === 3.0 || p === 3) {
          updatedSustraendo = 107.50;
        } else {
          updatedSustraendo = 0;
        }
      }
      return {
        ...prev,
        [field]: value,
        ...(field === 'porcentajeRetencion' ? { sustraendo: updatedSustraendo } : {})
      };
    });
  };

  // Concept Selector handler mapped to Tipo de Pago
  const handleConceptSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (!val) return;
    const selected = TIPOS_DE_PAGO_ISLR.find(c => c.label === val);
    if (selected) {
      let sust = selected.sustraendo;
      if (selected.porc === 1.0 || selected.porc === 1) {
        sust = 35.83;
      } else if (selected.porc === 3.0 || selected.porc === 3) {
        sust = 107.50;
      }
      setData(prev => ({
        ...prev,
        conceptoPago: selected.label,
        porcentajeRetencion: selected.porc,
        sustraendo: sust
      }));
      triggerToast(`Tipo de Pago: ${selected.label} (${selected.porc}%)`);
    }
  };

  const resetToDefault = () => {
    if (confirm('¿Está seguro de restaurar los datos predeterminados de la Bananera?')) {
      setData(DEFAULT_DATA);
      triggerToast('Valores y campos oficiales restaurados con éxito.');
    }
  };

  // --- CALCULATION LOGIC Engine ---
  
  // 1. IVA Calculations
  // Only active for 'Internas' and 'Importación'
  const isIvaEligible = data.tipoCompra === 'Internas' || data.tipoCompra === 'Importación';
  const baseImponible = isIvaEligible ? (Number(data.baseImponibleIngresada) || 0) : 0;
  const tasaIva = Number(data.tasaIvaSeleccionada) || 0;
  const montoIva = Math.round((baseImponible * (tasaIva / 100)) * 100) / 100;

  // 2. IGTF Calculations
  const baseIgtf = data.aplicaIgtfBoolean ? (Number(data.baseImponibleIgtf) || 0) : 0;
  const montoIgtf = Math.round((baseIgtf * 0.03) * 100) / 100;

  // 3. Selective Manual Montos depending on current 'tipoCompra'
  const currentExentas = data.tipoCompra === 'Exentas' ? (Number(data.montoExentas) || 0) : 0;
  const currentMontoExento = (data.tipoCompra === 'Internas' || data.tipoCompra === 'Importación') ? (Number(data.montoMontoExento) || 0) : 0;
  const currentExoneradas = data.tipoCompra === 'Exoneradas' ? (Number(data.montoExoneradas) || 0) : 0;
  const currentNoSujetas = data.tipoCompra === 'No Sujetas' ? (Number(data.montoNoSujetas) || 0) : 0;
  const currentSinDerecho = data.tipoCompra === 'Sin Derecho a crédito' ? (Number(data.montoSinDerechoCredito) || 0) : 0;

  // 4. TOTAL COMPRA Summation
  // Calculates live: Base Imponible + IVA + correct active direct purchase monto + calculated IGTF
  const computedTotalCompra = baseImponible + 
                               montoIva + 
                               montoIgtf + 
                               currentExentas + 
                               currentMontoExento + 
                               currentExoneradas + 
                               currentNoSujetas + 
                               currentSinDerecho;

  // 5. WITHHOLDING ISLR Calculations (For the PDF sheet)
  // Llévalo por defecto con la Base Imponible calculada para que sea óptimo y coherente
  const baseImponibleRetencion = baseImponible > 0 ? baseImponible : computedTotalCompra;
  const porcentajeRet = Number(data.porcentajeRetencion) || 0;
  const sustraendoRet = Number(data.sustraendo) || 0;
  const montoRetenido = Math.max(0, Math.round(((baseImponibleRetencion * porcentajeRet) / 100 - sustraendoRet) * 100) / 100);

  // Formatting helpers
  const formatBs = (val: number) => {
    return val.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateString = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  };

  const formatEmisionLong = (lugar: string, dateStr: string) => {
    if (!dateStr) return lugar;
    const date = new Date(dateStr + 'T00:00:00');
    if (isNaN(date.getTime())) return lugar;
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const dia = date.getDate().toString().padStart(2, '0');
    const mesStr = meses[date.getMonth()];
    const anio = date.getFullYear();
    return `${lugar.toUpperCase()}, ${dia} de ${mesStr} de ${anio}`;
  };

  const handlePrintExample = () => {
    // Generate new random fictitious data
    const nextFictitious = getRandomFictitiousData();
    setFictitiousData(nextFictitious);
    triggerToast('¡Datos ficticios regenerados! Abriendo diálogo de impresión...');
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HUB HEADER BAR */}
      <div className="no-print flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#c3c6d1] pb-4">
        <div>
          <h2 className="text-xl font-black text-[#001e40] uppercase flex items-center">
            <Printer className="w-5 h-5 mr-3 text-[#1b6d24]" />
            Emisión de Comprobantes de Retención (ISLR)
          </h2>
          <p className="text-xs text-slate-500">
            Calculadora inteligente que automatiza IVA, IGTF, tipos de compra y emite certificados ISLR imprimibles con datos ficticios aleatorios.
          </p>
        </div>
      </div>

      {successToast && (
        <div className="no-print fixed top-6 right-6 bg-slate-900 border-l-4 border-[#1b6d24] text-white px-4 py-2.5 text-xs font-mono uppercase shadow-2xl z-[100] flex items-center gap-2 animate-fade-in-down">
          <div className="w-2 h-2 rounded-full bg-green-400 animate-ping" />
          <span>{successToast}</span>
        </div>
      )}

      {/* 2. CALCULATOR LAYOUT: SINGLE-COLUMN CENTERED APP CARD */}
      <div className="no-print max-w-2xl mx-auto w-full bg-white border border-[#c3c6d1] shadow-md flex flex-col divide-y divide-slate-100 rounded-lg overflow-hidden">
        
        {/* BLOCK 3: COMPRES & CRÉDITO FISCAL */}
        <div className="p-4 space-y-4">
          <div className="text-[10px] font-bold text-[#001e40] uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">
            📦 1. PARÁMETROS CAMBIARIOS Y DE COMPRA
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Tipo de Compra</label>
              <select
                value={data.tipoCompra}
                onChange={e => handleChange('tipoCompra', e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-bold focus:outline-none focus:border-[#1b6d24]"
              >
                <option value="Internas">Internas</option>
                <option value="Importación">Importación</option>
                <option value="Exentas">Exentas</option>
                <option value="Exoneradas">Exoneradas</option>
                <option value="No Sujetas">No Sujetas</option>
                <option value="Sin Derecho a crédito">Sin Derecho a crédito</option>
              </select>
            </div>

            {/* Crédito fiscal (Only active for 'Internas' and 'Importación') */}
            <div>
              <label className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                Crédito Fiscal {(!isIvaEligible) && <span className="text-[8px] text-red-500 font-bold font-mono">(INACTIVO)</span>}
              </label>
              <select
                value={data.creditoFiscal}
                onChange={e => handleChange('creditoFiscal', e.target.value)}
                disabled={!isIvaEligible}
                className={`w-full text-xs border rounded p-2 text-slate-800 focus:outline-none focus:border-[#1b6d24] ${
                  !isIvaEligible ? 'bg-slate-100 text-slate-400 border-slate-200' : 'border-slate-300'
                }`}
              >
                <option value="Deducible">Deducible</option>
                <option value="Prorrateable">Prorrateable</option>
                <option value="No Deducible">No Deducible</option>
              </select>
            </div>
          </div>

          {/* ADICIONALES DE IMPORTACION (Active only when Importacion is selected) */}
          {data.tipoCompra === 'Importación' && (
            <div className="bg-sky-50 border border-sky-250 p-3 space-y-3 rounded animate-fade-in">
              <span className="text-[9px] font-black text-sky-800 uppercase block font-mono">
                ✈️ DATOS EXCLUSIVOS DE DECLARACIÓN DE IMPORTACIÓN:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">No. Planilla Importación</label>
                  <input
                    type="text"
                    value={data.nroPlanillaImportacion}
                    onChange={e => handleChange('nroPlanillaImportacion', e.target.value)}
                    className="w-full text-[11px] border border-sky-200 p-1 bg-white"
                    placeholder="Nº Planilla..."
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">No. Expediente Importación</label>
                  <input
                    type="text"
                    value={data.nroExpedienteImportacion}
                    onChange={e => handleChange('nroExpedienteImportacion', e.target.value)}
                    className="w-full text-[11px] border border-sky-200 p-1 bg-white"
                    placeholder="Nº Expediente..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Fecha Declaración Aduana</label>
                  <input
                    type="date"
                    value={data.fechaDeclaracionAduana}
                    onChange={e => handleChange('fechaDeclaracionAduana', e.target.value)}
                    className="w-full text-[10px] border border-sky-200 p-1 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[8px] font-bold text-slate-500 uppercase block mb-0.5">Número Declaración Aduana</label>
                  <input
                    type="text"
                    value={data.nroDeclaracionAduana}
                    onChange={e => handleChange('nroDeclaracionAduana', e.target.value)}
                    className="w-full text-[11px] border border-sky-200 p-1 bg-white"
                    placeholder="Declaración Nº..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* BLOCK 4: TIPO DE TRANSACCIÓN */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Tipo de Transacción</label>
              <select
                value={data.tipoTransaccion}
                onChange={e => handleChange('tipoTransaccion', e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 focus:outline-none focus:border-[#1b6d24]"
              >
                <option value="01 Registro">01 Registro</option>
                <option value="02 Complemento">02 Complemento</option>
                <option value="03 Anulación">03 Anulación</option>
                <option value="04 Ajuste">04 Ajuste</option>
              </select>
            </div>

            {/* Casilla secreta affected invoice */}
            {(data.tipoTransaccion === '02 Complemento' || data.tipoTransaccion === '03 Anulación') && (
              <div className="animate-pulse-slow">
                <label className="text-[10px] font-bold text-red-600 uppercase block mb-1">No. Factura Afectada ⚠️</label>
                <input
                  type="text"
                  value={data.nroFacturaAfectada}
                  onChange={e => handleChange('nroFacturaAfectada', e.target.value)}
                  className="w-full text-xs border-2 border-red-300 bg-red-50 rounded p-1.5 text-slate-800 font-mono focus:border-red-500 focus:outline-none"
                  placeholder="Escriba factura vinculada"
                />
              </div>
            )}
          </div>
        </div>

        {/* BLOCK 5: RECORD OF MANUAL DIRECT FIELDS */}
        <div className="p-4 bg-slate-50 space-y-2">
          <div className="text-[10px] font-bold text-[#001e40] uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">
            💰 2. REGISTRO DE MONTOS PARTICULARES
          </div>

          {/* Dynamic input field strictly mapping user rules: */}
          {data.tipoCompra === 'Exentas' && (
            <div>
              <label className="text-[10px] font-black text-[#1b6d24] uppercase block mb-1">Monto Exentas (Monto Total)</label>
              <input
                type="number"
                step="0.01"
                value={data.montoExentas}
                onChange={e => handleChange('montoExentas', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border-2 border-[#1b6d24] rounded p-2 text-slate-900 font-bold font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          {isIvaEligible && (
            <div>
              <label className="text-[10px] font-black text-[#1b6d24] uppercase block mb-1">Monto Exento (Interno / Importado)</label>
              <input
                type="number"
                step="0.01"
                value={data.montoMontoExento}
                onChange={e => handleChange('montoMontoExento', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border-2 border-[#1b6d24] rounded p-2 text-slate-900 font-bold font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          {data.tipoCompra === 'Exoneradas' && (
            <div>
              <label className="text-[10px] font-black text-[#1b6d24] uppercase block mb-1">Monto Exoneradas</label>
              <input
                type="number"
                step="0.01"
                value={data.montoExoneradas}
                onChange={e => handleChange('montoExoneradas', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border-2 border-[#1b6d24] rounded p-2 text-slate-900 font-bold font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          {data.tipoCompra === 'No Sujetas' && (
            <div>
              <label className="text-[10px] font-black text-[#1b6d24] uppercase block mb-1">Monto No Sujetas</label>
              <input
                type="number"
                step="0.01"
                value={data.montoNoSujetas}
                onChange={e => handleChange('montoNoSujetas', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border-2 border-[#1b6d24] rounded p-2 text-slate-900 font-bold font-mono"
                placeholder="0.00"
              />
            </div>
          )}

          {data.tipoCompra === 'Sin Derecho a crédito' && (
            <div>
              <label className="text-[10px] font-black text-[#1b6d24] uppercase block mb-1">Monto Sin Derecho a crédito</label>
              <input
                type="number"
                step="0.01"
                value={data.montoSinDerechoCredito}
                onChange={e => handleChange('montoSinDerechoCredito', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border-2 border-[#1b6d24] rounded p-2 text-slate-900 font-bold font-mono"
                placeholder="0.00"
              />
            </div>
          )}
        </div>

        {/* BLOCK 6: BASE IMPONIBLE & RATES (Active only for Importacion / Internas) */}
        {isIvaEligible && (
          <div className="p-4 space-y-4">
            <div className="text-[10px] font-bold text-[#001e40] uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">
              ⚡ 3. BASE IMPONIBLE DE IVA (SÓLO INTERNAS / IMPORTACIÓN)
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-semibold text-slate-500 uppercase block">Seleccionar Alícuota / Tasa IVA</label>
              <div className="grid grid-cols-3 gap-2">
                {[16, 8, 31].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => handleChange('tasaIvaSeleccionada', rate as 16 | 8 | 31)}
                    className={`py-2 text-xs font-black uppercase rounded border transition-colors cursor-pointer ${
                      data.tasaIvaSeleccionada === rate
                        ? 'bg-[#001e40] text-emerald-400 border-[#001e40]'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {rate}%
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 uppercase block mb-1">Monto Base Imponible (Bs.)</label>
              <input
                type="number"
                step="0.01"
                value={data.baseImponibleIngresada}
                onChange={e => handleChange('baseImponibleIngresada', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-bold font-mono focus:border-[#1b6d24] focus:outline-none"
                placeholder="Base imponible"
              />
            </div>

            {/* Calculations readout */}
            <div className="bg-[#f0fcf2] border border-green-200 p-3 space-y-1 rounded text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-slate-600">Precio Base:</span>
                <span className="font-semibold text-slate-800">{formatBs(baseImponible)} Bs.</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Alícuota IVA ({tasaIva}%):</span>
                <span className="text-emerald-700 font-bold font-semibold">+{formatBs(montoIva)} Bs.</span>
              </div>
              <div className="flex justify-between border-t border-green-150 pt-1 font-black text-[#001e40]">
                <span>Subtotal con IVA:</span>
                <span>{formatBs(baseImponible + montoIva)} Bs.</span>
              </div>
            </div>
          </div>
        )}

        {/* BLOCK 7: I.G.T.F. DISCIPLINE */}
        <div className="p-4 space-y-4">
          <div className="text-[10px] font-bold text-[#001e40] uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">
            🏦 4. IMPUESTO A LAS GRANDES TRANSACCIONES (I.G.T.F. 3%)
          </div>

          <div className="flex items-center gap-2">
            <input
              id="apply-igtf-chk"
              type="checkbox"
              checked={data.aplicaIgtfBoolean}
              onChange={e => handleChange('aplicaIgtfBoolean', e.target.checked)}
              className="w-4 h-4 rounded text-[#1b6d24] focus:ring-[#1b6d24] cursor-pointer"
            />
            <label htmlFor="apply-igtf-chk" className="text-xs font-bold text-slate-700 cursor-pointer select-none">
              Habilitar/Aplicar retención del I.G.T.F. (3%)
            </label>
          </div>

          {data.aplicaIgtfBoolean && (
            <div className="space-y-3 p-3 bg-indigo-50 border border-indigo-200 rounded animate-fade-in">
              <div>
                <label className="text-[10px] font-semibold text-indigo-900 block mb-1">Monto Base Imponible IGTF</label>
                <input
                  type="number"
                  step="0.01"
                  value={data.baseImponibleIgtf}
                  onChange={e => handleChange('baseImponibleIgtf', parseFloat(e.target.value) || 0)}
                  className="w-full text-xs border border-indigo-200 rounded p-2 text-indigo-950 font-bold font-mono focus:outline-none"
                  placeholder="0.00"
                />
              </div>
              <div className="flex justify-between text-xs font-mono text-indigo-950 font-black">
                <span>Resultado IGTF (3%):</span>
                <span>{formatBs(montoIgtf)} Bs.</span>
              </div>
            </div>
          )}
        </div>

        {/* BLOCK 8: OVERALL COMPLETED CALCULATED STATE */}
        <div className="p-4 bg-[#001e40] text-emerald-300">
          <div className="flex justify-between items-baseline font-mono">
            <span className="text-[10px] tracking-wider uppercase font-black text-slate-300">🛒 TOTAL COMPRA CALCULADO:</span>
            <span className="text-lg font-black text-white">{formatBs(computedTotalCompra)} Bs.</span>
          </div>
          <p className="text-[9px] text-slate-300 truncate mt-1">
            Fórmula: Base ({formatBs(baseImponible)}) + IVA ({formatBs(montoIva)}) + Exento/Diferencial ({formatBs(currentExentas || currentMontoExento || currentExoneradas || currentNoSujetas || currentSinDerecho)}) + IGTF ({formatBs(montoIgtf)})
          </p>
        </div>

        {/* BLOCK 9: WITHHOLDING MANUAL SPECIFICS */}
        <div className="p-4 space-y-4">
          <div className="text-[10px] font-bold text-[#001e40] uppercase tracking-widest block font-mono border-b border-slate-100 pb-1">
            📋 5. PARÁMETROS DEL CERTIFICADO DE RETENCIÓN ISLR
          </div>

          <div>
            <label className="text-[10px] font-bold text-[#001e40] block mb-1">Tipo de Pago (Categoría de Retención)</label>
            <select
              value={data.conceptoPago}
              onChange={handleConceptSelect}
              className="w-full text-xs font-sans border border-slate-300 rounded p-2 text-slate-800 font-bold focus:ring-1 focus:ring-[#1b6d24] focus:border-[#1b6d24]"
            >
              <option value="">-- Seleccionar Tipo de Pago --</option>
              {TIPOS_DE_PAGO_ISLR.map((c, i) => (
                <option key={i} value={c.label}>
                  [{c.code}] {c.label} ({c.porc}%)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-slate-500 block mb-1">Concepto del Pago (Texto Impreso)</label>
            <input
              type="text"
              value={data.conceptoPago}
              onChange={e => handleChange('conceptoPago', e.target.value)}
              className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-medium"
              placeholder="Escribe concepto de pago manualmente si lo requiere"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Porcentaje de Retención</label>
              <input
                type="number"
                step="0.01"
                value={data.porcentajeRetencion}
                onChange={e => handleChange('porcentajeRetencion', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#1b6d24]"
              />
            </div>

            <div>
              <label className="text-[10px] font-semibold text-slate-500 block mb-1">Sustraendo (Bs.)</label>
              <input
                type="number"
                step="0.01"
                value={data.sustraendo}
                onChange={e => handleChange('sustraendo', parseFloat(e.target.value) || 0)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-mono focus:outline-none focus:ring-1 focus:ring-[#1b6d24]"
                placeholder="Se auto-aplica en 1% y 3%"
              />
            </div>
          </div>

          {/* Live calculated ISLR Retained readout */}
          <div className="bg-[#fffbeb] border border-amber-200 p-3 space-y-1.5 rounded text-xs font-mono text-amber-900">
            <div className="flex justify-between">
              <span>Base Retención ISLR:</span>
              <span className="font-bold">{formatBs(baseImponibleRetencion)} Bs.</span>
            </div>
            <div className="flex justify-between">
              <span>Fórmula Retención:</span>
              <span>({porcentajeRet}% - {formatBs(sustraendoRet)})</span>
            </div>
            <div className="flex justify-between border-t border-amber-200 pt-1.5 text-sm font-black text-amber-950">
              <span>MONTO NETO RETENIDO ISLR:</span>
              <span>{formatBs(montoRetenido)} Bs.</span>
            </div>
          </div>
        </div>

        {/* PRINT ACTION AT THE END OF CALCULATOR */}
        <div className="p-6 bg-slate-50 flex justify-center border-t border-slate-150">
          <button
            onClick={handlePrintExample}
            className="w-full bg-[#1b6d24] border border-[#14521a] text-xs font-black text-white py-3 uppercase hover:bg-[#15521c] shadow-md transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer rounded-md tracking-wider"
          >
            <Printer className="w-4 h-4" />
            <span>IMPRIMIR EJEMPLO DE COMPROBANTE</span>
          </button>
        </div>

      </div>

      {/* PRINTABLE SHEET CONTAINER (HIDDEN ON SCREEN, ONLY VISIBLE UNDER PRINT) */}
      <div className="only-print">
        
        {/* Fiel standard physical view optimized specifically for zero margins at the top */}
        <div 
          id="printable-comprobante"
          className="bg-white text-black font-sans relative select-text shrink-0 w-[794px] p-6 pb-12 flex flex-col justify-start print:p-0 print:w-full"
          style={{ color: '#000000', minHeight: 'auto' }}
        >
          
          {/* 1. EMISOR INSTITUTIONAL HEADER (No visual flashy icons to match physical captures perfectly) */}
          <div className="text-center space-y-0.5 pt-2">
            <h1 className="text-base font-bold tracking-wider font-sans uppercase">C.A. BANANERA VENEZOLANA</h1>
            <p className="text-xs font-semibold tracking-wider uppercase">RIF {data.agenteRif}</p>
            
            <div className="pt-2 pb-1">
              <h2 className="text-xs font-bold tracking-widest uppercase border-b border-black inline-block px-10 pb-0.5">
                C O M P R O B A N T E &nbsp; d e &nbsp; R E T E n c i o n &nbsp; I S L R
              </h2>
              <p className="text-[8.5px] italic leading-tight text-slate-700 max-w-[580px] mx-auto mt-1">
                (Para dar cumplimiento con la normativa establecida el Artículo 24, Decreto 1.808 en materia de Retenciones ISLR publicado en G.O. Nº 36.203 del 12 de Mayo de 1997)
              </p>
            </div>
          </div>

          {/* 2. LOCATIONS, COMPROBANTE AND METADATA */}
          <div className="flex justify-between items-baseline border-b border-black pb-1.5 text-[10px] font-semibold mt-4">
            <div className="uppercase">
              {formatEmisionLong(fictitiousData.lugarEmision, fictitiousData.fechaEmision)}
            </div>
            <div>
              Nº Comprobante <span className="font-bold font-mono text-xs">{fictitiousData.nroComprobante}</span>
            </div>
          </div>

          {/* 3. DATOS DEL AGENTE DE RETENCION Section */}
          <div className="mt-3.5 space-y-0.5">
            <h3 className="text-[9.5px] font-extrabold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">
              DATOS DEL AGENTE DE RETENCION
            </h3>
            <div className="grid grid-cols-12 gap-x-1 px-1 text-[9px] leading-normal font-sans">
              <div className="col-span-3 font-bold">Nombre o Razón Social:</div>
              <div className="col-span-9 uppercase font-bold">{data.agenteNombre}</div>

              <div className="col-span-3 font-bold">Nº R.I.F.:</div>
              <div className="col-span-9 font-mono uppercase">{data.agenteRif}</div>

              <div className="col-span-3 font-bold">Dirección:</div>
              <div className="col-span-9 uppercase">{data.agenteDireccion}</div>

              <div className="col-span-3 font-bold">Teléfonos:</div>
              <div className="col-span-9 font-mono">{data.agenteTelefonos}</div>
            </div>
          </div>

          {/* 4. DATOS DEL BENEFICIARIO */}
          <div className="mt-3.5 space-y-0.5">
            <h3 className="text-[9.5px] font-extrabold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">
              DATOS DEL BENEFICIARIO (FICTICIO AUTO-GENERADO)
            </h3>
            <div className="grid grid-cols-12 gap-x-1 px-1 text-[9px] leading-normal font-sans">
              <div className="col-span-3 font-bold">Nombre o Razón Social:</div>
              <div className="col-span-9 uppercase font-bold text-emerald-900">{fictitiousData.beneficiarioNombre}</div>

              <div className="col-span-3 font-bold">Nº R.I.F.:</div>
              <div className="col-span-9 font-mono uppercase font-bold text-emerald-900">{fictitiousData.beneficiarioRif}</div>

              <div className="col-span-3 font-bold">Dirección:</div>
              <div className="col-span-9 uppercase text-slate-700">{fictitiousData.beneficiarioDireccion}</div>

              <div className="col-span-3 font-bold">Teléfonos:</div>
              <div className="col-span-9 font-mono text-slate-700">{fictitiousData.beneficiarioTelefonos}</div>
            </div>
          </div>

          {/* 5. DATOS DEL MONTO RETENIDO Y CONCEPTO */}
          <div className="mt-3.5 space-y-0.5">
            <h3 className="text-[9.5px] font-extrabold uppercase tracking-wider border-b border-black pb-0.5 mb-1.5">
              DATOS DEL MONTO RETENIDO Y CONCEPTO
            </h3>
            
            <table className="w-full text-left text-[8.5px] border-collapse">
              <thead>
                <tr className="border-b border-black text-[8.5px] font-black uppercase">
                  <th className="py-2 px-1">Nº Documento / Factura</th>
                  <th className="py-2 px-1">Nº Control</th>
                  <th className="py-2 px-1">Fecha</th>
                  <th className="py-2 px-1">Monto Renglón</th>
                  <th className="py-2 px-1 w-[26%]">Concepto del Pago</th>
                  <th className="py-2 px-1 text-right">Base Imponible</th>
                  <th className="py-2 px-1 text-right">Porc.</th>
                  <th className="py-2 px-1 text-right">Sustraendo</th>
                  <th className="py-2 px-1 text-right font-black">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-slate-300 text-[9px] leading-relaxed font-sans">
                  <td className="py-1.5 px-1 font-mono uppercase font-bold text-emerald-900">
                    {fictitiousData.tipoDocumento !== 'Factura' ? `${fictitiousData.tipoDocumento.substring(0,4)}. ` : ''}{fictitiousData.nroFactura}
                  </td>
                  <td className="py-1.5 px-1 font-mono text-emerald-900 font-bold">{fictitiousData.nroControl}</td>
                  <td className="py-1.5 px-1 font-mono">{formatDateString(fictitiousData.fechaEmision)}</td>
                  <td className="py-1.5 px-1 font-mono">
                    {formatBs(baseImponibleRetencion)}
                  </td>
                  <td className="py-1.5 px-1 uppercase font-semibold leading-normal text-[8px]">
                    {data.conceptoPago}
                  </td>
                  <td className="py-1.5 px-1 font-mono text-right">{formatBs(baseImponibleRetencion)}</td>
                  <td className="py-1.5 px-1 font-mono text-right">{porcentajeRet.toFixed(2)}</td>
                  <td className="py-1.5 px-1 font-mono text-right">{formatBs(sustraendoRet)}</td>
                  <td className="py-1.5 px-1 font-mono text-right font-bold">{formatBs(montoRetenido)}</td>
                </tr>
                
                {/* Totals line conforming to the visual capture double outline */}
                <tr className="font-bold border-t border-black text-[9.5px]">
                  <td colSpan={5} className="py-2 px-1 uppercase font-bold tracking-wider">Totales......</td>
                  <td className="py-2 px-1 font-mono text-right border-b border-black font-extrabold">{formatBs(baseImponibleRetencion)}</td>
                  <td colSpan={2}></td>
                  <td className="py-2 px-1 font-mono text-right font-black border-b border-black text-slate-900">{formatBs(montoRetenido)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* 6. SYSTEM METADATA INTEGRATION NOTES (excl. in print) */}
          <div className="no-print mt-4 p-3 bg-slate-50 border border-slate-200 text-[9px] text-slate-600 space-y-1 font-mono uppercase">
            <div className="font-bold text-[#001e40]">📊 RESUMEN ADICIONAL DE FACTURA (LIBRO COMPRAS):</div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
              <span>• TASA COMPRA: {data.tipoCompra}</span>
              <span>• CRÉDITO FISCAL: {data.creditoFiscal}</span>
              <span>• TRANSACCIÓN: {data.tipoTransaccion}</span>
              {data.nroFacturaAfectada && <span className="text-red-700 font-bold">• AFECTA A: {data.nroFacturaAfectada}</span>}
              <span>• BASE IVA ({tasaIva}%): {formatBs(baseImponible)} Bs.</span>
              <span>• IMPUESTO IVA: {formatBs(montoIva)} Bs.</span>
              {data.aplicaIgtfBoolean && <span>• BASE IGTF: {formatBs(baseIgtf)} Bs.</span>}
              {data.aplicaIgtfBoolean && <span>• IMPUESTO IGTF (3%): {formatBs(montoIgtf)} Bs.</span>}
              <span>• TOTAL FACTURA COMPRA: {formatBs(computedTotalCompra)} Bs.</span>
            </div>
          </div>

        </div>

      </div>

      <style>{`
        @media screen {
          .only-print {
            display: none !important;
          }
        }
        @media print {
          .only-print {
            display: block !important;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-comprobante, #printable-comprobante * {
            visibility: visible !important;
          }
          #printable-comprobante {
            position: absolute !important;
            left: 0px !important;
            top: 0px !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 4mm 4mm !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          table th {
            background: transparent !important;
            background-color: transparent !important;
          }
        }
      `}</style>

    </div>
  );
}
