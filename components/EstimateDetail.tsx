
import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Pencil, 
  FileText, 
  HardHat, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  Receipt, 
  User, 
  Phone,
  DollarSign,
  Image as ImageIcon,
  Mail,
  Loader2,
  Send,
  ArrowRight
} from 'lucide-react';
import { EstimateRecord, CalculationResults, CalculatorState } from '../types';
import { buildDocumentPDF } from '../utils/pdfGenerator';
import { sendDocumentEmail } from '../services/emailApi';

interface EstimateDetailProps {
  state: CalculatorState;
  record: EstimateRecord;
  results: CalculationResults;
  onBack: () => void;
  onEdit: () => void;
  onGeneratePDF: () => void;
  onSold: () => void;
  onInvoice: () => void;
}

export const EstimateDetail: React.FC<EstimateDetailProps> = ({ 
  state,
  record, 
  results, 
  onBack, 
  onEdit, 
  onGeneratePDF,
  onSold,
  onInvoice
}) => {
  const [isEmailing, setIsEmailing] = useState(false);

  const isPaid = record.status === 'Paid';
  const margin = results.totalCost > 0 
    ? ((results.totalCost - (results.materialCost + results.laborCost + results.miscExpenses)) / results.totalCost) * 100 
    : 0;

  const sitePhotos = record.sitePhotos || [];
  const completionPhotos = record.actuals?.completionPhotos || [];

  const handleEmailEstimate = async () => {
      if (!record.customer.email) {
          alert("Customer does not have an email address saved.");
          return;
      }

      if (!confirm(`Send estimate to ${record.customer.email}?`)) return;

      setIsEmailing(true);
      try {
          const { doc, filename } = buildDocumentPDF(
              state, 
              results,
              'ESTIMATE',
              record
          );
          
          const pdfBase64 = doc.output('datauristring');

          const response = await sendDocumentEmail({
              to: record.customer.email,
              subject: `Estimate from ${state.companyProfile.companyName || 'RFE Foam App'}: ${record.customer.name}`,
              body: `Hello ${record.customer.name},\n\nPlease find the attached estimate for your spray foam insulation project.\n\nBest regards,\n${state.companyProfile.companyName || 'The Team'}`,
              attachmentBase64: pdfBase64,
              filename: filename
          });

          if (response.status === 'success') {
              alert("Email sent successfully!");
          } else {
              alert("Failed to send email: " + response.message);
          }

      } catch (e) {
          console.error(e);
          alert("Error generating or sending email.");
      } finally {
          setIsEmailing(false);
      }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in zoom-in duration-200 pb-24">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 text-xs font-black uppercase tracking-widest transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to List
        </button>
        <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${
            record.status === 'Draft' ? 'bg-slate-100 text-slate-500' :
            record.status === 'Work Order' ? 'bg-amber-100 text-amber-700' :
            'bg-emerald-100 text-emerald-700'
        }`}>
            {record.status} #{record.invoiceNumber || record.id.substring(0,6).toUpperCase()}
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100">
          
          {/* Header Section */}
          <div className="bg-slate-900 text-white p-8 md:p-12 relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                  <div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                          <User className="w-3 h-3" /> Customer Profile
                      </div>
                      <h1 className="text-3xl md:text-4xl font-black text-white leading-tight mb-2">
                          {record.customer.name}
                      </h1>
                      <div className="text-slate-400 font-medium flex flex-col gap-1 text-sm">
                          <span className="flex items-center gap-2"><MapPin className="w-3 h-3"/> {record.customer.address}, {record.customer.city}</span>
                          <span className="flex items-center gap-2"><Phone className="w-3 h-3"/> {record.customer.phone}</span>
                      </div>
                  </div>

                  <div className="text-left md:text-right bg-white/5 p-6 rounded-2xl border border-white/10 backdrop-blur-sm">
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Estimate Value</div>
                      <div className="text-4xl font-black text-brand tracking-tight">
                          ${Math.round(results.totalCost).toLocaleString()}
                      </div>
                      <div className="flex items-center gap-2 mt-2 md:justify-end">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${margin > 30 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
                              {margin.toFixed(1)}% Margin
                          </span>
                          <span className="text-xs text-slate-500 font-bold">Est. Profit: ${Math.round(results.totalCost - (results.materialCost + results.laborCost + results.miscExpenses)).toLocaleString()}</span>
                      </div>
                  </div>
              </div>
              
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand rounded-full filter blur-[100px] opacity-10 transform translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
          </div>

          {/* Details Body */}
          <div className="p-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  {/* Scope Summary */}
                  <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <HardHat className="w-4 h-4 text-slate-400" /> Installation Scope
                      </h3>
                      <div className="space-y-3">
                          {results.totalWallArea > 0 && (
                              <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <div>
                                      <span className="block text-sm font-bold text-slate-800">Walls</span>
                                      <span className="text-xs text-slate-500 font-medium">{record.wallSettings.type} @ {record.wallSettings.thickness}"</span>
                                  </div>
                                  <div className="text-right">
                                      <span className="block text-sm font-bold text-slate-800">{Math.round(results.totalWallArea).toLocaleString()} sqft</span>
                                      <span className="text-xs text-slate-500 font-medium">{Math.round(results.wallBdFt).toLocaleString()} bdft</span>
                                  </div>
                              </div>
                          )}
                          {results.totalRoofArea > 0 && (
                              <div className="flex justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                  <div>
                                      <span className="block text-sm font-bold text-slate-800">Roof</span>
                                      <span className="text-xs text-slate-500 font-medium">{record.roofSettings.type} @ {record.roofSettings.thickness}"</span>
                                  </div>
                                  <div className="text-right">
                                      <span className="block text-sm font-bold text-slate-800">{Math.round(results.totalRoofArea).toLocaleString()} sqft</span>
                                      <span className="text-xs text-slate-500 font-medium">{Math.round(results.roofBdFt).toLocaleString()} bdft</span>
                                  </div>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* Financial Breakdown (Simplified) */}
                  <div>
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Receipt className="w-4 h-4 text-slate-400" /> Cost Summary
                      </h3>
                      <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-slate-500">Material Cost</span>
                              <span className="font-bold text-slate-800">${Math.round(results.materialCost).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-medium text-slate-500">Labor & Fees</span>
                              <span className="font-bold text-slate-800">${Math.round(results.laborCost + results.miscExpenses).toLocaleString()}</span>
                          </div>
                          <div className="border-t border-slate-100 my-2"></div>
                          <div className="flex justify-between items-center text-sm">
                              <span className="font-black text-slate-900">Total Estimate</span>
                              <span className="font-black text-brand text-lg">${Math.round(results.totalCost).toLocaleString()}</span>
                          </div>
                      </div>
                  </div>
              </div>

              {/* IMAGE GALLERY */}
              {(sitePhotos.length > 0 || completionPhotos.length > 0) && (
                  <div className="mb-8 pt-8 border-t border-slate-100">
                      <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <ImageIcon className="w-4 h-4 text-slate-400" /> Project Gallery
                      </h3>
                      {sitePhotos.length > 0 && (
                          <div className="mb-6">
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Site / Pre-Job Photos</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {sitePhotos.map((img) => (
                                      <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 group relative shadow-sm hover:shadow-md transition-all">
                                          <img src={img.url} alt="Site Condition" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                      {completionPhotos.length > 0 && (
                          <div>
                              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Completion Photos</h4>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                  {completionPhotos.map((img) => (
                                      <a key={img.id} href={img.url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden border border-slate-200 group relative shadow-sm hover:shadow-md transition-all">
                                          <img src={img.url} alt="Completion" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center p-2">
                                              <span className="text-[9px] text-white font-bold uppercase tracking-widest">View Full</span>
                                          </div>
                                      </a>
                                  ))}
                              </div>
                          </div>
                      )}
                  </div>
              )}

              {/* ACTION BAR */}
              <div className="pt-6 border-t border-slate-100">
                  <div className="flex flex-col md:flex-row gap-4 items-stretch">
                      
                      {/* Left: Edit Actions */}
                      <div className="flex flex-1 gap-2">
                          <button onClick={onEdit} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all uppercase text-xs tracking-widest">
                              <Pencil className="w-4 h-4" /> Edit
                          </button>
                          <button onClick={onGeneratePDF} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-slate-100 font-bold text-slate-600 hover:bg-slate-50 hover:border-slate-200 transition-all uppercase text-xs tracking-widest">
                              <FileText className="w-4 h-4" /> PDF
                          </button>
                      </div>

                      {/* Right: Primary Workflow */}
                      <div className="flex-[2] flex flex-col md:flex-row gap-3">
                          {record.status === 'Draft' && (
                              <>
                                  <button 
                                    onClick={handleEmailEstimate} 
                                    disabled={isEmailing}
                                    className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 font-black transition-all uppercase text-xs tracking-widest"
                                  >
                                      {isEmailing ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4" />}
                                      Email Quote
                                  </button>
                                  <button onClick={onSold} className="flex-[1.5] flex items-center justify-center gap-2 p-4 rounded-xl bg-brand text-white font-black hover:bg-brand-hover transition-all uppercase text-xs tracking-widest shadow-lg shadow-red-100">
                                      Convert to Work Order <ArrowRight className="w-4 h-4" />
                                  </button>
                              </>
                          )}

                          {record.status === 'Work Order' && (
                              <>
                                <button onClick={onSold} className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-amber-500 text-white font-black hover:bg-amber-600 transition-all uppercase text-xs tracking-widest shadow-lg shadow-amber-100">
                                    <Calendar className="w-4 h-4" /> Edit Work Order
                                </button>
                                <button onClick={onInvoice} className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-emerald-600 text-white font-black hover:bg-emerald-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-emerald-200">
                                    <DollarSign className="w-4 h-4" /> Generate Invoice
                                </button>
                              </>
                          )}

                          {(record.status === 'Invoiced' || record.status === 'Paid') && (
                              <button onClick={onInvoice} className="flex-1 flex items-center justify-center gap-2 p-4 rounded-xl bg-sky-600 text-white font-black hover:bg-sky-700 transition-all uppercase text-xs tracking-widest shadow-lg shadow-sky-100">
                                  <Receipt className="w-4 h-4" /> View Invoice
                              </button>
                          )}
                      </div>
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};
