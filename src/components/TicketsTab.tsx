import React, { useState } from 'react';
import { 
  Printer, 
  Plus, 
  Trash2, 
  RefreshCw, 
  FileText, 
  Check, 
  Layers, 
  Info,
  FileSpreadsheet,
  PlusCircle,
  Scissors,
  Calculator,
  ArrowRightLeft,
  ListFilter
} from 'lucide-react';

interface TicketItem {
  id: string;
  razonSocial: string;
  tipoDocumento: 'SOLICITUD' | 'PRESUPUESTO';
  numDocumento: string;
  concepto: string;
  tipoPersona: 'Natural' | 'Juridica';
  categoriaFiscal: string;
  conIva: boolean;
  porcentajeIslr: number;
  sustraendo: number;
  calculoModo: 'Directo' | 'Inverso';
  
  // Montos calculados principales
  baseImponible: number;
  iva: number;
  totalFactura: number;
  islrRetenido: number;
  totalAPagar: number;
  factorUsed: number;

  // Parámetros de Ticket Grande
  movimiento: string;
  referencia: string;
  vencimiento: string;
  saldoInicial: number;
  saldoDivisa: number;
  tasaCambio: number;
  tasaChangeOverride?: boolean;
  nota: string;

  // Lista de movimientos individuales para tabla múltiple
  movements?: {
    id: string;
    movimiento: string;
    referencia: string;
    vencimiento: string;
    saldoInicial: number;
    saldoDivisa: number;
  }[];

  // Operaciones de Retorno
  totalACancelarManual: number;
  factorRetorno: number;
  baseRetorno: number;
}

export function TicketsTab() {
  // Constante de Unidad Tributaria en Venezuela (Bs. 9,00 según el modelo excel)
  const UT_VALOR = 9.0;

  // Estado del Formulario
  const [razonSocial, setRazonSocial] = useState('TRIPLE FFF');
  const [tipoDocumento, setTipoDocumento] = useState<'SOLICITUD' | 'PRESUPUESTO'>('SOLICITUD');
  const [numDocumento, setNumDocumento] = useState('P-1377');
  const [concepto, setConcepto] = useState('REPARACION DEL HOGAR DE CALDERAS');
  const [tipoPersona, setTipoPersona] = useState<'Natural' | 'Juridica'>('Juridica');
  const [categoria, setCategoria] = useState('obras_servicios'); // obras_servicios, alquileres_honorarios, transportes_fletes
  const [conIva, setConIva] = useState(true);
  const [calculoModo, setCalculoModo] = useState<'Directo' | 'Inverso'>('Inverso');
  
  // Entrada numérica principal: Total a Cancelar que manda la Base Imponible
  const [totalACancelarText, setTotalACancelarText] = useState('93713.13');
  const [baseImponibleText, setBaseImponibleText] = useState('82204.50'); // Calculated or manual input

  // Parámetros específicos para el Ticket Grande (Entradas para nuevo movimiento)
  const [movimiento, setMovimiento] = useState('');
  const [referencia, setReferencia] = useState('');
  const [vencimiento, setVencimiento] = useState('');
  const [saldoInicial, setSaldoInicial] = useState('');
  const [saldoDivisa, setSaldoDivisa] = useState('');
  const [tasaCambio, setTasaCambio] = useState('564.80');
  const [nota, setNota] = useState('');

  // Movements List State for Ticket Grande
  const [movementsList, setMovementsList] = useState<any[]>([
    {
      id: 'm-1',
      movimiento: 'Anticipo M-29948',
      referencia: '180726412',
      vencimiento: '14/11/2025',
      saldoInicial: 132654.58,
      saldoDivisa: 234.87
    }
  ]);

  // Tamaño del ticket de impresión y visualización
  const [ticketSize, setTicketSize] = useState<'pequeno' | 'grande'>('grande');

  // Lista de Tickets acumulados para impresión multipágina / multielemento
  const [ticketsList, setTicketsList] = useState<TicketItem[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showExportModal, setShowExportModal] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  };

  // Obtener porcentajes y sustraendo fiscal. 
  // Persona Natural SIEMPRE es DEDUCIBLE, no existe opción no deducible (sustraendo fijo automático).
  const getFiscalProperties = () => {
    if (tipoPersona === 'Juridica') {
      if (categoria === 'obras_servicios') {
        return { label: 'Ejecución de Obras y Servicios (PJ 2%)', porc: 2.0, sustraendo: 0 };
      } else if (categoria === 'alquileres_honorarios') {
        return { label: 'Alquileres, Honorarios, Publicidad (PJ 5%)', porc: 5.0, sustraendo: 0 };
      } else {
        // Gastos de Transportes, Flete para Persona Juridica es 3% (factor sin iva = 0.97, con iva = 1.13)
        return { label: 'Gastos de Transportes, Flete (PJ 3%)', porc: 3.0, sustraendo: 0 };
      }
    } else {
      // Persona Natural: Siempre aplica sustraendo (No deducible eliminado para PN)
      if (categoria === 'obras_servicios' || categoria === 'transportes_fletes') {
        // Ejecución de Obras y Servicios, Fletes: 1% ISLR Deducible de 400 UT
        // Sustraendo: 400 UT * 1% = 4 UT. 4 * 9.0 = 36.00 Bs (En el modelo Excel es de 35.83 Bs debido a factores específicos de retención)
        return { label: 'Obras, Servicios y Fletes (PN 1% - Deducible)', porc: 1.0, sustraendo: 35.83 };
      } else {
        // Alquileres, Honorarios, Publicidad, Propaganda, Comisiones (PN 3% con sustraendo de 107.50 Bs, factor con iva = 1.13, sin iva = 0.97)
        return { label: 'Alquileres, Honorarios y Comisiones (PN 3% - Deducible)', porc: 3.0, sustraendo: 107.50 };
      }
    }
  };

  const { label: fiscalLabel, porc: islrPorcentaje, sustraendo: computedSustraendo } = getFiscalProperties();

  // Función matemática de cálculo de un ticket
  const calculateTicket = (baseVal: number, manualCancelVal: number): TicketItem => {
    const isNatural = tipoPersona === 'Natural';
    const ivaRate = conIva ? 0.16 : 0.0;
    const islrRate = islrPorcentaje / 100;
    
    // El cálculo va de Base Imponible hacia arriba (Directo)
    const base = baseVal;
    const iva = base * ivaRate;
    const totalFact = base + iva;
    const computedRawIslr = (base * islrRate) - computedSustraendo;
    const islr = computedRawIslr < 0 ? 0 : computedRawIslr;
    const finalPagar = totalFact - islr;

    // Operación matemática de retorno/factorización adicional solicitada
    const factorRetorno = base > 0 ? (finalPagar / base) : 0;
    const baseRetorno = factorRetorno > 0 ? manualCancelVal / factorRetorno : 0;

    const factorFisc = 1 + ivaRate - islrRate;

    return {
      id: `t-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      razonSocial: razonSocial.toUpperCase() || 'SIN NOMBRE',
      tipoDocumento: tipoDocumento,
      numDocumento: numDocumento.toUpperCase() || 'S/N',
      concepto: concepto.toUpperCase() || 'CONCEPTO NO VALORADO',
      tipoPersona,
      categoriaFiscal: fiscalLabel,
      conIva,
      porcentajeIslr: islrPorcentaje,
      sustraendo: computedSustraendo,
      calculoModo: 'Directo',
      baseImponible: Math.round(base * 100) / 100,
      iva: Math.round(iva * 100) / 100,
      totalFactura: Math.round(totalFact * 100) / 100,
      islrRetenido: Math.round(islr * 100) / 100,
      totalAPagar: Math.round(finalPagar * 100) / 100,
      factorUsed: Math.round(factorFisc * 100) / 100,

      // Grande parameters
      movimiento: movementsList.map(m => m.movimiento).join(' / ') || 'N/A',
      referencia: movementsList.map(m => m.referencia).join(' / ') || 'N/A',
      vencimiento: movementsList.map(m => m.vencimiento).join(' / ') || 'N/A',
      saldoInicial: movementsList.reduce((sum, m) => sum + m.saldoInicial, 0),
      saldoDivisa: movementsList.reduce((sum, m) => sum + m.saldoDivisa, 0),
      tasaChangeOverride: true, // Marker
      tasaCambio: parseFloat(tasaCambio) || 0,
      nota: nota ? nota.toUpperCase() : '',

      // movements list to render multiple rows in Ticket Grande
      movements: [...movementsList],

      // Retorno
      totalACancelarManual: manualCancelVal,
      factorRetorno: parseFloat(factorRetorno.toFixed(6)),
      baseRetorno: parseFloat(baseRetorno.toFixed(2))
    };
  };

  // Ticket calculado en tiempo real para visualización
  // Auto-sync baseImponibleText whenever totalACancelarText or fiscal attributes change
  React.useEffect(() => {
    const cancelVal = parseFloat(totalACancelarText) || 0;
    const ivaRate = conIva ? 0.16 : 0.0;
    const islrRate = islrPorcentaje / 100;
    const factorFisc = 1 + ivaRate - islrRate;
    const computedBase = cancelVal > 0 ? (cancelVal - computedSustraendo) / factorFisc : 0;
    setBaseImponibleText(computedBase > 0 ? computedBase.toFixed(2) : '0');
  }, [totalACancelarText, conIva, tipoPersona, categoria, islrPorcentaje, computedSustraendo]);



  // Handle adding a manual movement
  const handleAddMovement = () => {
    if (!movimiento.trim()) {
      triggerToast('⚠️ Ingrese el nombre del movimiento.');
      return;
    }
    const cargo = {
      id: `m-${Date.now()}`,
      movimiento: movimiento,
      referencia: referencia || 'N/A',
      vencimiento: vencimiento || 'N/A',
      saldoInicial: parseFloat(saldoInicial) || 0,
      saldoDivisa: parseFloat(saldoDivisa) || 0
    };
    setMovementsList(prev => [...prev, cargo]);
    triggerToast('✅ Movimiento agregado a la tabla.');
    // Keep tasaCambio static, clear individual input details for next item
    setMovimiento('');
    setReferencia('');
    setSaldoInicial('');
    setSaldoDivisa('');
  };

  const currentBase = parseFloat(baseImponibleText) || 0;
  const currentCancelManual = parseFloat(totalACancelarText) || 0;
  const activeCalculatedTicket = calculateTicket(currentBase, currentCancelManual);

  // Agregar ticket actual a la lista
  const handleAddTicket = () => {
    if (!razonSocial.trim()) {
      triggerToast('⚠️ Por favor ingrese el Nombre o Razón Social.');
      return;
    }
    if (currentBase <= 0) {
      triggerToast('⚠️ Ingrese un monto de Base Imponible mayor a cero.');
      return;
    }
    setTicketsList(prev => [...prev, activeCalculatedTicket]);
    triggerToast('✅ Ticket añadido con éxito.');
  };

  // Quitar ticket de la lista
  const handleRemoveTicket = (id: string) => {
    setTicketsList(prev => prev.filter(t => t.id !== id));
    triggerToast('🗑️ Ticket removido.');
  };

  // Resetear la lista
  const handleClearAll = () => {
    setTicketsList([]);
    triggerToast('🔄 Lista de tickets vaciada.');
  };

  const handlePrint = () => {
    if (ticketsList.length === 0) {
      triggerToast('⚠️ Agregue tickets a la lista antes de imprimir.');
      return;
    }
    window.print();
  };

  const handleExportToExcel = () => {
    if (ticketsList.length === 0) {
      triggerToast('⚠️ No hay tickets en la cola para exportar.');
      return;
    }
    setShowExportModal(true);
  };

  const handleExportToExcelList = () => {
    let xlsContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Tickets ISLR</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: Arial, sans-serif; }
          th { background-color: #001e40; color: white; font-weight: bold; border: 1px solid #c3c6d1; padding: 6px; text-transform: uppercase; font-size: 11px; }
          td { border: 1px solid #c3c6d1; padding: 6px; font-size: 11px; }
          .num { text-align: right; }
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <h2 style="color: #001e40; font-family: Arial, sans-serif;">Relación de Tickets de Retención ISLR</h2>
        <p style="font-family: Arial, sans-serif; font-size: 11px; color: #475569;">Generado el: ${new Date().toLocaleDateString('es-VE')} ${new Date().toLocaleTimeString('es-VE')}</p>
        <table>
          <thead>
            <tr>
              <th>N°</th>
              <th>Contribuyente / Razón Social</th>
              <th>Tipo de Documento</th>
              <th>Documento N°</th>
              <th>Concepto</th>
              <th>Clasificación</th>
              <th>Categoría Fiscal</th>
              <th>Base Imponible (Bs.)</th>
              <th>IVA (Bs.)</th>
              <th>Total Factura (Bs.)</th>
              <th>ISLR Retenido (Bs.)</th>
              <th>Total a Pagar (Bs.)</th>
              <th>Movimiento</th>
              <th>Referencia</th>
              <th>Nota</th>
              <th>Tasa de Cambio</th>
              <th>Total a Cancelar (Manual)</th>
              <th>Factor Retorno</th>
              <th>Base Retorno (Bs.)</th>
            </tr>
          </thead>
          <tbody>
    `;

    ticketsList.forEach((t, idx) => {
      xlsContent += `
        <tr>
          <td>${idx + 1}</td>
          <td class="bold">${t.razonSocial}</td>
          <td>${t.tipoDocumento}</td>
          <td>${t.numDocumento}</td>
          <td>${t.concepto}</td>
          <td>${t.tipoPersona}</td>
          <td>${t.categoriaFiscal}</td>
          <td class="num">${t.baseImponible.toFixed(2).replace('.', ',')}</td>
          <td class="num">${t.iva.toFixed(2).replace('.', ',')}</td>
          <td class="num">${t.totalFactura.toFixed(2).replace('.', ',')}</td>
          <td class="num bold" style="color: #b91c1c;">${t.islrRetenido.toFixed(2).replace('.', ',')}</td>
          <td class="num bold" style="color: #10b981;">${t.totalAPagar.toFixed(2).replace('.', ',')}</td>
          <td>${t.movimiento}</td>
          <td>${t.referencia}</td>
          <td>${t.nota || ''}</td>
          <td class="num">${t.tasaCambio.toFixed(2).replace('.', ',')}</td>
          <td class="num">${t.totalACancelarManual.toFixed(2).replace('.', ',')}</td>
          <td class="num">${t.factorRetorno.toFixed(6).replace('.', ',')}</td>
          <td class="num bold" style="color: #4f46e5;">${t.baseRetorno.toFixed(2).replace('.', ',')}</td>
        </tr>
      `;
    });

    xlsContent += `
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([xlsContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Relacion_Tickets_ISLR_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('📥 Relación exportada a Excel exitosamente.');
    setShowExportModal(false);
  };

  const handleExportToExcelEditable = () => {
    // Escapar caracteres XML para evitar que el archivo se dañe con símbolos especiales como '&', '<', '>'
    const escapeXml = (unsafe: any): string => {
      if (unsafe === null || unsafe === undefined) return '';
      const str = String(unsafe);
      return str.replace(/[<>&'"]/g, (c) => {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\'': return '&apos;';
          case '"': return '&quot;';
          default: return c;
        }
      });
    };

    let xmlContent = `<?xml version="1.0" encoding="utf-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
  <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
    <Author>C.A. BANANERA VENEZOLANA</Author>
    <Created>${new Date().toISOString()}</Created>
  </DocumentProperties>
  <ExcelWorkbook xmlns="urn:schemas-microsoft-com:office:excel">
    <WindowHeight>12000</WindowHeight>
    <WindowWidth>15000</WindowWidth>
    <WindowTopX>200</WindowTopX>
    <WindowTopY>200</WindowTopY>
    <ProtectStructure>False</ProtectStructure>
    <ProtectWindows>False</ProtectWindows>
  </ExcelWorkbook>
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Bottom"/>
      <Borders/>
      <Font ss:FontName="Arial" ss:Size="10" ss:Color="#000000"/>
      <Interior/>
      <NumberFormat/>
      <Protection/>
    </Style>
    <Style ss:ID="titleStyle">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#000000"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="11" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="subtitleStyle">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
      </Borders>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="9" ss:Color="#1e293b"/>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
    </Style>
    <Style ss:ID="tblHeader">
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="8" ss:Color="#1e293b"/>
      <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#cbd5e1"/>
      </Borders>
    </Style>
    <Style ss:ID="labelBold">
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="9" ss:Color="#334155"/>
      <Alignment ss:Vertical="Center"/>
      <Interior ss:Color="#F8FAFC" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
      </Borders>
    </Style>
    <Style ss:ID="labelTotal">
      <Alignment ss:Horizontal="Left" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="9" ss:Color="#10B981"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
      </Borders>
    </Style>
    <Style ss:ID="textVal">
      <Font ss:FontName="Arial" ss:Size="9" ss:Color="#000000"/>
      <Alignment ss:Vertical="Center"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
      </Borders>
    </Style>
    <Style ss:ID="moneyFormat">
      <NumberFormat ss:Format="#,##0.00"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Size="9" ss:Color="#000000"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
      </Borders>
    </Style>
    <Style ss:ID="moneyFormatBold">
      <NumberFormat ss:Format="#,##0.00"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="9" ss:Color="#0F172A"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#e2e8f0"/>
      </Borders>
    </Style>
    <Style ss:ID="moneyFormatTotal">
      <NumberFormat ss:Format="#,##0.00"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="9" ss:Color="#FFFFFF"/>
      <Interior ss:Color="#0F172A" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Double" ss:Weight="3" ss:Color="#0F172A"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#0F172A"/>
      </Borders>
    </Style>
    <Style ss:ID="greenRow">
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="8" ss:Color="#065F46"/>
      <Interior ss:Color="#F0FDF4" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
      </Borders>
    </Style>
    <Style ss:ID="greenRowValue">
      <NumberFormat ss:Format="#,##0.00"/>
      <Alignment ss:Horizontal="Right" ss:Vertical="Center"/>
      <Font ss:FontName="Arial" ss:Bold="1" ss:Size="8" ss:Color="#065F46"/>
      <Interior ss:Color="#F0FDF4" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
        <Border ss:Position="Left" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
        <Border ss:Position="Right" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
        <Border ss:Position="Top" ss:LineStyle="Continuous" ss:Weight="1" ss:Color="#b9f6ca"/>
      </Borders>
    </Style>
  </Styles>
  
  <Worksheet ss:Name="Tickets Pequeños">
    <Table>
      <Column ss:Width="160"/>
      <Column ss:Width="100"/>
      <Column ss:Width="120"/>
      <Column ss:Width="120"/>
`;

    // 1st SHEET: Tickets pequeños
    ticketsList.forEach((t) => {
      xmlContent += `
      <Row ss:Height="24">
        <Cell ss:MergeAcross="3" ss:StyleID="titleStyle"><Data ss:Type="String">${escapeXml(t.razonSocial)}</Data></Cell>
      </Row>
      <Row ss:Height="18">
        <Cell ss:MergeAcross="3" ss:StyleID="subtitleStyle"><Data ss:Type="String">COMPROBANTE DE RETENCIÓN ISLR / DOCUMENTO: ${escapeXml(t.tipoDocumento)} ${escapeXml(t.numDocumento)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">Concepto / Criterio:</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="textVal"><Data ss:Type="String">${escapeXml(t.concepto)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">Categoría / Tipo Persona:</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="textVal"><Data ss:Type="String">${escapeXml(t.categoriaFiscal)} (${escapeXml(t.tipoPersona)})</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">BASE IMPONIBLE (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormat"><Data ss:Type="Number">${t.baseImponible || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">IVA (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormat" ss:Formula="=R[-1]C * ${t.conIva ? 0.16 : 0.0}"><Data ss:Type="Number">${t.iva || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">TOTAL FACTURA (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatBold" ss:Formula="=R[-2]C + R[-1]C"><Data ss:Type="Number">${t.totalFactura || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">RETENCIÓN ISLR (${t.porcentajeIslr || 0}%):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatBold" ss:Formula="=IF((R[-3]C * ${(t.porcentajeIslr || 0) / 100} - ${(t.sustraendo || 0)}) &lt; 0, 0, R[-3]C * ${(t.porcentajeIslr || 0) / 100} - ${(t.sustraendo || 0)})"><Data ss:Type="Number">${t.islrRetenido || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:StyleID="labelTotal"><Data ss:Type="String">TOTAL A PAGAR (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatTotal" ss:Formula="=R[-2]C - R[-1]C"><Data ss:Type="Number">${t.totalAPagar || 0}</Data></Cell>
      </Row>
      <Row ss:Height="15">
        <Cell ss:MergeAcross="3" ss:StyleID="subtitleStyle"><Data ss:Type="String">C.A. BANANERA VENEZOLANA</Data></Cell>
      </Row>
      <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>
`;
    });

    xmlContent += `
    </Table>
  </Worksheet>
  
  <Worksheet ss:Name="Tickets Grandes">
    <Table>
      <Column ss:Width="160"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
      <Column ss:Width="110"/>
      <Column ss:Width="100"/>
      <Column ss:Width="100"/>
`;

    // 2nd SHEET: Tickets grandes
    ticketsList.forEach((t) => {
      const movements: any[] = t.movements && t.movements.length > 0 
        ? t.movements 
        : [{
            movimiento: t.movimiento || 'Movto Inicial',
            referencia: t.referencia || 'N/A',
            vencimiento: t.vencimiento || 'N/A',
            saldoInicial: t.saldoInicial || 0,
            saldoDivisa: t.saldoDivisa || 0,
          }];

      const numMovs = movements.length;

      xmlContent += `
      <Row ss:Height="24">
        <Cell ss:MergeAcross="5" ss:StyleID="titleStyle"><Data ss:Type="String">${escapeXml(t.razonSocial)}</Data></Cell>
      </Row>
      <Row ss:Height="18">
        <Cell ss:MergeAcross="5" ss:StyleID="subtitleStyle"><Data ss:Type="String">COMPROBANTE DE RETENCIÓN ISLR / DOCUMENTO: ${escapeXml(t.tipoDocumento)} ${escapeXml(t.numDocumento)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="1" ss:StyleID="labelBold"><Data ss:Type="String">Concepto / Criterio:</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="textVal"><Data ss:Type="String">${escapeXml(t.concepto)}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="1" ss:StyleID="labelBold"><Data ss:Type="String">Categoría Fiscal / Persona:</Data></Cell>
        <Cell ss:MergeAcross="3" ss:StyleID="textVal"><Data ss:Type="String">${escapeXml(t.categoriaFiscal)} (${escapeXml(t.tipoPersona)})</Data></Cell>
      </Row>
      <Row ss:Height="18">
        <Cell ss:StyleID="tblHeader"><Data ss:Type="String">MOVIMIENTO</Data></Cell>
        <Cell ss:StyleID="tblHeader"><Data ss:Type="String">REFERENCIA</Data></Cell>
        <Cell ss:StyleID="tblHeader"><Data ss:Type="String">VENCIMIENTO</Data></Cell>
        <Cell ss:StyleID="tblHeader"><Data ss:Type="String">SALDO BS.</Data></Cell>
        <Cell ss:StyleID="tblHeader"><Data ss:Type="String">DIVISA ($)</Data></Cell>
        <Cell ss:StyleID="tblHeader"><Data ss:Type="String">TASA (BS/$)</Data></Cell>
      </Row>
`;

      movements.forEach((move) => {
        const moveTasa = move.saldoDivisa > 0 ? (move.saldoInicial / move.saldoDivisa) : (t.tasaCambio || 0);
        xmlContent += `
      <Row>
        <Cell ss:StyleID="labelBold"><Data ss:Type="String">${escapeXml(move.movimiento)}</Data></Cell>
        <Cell ss:StyleID="textVal"><Data ss:Type="String">${escapeXml(move.referencia)}</Data></Cell>
        <Cell ss:StyleID="textVal"><Data ss:Type="String">${escapeXml(move.vencimiento || '')}</Data></Cell>
        <Cell ss:StyleID="moneyFormat"><Data ss:Type="Number">${move.saldoInicial || 0}</Data></Cell>
        <Cell ss:StyleID="moneyFormat"><Data ss:Type="Number">${move.saldoDivisa || 0}</Data></Cell>
        <Cell ss:StyleID="moneyFormat" ss:Formula="=IF(RC[-1]&gt;0, RC[-2]/RC[-1], ${t.tasaCambio || 0})"><Data ss:Type="Number">${moveTasa || 0}</Data></Cell>
      </Row>
`;
      });

      const hasPJ = t.tipoPersona === 'Juridica';

      if (hasPJ) {
        xmlContent += `
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="greenRow"><Data ss:Type="String">EN ESTA RELACION</Data></Cell>
        <Cell ss:StyleID="greenRowValue" ss:Formula="=R[7]C"><Data ss:Type="Number">${t.totalAPagar || 0}</Data></Cell>
        <Cell ss:StyleID="greenRowValue" ss:Formula="=IF(${t.tasaCambio || 0}&gt;0, RC[-1]/${t.tasaCambio || 0}, 0)"><Data ss:Type="Number">${t.tasaCambio > 0 ? (t.totalAPagar / t.tasaCambio) : 0}</Data></Cell>
        <Cell ss:StyleID="greenRowValue"><Data ss:Type="Number">${t.tasaCambio || 0}</Data></Cell>
      </Row>
`;
      }

      // Difference Row uses target formulas with correct relative coordinates relative to col 6 (Tasa, C) and col 5 (Divisa, C[-1])
      xmlContent += `
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">DIFERENCIA RESTANTE</Data></Cell>
        <Cell ss:StyleID="moneyFormatBold" ss:Formula="=SUM(R[-${numMovs + (hasPJ ? 1 : 0)}]C:R[-${1 + (hasPJ ? 1 : 0)}]C) - R[6]C"><Data ss:Type="Number">${(movements.reduce((sum, m) => sum + (m.saldoInicial || 0), 0) - (t.totalAPagar || 0))}</Data></Cell>
        <Cell ss:StyleID="moneyFormat"><Data ss:Type="String"></Data></Cell>
        <Cell ss:StyleID="moneyFormatBold" ss:Formula="=(SUM(R[-${numMovs + (hasPJ ? 1 : 0)}]C[-1]:R[-${1 + (hasPJ ? 1 : 0)}]C[-1]) - IF(${t.tasaCambio || 0}&gt;0, SUM(R[-${numMovs + (hasPJ ? 1 : 0)}]C[-2]:R[-${1 + (hasPJ ? 1 : 0)}]C[-2])/${t.tasaCambio || 0}, 0)"><Data ss:Type="Number">0</Data></Cell>
      </Row>
      <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">BASE IMPONIBLE (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormat"><Data ss:Type="Number">${t.baseImponible || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">REGISTRO IVA (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormat" ss:Formula="=R[-1]C * ${t.conIva ? 0.16 : 0.0}"><Data ss:Type="Number">${t.iva || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">TOTAL FACTURA (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatBold" ss:Formula="=R[-2]C + R[-1]C"><Data ss:Type="Number">${t.totalFactura || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">RETENCIÓN ISLR (${t.porcentajeIslr || 0}%):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatBold" ss:Formula="=IF((R[-3]C * ${(t.porcentajeIslr || 0) / 100} - ${(t.sustraendo || 0)}) &lt; 0, 0, R[-3]C * ${(t.porcentajeIslr || 0) / 100} - ${(t.sustraendo || 0)})"><Data ss:Type="Number">${t.islrRetenido || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelTotal"><Data ss:Type="String">TOTAL A PAGAR (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatTotal" ss:Formula="=R[-2]C - R[-1]C"><Data ss:Type="Number">${t.totalAPagar || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">FACTOR CALCULADO:</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="textVal" ss:Formula="=IF(R[-1]C&gt;0, R[-5]C/R[-1]C, 0)"><Data ss:Type="Number">${t.factorCalculado || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">BASE RETORNO (Bs.):</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="moneyFormatBold" ss:Formula="=IF(R[-1]C&gt;0, ${(t.totalACancelarManual || 0)}/R[-1]C, 0)"><Data ss:Type="Number">${t.baseRetorno || 0}</Data></Cell>
      </Row>
      <Row>
        <Cell ss:MergeAcross="2" ss:StyleID="labelBold"><Data ss:Type="String">NOTA DE AJUSTE:</Data></Cell>
        <Cell ss:MergeAcross="2" ss:StyleID="textVal"><Data ss:Type="String">${escapeXml((t.nota && t.nota !== 'NINGUNA' && t.nota !== 'NINGUNO') ? t.nota : '')}</Data></Cell>
      </Row>
      <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row ss:Height="24">
        <Cell ss:MergeAcross="5" ss:StyleID="subtitleStyle"><Data ss:Type="String">========================================================</Data></Cell>
      </Row>
      <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>
      <Row ss:Height="12"><Cell><Data ss:Type="String"></Data></Cell></Row>
`;
    });

    xmlContent += `
    </Table>
  </Worksheet>
</Workbook>`;

    // Agregar Byte Order Mark (BOM) para asegurar soporte óptimo de UTF-8 en Excel
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Tickets_Formatos_Editables_${Date.now()}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    triggerToast('📥 Excel editable (Dos Hojas) descargado exitosamente.');
    setShowExportModal(false);
  };

  // Pre-cargar presets de las imágenes para facilitar el testeo al usuario
  const applyPresetExample = (key: 'pj_eos_con_iva' | 'pn_eos_con_iva' | 'pn_alquiler_sin_iva') => {
    if (key === 'pj_eos_con_iva') {
      setRazonSocial('TRIPLE FFF');
      setTipoDocumento('SOLICITUD');
      setNumDocumento('P-1377');
      setConcepto('REPARACION DEL HOGAR DE CALDERAS');
      setTipoPersona('Juridica');
      setCategoria('obras_servicios'); // 2% ISLR
      setConIva(true);
      setTotalACancelarText('93713.13');
      setBaseImponibleText('82204.50');
      setTasaCambio('564.80');
      setMovementsList([
        {
          id: 'm-p1',
          movimiento: 'Anticipo M-29948',
          referencia: '180726412',
          vencimiento: '14/11/2025',
          saldoInicial: 132654.58,
          saldoDivisa: 234.87
        }
      ]);
    } else if (key === 'pn_eos_con_iva') {
      setRazonSocial('ALEXANDRA RAMIREZ');
      setTipoDocumento('SOLICITUD');
      setNumDocumento('PN-551');
      setConcepto('HONORARIOS PROFESIONALES DE PINTURA');
      setTipoPersona('Natural');
      setCategoria('obras_servicios'); // 1% ISLR con sustraendo de 35.83 Bs.
      setConIva(true);
      setTotalACancelarText('24471.42');
      setBaseImponibleText('21248.34');
      setTasaCambio('500.00');
      setMovementsList([
        {
          id: 'm-p2',
          movimiento: 'Pago Manual PN',
          referencia: '188223',
          vencimiento: '10/06/2026',
          saldoInicial: 50000.00,
          saldoDivisa: 100.00
        }
      ]);
    } else if (key === 'pn_alquiler_sin_iva') {
      setRazonSocial('JOSE GREGORIO HERNANDEZ');
      setTipoDocumento('PRESUPUESTO');
      setNumDocumento('ALQ-002');
      setConcepto('ARRENDAMIENTO DE OFICINAS MUNICIPALES');
      setTipoPersona('Natural');
      setCategoria('alquileres_honorarios'); // 2% sin IVA
      setConIva(false);
      setTotalACancelarText('13136.91');
      setBaseImponibleText('13405.01');
      setTasaCambio('400.00');
      setMovementsList([
        {
          id: 'm-p3',
          movimiento: 'Alquiler Local',
          referencia: '90102',
          vencimiento: '30/06/2026',
          saldoInicial: 20000.00,
          saldoDivisa: 50.00
        }
      ]);
    }
    triggerToast('⚡ Preset de imagen cargado.');
  };

  return (
    <div className="space-y-6">
      
      {/* SECCIÓN TICKETS INTERIOR BANNER */}
      <div className="no-print bg-white border border-[#c3c6d1] shadow-sm rounded-lg p-5 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#001e40] text-white rounded-lg">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">MÓDULO DE TICKETS (ALÍCUOTAS Y TASAS ISLR)</h3>
            <p className="text-xs text-slate-500 mt-1">
              Emisión de tickets de tamaño reglamentario. Permite pre-visualizar el formato exacto e imprimir de 2 en 2 en hojas tipo carta.
            </p>
          </div>
        </div>

        {/* PRESETS DE EJEMPLO */}
        <div className="flex flex-wrap gap-1.5 justify-end">
          <span className="text-[9px] font-black text-slate-400 block w-full text-right uppercase tracking-wider mb-0.5">Presets Rápidos de las Imágenes:</span>
          <button 
            type="button"
            onClick={() => applyPresetExample('pj_eos_con_iva')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 font-bold rounded"
          >
            PJ Obr. 2% Con IVA
          </button>
          <button 
            type="button"
            onClick={() => applyPresetExample('pn_eos_con_iva')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 font-bold rounded"
          >
            PN Obr. 1% (Deducible)
          </button>
          <button 
            type="button"
            onClick={() => applyPresetExample('pn_alquiler_sin_iva')}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 px-2 py-1 font-bold rounded"
          >
            PN Alq. 3% (Deducible)
          </button>
        </div>
      </div>

      <div className="no-print grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* PANEL IZQUIERDO: FORMULARIO */}
        <div className="xl:col-span-5 bg-white border border-[#c3c6d1] rounded-lg shadow-sm divide-y divide-slate-100 overflow-hidden">
          
          {/* Clasificación (Natural vs Jurídica) */}
          <div className="p-4 bg-slate-50/80">
            <span className="text-[10px] font-black text-[#001e40] uppercase tracking-wider block mb-2 font-mono flex items-center gap-1.5">
              <Check className="w-4 h-4 text-[#1b6d24]" /> 1. CLASIFICACIÓN TRIBUTARIA
            </span>
            
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => {
                  setTipoPersona('Juridica');
                  setCategoria('obras_servicios');
                }}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border rounded text-center transition-all ${
                  tipoPersona === 'Juridica'
                    ? 'bg-[#001e40] text-white border-[#001e40] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Persona Jurídica
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setTipoPersona('Natural');
                  setCategoria('obras_servicios');
                }}
                className={`py-2 px-3 text-xs font-bold uppercase tracking-wider border rounded text-center transition-all ${
                  tipoPersona === 'Natural'
                    ? 'bg-[#001e40] text-white border-[#001e40] shadow-sm'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                Persona Natural
              </button>
            </div>
          </div>

          {/* Datos del emisor y documento */}
          <div className="p-4 space-y-4">
            
            <div>
              <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Nombre o Razón Social</label>
              <input
                type="text"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-bold focus:ring-1 focus:ring-[#1b6d24] focus:border-[#1b6d24]"
                placeholder="Nombre o Razón Social"
              />
            </div>

            {/* SELECCIÓN DE ENTRADA DE DOCUMENTO (SOLICITUD / PRESUPUESTO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Tipo de Documento</label>
                <div className="flex border border-slate-300 rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setTipoDocumento('SOLICITUD')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      tipoDocumento === 'SOLICITUD' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Solicitud
                  </button>
                  <button
                    type="button"
                    onClick={() => setTipoDocumento('PRESUPUESTO')}
                    className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-all ${
                      tipoDocumento === 'PRESUPUESTO' ? 'bg-slate-800 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Presupuesto
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Número</label>
                <input
                  type="text"
                  value={numDocumento}
                  onChange={(e) => setNumDocumento(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-semibold focus:ring-1 focus:ring-[#1b6d24] focus:border-[#1b6d24]"
                  placeholder="Código o número"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Concepto del Pago</label>
              <textarea
                rows={2}
                value={concepto}
                onChange={(e) => setConcepto(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-medium focus:ring-1 focus:ring-[#1b6d24] focus:border-[#1b6d24]"
                placeholder="Describa el concepto de la retención"
              />
            </div>

            {/* Categoría Fiscal e IVA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Actividad / Alícuota de Retención</label>
                {tipoPersona === 'Juridica' ? (
                  <select
                    value={categoria}
                    onChange={(e) => setCategoria(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded p-2 text-slate-800 font-semibold focus:ring-1 focus:ring-[#1b6d24] focus:border-[#1b6d24] bg-white"
                  >
                    <option value="obras_servicios">Ejecución de Obras y Servicios (ISLR: 2% No Deducible)</option>
                    <option value="alquileres_honorarios">Alquileres, Honorarios y Publicidad (ISLR: 5% No Deducible)</option>
                    <option value="transportes_fletes">Gastos de Transportes y Flete (ISLR: 3% No Deducible)</option>
                  </select>
                ) : (
                  <div className="bg-emerald-50/50 p-2 border border-emerald-100 rounded text-xs">
                    <span className="font-extrabold block text-emerald-900 text-[10px] uppercase tracking-wider mb-1">Persona Natural (Sustraendo UT Automático)</span>
                    <select
                      value={categoria}
                      onChange={(e) => setCategoria(e.target.value)}
                      className="w-full text-xs border border-emerald-300 rounded p-1.5 text-slate-800 font-bold bg-white"
                    >
                      <option value="obras_servicios">Ejecución de Obras, Servicios y Fletes (ISLR: 1% Deducible)</option>
                      <option value="alquileres_honorarios">Alquileres, Honorarios, Comisiones (ISLR: 3% Deducible)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Cálculo de IVA (16%)</label>
                <div className="flex border border-slate-300 rounded overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setConIva(true)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      conIva ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Con IVA
                  </button>
                  <button
                    type="button"
                    onClick={() => setConIva(false)}
                    className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider transition-all ${
                      !conIva ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Sin IVA
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">Deducción de UT</label>
                <div className="bg-slate-100 p-2 text-[10px] text-slate-600 rounded border border-slate-200 text-center font-bold uppercase leading-tight min-h-[38px] flex items-center justify-center">
                  {tipoPersona === 'Natural' 
                    ? `DEDUCIBLE AUTOMÁTICO (Sustraendo: ${computedSustraendo} Bs.)` 
                    : 'NO DEDUCIBLE (Sustraendo: 0 Bs.)'}
                </div>
              </div>
            </div>

          </div>

          {/* PARÁMETROS ESPECÍFICOS DEL TICKET GRANDE */}
          <div className="p-4 bg-slate-50/60 space-y-4">
            <span className="text-[10px] font-black text-[#001e40] uppercase tracking-wider block font-mono flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-indigo-600" /> Parámetros para Ticket Grande
            </span>

            {/* List and editor of current movements inside the card */}
            {movementsList.length > 0 && (
              <div className="border border-slate-200 rounded p-2 bg-white space-y-1 text-[11px] font-mono max-h-[175px] overflow-y-auto">
                <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-100 flex-wrap gap-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Movimientos cargados ({movementsList.length}):</span>
                  <button
                    type="button"
                    onClick={() => {
                      const sumSaldos = movementsList.reduce((sum, m) => sum + m.saldoInicial, 0);
                      if (sumSaldos > 0) {
                        setTotalACancelarText(sumSaldos.toFixed(2));
                        triggerToast(`💰 Total a Cancelar actualizado a ${sumSaldos.toFixed(2)} Bs. (Suma de movimientos)`);
                      } else {
                        triggerToast('⚠️ La suma de movimientos es 0 Bs.');
                      }
                    }}
                    className="text-[8px] bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-200 uppercase tracking-tight transition-all cursor-pointer"
                  >
                    Usar Suma como Total a Cancelar
                  </button>
                </div>
                {movementsList.map((move, mIdx) => (
                  <div key={move.id || mIdx} className="flex justify-between items-center bg-slate-50 p-1 px-2 border border-slate-150 rounded">
                    <div className="truncate pr-1">
                      <span className="font-bold text-slate-800">#{mIdx + 1} {move.movimiento}</span>
                      <span className="text-slate-400 text-[10px] ml-1">({move.referencia} - {move.vencimiento})</span>
                      <span className="font-bold text-indigo-700 block text-[10px]">
                        Bs. {move.saldoInicial.toLocaleString('es-VE', { minimumFractionDigits: 2 })} / {move.saldoDivisa.toLocaleString('es-VE', { minimumFractionDigits: 2 })} $
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMovementsList(prev => prev.filter(item => item.id !== move.id))}
                      className="text-red-500 hover:bg-red-50 p-1 px-2 rounded font-bold text-sm shrink-0"
                      title="Eliminar movimiento"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 border-t border-slate-200 pt-3">
              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nombre Movimiento</label>
                <input 
                  type="text" 
                  value={movimiento} 
                  onChange={(e) => setMovimiento(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                  placeholder="ej. Anticipo M-29948"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Referencia</label>
                <input 
                  type="text" 
                  value={referencia} 
                  onChange={(e) => setReferencia(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                  placeholder="ej. 180726412"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Vencimiento</label>
                <input 
                  type="text" 
                  value={vencimiento} 
                  onChange={(e) => setVencimiento(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono"
                  placeholder="ej. 14/11/2025"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Saldo Inicial (Bs.)</label>
                <input 
                  type="text" 
                  value={saldoInicial} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setSaldoInicial(val);
                  }}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Saldo ($ Divisa)</label>
                <input 
                  type="text" 
                  value={saldoDivisa} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setSaldoDivisa(val);
                  }}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono font-bold"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="text-[9px] font-extrabold text-[#001e40] block mb-1 uppercase flex justify-between">
                  <span>Tasa de Cambio</span>
                  <button 
                    type="button"
                    onClick={() => {
                      const sInit = parseFloat(saldoInicial) || 0;
                      const sDiv = parseFloat(saldoDivisa) || 0;
                      if (sInit > 0 && sDiv > 0) {
                        setTasaCambio((sInit / sDiv).toFixed(2));
                        triggerToast('🔄 Tasa recalculada desde los saldos.');
                      } else {
                        triggerToast('⚠️ Ingrese Saldo Inicial y Saldo ($) para auto-calcular.');
                      }
                    }}
                    className="text-[7.5px] text-indigo-600 hover:text-indigo-800 font-mono font-bold underline cursor-pointer"
                  >
                    Auto-Calcular
                  </button>
                </label>
                <input 
                  type="text" 
                  value={tasaCambio} 
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) setTasaCambio(val);
                  }}
                  className="w-full text-xs border border-slate-300 rounded p-1.5 font-mono font-bold bg-white"
                  placeholder="0.00"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAddMovement}
              className="w-full text-[10px] bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 rounded uppercase tracking-wider transition-all shadow-sm"
            >
              + Registrar Movimiento en Tabla
            </button>

            <div>
              <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Nota Adicional / Comentario</label>
              <input 
                type="text" 
                value={nota} 
                onChange={(e) => setNota(e.target.value)}
                placeholder="ej. REPARACIÓN DEL COMPRESOR CON RETRASO"
                className="w-full text-xs border border-slate-300 rounded p-1.5"
              />
            </div>
          </div>

          {/* PARÁMETROS NUMÉRICOS DE CÁLCULO PRINCIPAL */}
          <div className="p-4 bg-slate-50 space-y-4">
            <div>
              <span className="text-[10px] font-black text-[#001e40] uppercase tracking-wider block mb-2 font-mono flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-[#1b6d24]" /> 2. PARÁMETROS NUMÉRICOS DE RETENCIÓN
              </span>
            </div>

            {/* TOTAL A CANCELAR COMO INPUT PRINCIPAL */}
            <div>
              <label className="text-[10.5px] font-black text-rose-800 uppercase tracking-wide block mb-1">
                💰 Total a Cancelar (Bs.) - [Input Principal que Arrastra Cálculos]
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-rose-600 text-xs font-mono font-black">Bs.</span>
                </div>
                <input
                  type="text"
                  value={totalACancelarText}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setTotalACancelarText(val);
                    }
                  }}
                  className="w-full text-lg font-black font-mono pl-10 pr-4 py-2 border-2 border-rose-300 focus:border-rose-600 rounded bg-rose-50/50 text-rose-950 focus:ring-0"
                  placeholder="0.00"
                />
              </div>
              <span className="text-[8.5px] text-slate-500 block mt-0.5">
                Al modificar este monto, se calculará automáticamente la **Base Imponible** y se aplicarán los parámetros fiscales correspondientes.
              </span>
            </div>

            {/* BASE IMPONIBLE AUTOMÁTICA Y TOTALMENTE EDITABLE */}
            <div>
              <label className="text-[10.5px] font-extrabold text-[#001e40] uppercase tracking-wider block mb-1">
                📝 Base Imponible (Bs.) - [Automático, Totalmente Editable]
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-slate-500 text-xs font-mono">Bs.</span>
                </div>
                <input
                  type="text"
                  value={baseImponibleText}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === '' || /^[0-9]*\.?[0-9]*$/.test(val)) {
                      setBaseImponibleText(val);
                    }
                  }}
                  className="w-full text-base font-bold font-mono pl-10 pr-4 py-2 border border-slate-350 rounded focus:ring-2 focus:ring-[#1b6d24] focus:border-[#1b6d24] bg-white text-slate-900"
                  placeholder="0.00"
                />
              </div>
              <span className="text-[8.5px] text-slate-400 block mt-0.5">
                Si desea alterar manualmente la Base Imponible calculada por el factor de retención, edítela aquí.
              </span>
            </div>

            {/* LA FACTORIZACION ADICIONAL */}
            <div className="p-3 bg-amber-50/50 border border-amber-200 rounded-lg space-y-2 lg:col-span-2">
              <span className="text-[9.5px] font-black text-amber-900 uppercase block font-mono flex items-center gap-1">
                <Calculator className="w-3.5 h-3.5 text-amber-700" /> OPERACIÓN DE FACTORIZACIÓN ADICIONAL
              </span>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-white p-2 rounded border border-amber-100 font-mono">
                <div>
                  <span className="text-[8px] block font-bold text-amber-700">FACTOR CALCULADO:</span>
                  <span className="font-extrabold text-slate-800 text-xs">{activeCalculatedTicket.factorRetorno.toFixed(2)}</span>
                  <span className="text-[7px] text-slate-400 block font-sans">(BaseImponible * 100% / TotalAPagar)</span>
                </div>
                <div>
                  <span className="text-[8px] block font-bold text-indigo-700">BASE RESULTANTE:</span>
                  <span className="font-extrabold text-indigo-700 text-xs">{activeCalculatedTicket.baseRetorno.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs.</span>
                  <span className="text-[7px] text-slate-400 block font-sans">(TotalACancelar / Factor)</span>
                </div>
              </div>
            </div>
            
          </div>

          {/* ACCIÓN DE AGREGAR */}
          <div className="p-4 bg-slate-100 flex flex-col sm:flex-row gap-2">
            <button
              onClick={handleAddTicket}
              className="flex-1 bg-[#1b6d24] hover:bg-[#14531b] text-white py-2.5 px-4 rounded font-bold uppercase text-xs tracking-wider flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Añadir / Acumular Ticket</span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={ticketsList.length === 0}
              className="px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold uppercase text-xs rounded transition-all disabled:opacity-50"
            >
              Limpiar Cola ({ticketsList.length})
            </button>
          </div>

        </div>

        {/* PANEL DERECHO: VISTA PREVIA */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          
          {/* TICKET MOCKUP VIEW */}
          <div className="bg-white border border-[#c3c6d1] rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-[#1b6d24]" /> Vista Previa del Modelo de Ticket
              </span>
              
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => setTicketSize('pequeno')}
                  className={`text-[10px] px-2.5 py-1 font-bold rounded uppercase transition-all ${
                    ticketSize === 'pequeno'
                      ? 'bg-[#001e40] text-white'
                      : 'bg-slate-150 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ticket Pequeño (10.20 x 4.23 cm)
                </button>
                <button
                  type="button"
                  onClick={() => setTicketSize('grande')}
                  className={`text-[10px] px-2.5 py-1 font-bold rounded uppercase transition-all ${
                    ticketSize === 'grande'
                      ? 'bg-[#001e40] text-white'
                      : 'bg-slate-150 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Ticket Grande (23.00 x 10.00 cm)
                </button>
              </div>
            </div>

            {/* RENDER MOCKUP IN REALTIME */}
            <div className="flex items-center justify-center p-4 bg-slate-100 rounded border border-dashed border-slate-300 min-h-[350px] overflow-auto">
              
              {ticketSize === 'pequeno' ? (
                /* MODELO TICKET PEQUEÑO EN PANTALLA */
                <div className="bg-white text-black font-sans shadow-lg p-2 flex flex-col justify-between shrink-0 border-2 border-black w-[385px] h-[160px] text-[9px] leading-tight">
                  {/* 1. Header: Razón Social */}
                  <div className="border border-black text-center font-black uppercase py-0.5 tracking-tight truncate text-[10px]">
                    {activeCalculatedTicket.razonSocial}
                  </div>

                  {/* 2. Solicitud o Presupuesto */}
                  <div className="text-[9px] text-left px-2 font-mono font-black border-l border-r border-b border-black py-0.5 bg-slate-50 uppercase">
                    {activeCalculatedTicket.tipoDocumento} {activeCalculatedTicket.numDocumento}
                  </div>

                  {/* 3. Middle contents */}
                  <div className="grid grid-cols-12 border-l border-r border-b border-black flex-1 min-h-0">
                    {/* Concept */}
                    <div className="col-span-6 p-1 border-r border-black flex items-center justify-center text-center font-bold text-[8px] uppercase break-words leading-tight">
                      {activeCalculatedTicket.concepto}
                    </div>

                    {/* Base, Iva, Total */}
                    <div className="col-span-6 p-1.5 flex flex-col justify-between font-mono text-[8px]">
                      <div className="flex justify-between border-b border-dashed border-slate-300 py-0.5">
                        <span className="text-slate-500">BASE IMP:</span>
                        <span className="font-extrabold">{activeCalculatedTicket.baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-300 py-0.5">
                        <span className="text-slate-500">IVA (16%):</span>
                        <span className="font-extrabold">{activeCalculatedTicket.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-black bg-slate-100 p-0.5 mt-1 border-t border-black text-[9px]">
                        <span>TOTAL:</span>
                        <span>{activeCalculatedTicket.totalFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  {/* footer label info */}
                  <div className="text-[7px] text-slate-400 font-mono text-center pt-1 mt-auto shrink-0 uppercase tracking-tight">
                    C.A. BANANERA VENEZOLANA
                  </div>
                </div>

              ) : (
                
                /* MODELO TICKET GRANDE CON LEDGERS Y TABLAS COMPLETO */
                <div className="bg-white text-black font-sans shadow-lg p-3 shrink-0 border-2 border-black w-[650px] h-[330px] flex flex-col justify-between text-[10px]">
                  
                  {/* Top Business Title */}
                  <div className="border border-black bg-slate-50 text-center font-black uppercase py-0.5 text-[11px] shrink-0 tracking-wider">
                    {activeCalculatedTicket.razonSocial}
                  </div>

                  {/* Ledger Header Table Rows */}
                  <div className="shrink-0 overflow-x-auto max-h-[85px]">
                    <table className="w-full text-center border-l border-r border-b border-black text-[8px] font-mono leading-none">
                      <thead>
                        <tr className="border-b border-black bg-slate-100 font-bold uppercase font-sans">
                          <th className="border-r border-black py-1 px-1 text-left">Movimiento</th>
                          <th className="border-r border-black py-1 px-1">Referencia</th>
                          <th className="border-r border-black py-1 px-1">Vencimiento</th>
                          <th className="border-r border-black py-1 px-1 text-right">Saldo</th>
                          <th className="border-r border-black py-1 px-1 text-right">$</th>
                          <th className="py-1 px-1 text-right">TASA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeCalculatedTicket.movements && activeCalculatedTicket.movements.length > 0 ? (
                          activeCalculatedTicket.movements.map((move, moveIdx) => (
                            <tr key={move.id || moveIdx} className="border-b border-black">
                              <td className="border-r border-black py-0.5 px-0.5 truncate font-bold text-left">{move.movimiento}</td>
                              <td className="border-r border-black py-0.5 px-0.5 font-medium">{move.referencia}</td>
                              <td className="border-r border-black py-0.5 px-0.5 font-medium">{move.vencimiento}</td>
                              <td className="border-r border-black py-0.5 px-0.5 font-bold text-right">{move.saldoInicial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                              <td className="border-r border-black py-0.5 px-0.5 font-bold text-right">{move.saldoDivisa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                              <td className="py-0.5 px-0.5 text-right font-bold text-indigo-700">
                                {move.saldoDivisa > 0 
                                  ? (move.saldoInicial / move.saldoDivisa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : activeCalculatedTicket.tasaCambio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b border-black">
                            <td className="border-r border-black py-0.5 px-1 truncate font-bold text-left">{activeCalculatedTicket.movimiento}</td>
                            <td className="border-r border-black py-0.5 px-1 font-medium">{activeCalculatedTicket.referencia}</td>
                            <td className="border-r border-black py-0.5 px-1 font-medium">{activeCalculatedTicket.vencimiento}</td>
                            <td className="border-r border-black py-0.5 px-1 font-extrabold text-right">{activeCalculatedTicket.saldoInicial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td className="border-r border-black py-0.5 px-1 font-extrabold text-right">{activeCalculatedTicket.saldoDivisa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td className="py-0.5 px-1 font-black text-right text-indigo-700">
                              {activeCalculatedTicket.saldoDivisa > 0 
                                ? (activeCalculatedTicket.saldoInicial / activeCalculatedTicket.saldoDivisa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : activeCalculatedTicket.tasaCambio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        {/* EN ESTA RELACIÓN row - Solo aparece para Personas Juridicas */}
                        {activeCalculatedTicket.tipoPersona === 'Juridica' && (
                          <tr className="border-b border-black bg-emerald-50/30">
                            <td className="border-r border-black py-0.5 px-1 font-bold text-left text-emerald-800">EN ESTA RELACION</td>
                            <td className="border-r border-black py-0.5 px-1"></td>
                            <td className="border-r border-black py-0.5 px-1"></td>
                            <td className="border-r border-black py-0.5 px-1 font-black text-right text-emerald-700">{activeCalculatedTicket.totalAPagar.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td className="border-r border-black py-0.5 px-1 font-black text-right text-emerald-700 font-bold">
                              {activeCalculatedTicket.tasaCambio > 0 
                                ? (activeCalculatedTicket.totalAPagar / activeCalculatedTicket.tasaCambio).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '0,00'}
                            </td>
                            {/* Calculated Tasa */}
                            <td className="py-0.5 px-1 font-extrabold text-right text-emerald-900">
                              {activeCalculatedTicket.tasaCambio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                        {/* Remaining row - Diferencia por la resta de las primeras dos filas o suma de movimientos */}
                        <tr className="bg-slate-50">
                          <td className="border-r border-black py-0.5 px-1 text-slate-500 font-bold text-left">DIFERENCIA RESTANTE</td>
                          <td className="border-r border-black py-0.5 px-1"></td>
                          <td className="border-r border-black py-0.5 px-1"></td>
                          <td className="border-r border-black py-0.5 px-1 text-right font-bold text-slate-500 font-mono">
                            {(activeCalculatedTicket.saldoInicial - activeCalculatedTicket.totalAPagar).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="border-r border-black py-0.5 px-1 text-right font-bold text-slate-500 font-mono">
                            {/* Eliminado el resultado en el saldo en divisas */}
                          </td>
                          <td className="text-right text-slate-500 font-bold font-mono text-[9px] pr-1">
                            {(() => {
                              const movements: any[] = activeCalculatedTicket.movements && activeCalculatedTicket.movements.length > 0
                                ? activeCalculatedTicket.movements
                                : [{
                                    saldoInicial: activeCalculatedTicket.saldoInicial,
                                    saldoDivisa: activeCalculatedTicket.saldoDivisa
                                  }];
                              
                              const sumMovsTasa = movements.reduce((acc: number, m: any) => {
                                const t = m.saldoDivisa > 0 ? (m.saldoInicial / m.saldoDivisa) : activeCalculatedTicket.tasaCambio;
                                return acc + t;
                              }, 0);

                              const diffTasa = sumMovsTasa - activeCalculatedTicket.tasaCambio;
                              return diffTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Dual Grid bottom block */}
                  <div className="grid grid-cols-12 gap-2 mt-2 flex-1 min-h-0">
                    
                    {/* LEFT INNER BOX */}
                    <div className="col-span-6 border border-black rounded flex flex-col justify-between p-1 bg-slate-50/40">
                      <div>
                        {/* Título de Razón Social */}
                        <div className="text-center font-bold font-sans uppercase border-b border-slate-300 pb-0.5 text-[8.5px]">
                          {activeCalculatedTicket.razonSocial}
                        </div>
                        {/* Document Name block */}
                        <div className="font-extrabold text-[8.5px] uppercase text-indigo-900 border-b border-black py-0.5 font-mono mb-1">
                          {activeCalculatedTicket.tipoDocumento} {activeCalculatedTicket.numDocumento}
                        </div>
                        {/* Concept body */}
                        <div className="text-[7.5px] uppercase font-bold text-slate-700 font-serif leading-tight line-clamp-3">
                          {activeCalculatedTicket.concepto}
                        </div>
                      </div>

                      {/* Mini table inside left box: BASE, IVA, TOTAL */}
                      <div className="border-t border-slate-300 pt-1 font-mono text-[7.5px] space-y-0.5">
                        <div className="flex justify-between">
                          <span>BASE:</span>
                          <span className="font-bold">{activeCalculatedTicket.baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA:</span>
                          <span className="font-bold">{activeCalculatedTicket.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-slate-400 font-black">
                          <span>TOTAL:</span>
                          <span>{activeCalculatedTicket.totalFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT LEDGER CALCULATION BLOCK */}
                    <div className="col-span-6 flex flex-col justify-between p-1.5 border border-black rounded bg-white">
                      
                      <div className="space-y-0.5 font-mono text-[8px] md:text-[9.5px]">
                        <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">BASE:</span>
                          <span className="font-bold">{activeCalculatedTicket.baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">IVA:</span>
                          <span className="font-bold">{activeCalculatedTicket.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center pb-0.5 border-b border-slate-200 font-extrabold text-slate-800">
                          <span>TOTAL:</span>
                          <span>{activeCalculatedTicket.totalFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-slate-200 text-red-700">
                          <span className="font-bold">ISLR ({activeCalculatedTicket.porcentajeIslr}%):</span>
                          <span className="font-black">-{activeCalculatedTicket.islrRetenido.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        {activeCalculatedTicket.sustraendo > 0 && (
                          <div className="flex justify-between text-[7px] text-slate-400 pl-1 font-sans">
                            <span>Sustraendo UT:</span>
                            <span>-{activeCalculatedTicket.sustraendo.toFixed(2)} Bs.</span>
                          </div>
                        )}
                      </div>

                      {/* TOTAL A PAGAR HIGHLIGHT */}
                      <div className="bg-slate-900 text-white p-1 rounded mt-1">
                        <div className="flex justify-between items-center font-black text-[9px] md:text-[11px] uppercase text-emerald-400">
                          <span>TOTAL A PAGAR:</span>
                          <span className="font-mono text-white">{activeCalculatedTicket.totalAPagar.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Nota section at the very bottom */}
                  <div className="border border-black bg-slate-50 p-1 rounded mt-1 shrink-0">
                    <span className="font-black text-[8px] block uppercase text-slate-600 font-mono">
                      NOTA: <span className="font-bold text-black font-sans ml-1 text-[8px]">{(activeCalculatedTicket.nota && activeCalculatedTicket.nota !== 'NINGUNA' && activeCalculatedTicket.nota !== 'NINGUNO') ? activeCalculatedTicket.nota : ''}</span>
                    </span>
                  </div>

                </div>
              )}
            </div>
          </div>

          {/* LISTA DE TICKETS APILADOS */}
          <div className="bg-white border border-[#c3c6d1] rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-600" /> Cola de Tickets Acumulados ({ticketsList.length})
              </span>
              
              {ticketsList.length > 0 && (
                <div className="flex gap-2">
                  <button
                    onClick={handlePrint}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Imprimir Carta ({ticketsList.length})</span>
                  </button>
                  <button
                    onClick={handleExportToExcel}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm transition-all"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Exportar a Excel</span>
                  </button>
                </div>
              )}
            </div>

            {ticketsList.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded border border-slate-200 text-slate-400">
                <Scissors className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-bold uppercase">No hay tickets acumulados en cola</p>
                <p className="text-[10px] mt-1">Rellene el formulario conceptual izquierdo y presione "Añadir / Acumular Ticket".</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {ticketsList.map((ticket, idx) => (
                  <div key={ticket.id} className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-7 h-7 bg-slate-850 bg-[#001e40] text-white rounded-full flex items-center justify-center font-bold font-mono text-[10px] shrink-0">
                        #{idx + 1}
                      </div>
                      <div className="min-w-0 font-mono">
                        <div className="font-bold text-[#001e40] uppercase truncate text-[11px] flex gap-2 items-center">
                          <span>{ticket.razonSocial}</span>
                          <span className="text-[8.5px] px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded font-normal">
                            {ticket.tipoDocumento} {ticket.numDocumento}
                          </span>
                        </div>
                        <div className="text-[9px] text-slate-500 uppercase flex flex-wrap gap-x-2 mt-0.5">
                          <span>Base: <strong className="text-slate-700">{ticket.baseImponible.toFixed(2)}</strong></span>
                          <span>IVA: <strong className="text-slate-700">{ticket.iva.toFixed(2)}</strong></span>
                          <span>ISLR ({ticket.porcentajeIslr}%): <strong className="text-red-700">-{ticket.islrRetenido.toFixed(2)}</strong></span>
                          <span>Pagar: <strong className="text-emerald-700">{ticket.totalAPagar.toFixed(2)}</strong></span>
                          <span className="text-[8.5px] text-amber-600">Base Ret: <strong>{ticket.baseRetorno.toFixed(2)}</strong></span>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveTicket(ticket.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                      title="Eliminar de la lista"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* REGLAS FÍSICAS DE LA HOJA TAMAÑO CARTA */}
          <div className="bg-indigo-50 border border-indigo-150 rounded-lg p-4 font-sans text-xs text-indigo-950 leading-relaxed">
            <div className="flex gap-1.5 items-center font-black uppercase text-[10px] text-indigo-900 mb-1">
              <Info className="w-4 h-4 shrink-0" /> REGLAS Y CONFIGURACIÓN FÍSICA PARA IMPRESIÓN CORREGIDA:
            </div>
            <p>
              El sistema de impresión ha sido programado para agrupar los tickets de <strong>2 en 2 horizontalmente (dos columnas)</strong> en el tamaño de hoja Carta. Se implementan los siguientes estándares de control:
            </p>
            <ul className="list-inside space-y-1 mt-1 pl-1 list-decimal font-mono text-[9px] text-indigo-900">
              <li><strong>Tickets Pequeños (10.20cm x 4.23cm)</strong>: Agrupamiento forzado de columnas mediante estructura Grid de impresión. Evita reboses.</li>
              <li><strong>Tickets Grandes (23.00cm x 10.00cm)</strong>: Se escalan automáticamente con un límite del 100% del ancho físico de la hoja para no rebasar los bordes en el formato carta estándar y forzar un salto de página limpio.</li>
              <li><strong>Prevención de Cortes</strong>: Todas las tarjetas emplean una directiva <code>break-inside: avoid</code> para que no queden divididas a mitad de página con líneas fantasma.</li>
            </ul>
          </div>

        </div>

      </div>

      {/* EXPORT OPTIONS MODAL */}
      {showExportModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden transform transition-all duration-200">
            {/* Header */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <span className="font-sans font-black uppercase text-xs tracking-wider flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" /> Exportar a Excel
              </span>
              <button 
                onClick={() => setShowExportModal(false)}
                className="text-slate-400 hover:text-white font-bold text-lg select-none outline-none focus:outline-none"
              >
                ×
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed font-sans">
                Seleccione el formato en el cual desea exportar sus comprobantes o relación de retención ISLR a un libro de Excel (.xls):
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Option 1: Relation List */}
                <button
                  type="button"
                  onClick={handleExportToExcelList}
                  className="flex flex-col text-left border border-slate-200 rounded-lg p-4 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all focus:outline-none"
                >
                  <span className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center mb-3">
                    <ListFilter className="w-4 h-4 text-emerald-600" />
                  </span>
                  <span className="font-black text-slate-800 text-[11px] uppercase tracking-wide">Fila de Relación</span>
                  <span className="text-[9.5px] text-slate-500 mt-1 leading-normal">
                    Exporta una sola tabla horizontal consolidando todos los datos correspondientes para control administrativo.
                  </span>
                </button>

                {/* Option 2: Printable Card Layout */}
                <button
                  type="button"
                  onClick={handleExportToExcelEditable}
                  className="flex flex-col text-left border border-slate-200 rounded-lg p-4 hover:border-indigo-500 hover:bg-indigo-50/30 transition-all focus:outline-none"
                >
                  <span className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center mb-3">
                    <Layers className="w-4 h-4 text-indigo-600" />
                  </span>
                  <span className="font-black text-slate-800 text-[11px] uppercase tracking-wide">Tarjetas Editables</span>
                  <span className="text-[9.5px] text-slate-500 mt-1 leading-normal">
                    Exporta plantillas completas de comprobantes en tarjetas con formulas para su re-edición exacta por separado.
                  </span>
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-slate-50 px-6 py-3.5 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold px-4 py-1.5 rounded text-[10px] uppercase tracking-wider transition-all"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATIONS */}
      {toastMessage && (
        <div className="no-print fixed bottom-5 right-5 z-50 bg-slate-900 text-white rounded-lg px-4 py-2.5 shadow-xl border border-slate-700">
          <span className="text-xs font-mono font-bold tracking-wide uppercase">{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ============ SECCIÓN EXCLUSIVA DE PRINT: APARECE SÓLO CON WINDOW.PRINT ============ */}
      {/* ========================================================================= */}
      <div id="printable-tickets-sheet" className="hidden print:block font-sans text-black bg-white p-0 m-0">
        
        {(() => {
          const chunkSize = ticketSize === 'pequeno' ? 8 : 2;
          const chunks = [];
          for (let i = 0; i < ticketsList.length; i += chunkSize) {
            chunks.push(ticketsList.slice(i, i + chunkSize));
          }
          
          return chunks.map((chunk, chunkIdx) => (
            <div 
              key={`print-page-${chunkIdx}`} 
              className={`${ticketSize === 'pequeno' ? 'print-grid-2col' : 'print-grid-large'} print-page`}
            >
              {chunk.map((ticket, idxInChunk) => {
                const index = chunkIdx * chunkSize + idxInChunk;
                return (
                  <div 
                    key={ticket.id}
                    className={`bg-white text-black font-sans shrink-0 border border-black flex flex-col justify-between relative break-inside-avoid print-card-item ${
                      ticketSize === 'pequeno' ? 'ticket-print-small' : 'ticket-print-large'
                    }`}
                  >
              {/* Línea sutil discontinua de ayuda para corte o guías física */}
              <div className="absolute -inset-[1px] border border-dashed border-slate-400 pointer-events-none opacity-40"></div>

              {ticketSize === 'pequeno' ? (
                /* MODELO PEQUEÑO PRINT */
                <div className="flex flex-col h-full justify-between p-2">
                  <div className="border border-black text-center font-black uppercase py-0.5 tracking-tight text-[10px] truncate shrink-0">
                    {ticket.razonSocial}
                  </div>

                  <div className="text-[9px] text-left px-2 font-mono font-black border-l border-r border-b border-black py-0.5 bg-slate-50 uppercase">
                    {ticket.tipoDocumento} {ticket.numDocumento}
                  </div>

                  <div className="grid grid-cols-12 border-l border-r border-b border-black flex-1 min-h-0">
                    <div className="col-span-6 p-1 border-r border-black flex items-center justify-center text-center font-bold text-[8px] uppercase break-words leading-tight">
                      {ticket.concepto}
                    </div>

                    <div className="col-span-6 p-1.5 flex flex-col justify-between font-mono text-[8px]">
                      <div className="flex justify-between border-b border-dashed border-slate-300 py-0.5">
                        <span className="text-slate-500">BASE IMP:</span>
                        <span className="font-extrabold">{ticket.baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between border-b border-dashed border-slate-300 py-0.5">
                        <span className="text-slate-500">IVA (16%):</span>
                        <span className="font-extrabold">{ticket.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between font-black bg-slate-100 p-0.5 mt-1 border-t border-black text-[9px]">
                        <span>TOTAL:</span>
                        <span>{ticket.totalFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-[7px] text-slate-405 text-center mt-1 uppercase font-mono">
                    C.A. BANANERA VENEZOLANA
                  </div>
                </div>
              ) : (
                /* MODELO GRANDE PRINT */
                <div className="flex flex-col h-full justify-between p-3">
                  
                  {/* Top Business Title */}
                  <div className="border border-black bg-slate-50 text-center font-black uppercase py-0.5 text-[11px] shrink-0">
                    {ticket.razonSocial}
                  </div>

                  {/* Ledger Header Table Rows */}
                  <div className="shrink-0">
                    <table className="w-full text-center border-l border-r border-b border-black text-[8px] font-mono leading-none">
                      <thead>
                        <tr className="border-b border-black bg-slate-100 font-bold uppercase font-sans">
                          <th className="border-r border-black py-1 px-1 text-left">Movimiento</th>
                          <th className="border-r border-black py-1 px-1">Referencia</th>
                          <th className="border-r border-black py-1 px-1">Vencimiento</th>
                          <th className="border-r border-black py-1 px-1 text-right">Saldo</th>
                          <th className="border-r border-black py-1 px-1 text-right">$</th>
                          <th className="py-1 px-1 text-right font-sans">TASA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.movements && ticket.movements.length > 0 ? (
                          ticket.movements.map((move, idxC) => (
                            <tr key={move.id || idxC} className="border-b border-black">
                              <td className="border-r border-black py-0.5 px-0.5 truncate font-bold text-left">{move.movimiento}</td>
                              <td className="border-r border-black py-0.5 px-0.5 font-medium">{move.referencia}</td>
                              <td className="border-r border-black py-0.5 px-0.5 font-medium">{move.vencimiento}</td>
                              <td className="border-r border-black py-0.5 px-0.5 text-right font-bold">{move.saldoInicial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                              <td className="border-r border-black py-0.5 px-0.5 text-right font-bold">{move.saldoDivisa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                              <td className="py-0.5 px-0.5 text-right font-bold font-mono">
                                {move.saldoDivisa > 0 
                                  ? (move.saldoInicial / move.saldoDivisa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                  : ticket.tasaCambio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr className="border-b border-black">
                            <td className="border-r border-black py-0.5 px-1 truncate font-bold text-left">{ticket.movimiento}</td>
                            <td className="border-r border-black py-0.5 px-1 font-medium">{ticket.referencia}</td>
                            <td className="border-r border-black py-0.5 px-1 font-medium">{ticket.vencimiento}</td>
                            <td className="border-r border-black py-0.5 px-1 text-right font-bold">{ticket.saldoInicial.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td className="border-r border-black py-0.5 px-1 text-right font-bold">{ticket.saldoDivisa.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td className="py-0.5 px-1 text-right font-bold">
                              {ticket.saldoDivisa > 0 
                                ? (ticket.saldoInicial / ticket.saldoDivisa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : ticket.tasaCambio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}

                        {/* EN ESTA RELACIÓN row - Solo para Personas Juridicas */}
                        {ticket.tipoPersona === 'Juridica' && (
                          <tr className="border-b border-black bg-emerald-50/20">
                            <td className="border-r border-black py-0.5 px-1 font-bold text-left text-emerald-800">EN ESTA RELACION</td>
                            <td className="border-r border-black py-0.5 px-1"></td>
                            <td className="border-r border-black py-0.5 px-1"></td>
                            <td className="border-r border-black py-0.5 px-1 text-right font-bold font-mono">{ticket.totalAPagar.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</td>
                            <td className="border-r border-black py-0.5 px-1 text-right font-bold font-mono">
                              {ticket.tasaCambio > 0 
                                ? (ticket.totalAPagar / ticket.tasaCambio).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                                : '0,00'}
                            </td>
                            <td className="py-0.5 px-1 text-right font-bold font-mono text-emerald-950">
                              {ticket.tasaCambio.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </td>
                          </tr>
                        )}
                        {/* Remaining row - Diferencia por la resta de las primeras dos filas */}
                        <tr className="bg-slate-50">
                          <td className="border-r border-black py-0.5 px-1 text-slate-500 font-bold text-left">DIFERENCIA RESTANTE</td>
                          <td className="border-r border-black py-0.5 px-1"></td>
                          <td className="border-r border-black py-0.5 px-1"></td>
                          <td className="border-r border-black py-0.5 px-1 text-right font-bold text-slate-500 font-mono">
                            {(ticket.saldoInicial - ticket.totalAPagar).toLocaleString('es-VE', { minimumFractionDigits: 2 })}
                          </td>
                          <td className="border-r border-black py-0.5 px-1 text-right font-bold text-slate-500 font-mono">
                            {/* Eliminado el resultado en el saldo en divisas */}
                          </td>
                          <td className="text-right text-slate-500 font-bold font-mono text-[9px] pr-1">
                            {(() => {
                              const movements: any[] = ticket.movements && ticket.movements.length > 0
                                ? ticket.movements
                                : [{
                                    saldoInicial: ticket.saldoInicial,
                                    saldoDivisa: ticket.saldoDivisa
                                  }];
                              
                              const sumMovsTasa = movements.reduce((acc: number, m: any) => {
                                const t = m.saldoDivisa > 0 ? (m.saldoInicial / m.saldoDivisa) : ticket.tasaCambio;
                                return acc + t;
                              }, 0);

                              const diffTasa = sumMovsTasa - ticket.tasaCambio;
                              return diffTasa.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            })()}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Dual Grid bottom block */}
                  <div className="grid grid-cols-12 gap-2 mt-2 flex-1 min-h-0">
                    
                    {/* LEFT INNER BOX */}
                    <div className="col-span-6 border border-black rounded flex flex-col justify-between p-1 bg-slate-50/40">
                      <div>
                        {/* Título de Razón Social */}
                        <div className="text-center font-bold font-sans uppercase border-b border-slate-300 pb-0.5 text-[8.5px]">
                          {ticket.razonSocial}
                        </div>
                        {/* Document Name block */}
                        <div className="font-extrabold text-[8.5px] uppercase text-indigo-900 border-b border-black py-0.5 font-mono mb-1">
                          {ticket.tipoDocumento} {ticket.numDocumento}
                        </div>
                        {/* Concept body */}
                        <div className="text-[7.5px] uppercase font-bold text-slate-700 leading-tight">
                          {ticket.concepto}
                        </div>
                      </div>

                      <div className="border-t border-slate-300 pt-1 font-mono text-[7.5px] space-y-0.5">
                        <div className="flex justify-between">
                          <span>BASE:</span>
                          <span className="font-bold">{ticket.baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>IVA:</span>
                          <span className="font-bold">{ticket.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between border-t border-dashed border-slate-400 font-black">
                          <span>TOTAL:</span>
                          <span>{ticket.totalFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT LEDGER CALCULATION BLOCK */}
                    <div className="col-span-6 flex flex-col justify-between p-1.5 border border-black rounded bg-white">
                      
                      <div className="space-y-0.5 font-mono text-[8px] md:text-[9.5px]">
                        <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">BASE:</span>
                          <span className="font-bold">{ticket.baseImponible.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-slate-200">
                          <span className="text-slate-500">IVA:</span>
                          <span className="font-bold">{ticket.iva.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center pb-0.5 border-b border-slate-200 font-extrabold">
                          <span>TOTAL:</span>
                          <span>{ticket.totalFactura.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>

                        <div className="flex justify-between items-center pb-0.5 border-b border-dashed border-slate-200 text-black">
                          <span className="font-bold">RET. ISLR ({ticket.porcentajeIslr}%):</span>
                          <span className="font-black">-{ticket.islrRetenido.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                        
                        {ticket.sustraendo > 0 && (
                          <div className="flex justify-between text-[7px] text-slate-500 pl-1 font-sans">
                            <span>Sustraendo UT:</span>
                            <span>-{ticket.sustraendo.toFixed(2)} Bs.</span>
                          </div>
                        )}
                      </div>

                      {/* TOTAL A PAGAR HIGHLIGHT */}
                      <div className="bg-slate-100 text-black p-1 border border-black rounded mt-1">
                        <div className="flex justify-between items-center font-black text-[9px] md:text-[11px] uppercase">
                          <span>TOTAL A PAGAR:</span>
                          <span className="font-mono">{ticket.totalAPagar.toLocaleString('es-VE', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                    </div>

                  </div>

                  {/* Nota section at the very bottom */}
                  <div className="border border-black bg-slate-50 p-1 rounded mt-1 shrink-0">
                    <span className="font-black text-[8px] block uppercase text-slate-600 font-mono">
                      NOTA: <span className="font-bold text-black font-sans ml-1 text-[8px]">{(ticket.nota && ticket.nota !== 'NINGUNA' && ticket.nota !== 'NINGUNO') ? ticket.nota : ''}</span>
                    </span>
                  </div>

                </div>
              )}

            </div>
          );
        })}
      </div>
    ));
  })()}

</div>

      {/* ESTILOS DE IMPRESIÓN FORZADOS PARA TAMAÑO CARTA Y GRID */}
      <style>{`
        @media print {
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            height: auto !important;
            width: 21.59cm !important; /* Ancho físico exacto de hoja Carta */
            overflow: visible !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-tickets-sheet, #printable-tickets-sheet * {
            visibility: visible !important;
          }
          #printable-tickets-sheet {
            position: absolute !important;
            left: 0px !important;
            top: 0px !important;
            width: 21.59cm !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 8mm 6mm !important; /* Márgenes para no quedar al ras */
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          
          /* AGRUPACIÓN DE 2 EN 2 */
          .print-grid-2col {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            column-gap: 5mm !important;
            row-gap: 8mm !important;
            width: 100% !important;
          }

          .print-grid-large {
            display: flex !important;
            flex-direction: column !important;
            gap: 12mm !important;
            width: 100% !important;
          }

          /* TAMAÑOS FISICOS DE LOS TICKETS */
          .ticket-print-small {
            width: 10.20cm !important;
            height: 4.23cm !important;
            display: inline-block !important;
            box-sizing: border-box !important;
            border: 2px solid black !important;
          }
          
          .ticket-print-large {
            width: 100% !important; /* Se ajusta de forma exacta al ancho de la hoja */
            max-width: 20.00cm !important; /* Limite físico para que entre holgado */
            height: 10.00cm !important;
            display: block !important;
            margin-left: auto !important;
            margin-right: auto !important;
            box-sizing: border-box !important;
            border: 2px solid black !important;
          }

          .print-page {
            page-break-after: always !important;
            break-after: page !important;
          }
          .print-page:last-child {
            page-break-after: avoid !important;
            break-after: avoid !important;
          }

          .break-inside-avoid {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
}
