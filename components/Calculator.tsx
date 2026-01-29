
import React, { useState } from 'react';
import {
    Building2,
    Box,
    Save,
    CheckCircle2,
    Receipt,
    DollarSign,
    Plus,
    Trash2,
    HardHat,
    ArrowRight,
    Calculator as CalculatorIcon,
    ClipboardList,
    Calendar,
    Pencil,
    Wrench,
    Camera,
    Loader2,
    X,
    FileText
} from 'lucide-react';
import {
    CalculatorState,
    CalculationMode,
    FoamType,
    CalculationResults,
    EstimateRecord,
    JobImage,
    AreaType,
    AdditionalArea
} from '../types';
import { JobProgress } from './JobProgress';
import { uploadImage } from '../services/api';
import { compressImage } from '../utils/imageHelpers';

interface CalculatorProps {
    state: CalculatorState;
    results: CalculationResults;
    editingEstimateId: string | null;
    onInputChange: (field: keyof CalculatorState, value: any) => void;
    onSettingsChange: (category: 'wallSettings' | 'roofSettings', field: string, value: any) => void;
    onCustomerSelect: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onInventoryUpdate: (id: string, field: string, value: any) => void;
    onAddInventory: () => void;
    onRemoveInventory: (id: string) => void;
    onSaveEstimate: (status?: EstimateRecord['status']) => void;
    onGeneratePDF: () => void;
    onStageWorkOrder: () => void;
    onStageInvoice: () => void;
    onAddNewCustomer: () => void;
    onMarkPaid?: (id: string) => void;
    onCreateWarehouseItem?: (name: string, unit: string, cost: number) => void;
}

export const Calculator: React.FC<CalculatorProps> = ({
    state,
    results,
    editingEstimateId,
    onInputChange,
    onSettingsChange,
    onCustomerSelect,
    onInventoryUpdate,
    onAddInventory,
    onRemoveInventory,
    onSaveEstimate,
    onGeneratePDF,
    onStageWorkOrder,
    onStageInvoice,
    onAddNewCustomer,
    onMarkPaid,
    onCreateWarehouseItem
}) => {

    const currentRecord = editingEstimateId ? state.savedEstimates.find(e => e.id === editingEstimateId) : null;
    const currentStatus = currentRecord?.status || 'Draft';
    const isJobCompleted = currentRecord?.executionStatus === 'Completed';
    const [uploadQueue, setUploadQueue] = useState<number>(0);
    const [showModal, setShowModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', unit: 'Unit', cost: 0, itemId: '' });

    const activeScheduledDate = currentRecord?.scheduledDate || state.scheduledDate;

    // Helper to pre-fill inventory from warehouse OR Create New
    const handleWarehouseSelect = (itemId: string, warehouseItemId: string) => {
        if (warehouseItemId === 'create_new') {
            setNewItem({ name: '', unit: 'Unit', cost: 0, itemId: itemId });
            setShowModal(true);
        } else {
            const warehouseItem = state.warehouse.items.find(w => w.id === warehouseItemId);
            if (warehouseItem) {
                onInventoryUpdate(itemId, 'name', warehouseItem.name);
                onInventoryUpdate(itemId, 'unit', warehouseItem.unit);
                onInventoryUpdate(itemId, 'unitCost', warehouseItem.unitCost);
            }
        }
    };

    const handleCreateConfirm = () => {
        if (!newItem.name) return;
        if (onCreateWarehouseItem) {
            onCreateWarehouseItem(newItem.name, newItem.unit, newItem.cost);
            // Auto-fill the item row that triggered this
            if (newItem.itemId) {
                onInventoryUpdate(newItem.itemId, 'name', newItem.name);
                onInventoryUpdate(newItem.itemId, 'unit', newItem.unit);
                onInventoryUpdate(newItem.itemId, 'unitCost', newItem.cost);
            }
        }
        setShowModal(false);
    };

    // Additional Area Helpers
    const addAdditionalArea = () => {
        const newArea: AdditionalArea = {
            id: Math.random().toString(36).substr(2, 9),
            description: '',
            length: 0,
            width: 0,
            type: AreaType.WALL
        };
        onInputChange('additionalAreas', [...(state.additionalAreas || []), newArea]);
    };

    const updateAdditionalArea = (id: string, field: keyof AdditionalArea, value: any) => {
        const updated = (state.additionalAreas || []).map(a => a.id === id ? { ...a, [field]: value } : a);
        onInputChange('additionalAreas', updated);
    };

    const removeAdditionalArea = (id: string) => {
        onInputChange('additionalAreas', (state.additionalAreas || []).filter(a => a.id !== id));
    };

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files) as File[];
        setUploadQueue(prev => prev + files.length);

        const sessionStr = localStorage.getItem('foamProSession');
        const session = sessionStr ? JSON.parse(sessionStr) : null;
        if (!session) return; 

        const refId = editingEstimateId || "New_Estimate";

        for (const file of files) {
            try {
                const compressed = await compressImage(file);
                const url = await uploadImage(compressed, `Site_${refId}_${file.name}`, session.spreadsheetId, session.folderId);
                if (url) {
                    const newImg: JobImage = {
                        id: Math.random().toString(36).substr(2, 9),
                        url: url,
                        uploadedAt: new Date().toISOString(),
                        uploadedBy: session.username,
                        type: 'site_condition'
                    };
                    onInputChange('sitePhotos', [...(state.sitePhotos || []), newImg]);
                }
            } catch (err) {
                console.error(err);
                alert("Failed to upload " + file.name);
            } finally {
                setUploadQueue(prev => prev - 1);
            }
        }
    };

    const getNextStep = () => {
        // Workflow Change: Drafts go to Review/Detail view first (to allow Emailing), not straight to Work Order
        if (currentStatus === 'Draft') return { 
            label: 'Finalize & Review', 
            icon: FileText, 
            action: () => onSaveEstimate(), // Saves as Draft and redirects to Detail View
            style: 'bg-slate-900 text-white shadow-slate-200' 
        };
        if (currentStatus === 'Work Order' && !activeScheduledDate) return { label: 'Schedule Job', icon: Calendar, action: onStageWorkOrder, style: 'bg-amber-500 text-white shadow-amber-200' };
        if (currentStatus === 'Work Order' && activeScheduledDate) return { label: 'Generate Invoice', icon: Receipt, action: onStageInvoice, style: 'bg-emerald-600 text-white shadow-emerald-200' };
        if (currentStatus === 'Invoiced') return { label: 'Record Payment', icon: CheckCircle2, action: onStageInvoice, style: 'bg-slate-900 text-white shadow-slate-200' };
        return null;
    };

    const nextStep = getNextStep();

    return (
        <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in zoom-in duration-200 pb-24">

            {/* Workflow Stepper */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                            <CalculatorIcon className="w-6 h-6 text-brand" />
                            {editingEstimateId ? 'Job Manager' : 'New Estimate'}
                        </h2>
                        <p className="text-slate-500 font-medium text-sm">Follow the workflow to manage this job.</p>
                    </div>
                    <div className="text-right hidden md:block">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1">Current Status</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest inline-block ${currentStatus === 'Draft' ? 'bg-slate-100 text-slate-500' :
                            currentStatus === 'Work Order' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-600'
                            }`}>
                            {currentStatus}
                        </span>
                    </div>
                </div>

                <div className="mb-8 md:px-8">
                    <JobProgress status={currentStatus} scheduledDate={activeScheduledDate} />

                    {nextStep && (
                        <div className="mt-6 flex justify-center animate-in slide-in-from-top-2 duration-500">
                            <button
                                onClick={nextStep.action}
                                className={`flex items-center gap-2 px-8 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-lg transition-all transform hover:scale-105 active:scale-95 ${nextStep.style} hover:opacity-90`}
                            >
                                {nextStep.label} <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>

                {/* Customer & Mode Selectors */}
                <div className="flex flex-col md:flex-row gap-4 border-t border-slate-100 pt-6">
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Customer / Lead</label>
                        <div className="flex gap-2">
                            <select
                                className="flex-1 bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-brand"
                                value={state.customerProfile.id || 'new'}
                                onChange={onCustomerSelect}
                            >
                                <option value="new">+ Create New Customer</option>
                                {state.customers.filter(c => c.status !== 'Archived').map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            {(!state.customerProfile.id || state.customerProfile.id === 'new') && (
                                <button onClick={onAddNewCustomer} className="bg-slate-900 text-white p-3 rounded-xl hover:bg-slate-800 transition-colors">
                                    <Plus className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex-1">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Calculation Mode</label>
                        <select
                            value={state.mode}
                            onChange={(e) => onInputChange('mode', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-900 text-sm rounded-xl p-3 font-bold outline-none focus:ring-2 focus:ring-brand"
                        >
                            <option value={CalculationMode.BUILDING}>Full Building (Walls + Roof)</option>
                            <option value={CalculationMode.WALLS_ONLY}>Walls Only (Linear Ft)</option>
                            <option value={CalculationMode.FLAT_AREA}>Flat Area (Attic/Slab)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Crew Report Banner */}
            {isJobCompleted && currentRecord && currentStatus !== 'Paid' && (
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-3xl animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-4">
                        <div className="bg-white p-3 rounded-full shadow-sm text-emerald-600"><CheckCircle2 className="w-6 h-6" /></div>
                        <div className="flex-1">
                            <h3 className="text-emerald-900 font-black uppercase text-sm tracking-widest mb-1">Job Completed by Crew</h3>
                            <p className="text-emerald-700 text-sm font-medium mb-4">
                                The crew has finalized this work order. Review actual usage before generating the invoice.
                            </p>
                            <button onClick={onStageInvoice} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 shadow-lg shadow-emerald-200 flex items-center gap-2">
                                <ClipboardList className="w-4 h-4" /> Review Actuals & Create Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESULTS CARD */}
            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Spray Area</div>
                        <div className="text-3xl font-black">{Math.round(results.totalWallArea + results.totalRoofArea).toLocaleString()} <span className="text-sm text-slate-500 font-bold">sqft</span></div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Total Volume</div>
                        <div className="text-3xl font-black">{Math.round(results.wallBdFt + results.roofBdFt).toLocaleString()} <span className="text-sm text-slate-500 font-bold">bdft</span></div>
                    </div>
                    <div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Chemical Sets</div>
                        <div className="text-lg font-bold">
                            {results.openCellSets > 0 && <div className="text-brand-yellow">{results.openCellSets.toFixed(2)} OC</div>}
                            {results.closedCellSets > 0 && <div className="text-white">{results.closedCellSets.toFixed(2)} CC</div>}
                            {results.openCellSets === 0 && results.closedCellSets === 0 && <span className="text-slate-600">-</span>}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">
                            {state.pricingMode === 'sqft_pricing' ? 'SqFt Quote Total' : 'Total Estimate'}
                        </div>
                        <div className="text-3xl font-black text-brand">${Math.round(results.totalCost).toLocaleString()}</div>

                        <div className="mt-2">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500">Est. Material Cost</div>
                            <div className="text-sm font-bold text-slate-300">${Math.round(results.materialCost).toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Form Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* DIMENSIONS */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-sm tracking-widest">
                        <Building2 className="w-5 h-5 text-brand" /> Building Dimensions
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        {state.mode !== CalculationMode.FLAT_AREA && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Length (ft)</label>
                                <input type="number" value={state.length} onChange={(e) => onInputChange('length', parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none" />
                            </div>
                        )}
                        {state.mode === CalculationMode.BUILDING && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Width (ft)</label>
                                <input type="number" value={state.width} onChange={(e) => onInputChange('width', parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none" />
                            </div>
                        )}
                        {state.mode !== CalculationMode.FLAT_AREA && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Wall Height (ft)</label>
                                <input type="number" value={state.wallHeight} onChange={(e) => onInputChange('wallHeight', parseFloat(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none" />
                            </div>
                        )}
                        {state.mode === CalculationMode.BUILDING && (
                            <div className="col-span-2 md:col-span-1">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Roof Pitch (X/12)</label>
                                <input type="text" value={state.roofPitch} onChange={(e) => onInputChange('roofPitch', e.target.value)} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none" />
                            </div>
                        )}
                    </div>

                    {/* Toggles */}
                    <div className="mt-4 flex flex-col md:flex-row md:items-center justify-start gap-6 border-t border-slate-100 pt-4">
                        {state.mode === CalculationMode.BUILDING && (
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="gables"
                                    checked={state.includeGables}
                                    onChange={(e) => onInputChange('includeGables', e.target.checked)}
                                    className="w-5 h-5 text-brand rounded focus:ring-brand border-slate-300"
                                />
                                <label htmlFor="gables" className="text-sm font-bold text-slate-700">Include Gable Ends?</label>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="metal"
                                checked={state.isMetalSurface}
                                onChange={(e) => onInputChange('isMetalSurface', e.target.checked)}
                                className="w-5 h-5 text-brand rounded focus:ring-brand border-slate-300"
                            />
                            <label htmlFor="metal" className="text-sm font-bold text-slate-700">Spraying to Metal? (+15%)</label>
                        </div>
                    </div>

                    {/* Additional Areas / Sections */}
                    <div className="mt-6 pt-6 border-t border-slate-100">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center gap-2">
                                <Plus className="w-4 h-4 text-slate-400" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Additional Areas</span>
                            </div>
                            <button
                                onClick={addAdditionalArea}
                                className="text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <Plus className="w-3 h-3" /> Add Section
                            </button>
                        </div>

                        <div className="space-y-3">
                            {(!state.additionalAreas || state.additionalAreas.length === 0) && (
                                <div className="text-center py-4 text-slate-300 text-xs italic border-2 border-dashed border-slate-100 rounded-xl">
                                    No additional areas added.
                                </div>
                            )}
                            {state.additionalAreas && state.additionalAreas.map(area => (
                                <div key={area.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100 animate-in fade-in slide-in-from-top-1">
                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Description (e.g. Bump Out)"
                                                value={area.description || ''}
                                                onChange={(e) => updateAdditionalArea(area.id, 'description', e.target.value)}
                                                className="flex-1 p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-brand"
                                            />
                                            <select
                                                value={area.type}
                                                onChange={(e) => updateAdditionalArea(area.id, 'type', e.target.value)}
                                                className="p-2 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none text-slate-600"
                                            >
                                                <option value={AreaType.WALL}>Wall (LxH)</option>
                                                <option value={AreaType.ROOF}>Roof (LxW)</option>
                                            </select>
                                            <button onClick={() => removeAdditionalArea(area.id)} className="p-2 text-slate-300 hover:text-red-500 bg-white border border-slate-200 rounded-lg transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="relative">
                                                <label className="absolute left-3 top-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">Length</label>
                                                <input
                                                    type="number"
                                                    value={area.length || ''}
                                                    onChange={(e) => updateAdditionalArea(area.id, 'length', parseFloat(e.target.value))}
                                                    className="w-full pt-5 pb-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="relative">
                                                <label className="absolute left-3 top-2 text-[8px] font-black text-slate-400 uppercase tracking-wider">{area.type === AreaType.WALL ? 'Height' : 'Width'}</label>
                                                <input
                                                    type="number"
                                                    value={area.width || ''}
                                                    onChange={(e) => updateAdditionalArea(area.id, 'width', parseFloat(e.target.value))}
                                                    className="w-full pt-5 pb-2 px-3 bg-white border border-slate-200 rounded-lg text-sm font-bold outline-none focus:ring-2 focus:ring-brand"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Specs */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-widest">
                            <HardHat className="w-5 h-5 text-brand" /> Insulation Specs
                        </h3>
                        {/* Pricing Mode Toggle */}
                        <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                            <button onClick={() => onInputChange('pricingMode', 'level_pricing')} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${state.pricingMode === 'level_pricing' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}>Cost Plus</button>
                            <button onClick={() => onInputChange('pricingMode', 'sqft_pricing')} className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-wider transition-all ${state.pricingMode === 'sqft_pricing' ? 'bg-white shadow-sm text-brand' : 'text-slate-400 hover:text-slate-600'}`}>SqFt Price</button>
                        </div>
                    </div>
                    {/* Spec Fields */}
                    <div className="space-y-6">
                        {state.mode !== CalculationMode.FLAT_AREA && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-3">
                                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">Walls</span>
                                    <span className="text-xs font-black text-sky-600 bg-white border border-sky-100 px-2 py-1 rounded shadow-sm">Total: {Math.round(results.totalWallArea).toLocaleString()} sqft</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <select value={state.wallSettings.type} onChange={(e) => onSettingsChange('wallSettings', 'type', e.target.value)} className="col-span-2 bg-white border border-slate-200 p-2 rounded-lg font-bold text-sm"><option value={FoamType.OPEN_CELL}>Open Cell</option><option value={FoamType.CLOSED_CELL}>Closed Cell</option></select>
                                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Depth (in)</label><input type="number" value={state.wallSettings.thickness} onChange={(e) => onSettingsChange('wallSettings', 'thickness', parseFloat(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-sm" /></div>
                                    <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Waste %</label><input type="number" value={state.wallSettings.wastePercentage} onChange={(e) => onSettingsChange('wallSettings', 'wastePercentage', parseFloat(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-sm" /></div>

                                    {state.pricingMode === 'sqft_pricing' && (
                                        <div className="col-span-2">
                                            <label className="text-[9px] font-bold text-brand uppercase block mb-1">Price / SqFt ($)</label>
                                            <div className="relative">
                                                <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                                <input
                                                    type="number"
                                                    value={state.sqFtRates.wall}
                                                    onChange={(e) => onInputChange('sqFtRates', { ...state.sqFtRates, wall: parseFloat(e.target.value) || 0 })}
                                                    className="w-full pl-6 p-2 bg-white border border-brand/30 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-brand outline-none"
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs font-black uppercase tracking-widest text-slate-500">Roof</span>
                                <span className="text-xs font-black text-sky-600 bg-white border border-sky-100 px-2 py-1 rounded shadow-sm">Total: {Math.round(results.totalRoofArea).toLocaleString()} sqft</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <select value={state.roofSettings.type} onChange={(e) => onSettingsChange('roofSettings', 'type', e.target.value)} className="col-span-2 bg-white border border-slate-200 p-2 rounded-lg font-bold text-sm"><option value={FoamType.OPEN_CELL}>Open Cell</option><option value={FoamType.CLOSED_CELL}>Closed Cell</option></select>
                                <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Depth (in)</label><input type="number" value={state.roofSettings.thickness} onChange={(e) => onSettingsChange('roofSettings', 'thickness', parseFloat(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-sm" /></div>
                                <div><label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Waste %</label><input type="number" value={state.roofSettings.wastePercentage} onChange={(e) => onSettingsChange('roofSettings', 'wastePercentage', parseFloat(e.target.value))} className="w-full p-2 bg-white border border-slate-200 rounded-lg font-bold text-sm" /></div>

                                {state.pricingMode === 'sqft_pricing' && (
                                    <div className="col-span-2">
                                        <label className="text-[9px] font-bold text-brand uppercase block mb-1">Price / SqFt ($)</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2.5 text-slate-400 font-bold">$</span>
                                            <input
                                                type="number"
                                                value={state.sqFtRates.roof}
                                                onChange={(e) => onInputChange('sqFtRates', { ...state.sqFtRates, roof: parseFloat(e.target.value) || 0 })}
                                                className="w-full pl-6 p-2 bg-white border border-brand/30 rounded-lg font-bold text-sm text-slate-900 focus:ring-2 focus:ring-brand outline-none"
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Inventory ONLY */}
                <div className="md:col-span-2">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-widest"><Box className="w-5 h-5 text-brand" /> Prep & Inventory</h3>
                            <button onClick={onAddInventory} className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"><Plus className="w-3 h-3" /> Add Item</button>
                        </div>
                        <div className="space-y-4">
                            {state.inventory.length === 0 ? (<div className="text-center py-6 text-slate-300 text-xs italic border-2 border-dashed border-slate-100 rounded-xl">No extra inventory items added.</div>) : (
                                state.inventory.map(item => (
                                    <div key={item.id} className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <div className="flex flex-col gap-2">
                                            <div className="flex gap-2 items-center">
                                                <select className="flex-1 w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold outline-none" onChange={(e) => handleWarehouseSelect(item.id, e.target.value)} defaultValue="">
                                                    <option value="" disabled>Select Item...</option>
                                                    <option value="create_new" className="text-brand font-black">+ Create New</option>
                                                    {state.warehouse.items.map(w => (<option key={w.id} value={w.id}>{w.name}</option>))}
                                                </select>
                                                <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => onInventoryUpdate(item.id, 'quantity', parseFloat(e.target.value))} className="w-20 bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold text-center" />
                                                <button onClick={() => onRemoveInventory(item.id)} className="p-2 text-slate-300 hover:text-red-500 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Labor & Fees */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 md:col-span-2">
                    <h3 className="font-black text-slate-900 mb-6 flex items-center gap-2 uppercase text-sm tracking-widest">
                        <DollarSign className="w-5 h-5 text-brand" /> Labor & Fees
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Est. Man Hours</label>
                            <input type="number" value={state.expenses.manHours} onChange={(e) => onInputChange('expenses', { ...state.expenses, manHours: parseFloat(e.target.value) || 0 })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none" />
                        </div>
                        <div className="col-span-1">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Trip / Fuel ($)</label>
                            <input type="number" value={state.expenses.tripCharge} onChange={(e) => onInputChange('expenses', { ...state.expenses, tripCharge: parseFloat(e.target.value) || 0 })} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none" />
                        </div>
                    </div>
                </div>

                {/* SITE PHOTOS */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200 md:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-black text-slate-900 flex items-center gap-2 uppercase text-sm tracking-widest">
                            <Camera className="w-5 h-5 text-brand" /> Site Photos
                        </h3>
                        <label className="bg-slate-100 hover:bg-slate-200 text-slate-600 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                            {uploadQueue > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                            {uploadQueue > 0 ? 'Uploading...' : 'Add Photos'}
                            <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadQueue > 0} />
                        </label>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        {state.sitePhotos && state.sitePhotos.map((photo, idx) => (
                            <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                                <img src={photo.url} alt="Site Photo" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <button
                                        onClick={() => onInputChange('sitePhotos', state.sitePhotos.filter(p => p.id !== photo.id))}
                                        className="p-2 bg-red-500 rounded-full text-white hover:bg-red-600"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {(!state.sitePhotos || state.sitePhotos.length === 0) && (
                            <div className="col-span-2 md:col-span-6 p-8 text-center text-slate-400 italic bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                No site photos uploaded.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* ACTION BAR */}
            <div className="md:col-span-2 flex flex-col md:flex-row gap-4 pt-6 border-t border-slate-200 pb-12">
                <button onClick={() => onSaveEstimate()} disabled={uploadQueue > 0} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-70">
                    <Save className="w-4 h-4" /> Save / Update
                </button>

                {/* Conditional Workflow Buttons */}
                {currentStatus === 'Paid' ? (
                    <div className="flex-1 bg-emerald-100 text-emerald-700 p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-200">
                        <CheckCircle2 className="w-4 h-4" /> Paid in Full
                    </div>
                ) : currentStatus === 'Invoiced' ? (
                    <button onClick={onStageInvoice} className="flex-1 bg-sky-600 hover:bg-sky-700 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-sky-200">
                        <Receipt className="w-4 h-4" /> View / Manage Invoice
                    </button>
                ) : currentStatus === 'Work Order' ? (
                    <div className="flex-1 flex gap-2">
                        {!activeScheduledDate ? (
                            <button onClick={onStageWorkOrder} className="flex-1 bg-amber-500 hover:bg-amber-600 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-amber-200">
                                <Calendar className="w-4 h-4" /> Schedule Job
                            </button>
                        ) : (
                            <button onClick={onStageWorkOrder} className="flex-1 bg-white border-2 border-slate-100 hover:bg-slate-50 text-slate-500 p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2">
                                <Pencil className="w-4 h-4" /> Edit Work Order
                            </button>
                        )}
                        <button onClick={onStageInvoice} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-emerald-200">
                            <ClipboardList className="w-4 h-4" /> Finalize & Invoice
                        </button>
                    </div>
                ) : (
                    // Default Action for Draft (matches getNextStep logic)
                    <button onClick={() => onSaveEstimate()} className="flex-1 bg-brand hover:bg-brand-hover text-white p-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-red-200">
                        <FileText className="w-4 h-4" /> Review & Finalize <ArrowRight className="w-4 h-4" />
                    </button>
                )}
            </div>
            
            {/* Modal for New Inventory Item */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-black text-slate-900 uppercase tracking-widest text-lg">Create New Item</h3>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-400" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Item Name</label>
                                <input
                                    autoFocus
                                    type="text"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none"
                                    placeholder="e.g. Poly Plastic (20x100)"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Unit</label>
                                    <input
                                        type="text"
                                        value={newItem.unit}
                                        onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none"
                                        placeholder="Roll, Box, etc"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Cost ($)</label>
                                    <input
                                        type="number"
                                        value={newItem.cost}
                                        onChange={(e) => setNewItem({ ...newItem, cost: parseFloat(e.target.value) || 0 })}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-brand outline-none"
                                        placeholder="0.00"
                                    />
                                </div>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button onClick={() => setShowModal(false)} className="flex-1 p-3 font-bold text-slate-500 hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button onClick={handleCreateConfirm} className="flex-1 p-3 bg-brand text-white font-black uppercase tracking-widest rounded-xl shadow-lg shadow-red-200 hover:bg-brand-hover">Create Item</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
