import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Search, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Printer, 
  FileSpreadsheet, 
  X, 
  User, 
  Truck, 
  Calendar,
  AlertCircle,
  CheckCircle,
  Building2,
  FileText,
  MousePointerClick,
  Database,
  Copy
} from 'lucide-react';
import { supabase } from '../supabase';

interface Company {
  rif: string;
  razonSocial: string;
  estado: 'Yaracuy' | 'Lara' | 'Valencia';
  direccion: string;
  telefono: string;
  actividadCompetente?: string;
  suggestedAction?: string;
}

interface SelectedStop {
  id: string;
  company: Company;
  actionType: string;
  observation: string;
  priority: 'Alta' | 'Media' | 'Baja';
}

const PRESET_COMPANIES: Company[] = [];

export function DireccionesTab() {
  const [selectedState, setSelectedState] = useState<'Yaracuy' | 'Lara' | 'Valencia' | null>(null);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom Company Form inside Modal State
  const [addNewCustomMode, setAddNewCustomMode] = useState(false);
  const [customRif, setCustomRif] = useState('');
  const [customName, setCustomName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customTelefono, setCustomTelefono] = useState('');
  const [customEstado, setCustomEstado] = useState<'Yaracuy' | 'Lara' | 'Valencia'>('Yaracuy');
  const [isSavingCustom, setIsSavingCustom] = useState(false);
  const [customSaveError, setCustomSaveError] = useState<string | null>(null);
  const [customSaveSuccess, setCustomSaveSuccess] = useState(false);

  // Driver details state
  const [driverName, setDriverName] = useState('JOHONNY AMARO');
  const [vehiclePlate, setVehiclePlate] = useState('A80-AJ0R');
  const [routeDate, setRouteDate] = useState(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // Supabase dynamic companies state
  const [customCompanies, setCustomCompanies] = useState<Company[]>([]);
  const [supabaseStatus, setSupabaseStatus] = useState<{ configured: boolean; testSuccess: boolean; error: string | null; details: string; supabaseUrl: string | null; provisionSql: string } | null>(null);
  const [showSqlGuide, setShowSqlGuide] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const fetchSupabaseStatus = () => {
    fetch('/api/supabase/status')
      .then(res => res.json())
      .then(data => setSupabaseStatus(data))
      .catch(err => console.error("Error al consultar estado de Supabase desde DireccionesTab:", err));
  };

  const fetchCustomCompanies = async () => {
    // Intentar consultar directamente Supabase desde el cliente (ideal para hosting estático como Netlify o CloudPages)
    const hasClientKeys = (import.meta as any).env?.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
    if (hasClientKeys && supabase) {
      try {
        const { data, error } = await supabase
          .from("empresas_ruta")
          .select("*")
          .order("created_at", { ascending: false });

        if (!error && data) {
          const mapped = data.map((row: any) => ({
            rif: row.rif,
            razonSocial: row.nombre || row.razon_social || row.razonSocial || "EMPRESA SIN NOMBRE",
            estado: row.estado || "Yaracuy",
            direccion: row.direccion || "SIN DIRECCIÓN REGISTRADA",
            telefono: row.telefono || "SIN TELÉFONO",
            actividadCompetente: row.actividad_competente || row.actividadCompetente || "Trámites generales",
            suggestedAction: row.suggested_action || row.suggestedAction || "Gestión General de Trámites"
          }));
          
          setCustomCompanies(mapped);
          return;
        } else if (error) {
          console.warn("Error consultando Supabase directamente en cliente:", error.message || error);
        }
      } catch (err) {
        console.warn("Excepción al conectar directamente con Supabase:", err);
      }
    }

    // Fallback a API local /api/empresas
    fetch('/api/empresas')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // Normalize state naming safely so they fit standard cases
          const normalized = data.map((item: any) => {
            let estVal = item.estado || 'Yaracuy';
            const lowerEst = estVal.trim().toLowerCase();
            if (lowerEst === 'yaracuy') estVal = 'Yaracuy';
            else if (lowerEst === 'lara') estVal = 'Lara';
            else if (lowerEst === 'valencia') estVal = 'Valencia';
            
            return {
              ...item,
              estado: estVal
            };
          });
          setCustomCompanies(normalized);
        }
      })
      .catch(err => console.error("Error al cargar empresas sincronizadas de Supabase:", err));
  };

  useEffect(() => {
    fetchCustomCompanies();
    fetchSupabaseStatus();
  }, []);

  const allCompanies = customCompanies;

  // Live accumulated Route Stops
  const [routeStops, setRouteStops] = useState<SelectedStop[]>(() => {
    const saved = localStorage.getItem('bananera_driver_route');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  // Save stops to localStorage
  useEffect(() => {
    localStorage.setItem('bananera_driver_route', JSON.stringify(routeStops));
  }, [routeStops]);

  // Filter local presets based on search query with case-insensitivity
  const filteredPresets = allCompanies.filter(c => {
    if (selectedState) {
      const cEst = (c.estado || '').trim().toLowerCase();
      const sEst = selectedState.trim().toLowerCase();
      if (cEst !== sEst) return false;
    }
    if (!searchQuery.trim()) return true;
    
    const q = searchQuery.toLowerCase().trim();
    const nameMatch = (c.razonSocial || '').toLowerCase().includes(q);
    const rifMatch = (c.rif || '').toLowerCase().includes(q);
    return nameMatch || rifMatch;
  });

  // Action to add a company to the route list
  const handleAddCompany = (company: Company) => {
    const alreadyExists = routeStops.some(s => s.company.rif === company.rif);
    if (alreadyExists) {
      alert(`La empresa con RIF ${company.rif} ya está agregada a la lista de ruta.`);
      return;
    }

    const newStop: SelectedStop = {
      id: `stop-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      company,
      actionType: company.suggestedAction ? 'Buscar/Retirar' : 'Entregar/Despachar',
      observation: company.suggestedAction || 'Retirar encomienda o tramitar firmas correspondientes.',
      priority: 'Media'
    };

    setRouteStops(prev => [...prev, newStop]);
    setShowSearchModal(false);
    setSearchQuery('');
  };

  // Add custom company to list & Sync to Supabase
  const handleAddCustomCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRif.trim() || !customName.trim() || !customAddress.trim() || !customTelefono.trim()) {
      setCustomSaveError('Por favor complete todos los datos para la empresa personalizada, incluyendo el número de teléfono.');
      return;
    }

    // Set saving states
    setIsSavingCustom(true);
    setCustomSaveError(null);
    setCustomSaveSuccess(false);

    // Rough RIF validate format J-12345678-9
    let formattedRif = customRif.trim().toUpperCase();
    if (!formattedRif.includes('-')) {
      // attempt formatting if they input pure numbers
      const numOnly = formattedRif.replace(/[^0-9]/g, '');
      if (numOnly.length >= 9) {
        formattedRif = `J-${numOnly.substring(0, 8)}-${numOnly.substring(8, 9)}`;
      }
    }

    const customCompany: Company = {
      rif: formattedRif,
      razonSocial: customName.trim().toUpperCase(),
      estado: customEstado,
      direccion: customAddress.trim().toUpperCase(),
      telefono: customTelefono.trim(),
      suggestedAction: 'Gestión General de Trámites'
    };

    // Save to database
    const handleSuccess = () => {
      // Refresh the database list
      fetchCustomCompanies();

      // Add company to active route stops
      handleAddCompany(customCompany);

      setCustomSaveSuccess(true);
      setIsSavingCustom(false);

      // reset custom format inputs
      setCustomRif('');
      setCustomName('');
      setCustomAddress('');
      setCustomTelefono('');

      // Auto-leave custom mode with smooth transition delay
      setTimeout(() => {
        setCustomSaveSuccess(false);
        setAddNewCustomMode(false);
      }, 1500);
    };

    const tryClientSideSupabaseSave = async () => {
      const hasClientKeys = (import.meta as any).env?.SUPABASE_URL || (import.meta as any).env?.VITE_SUPABASE_URL;
      if (hasClientKeys && supabase) {
        try {
          const { error } = await supabase
            .from("empresas_ruta")
            .upsert({
              rif: customCompany.rif,
              nombre: customCompany.razonSocial,
              telefono: customCompany.telefono || "",
              direccion: customCompany.direccion,
              estado: customCompany.estado || "Yaracuy",
              actividad_competente: "Trámites aduaneros",
              suggested_action: "Gestión Gener de Trámites"
            }, { onConflict: "rif" });

          if (!error) {
            console.log("Compañía guardada con éxito directamente en Supabase (cliente)");
            handleSuccess();
            return true;
          } else {
            console.warn("Fallo guardado directo Supabase:", error.message || error);
          }
        } catch (err) {
          console.warn("Excepción guardando directo en Supabase:", err);
        }
      }
      return false;
    };

    const performSave = async () => {
      const savedDirectly = await tryClientSideSupabaseSave();
      if (savedDirectly) return;

      // Fallback a API local
      fetch('/api/empresas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customCompany)
      })
      .then(async (res) => {
        const resJson = await res.json();
        if (!res.ok || resJson.success === false) {
          throw new Error(resJson.message || 'Error al registrar la empresa en el servidor.');
        }
        return resJson;
      })
      .then((data) => {
        console.log("Compañía guardada con éxito vía API local:", data);
        handleSuccess();
      })
      .catch(err => {
        console.error("Error al registrar la empresa:", err);
        setCustomSaveError(`Error de sincronización con base de datos: ${err.message || err}`);
        setIsSavingCustom(false);
      });
    };

    performSave();
  };

  // Move stops up & down
  const moveStop = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === routeStops.length - 1) return;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...routeStops];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setRouteStops(updated);
  };

  // Delete stop from list
  const handleDeleteStop = (id: string) => {
    setRouteStops(prev => prev.filter(s => s.id !== id));
  };

  // Update stop observation or type dynamically in table
  const handleUpdateStopValue = (id: string, field: keyof SelectedStop, value: any) => {
    setRouteStops(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, [field]: value };
      }
      return s;
    }));
  };

  // Clear entire route sequence
  const handleClearRoute = () => {
    if (window.confirm('¿Está seguro de vaciar la hoja de ruta actual de todos los despachos?')) {
      setRouteStops([]);
    }
  };

  // Generation utilizing styled HTML Table parsed natively by Excel (No corruption warnings)
  const handleExportToExcel = () => {
    if (routeStops.length === 0) {
      alert('La lista de ruta está vacía. Agregue destinos antes de exportar.');
      return;
    }

    let htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Hoja de Ruta</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; font-family: 'Segoe UI', Arial, sans-serif; width: 100%; }
          th { background-color: #001e40; color: #ffffff; font-weight: bold; border: 1px solid #94a3b8; padding: 10px; text-transform: uppercase; font-size: 11px; text-align: center; }
          td { border: 1px solid #cbd5e1; padding: 8px; font-size: 11px; vertical-align: middle; }
          .title-row { background-color: #001937; color: #ffffff; font-size: 15px; font-weight: bold; text-align: center; padding: 12px; }
          .meta-label { background-color: #f1f5f9; color: #334155; font-weight: bold; font-size: 10px; text-transform: uppercase; border: 1px solid #cbd5e1; }
          .meta-value { font-weight: bold; font-size: 10px; border: 1px solid #cbd5e1; }
          .center { text-align: center; }
          .left { text-align: left; }
          .bold { font-weight: bold; }
          .priority-high { color: #b91c1c; background-color: #fef2f2; font-weight: bold; text-align: center; }
          .priority-medium { color: #b45309; background-color: #fffbeb; font-weight: bold; text-align: center; }
          .priority-low { color: #334155; background-color: #f8fafc; text-align: center; }
        </style>
      </head>
      <body>
        <table>
          <tr>
            <td colspan="6" class="title-row">HOJA DE RUTA Y DESPACHO PARA CH&Oacute;FER - C.A. BANANERA VENEZOLANA</td>
          </tr>
          <tr><td colspan="6" style="height:10px; border:none;"></td></tr>
          <tr>
            <td class="meta-label">CH&Oacute;FER CONDUC.:</td>
            <td colspan="1" class="meta-value">${driverName.toUpperCase()}</td>
            <td class="meta-label">VEH&Iacute;CULO / PLACAS:</td>
            <td class="meta-value">${vehiclePlate.toUpperCase()}</td>
            <td class="meta-label">FECHA SALIDA:</td>
            <td class="meta-value">${routeDate}</td>
          </tr>
          <tr>
            <td class="meta-label">ESTADO FILTRADO:</td>
            <td colspan="5" class="meta-value">${(selectedState || 'TODOS LOS ESTADOS').toUpperCase()}</td>
          </tr>
          <tr><td colspan="6" style="height:15px; border:none;"></td></tr>
          <thead>
            <tr>
              <th>N&deg;</th>
              <th>EMPRESA / DESTINO</th>
              <th>DIRECCI&Oacute;N DE VISITA</th>
              <th>TEL&Eacute;FONO</th>
              <th>INSTRUCCIONES / OBSERVACI&Oacute;N DEL DESPACHO</th>
              <th>PRIORIDAD</th>
            </tr>
          </thead>
          <tbody>
    `;

    routeStops.forEach((stop, index) => {
      let priorityClass = 'priority-low';
      if (stop.priority === 'Alta') priorityClass = 'priority-high';
      else if (stop.priority === 'Media') priorityClass = 'priority-medium';

      htmlContent += `
        <tr>
          <td class="center bold">${index + 1}</td>
          <td class="left bold">${stop.company.razonSocial}</td>
          <td class="left">${stop.company.direccion}</td>
          <td class="center" style="font-family: monospace;">${stop.company.telefono || 'N/A'}</td>
          <td class="left">${stop.observation || 'Tr&aacute;mite asignado por departamento.'}</td>
          <td class="${priorityClass}">${stop.priority.toUpperCase()}</td>
        </tr>
      `;
    });

    htmlContent += `
          </tbody>
        </table>
        
        <br/><br/><br/>
        
        <table style="width: 100%; border: none;">
          <tr style="border: none;">
            <td style="border: none; width: 5%;"></td>
            <td style="border: none; text-align: center; border-top: 1px solid #475569; width: 40%; padding-top: 8px;">
               <font size="2"><b>JEFE DE COMPRAS</b></font><br/>
               <font size="1" color="#64748b">C.A. BANANERA VENEZOLANA</font>
            </td>
            <td style="border: none; width: 10%;"></td>
            <td style="border: none; text-align: center; border-top: 1px solid #475569; width: 40%; padding-top: 8px;">
               <font size="2"><b>${driverName.toUpperCase()}</b></font><br/>
               <font size="1" color="#64748b">VEH&Iacute;CULO: ${vehiclePlate.toUpperCase()}</font>
            </td>
            <td style="border: none; width: 5%;"></td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hoja_ruta_chofer_${routeDate}_${driverName.replace(/\s+/g, '_')}.xls`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Printing simply executes native print
  const handlePrint = () => {
    if (routeStops.length === 0) {
      alert('La lista de ruta está vacía. Agregue destinos antes de intentar imprimir.');
      return;
    }
    window.print();
  };

  return (
    <div className="w-full max-w-[1240px] mx-auto space-y-6">
      
      {/* 1. DISPATCH CONTROLS & HEADER (no-print) */}
      <div className="no-print bg-white border border-slate-200 shadow-xs p-6 rounded-none space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 border border-emerald-300 bg-emerald-50 text-emerald-800 text-[9px] font-black uppercase tracking-wider rounded-xs">
                MÓDULO DE DISTRIBUCIÓN
              </span>
              <span className="p-1 px-2 border border-slate-300 bg-slate-50 text-slate-800 text-[9px] font-black uppercase tracking-wider rounded-xs font-mono">
                V2.1 - ESTABLE
              </span>
            </div>
            <h1 className="text-xl font-sans font-black tracking-tight text-slate-900 uppercase">
              Direcciones y Hojas de Ruta para Chófer
            </h1>
            <p className="text-xs text-slate-500 leading-normal">
              Organice los fletes, retiros, entregas y trámites ante aduanas y empresas asociadas en la región centro-occidente de Venezuela.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            {routeStops.length > 0 && (
              <button
                type="button"
                onClick={handleClearRoute}
                className="bg-red-50 text-red-700 hover:bg-red-100 border border-red-300 font-bold px-4 py-2 text-[10px] uppercase tracking-wider select-none outline-none transition-all w-full sm:w-auto"
              >
                Vaciar Lista
              </button>
            )}
            
            <button
              type="button"
              onClick={handlePrint}
              disabled={routeStops.length === 0}
              className={`flex items-center justify-center gap-2 font-bold px-5 py-2 text-[10px] uppercase tracking-wider transition-all select-none w-full sm:w-auto ${
                routeStops.length > 0
                  ? 'bg-slate-900 text-white hover:bg-slate-800 border border-slate-900 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" /> Imprimir Hoja (.pdf)
            </button>
            
            <button
              type="button"
              onClick={handleExportToExcel}
              disabled={routeStops.length === 0}
              className={`flex items-center justify-center gap-2 font-bold px-5 py-2 text-[10px] uppercase tracking-wider transition-all select-none w-full sm:w-auto ${
                routeStops.length > 0
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700 border border-emerald-600 cursor-pointer'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-white" /> Exportar a Excel (.xls)
            </button>
          </div>
        </div>

        {/* Selección de estado y metatabla (no-print) */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          
          {/* Selector de estado destino */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wide">
              1. Seleccione el Estado Destino:
            </label>
            <div className="grid grid-cols-3 gap-1">
              {(['Yaracuy', 'Lara', 'Valencia'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setSelectedState(st);
                  }}
                  className={`py-2 text-[10px] font-black uppercase tracking-wider border rounded-none transition-all ${
                    selectedState === st
                      ? 'bg-emerald-50 text-[#1b6d24] border-[#1b6d24] shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <MapPin className={`w-3 h-3 inline-block -mt-0.5 mr-1 ${selectedState === st ? 'text-[#1b6d24]' : 'text-slate-400'}`} />
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* DRIVER INPUTS */}
          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wide">
              2. Nombre del Chófer:
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Nombre del conductor"
                value={driverName}
                onChange={(e) => setDriverName(e.target.value)}
                className="w-full text-xs font-bold pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-900 font-sans uppercase rounded-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wide">
              3. Vehículo y Placas:
            </label>
            <div className="relative">
              <Truck className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Ej. IVECO A55BC3"
                value={vehiclePlate}
                onChange={(e) => setVehiclePlate(e.target.value)}
                className="w-full text-xs font-bold pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-900 font-sans uppercase rounded-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[10px] font-black uppercase text-slate-600 tracking-wide">
              4. Fecha del Recorrido:
            </label>
            <div className="relative">
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
                className="w-full text-xs font-bold pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 focus:outline-none focus:border-slate-900 font-mono rounded-none"
              />
            </div>
          </div>

        </div>

        {/* Panel de búsqueda y selección de empresas */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 bg-slate-50/50 -mx-6 -mb-6 p-6">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
              {selectedState 
                ? `Estado activo: ${selectedState} (${allCompanies.filter(c => c.estado === selectedState).length} empresas disponibles)`
                : 'Seleccione un estado de arriba para habilitar el portal de búsqueda'
              }
            </span>
          </div>

          <button
            type="button"
            disabled={!selectedState}
            onClick={() => setShowSearchModal(true)}
            className={`flex items-center gap-2 font-bold px-6 py-2.5 text-[11px] uppercase tracking-wider transition-all select-none rounded-none shadow-sm ${
              selectedState
                ? 'bg-indigo-600 text-white hover:bg-indigo-700 border border-indigo-600 cursor-pointer animate-pulse'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            <Search className="w-3.5 h-3.5" /> Buscar Empresa en {selectedState || 'Filtro'}
          </button>
        </div>
      </div>

      {/* 2. LIVE ACCUMULATING ROUTE TABLE (no-print) */}
      <div className="no-print bg-white border border-slate-200 shadow-xs p-6 rounded-none space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <span className="font-sans font-black text-xs uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
            <Building2 className="w-4 h-4 text-[#1b6d24]" /> Secuencia de Entrega / Ruta en Directo
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 p-1 px-2 transition-colors">
            TOTAL DESTINOS: {routeStops.length}
          </span>
        </div>

        {routeStops.length === 0 ? (
          /* Empty state placeholder */
          <div className="border-2 border-dashed border-slate-200 rounded-lg py-12 flex flex-col items-center justify-center text-center px-4">
            <span className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 mb-4 animate-bounce">
              <MapPin className="w-6 h-6 text-slate-300" />
            </span>
            <p className="font-sans font-black text-xs text-slate-800 uppercase tracking-widest">
              No hay destinos en la hoja de ruta
            </p>
            <p className="text-[10.5px] text-slate-500 max-w-md mt-1 mb-5">
              Primero elija un estado en la sección superior, presione el botón de buscar y agregue los puntos de visita que recorrerá el conductor.
            </p>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setSelectedState('Yaracuy'); }}
                className="bg-white border border-slate-200 hover:border-slate-400 px-3 py-1.5 text-[10px] uppercase font-bold text-slate-600 tracking-wider transition-all"
              >
                Probar con Yaracuy
              </button>
              <button
                type="button"
                onClick={() => { setSelectedState('Lara'); }}
                className="bg-white border border-slate-200 hover:border-slate-400 px-3 py-1.5 text-[10px] uppercase font-bold text-slate-600 tracking-wider transition-all"
              >
                Probar con Lara
              </button>
            </div>
          </div>
        ) : (
          /* Route table content */
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs border-collapse border border-slate-200">
              <thead>
                <tr className="bg-slate-900 text-white uppercase text-[10px] font-mono tracking-wider">
                  <th className="p-3 border border-slate-800 text-center w-12">N°</th>
                  <th className="p-3 border border-slate-800 w-52">Empresa/Destinatario</th>
                  <th className="p-3 border border-slate-800 w-64">Dirección Fiscal / Sede</th>
                  <th className="p-3 border border-slate-800 w-36">TELÉFONO</th>
                  <th className="p-3 border border-slate-800 min-w-[350px]">Directiva / Nota chofer</th>
                  <th className="p-3 border border-slate-800 w-28 text-center">Prioridad</th>
                  <th className="p-3 border border-slate-800 text-center w-28">Orden/Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {routeStops.map((stop, index) => (
                  <tr key={stop.id} className="hover:bg-slate-50/50 transition-colors">
                    
                    {/* Index */}
                    <td className="p-2 border border-slate-100 text-center font-bold text-slate-600 font-mono">
                      {index + 1}
                    </td>

                    {/* Razon Social */}
                    <td className="p-2 border border-slate-100">
                      <div className="font-extrabold text-[#001e40] uppercase tracking-wide text-[10px]">
                        {stop.company.razonSocial}
                      </div>
                      <div className="text-[8px] text-emerald-700 font-black uppercase tracking-tight mt-0.5">
                        {stop.company.estado || 'Otro'}
                      </div>
                    </td>

                    {/* Address */}
                    <td className="p-2 border border-slate-100 text-[10px] text-slate-500 leading-normal max-w-[200px] truncate" title={stop.company.direccion}>
                      {stop.company.direccion}
                    </td>

                    {/* Teléfono */}
                    <td className="p-2 border border-slate-100 font-mono font-bold text-[10px] text-slate-700 bg-slate-50">
                      {stop.company.telefono || 'N/A'}
                    </td>

                    {/* Observation textarea - spacious, customizable height for comfortable note writing */}
                    <td className="p-2 border border-slate-100">
                      <textarea
                        rows={2}
                        value={stop.observation}
                        onChange={(e) => handleUpdateStopValue(stop.id, 'observation', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 text-[10.5px] p-2 text-slate-700 focus:outline-none focus:bg-white focus:border-slate-900 rounded-none placeholder:text-slate-300 font-sans leading-relaxed resize-y min-h-[50px]"
                        placeholder="Ej. Preguntar por el encargado en despacho..."
                      />
                    </td>

                    {/* Priority select */}
                    <td className="p-2 border border-slate-100 text-center">
                      <select
                        value={stop.priority}
                        onChange={(e) => handleUpdateStopValue(stop.id, 'priority', e.target.value as any)}
                        className={`font-mono text-[9px] font-black uppercase p-1 w-full border ${
                          stop.priority === 'Alta'
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : stop.priority === 'Media'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        } focus:outline-none`}
                      >
                        <option value="Alta">🔴 ALTA</option>
                        <option value="Media">🟡 MEDIA</option>
                        <option value="Baja">🔵 BAJA</option>
                      </select>
                    </td>

                    {/* Reordering & Deleting buttons */}
                    <td className="p-2 border border-slate-100 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          type="button"
                          onClick={() => moveStop(index, 'up')}
                          disabled={index === 0}
                          title="Subir de posición en ruta"
                          className="p-1 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs"
                        >
                          <ArrowUp className="w-3 h-3 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveStop(index, 'down')}
                          disabled={index === routeStops.length - 1}
                          title="Bajar de posición en ruta"
                          className="p-1 border border-slate-200 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent rounded-xs"
                        >
                          <ArrowDown className="w-3 h-3 text-slate-600" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStop(stop.id)}
                          title="Eliminar de la ruta"
                          className="p-1 border border-red-100 hover:bg-red-50 hover:border-red-300 rounded-xs transition-colors ml-1"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 3. VERTICAL PRINTABLE PAGE (Visible only during PRINT mode) */}
      <div className="print-only tracking-tight font-sans text-xs bg-white text-black p-4 max-w-3xl mx-auto space-y-6">
        
        {/* Print Header */}
        <div className="border-b-2 border-black pb-4 text-center relative">
          <div className="text-right text-[8px] font-mono absolute right-0 top-0 uppercase">
            RUTA DPTO. COMPRAS
          </div>
          
          <h2 className="text-sm font-sans font-black tracking-widest uppercase">
            C.A. BANANERA VENEZOLANA
          </h2>
          <h1 className="text-base font-sans font-black tracking-tight uppercase mt-0.5 border-t border-black pt-1">
            HOJA DE RUTA Y DESPACHO PARA CHÓFER
          </h1>
          <p className="text-[9px] font-serif font-bold italic text-slate-500 mt-1">
            Yaracuy, Lara y Valencia
          </p>
        </div>

        {/* Metadatos Imprimibles */}
        <div className="grid grid-cols-2 gap-4 border border-black p-3 bg-slate-50/20 text-[10px]">
          <div className="space-y-1.5 uppercase leading-normal">
            <div><b>Chófer Asignado:</b> {driverName || 'SIN NOMBRE'}</div>
            <div><b>Vehículo Comercial & Patente:</b> {vehiclePlate || 'SIN CONTROL'}</div>
            <div><b>Filtro de Estado Regional:</b> {selectedState || 'GENERAL'}</div>
          </div>
          <div className="space-y-1.5 uppercase leading-normal text-right">
            <div><b>Fecha de Recorrido:</b> {routeDate}</div>
            <div><b>Estatus Logístico:</b> ACTIVO DEPARTAMENTO COMPRAS</div>
            <div><b>Total Destinos:</b> {routeStops.length} Destinos</div>
          </div>
        </div>

        {/* Tabla Imprimible */}
        <div className="pt-2">
          <table className="w-full text-left text-[9px] border-collapse border border-black">
            <thead>
              <tr className="bg-slate-100 text-black uppercase font-bold border-b border-black text-[8px]">
                <th className="p-2 border border-black text-center w-8">N°</th>
                <th className="p-2 border border-black w-44">Empresa / Sede</th>
                <th className="p-2 border border-black w-52">Dirección Fiscal / Sede</th>
                <th className="p-2 border border-black w-28">TELÉFONO</th>
                <th className="p-2 border border-black font-semibold">Observaciones al Conductor</th>
                <th className="p-2 border border-black text-center w-16 font-semibold">Prioridad</th>
              </tr>
            </thead>
            <tbody>
              {routeStops.map((stop, index) => (
                <tr key={stop.id} className="border-b border-black">
                  <td className="p-2 border border-black text-center font-bold">
                    {index + 1}
                  </td>
                  <td className="p-2 border border-black font-bold uppercase text-[8.5px]">
                    {stop.company.razonSocial}
                  </td>
                  <td className="p-2 border border-black leading-tight">
                    {stop.company.direccion}
                  </td>
                  <td className="p-2 border border-black font-mono">
                    {stop.company.telefono || 'N/A'}
                  </td>
                  <td className="p-2 border border-black text-slate-800 leading-tight">
                    {stop.observation || 'Trámite habitual de transporte.'}
                  </td>
                  <td className="p-2 border border-black text-center font-bold font-mono">
                    {stop.priority.toUpperCase()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Firmas en fondo de página */}
        <div className="pt-16 grid grid-cols-2 gap-12 text-center text-[10px]">
          <div>
            <div className="border-t border-black w-48 mx-auto pt-1 font-bold">
              JEFE DE COMPRAS
            </div>
            <div className="text-[8px] text-slate-500 uppercase mt-0.5">
              C.A. BANANERA VENEZOLANA
            </div>
          </div>
          
          <div>
            <div className="border-t border-black w-48 mx-auto pt-1 font-bold">
              {driverName || 'CHÓFER'}
            </div>
            <div className="text-[8px] text-slate-500 uppercase mt-0.5">
              VEHÍCULO: {vehiclePlate || 'N/A'}
            </div>
          </div>
        </div>

      </div>

      {/* 4. MODAL DE BUSCADOR EMERGENTE (no-print) */}
      {showSearchModal && (
        <div className="no-print fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-none shadow-2xl border border-slate-300 max-w-2xl w-full overflow-hidden transform transition-all duration-200">
            
            {/* Modal Header */}
            <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
              <span className="font-sans font-black uppercase text-xs tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#a3f69c]" /> Buscar Destinatario ({selectedState})
              </span>
              <button 
                onClick={() => {
                  setShowSearchModal(false);
                  setAddNewCustomMode(false);
                  setSearchQuery('');
                }}
                className="text-slate-400 hover:text-white font-bold text-lg select-none outline-none focus:outline-none"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              
              {/* Tabs inside search modal for Presets vs Add Custom */}
              <div className="flex border-b border-slate-200">
                <button
                  type="button"
                  onClick={() => setAddNewCustomMode(false)}
                  className={`py-2 px-4 text-xs font-bold uppercase transition-all border-b-2 ${
                    !addNewCustomMode
                      ? 'border-indigo-600 text-indigo-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  🏢 Catálogo de Empresas Pre-cargadas
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddNewCustomMode(true);
                    setCustomEstado(selectedState || 'Yaracuy');
                    setCustomSaveError(null);
                    setCustomSaveSuccess(false);
                  }}
                  className={`py-2 px-4 text-xs font-bold uppercase transition-all border-b-2 ${
                    addNewCustomMode
                      ? 'border-indigo-600 text-indigo-600 font-black'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  ➕ Agregar Destino Personalizado
                </button>
              </div>

              {!addNewCustomMode ? (
                /* Preset Search Directory */
                <>
                  <p className="text-[10.5px] text-slate-500 leading-normal font-sans">
                    Filtre de forma dinámica todas las sedes fiscales y empresas aliadas registradas de <b>{selectedState}</b>. Busque escribiendo el número de RIF, actividad o razón societaria:
                  </p>

                  {/* Search Bar at the Top (As explicitly requested!) */}
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="ESCRIBA EL RIF (EJ. J-32456789-0), NOMBRE O DIRECCIÓN DE EMPRESA..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-xs font-mono font-bold pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600 uppercase rounded-none placeholder:text-slate-400"
                      autoFocus
                    />
                  </div>

                  {/* Filter Results Directory List */}
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1 border border-slate-100 p-1 bg-slate-50/50">
                    {filteredPresets.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        No se encontraron empresas precargadas con ese RIF o Nombre en <b>{selectedState}</b>.
                        <button
                          type="button"
                          onClick={() => {
                            setAddNewCustomMode(true);
                            setCustomEstado(selectedState || 'Yaracuy');
                            setCustomSaveError(null);
                            setCustomSaveSuccess(false);
                          }}
                          className="block mx-auto mt-2 text-indigo-600 hover:underline font-bold font-sans uppercase text-[10px]"
                        >
                          Haga clic aquí para agregarlo de forma manual
                        </button>
                      </div>
                    ) : (
                      filteredPresets.map((company) => {
                        const isAlreadySelected = routeStops.some(s => s.company.rif === company.rif);
                        return (
                          <div 
                            key={company.rif}
                            className={`flex justify-between items-center bg-white border p-3 rounded-none transition-all ${
                              isAlreadySelected 
                                ? 'border-emerald-200 bg-emerald-50/30'
                                : 'border-slate-200 hover:border-slate-400'
                            }`}
                          >
                            <div className="space-y-1 pr-4">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] bg-slate-100 text-slate-800 font-mono font-bold px-1.5 py-0.5 border border-slate-300">
                                  {company.rif}
                                </span>
                                <span className="font-sans font-black text-slate-900 text-[10.5px] uppercase tracking-wide">
                                  {company.razonSocial}
                                </span>
                              </div>
                              <div className="text-[9.5px] text-slate-500 font-sans leading-normal">
                                📍 {company.direccion}
                              </div>
                              {company.actividadCompetente && (
                                <div className="text-[8.5px] text-slate-400 font-mono">
                                  COMPETENCIA: {company.actividadCompetente.toUpperCase()}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={isAlreadySelected}
                              onClick={() => handleAddCompany(company)}
                              className={`flex items-center gap-1 px-3 py-1.5 rounded-none font-bold text-[9.5px] uppercase tracking-wider transition-all cursor-pointer ${
                                isAlreadySelected
                                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
                              }`}
                            >
                              {isAlreadySelected ? (
                                <>Añadido ✔</>
                              ) : (
                                <>
                                  <Plus className="w-3.5 h-3.5" /> Seleccionar
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              ) : (
                /* Add Custom Company Form */
                <form onSubmit={handleAddCustomCompanySubmit} className="space-y-4">
                  <p className="text-[10.5px] text-slate-500 leading-normal font-sans">
                    Ingrese los datos específicos del destino en caso de que sea una empresa o cobro fuera del catálogo oficial. Se registrará de inmediato en la base de datos centralizada y se asignará al chofer.
                  </p>

                  {/* Feedback Messages */}
                  {customSaveSuccess && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] p-3 rounded-none font-bold flex items-center gap-2">
                      <span className="p-1 bg-emerald-600 text-white font-black text-[9px] rounded-full w-4 h-4 flex items-center justify-center">✔</span>
                      <span>¡Empresa registrada con éxito y añadida a la ruta!</span>
                    </div>
                  )}

                  {customSaveError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-[11px]/relaxed p-3 rounded-none font-medium flex items-start gap-2">
                      <span className="text-red-600 mt-0.5 shrink-0">🛑</span>
                      <div>
                        <p className="font-bold">Error de Registro:</p>
                        <p className="text-[10px] mt-0.5">{customSaveError}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black uppercase text-slate-600 tracking-wide">
                        RIF de la Empresa:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: J-12345678-0"
                        value={customRif}
                        onChange={(e) => setCustomRif(e.target.value)}
                        className="w-full text-xs font-mono font-bold px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600 uppercase rounded-none"
                        required
                        disabled={isSavingCustom || customSaveSuccess}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black uppercase text-slate-600 tracking-wide">
                        Razón Social / Nombre:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: AGRICOLA LAS MERCEDES, C.A."
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full text-xs font-sans font-bold px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600 uppercase rounded-none"
                        required
                        disabled={isSavingCustom || customSaveSuccess}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[9.5px] font-black uppercase text-slate-600 tracking-wide">
                        TELÉFONO:
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 0414-1234567"
                        value={customTelefono}
                        onChange={(e) => setCustomTelefono(e.target.value)}
                        className="w-full text-xs font-sans font-bold px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600 uppercase rounded-none"
                        required
                        disabled={isSavingCustom || customSaveSuccess}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="sm:col-span-1 space-y-1">
                      <label className="block text-[9.5px] font-black uppercase text-slate-600 tracking-wide">
                        Estado de Destino:
                      </label>
                      <select
                        value={customEstado}
                        onChange={(e) => setCustomEstado(e.target.value as any)}
                        className="w-full text-xs font-sans font-black px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600 uppercase rounded-none cursor-pointer"
                        disabled={isSavingCustom || customSaveSuccess}
                        required
                      >
                        <option value="Yaracuy">Yaracuy</option>
                        <option value="Lara">Lara</option>
                        <option value="Valencia">Valencia (Carabobo)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2 space-y-1">
                      <label className="block text-[9.5px] font-black uppercase text-slate-600 tracking-wide">
                        Dirección Completa de Despacho / Visita:
                      </label>
                      <textarea
                        placeholder="Ej: Vía Carretera Panamericana, Galpón N° 14, Chivacoa, Yaracuy"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        rows={2}
                        className="w-full text-xs font-sans font-medium px-3 py-2 bg-slate-50 border border-slate-300 focus:outline-none focus:bg-white focus:border-indigo-600 uppercase rounded-none resize-none"
                        required
                        disabled={isSavingCustom || customSaveSuccess}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setAddNewCustomMode(false)}
                      className="bg-slate-100 hover:bg-slate-200 border border-slate-200 font-bold px-4 py-2 text-[10px] uppercase tracking-wider rounded-none transition-all text-slate-700"
                      disabled={isSavingCustom || customSaveSuccess}
                    >
                      Volver al Catálogo
                    </button>
                    <button
                      type="submit"
                      className="bg-[#1b6d24] text-white hover:bg-[#15561a] disabled:bg-slate-400 font-bold px-5 py-2 text-[10px] uppercase tracking-wider rounded-none transition-all shadow-xs flex items-center gap-1.5"
                      disabled={isSavingCustom || customSaveSuccess}
                    >
                      {isSavingCustom ? (
                        <>
                          <span className="animate-spin inline-block w-3 h-3 border-2 border-white border-t-transparent rounded-full" />
                          <span>REGISTRANDO, POR FAVOR ESPERE...</span>
                        </>
                      ) : customSaveSuccess ? (
                        <>
                          <span>✔ REGISTRADO Y AÑADIDO</span>
                        </>
                      ) : (
                        <>Crear y Añadir a Ruta</>
                      )}
                    </button>
                  </div>
                </form>
              )}

            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setShowSearchModal(false);
                  setAddNewCustomMode(false);
                  setSearchQuery('');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-black px-5 py-2 text-[10px] uppercase tracking-wider transition-all border border-slate-900 rounded-none"
              >
                Cerrar Ventana
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
