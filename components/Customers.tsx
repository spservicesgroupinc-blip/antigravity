
import React, { useState, useEffect } from 'react';
import { Plus, Archive, Phone, Mail, MapPin, ArrowLeft, Send, MessageSquare, Calendar, Pencil, History, User, Loader2 } from 'lucide-react';
import { CalculatorState, CustomerProfile, EstimateRecord, CommunicationLogEntry } from '../types';
import { sendWelcomeEmail } from '../services/emailApi';

interface CustomersProps {
  state: CalculatorState;
  viewingCustomerId: string | null;
  onSelectCustomer: (id: string | null) => void;
  onSaveCustomer: (customer: CustomerProfile) => Promise<void>; 
  onArchiveCustomer: (id: string) => void;
  onStartEstimate: (customer: CustomerProfile) => void;
  onLoadEstimate: (est: EstimateRecord) => void;
  autoOpen?: boolean;
  onAutoOpenComplete?: () => void;
}

export const Customers: React.FC<CustomersProps> = ({
  state,
  viewingCustomerId,
  onSelectCustomer,
  onSaveCustomer,
  onArchiveCustomer,
  onStartEstimate,
  onLoadEstimate,
  autoOpen,
  onAutoOpenComplete
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<CustomerProfile>({
    id: '', name: '', address: '', city: '', state: '', zip: '', email: '', phone: '', notes: '', logs: [], status: 'Active'
  });
  
  const [newNote, setNewNote] = useState('');

  useEffect(() => {
    if (autoOpen) {
      handleOpenModal();
      if (onAutoOpenComplete) onAutoOpenComplete();
    }
  }, [autoOpen]);

  const handleOpenModal = (customer?: CustomerProfile) => {
    if (customer) {
      setFormData(customer);
    } else {
      setFormData({ 
        id: Math.random().toString(36).substr(2, 9), 
        name: '', address: '', city: '', state: '', zip: '', email: '', phone: '', notes: '', logs: [], status: 'Active' 
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return alert('Name is required');
    
    // Check if this is truly a new customer ID before saving
    const isNewCustomer = !state.customers.find(c => c.id === formData.id);
    
    setIsSaving(true);
    
    // OPTIMISTIC UI: Close immediately, process in background
    setIsModalOpen(false); 
    
    try {
        // 1. Save to Database (this updates state locally and triggers sync)
        const dbPromise = onSaveCustomer(formData);
        
        // 2. Email Service (Fire and Forget)
        // ONLY if it's a new customer record to prevent duplicate emails on edits
        if (isNewCustomer && formData.email) {
            console.log("New Customer detected. Triggering Welcome Email...");
            // Do NOT await this, let it run in background
            sendWelcomeEmail(formData.email, formData.name)
                .then(res => console.log("Email Result:", res))
                .catch(err => console.error("Email Service Failed:", err));
        }

        // We only await the DB save to ensure data integrity
        await dbPromise;

    } catch (e) {
        console.error("Error saving customer:", e);
        alert("Saved locally, but sync failed. Check connection.");
    } finally {
        setIsSaving(false);
    }
  };

  const handleCallCustomer = (customer: CustomerProfile) => {
      if (!customer.phone) return alert("No phone number listed.");
      window.location.href = `tel:${customer.phone}`;
      
      const logEntry: CommunicationLogEntry = {
          id: Math.random().toString(36).substr(2,9),
          date: new Date().toISOString(),
          type: 'Call',
          content: 'Outgoing call initiated.'
      };
      
      const updatedCustomer = {
          ...customer,
          logs: [logEntry, ...(customer.logs || [])]
      };
      onSaveCustomer(updatedCustomer);
  };

  const handleAddNote = (customer: CustomerProfile) => {
      if (!newNote.trim()) return;
      
      const logEntry: CommunicationLogEntry = {
          id: Math.random().toString(36).substr(2,9),
          date: new Date().toISOString(),
          type: 'Note',
          content: newNote
      };

      const updatedCustomer = {
          ...customer,
          logs: [logEntry, ...(customer.logs || [])]
      };
      onSaveCustomer(updatedCustomer);
      setNewNote('');
  };

  if (viewingCustomerId) {
    const customer = state.customers.find(c => c.id === viewingCustomerId);
    if (!customer) return <div>Customer not found.</div>;
    const customerEstimates = state.savedEstimates.filter(e => e.customerId === customer.id || e.customer?.id === customer.id);
    const sortedLogs = [...(customer.logs || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return (
        <div className="space-y-6 animate-in fade-in zoom-in duration-200 pb-20">
             <button onClick={() => onSelectCustomer(null)} className="text-slate-400 hover:text-slate-900 flex items-center gap-2 mb-4 text-[10px] font-black uppercase tracking-widest transition-colors"> <ArrowLeft className="w-4 h-4" /> Back to Lead List </button>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* LEFT: Profile & Quick Actions */}
                <div className="space-y-6">
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">{customer.name}</h2>
                            <div className="space-y-3 mb-8">
                                {customer.phone && (
                                    <div className="flex items-center gap-3 text-slate-600 font-bold bg-slate-50 p-3 rounded-xl">
                                        <Phone className="w-5 h-5 text-brand"/> {customer.phone}
                                    </div>
                                )}
                                {customer.email && (
                                    <div className="flex items-center gap-3 text-slate-600 font-bold bg-slate-50 p-3 rounded-xl">
                                        <Mail className="w-5 h-5 text-brand"/> {customer.email}
                                    </div>
                                )}
                                {customer.address && (
                                    <div className="flex items-center gap-3 text-slate-600 font-bold bg-slate-50 p-3 rounded-xl">
                                        <MapPin className="w-5 h-5 text-brand"/> {customer.address}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-3">
                                {customer.phone && (
                                    <button 
                                        onClick={() => handleCallCustomer(customer)}
                                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                                    >
                                        <Phone className="w-5 h-5" /> Call Customer
                                    </button>
                                )}
                                <div className="flex gap-3">
                                    <button onClick={() => onStartEstimate(customer)} className="flex-1 bg-slate-900 text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 shadow-lg shadow-slate-200 transition-all">Start Estimate</button>
                                    <button onClick={() => handleOpenModal(customer)} className="px-4 border-2 border-slate-100 rounded-2xl text-slate-400 hover:text-brand hover:border-brand transition-colors"><Pencil className="w-5 h-5"/></button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Customer Stats */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm grid grid-cols-2 gap-4">
                        <div className="text-center p-4 bg-slate-50 rounded-2xl">
                            <div className="text-2xl font-black text-slate-900">{customerEstimates.length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Estimates</div>
                        </div>
                        <div className="text-center p-4 bg-slate-50 rounded-2xl">
                            <div className="text-2xl font-black text-slate-900">{customerEstimates.filter(e => e.status === 'Paid').length}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Completed Jobs</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Communication Log */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
                    <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                        <h3 className="font-black text-slate-900 uppercase text-xs tracking-widest flex items-center gap-2">
                            <History className="w-4 h-4 text-brand"/> Communication Log
                        </h3>
                    </div>
                    
                    <div className="p-4 bg-slate-50 border-b border-slate-100">
                        <div className="relative">
                            <textarea 
                                className="w-full p-4 pr-12 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-brand outline-none resize-none h-24"
                                placeholder="Log a call, note, or update..."
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                            />
                            <button 
                                onClick={() => handleAddNote(customer)}
                                className="absolute bottom-3 right-3 p-2 bg-brand text-white rounded-lg hover:bg-brand-hover shadow-md transition-all active:scale-90"
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {sortedLogs.length === 0 ? (
                            <div className="text-center text-slate-400 italic text-sm mt-10">No communication history yet.</div>
                        ) : (
                            sortedLogs.map((log) => (
                                <div key={log.id} className="flex gap-4 group">
                                    <div className={`mt-1 flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                                        log.type === 'Call' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 
                                        'bg-slate-50 border-slate-200 text-slate-400'
                                    }`}>
                                        {log.type === 'Call' ? <Phone className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${
                                                log.type === 'Call' ? 'text-emerald-600' : 'text-slate-500'
                                            }`}>{log.type}</span>
                                            <span className="text-[10px] font-bold text-slate-300">
                                                {new Date(log.date).toLocaleDateString()} {new Date(log.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                        <div className="bg-slate-50 p-3 rounded-xl rounded-tl-none border border-slate-100 text-sm font-medium text-slate-700">
                                            {log.content}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

             </div>
            
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mt-6">
                <div className="p-6 border-b border-slate-100 bg-slate-50 font-black uppercase text-[10px] tracking-widest text-slate-400">Project History</div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-300 uppercase tracking-widest border-b"><tr><th className="px-6 py-5">Date</th><th className="px-6 py-5">Status</th><th className="px-6 py-5">Quote</th><th className="px-6 py-5 text-right">Action</th></tr></thead>
                    <tbody>
                        {customerEstimates.map(est => (
                            <tr key={est.id} className="hover:bg-slate-50 border-b last:border-0 cursor-pointer transition-colors" onClick={() => onLoadEstimate(est)}>
                                <td className="px-6 py-5 font-bold text-slate-800">{new Date(est.date).toLocaleDateString()}</td>
                                <td className="px-6 py-5"> <span className="bg-slate-100 px-3 py-1 rounded-full text-[10px] font-black text-slate-600 uppercase tracking-tighter">{est.status}</span> </td>
                                <td className="px-6 py-5 font-mono font-black text-slate-900">${est.totalValue?.toLocaleString() || 0}</td>
                                <td className="px-6 py-5 text-right text-brand font-black uppercase text-[10px] tracking-widest">Open Quote</td>
                            </tr>
                        ))}
                        {customerEstimates.length === 0 && <tr><td colSpan={4} className="p-12 text-center text-slate-300 italic">No project history found for this lead.</td></tr>}
                    </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">
                            {formData.id && state.customers.find(c => c.id === formData.id) ? 'Edit Profile' : 'New Customer'}
                        </h3>
                        <div className="space-y-5">
                            <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Full Name</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus /> </div>
                            <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Address</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /> </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">City</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> </div>
                                <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">State</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /> </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Zip</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} /> </div>
                                <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Phone</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /> </div>
                            </div>

                            <div> 
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Email Address</label> 
                                <input 
                                    type="email" 
                                    className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})} 
                                    placeholder="client@example.com"
                                /> 
                                <p className="text-[9px] text-brand font-bold mt-1.5 ml-1 flex items-center gap-1">
                                    <Mail className="w-3 h-3" /> Sends automatic 'Thank You' email on save
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-6">
                            <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="flex-1 p-4 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="flex-1 p-4 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-hover shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save Profile'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
  }

  // List View
  return (
    <div className="space-y-6 animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-end">
            <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Customer Database</h2>
                <p className="text-slate-500 font-medium text-sm">CRM & History Management</p>
            </div>
            <button onClick={() => handleOpenModal()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"> <Plus className="w-4 h-4" /> Add Lead </button>
        </div>
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest"><tr><th className="px-6 py-5">Client Name</th><th className="px-6 py-5">Contact</th><th className="px-6 py-5">Job History</th><th className="px-6 py-5 text-right">Action</th></tr></thead>
                <tbody className="divide-y divide-slate-100">
                    {state.customers.filter(c => c.status !== 'Archived').length === 0 ? (<tr><td colSpan={4} className="p-12 text-center text-slate-300 italic">No customers active.</td></tr>) : (
                        state.customers.filter(c => c.status !== 'Archived').map(c => {
                            const jobCount = state.savedEstimates.filter(e => e.customerId === c.id || e.customer?.id === c.id).length;
                            return (
                                <tr 
                                    key={c.id} 
                                    className="hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => onSelectCustomer(c.id)}
                                >
                                    <td className="px-6 py-5 font-bold text-slate-800 group-hover:text-brand transition-colors">{c.name}</td>
                                    <td className="px-6 py-5 text-xs text-slate-500">{c.phone || c.email || 'No contact info'}</td>
                                    <td className="px-6 py-5"> <span className="bg-slate-100 px-2 py-1 rounded text-[10px] font-black text-slate-600 uppercase tracking-tighter">{jobCount} Projects</span> </td>
                                    <td className="px-6 py-5 text-right flex justify-end gap-2">
                                        <button className="text-xs font-black text-brand uppercase tracking-widest p-2 hover:bg-red-50 rounded-lg">Details</button>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onArchiveCustomer(c.id); }} 
                                            className="p-2 text-slate-200 hover:text-slate-400 z-10"
                                        >
                                            <Archive className="w-4 h-4"/>
                                        </button>
                                    </td>
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
                    <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-8">
                        {formData.id && state.customers.find(c => c.id === formData.id) ? 'Edit Profile' : 'New Customer'}
                    </h3>
                    <div className="space-y-5">
                        <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Full Name</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} autoFocus /> </div>
                        <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Address</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /> </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">City</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /> </div>
                            <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">State</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.state} onChange={e => setFormData({...formData, state: e.target.value})} /> </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Zip</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} /> </div>
                            <div> <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Phone</label> <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /> </div>
                        </div>

                        <div> 
                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 ml-1 tracking-widest">Email Address</label> 
                            <input 
                                type="email" 
                                className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                                placeholder="client@example.com"
                            /> 
                            <p className="text-[9px] text-brand font-bold mt-1.5 ml-1 flex items-center gap-1">
                                <Mail className="w-3 h-3" /> Sends automatic 'Thank You' email on save
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3 pt-6">
                        <button onClick={() => setIsModalOpen(false)} disabled={isSaving} className="flex-1 p-4 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50 transition-colors">Cancel</button>
                        <button onClick={handleSave} disabled={isSaving} className="flex-1 p-4 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-hover shadow-lg shadow-red-200 transition-all flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Save Profile'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
