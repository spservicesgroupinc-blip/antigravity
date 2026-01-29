
import React, { useState, useEffect } from 'react';
import { 
    LogOut, RefreshCw, MapPin, Calendar, HardHat, FileText, 
    ChevronLeft, CheckCircle2, Package, AlertTriangle, User, 
    ArrowRight, Play, Square, Clock, Save, Loader2, Download,
    MessageSquare, History, Activity, Gauge, Camera, Image as ImageIcon
} from 'lucide-react';
import { CalculatorState, EstimateRecord, JobImage } from '../types';
import { logCrewTime, completeJob, uploadImage, startJob } from '../services/api';
import { compressImage } from '../utils/imageHelpers';

interface CrewDashboardProps {
  state: CalculatorState;
  onLogout: () => void;
  syncStatus: string;
  onSync: () => Promise<void>; // This is forceRefresh (Sync Down) now passed from parent
  installPrompt: any;
  onInstall: () => void;
}

export const CrewDashboard: React.FC<CrewDashboardProps> = ({ state, onLogout, syncStatus, onSync, installPrompt, onInstall }) => {
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  
  // Timer State
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [jobStartTime, setJobStartTime] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isSyncingTime, setIsSyncingTime] = useState(false);
  
  // Telemetry State (Mock)
  const [pressureA, setPressureA] = useState(0);
  const [pressureB, setPressureB] = useState(0);
  const [strokeCount, setStrokeCount] = useState(8452); // Initial arbitrary reading
  
  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [actuals, setActuals] = useState({
      openCellSets: 0,
      closedCellSets: 0,
      laborHours: 0,
      inventory: [] as any[],
      notes: '',
      completionPhotos: [] as JobImage[] // NEW
  });
  const [isCompleting, setIsCompleting] = useState(false);
  const [uploadQueue, setUploadQueue] = useState<number>(0);

  // --- AUTOMATIC BACKGROUND SYNC ---
  useEffect(() => {
    // Poll for new jobs every 45 seconds
    const syncInterval = setInterval(() => {
        // Only sync if we aren't in the middle of a critical action (Timer/Modal)
        // This prevents UI resets while typing notes or tracking time
        if (!isTimerRunning && !showCompletionModal && !isCompleting && uploadQueue === 0) {
            console.log("Auto-syncing crew dashboard...");
            onSync();
        }
    }, 45000);

    return () => clearInterval(syncInterval);
  }, [isTimerRunning, showCompletionModal, isCompleting, onSync, uploadQueue]);

  // Restore timer state on load
  useEffect(() => {
      const savedStart = localStorage.getItem('foamPro_crewStartTime');
      const savedJobId = localStorage.getItem('foamPro_crewActiveJob');
      
      if (savedStart && savedJobId) {
          setJobStartTime(savedStart);
          setIsTimerRunning(true);
          setSelectedJobId(savedJobId);
      }
  }, []);

  // Timer Tick & Telemetry Simulation
  useEffect(() => {
      let interval: ReturnType<typeof setInterval>;
      let telemetryInterval: ReturnType<typeof setInterval>;

      if (isTimerRunning && jobStartTime) {
          // Timer Logic
          interval = setInterval(() => {
              const start = new Date(jobStartTime).getTime();
              const now = new Date().getTime();
              setElapsedSeconds(Math.floor((now - start) / 1000));
          }, 1000);

          // Telemetry Simulation (Mock Data)
          telemetryInterval = setInterval(() => {
              // Simulate fluctuating pressure around 1300 PSI
              const targetP = 1300;
              const variance = 150;
              // A side
              const pA = Math.floor(targetP + (Math.random() * variance * 2 - variance));
              // B side usually tracks A side closely in a good mix (within ~50-100psi)
              const pB = Math.floor(pA + (Math.random() * 100 - 50));
              
              setPressureA(pA);
              setPressureB(pB);
              
              // Increment stroke counter randomly to simulate spraying
              if (Math.random() > 0.3) {
                  setStrokeCount(prev => prev + 1);
              }
          }, 800); // Fast updates for "live" feel

      } else {
          // Reset pressures when not running (or "idle")
          setPressureA(0);
          setPressureB(0);
      }

      return () => {
          clearInterval(interval);
          clearInterval(telemetryInterval);
      };
  }, [isTimerRunning, jobStartTime]);

  const formatTime = (secs: number) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = secs % 60;
      return `${h.toString().padStart(2,'0')}:${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`;
  };

  const activeWorkOrders = state.savedEstimates.filter(e => (e.status === 'Work Order' || e.executionStatus === 'In Progress') && e.executionStatus !== 'Completed');
  const completedWorkOrders = state.savedEstimates.filter(e => e.status === 'Work Order' && e.executionStatus === 'Completed');
  
  const displayedJobs = showHistory ? completedWorkOrders : activeWorkOrders;
  const selectedJob = selectedJobId ? state.savedEstimates.find(j => j.id === selectedJobId) : null;

  const handleStartTimer = async () => {
      const now = new Date().toISOString();
      setJobStartTime(now);
      setIsTimerRunning(true);
      localStorage.setItem('foamPro_crewStartTime', now);
      if (selectedJobId) localStorage.setItem('foamPro_crewActiveJob', selectedJobId);

      // Signal backend that job is live (for admin dashboard)
      if (selectedJobId) {
          try {
              const s = localStorage.getItem('foamProSession');
              if (s) {
                  const session = JSON.parse(s);
                  await startJob(selectedJobId, session.spreadsheetId);
              }
          } catch(e) {
              console.warn("Failed to signal job start to server", e);
          }
      }
  };

  const handleStopTimer = async (isCompletion: boolean) => {
      if (!selectedJob || !jobStartTime) return;
      
      try {
          const endTime = new Date().toISOString();
          setIsSyncingTime(true);
          
          // Log to backend
          if (selectedJob.workOrderSheetUrl) {
            let user = "Crew";
            try {
                const s = localStorage.getItem('foamProSession');
                if (s) user = JSON.parse(s).username;
            } catch(e) {
                console.warn("Could not retrieve session user for timer log");
            }
            
            await logCrewTime(selectedJob.workOrderSheetUrl, jobStartTime, endTime, user);
          }

          const sessionDurationHours = (new Date(endTime).getTime() - new Date(jobStartTime).getTime()) / (1000 * 60 * 60);

          // Clear local state
          setIsTimerRunning(false);
          setJobStartTime(null);
          setElapsedSeconds(0);
          localStorage.removeItem('foamPro_crewStartTime');
          localStorage.removeItem('foamPro_crewActiveJob');
          
          if (isCompletion) {
              const estLabor = selectedJob.expenses?.manHours || 0;
              // Safe access to materials and inventory
              const estInventory = selectedJob.materials?.inventory ? [...selectedJob.materials.inventory] : [];
              const ocSets = selectedJob.materials?.openCellSets || 0;
              const ccSets = selectedJob.materials?.closedCellSets || 0;
              
              setActuals({
                  openCellSets: parseFloat((selectedJob.actuals?.openCellSets || ocSets).toFixed(2)),
                  closedCellSets: parseFloat((selectedJob.actuals?.closedCellSets || ccSets).toFixed(2)),
                  laborHours: selectedJob.actuals?.laborHours || parseFloat((estLabor || sessionDurationHours).toFixed(1)),
                  inventory: selectedJob.actuals?.inventory || estInventory,
                  notes: selectedJob.actuals?.notes || '',
                  completionPhotos: selectedJob.actuals?.completionPhotos || []
              });
              setShowCompletionModal(true);
          }
      } catch (e: any) {
          alert(`Error updating timer: ${e.message}`);
      } finally {
          setIsSyncingTime(false);
      }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      
      const files = Array.from(e.target.files) as File[];
      setUploadQueue(prev => prev + files.length);
      
      const sessionStr = localStorage.getItem('foamProSession');
      const session = sessionStr ? JSON.parse(sessionStr) : null;
      if (!session) return;

      for (const file of files) {
          try {
              // 1. Compress
              const compressedBase64 = await compressImage(file);
              
              // 2. Upload
              const url = await uploadImage(compressedBase64, `Completion_${selectedJobId}_${file.name}`, session.spreadsheetId, session.folderId);
              
              if (url) {
                  const newImage: JobImage = {
                      id: Math.random().toString(36).substr(2,9),
                      url: url,
                      uploadedAt: new Date().toISOString(),
                      uploadedBy: session.username || 'Crew',
                      type: 'completion'
                  };
                  setActuals(prev => ({ ...prev, completionPhotos: [...prev.completionPhotos, newImage] }));
              }
          } catch (err) {
              console.error("Upload failed", err);
              alert(`Failed to upload ${file.name}`);
          } finally {
              setUploadQueue(prev => prev - 1);
          }
      }
  };

  const handleCompleteJobSubmit = async () => {
      if (!selectedJob) return;
      setIsCompleting(true);
      
      try {
        const sessionStr = localStorage.getItem('foamProSession');
        if (!sessionStr) throw new Error("Session expired. Please log out and back in.");
        
        const session = JSON.parse(sessionStr);
        if (!session.spreadsheetId) throw new Error("Invalid session data. Please log out and back in.");

        const finalData = {
            ...actuals,
            completionDate: new Date().toISOString(),
            completedBy: session.username || "Crew"
        };

        const success = await completeJob(selectedJob.id, finalData, session.spreadsheetId);
        
        if (success) {
            setShowCompletionModal(false);
            setSelectedJobId(null);
            
            // Sync DOWN to get the latest status from server (Completed)
            // This prevents local "In Progress" state from overwriting the server
            setTimeout(async () => {
                try {
                    await onSync(); // This calls forceRefresh (Sync Down)
                    alert("Job Completed Successfully!");
                } catch(e) {
                    console.error("Sync failed after completion", e);
                    window.location.reload();
                }
            }, 1000);
        } else {
            alert("Error syncing completion. Please check your internet connection.");
        }
      } catch (error: any) {
         console.error("Completion Error:", error);
         alert(`An error occurred: ${error.message || "Unknown error"}`);
      } finally {
         setIsCompleting(false);
      }
  };

  const RFESmallLogo = () => (
    <div className="flex items-center gap-2 select-none">
        <div className="bg-brand text-white px-1.5 py-0.5 -skew-x-12 transform origin-bottom-left shadow-sm flex items-center justify-center">
            <span className="skew-x-12 font-black text-lg tracking-tighter">RFE</span>
        </div>
        <div className="flex flex-col justify-center -space-y-0.5">
            <span className="text-xl font-black italic tracking-tighter text-slate-900 leading-none">RFE</span>
            <span className="text-[0.4rem] font-bold tracking-[0.2em] text-brand-yellow bg-black px-1 py-0.5 leading-none">FOAM EQUIPMENT</span>
        </div>
    </div>
  );

  // --- JOB DETAIL VIEW ---
  if (selectedJob) {
      return (
        <div className="min-h-screen bg-slate-50 text-slate-900 pb-28 animate-in slide-in-from-right-4 duration-300">
            {/* Same detail view logic as before ... keeping it consistent */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 py-4 flex justify-between items-center">
                    <button 
                        onClick={() => !isTimerRunning && setSelectedJobId(null)} 
                        disabled={isTimerRunning}
                        className={`flex items-center gap-2 font-bold transition-colors ${isTimerRunning ? 'text-slate-300' : 'text-slate-500 hover:text-slate-900'}`}
                    >
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <ChevronLeft className="w-5 h-5" />
                        </div>
                        <span className="text-sm uppercase tracking-wider">Back</span>
                    </button>
                    <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Work Order</div>
                        <div className="text-lg font-black text-slate-900">#{selectedJob.id.substring(0,8).toUpperCase()}</div>
                    </div>
                </div>
                
                {/* Time Clock Bar */}
                <div className={`p-4 ${isTimerRunning ? 'bg-red-50 border-b border-red-100' : 'bg-slate-50 border-b border-slate-100'}`}>
                    <div className="max-w-3xl mx-auto flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className={`w-6 h-6 ${isTimerRunning ? 'text-brand animate-pulse' : 'text-slate-400'}`} />
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Time Clock</div>
                                <div className={`text-xl font-mono font-black ${isTimerRunning ? 'text-brand' : 'text-slate-600'}`}>
                                    {isTimerRunning ? formatTime(elapsedSeconds) : '00:00:00'}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            {selectedJob.executionStatus === 'Completed' ? (
                                <button 
                                    onClick={() => {
                                        // Allow editing completion details without timer
                                        const ocSets = selectedJob.actuals?.openCellSets ?? selectedJob.materials?.openCellSets ?? 0;
                                        const ccSets = selectedJob.actuals?.closedCellSets ?? selectedJob.materials?.closedCellSets ?? 0;

                                        setActuals({
                                            openCellSets: parseFloat(ocSets.toFixed(2)),
                                            closedCellSets: parseFloat(ccSets.toFixed(2)),
                                            laborHours: selectedJob.actuals?.laborHours || 0,
                                            inventory: selectedJob.actuals?.inventory || [],
                                            notes: selectedJob.actuals?.notes || '',
                                            completionPhotos: selectedJob.actuals?.completionPhotos || []
                                        });
                                        setShowCompletionModal(true);
                                    }}
                                    className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2"
                                >
                                    Edit Details
                                </button>
                            ) : !isTimerRunning ? (
                                <button 
                                    onClick={handleStartTimer}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-200"
                                >
                                    <Play className="w-4 h-4 fill-current" /> Start Job
                                </button>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => handleStopTimer(false)}
                                        disabled={isSyncingTime}
                                        className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2"
                                    >
                                        {isSyncingTime ? <Loader2 className="w-4 h-4 animate-spin"/> : "Pause / End Day"}
                                    </button>
                                    <button 
                                        onClick={() => handleStopTimer(true)}
                                        disabled={isSyncingTime}
                                        className="bg-brand hover:bg-brand-hover text-white px-4 py-2 rounded-xl font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-red-200"
                                    >
                                        <CheckCircle2 className="w-4 h-4" /> Complete Job
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-3xl mx-auto p-4 space-y-6">
                
                {/* Completed Banner */}
                {selectedJob.executionStatus === 'Completed' && (
                    <div className="bg-emerald-100 border border-emerald-200 p-4 rounded-xl flex items-center gap-3 text-emerald-800">
                        <CheckCircle2 className="w-6 h-6" />
                        <div>
                            <div className="font-black uppercase text-xs tracking-widest">Job Completed</div>
                            <div className="text-sm">Submitted by {selectedJob.actuals?.completedBy} on {new Date(selectedJob.actuals?.completionDate || "").toLocaleDateString()}</div>
                        </div>
                    </div>
                )}

                {/* Primary Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedJob.customer.address + ' ' + selectedJob.customer.zip)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="bg-white active:bg-slate-50 text-slate-900 border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
                    >
                        <MapPin className="w-6 h-6 text-brand" /> 
                        <span className="font-bold text-sm uppercase tracking-wide">GPS Map</span>
                    </a>
                    {selectedJob.workOrderSheetUrl ? (
                         <a 
                            href={selectedJob.workOrderSheetUrl} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-white active:bg-slate-50 text-slate-900 border border-slate-200 p-4 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-2 transition-transform active:scale-95"
                        >
                             <FileText className="w-6 h-6 text-emerald-600" /> 
                             <span className="font-bold text-sm uppercase tracking-wide">View Sheet</span>
                         </a>
                    ) : (
                         <div className="bg-slate-100 text-slate-400 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 border border-slate-200">
                             <FileText className="w-6 h-6" /> 
                             <span className="font-bold text-sm uppercase tracking-wide">No Sheet</span>
                         </div>
                    )}
                </div>

                {/* --- MOCK TELEMETRY CARD --- */}
                <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-4">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Activity className="w-4 h-4 text-brand" /> Live Rig Telemetry
                            </h3>
                            {isTimerRunning && <div className="animate-pulse w-2 h-2 rounded-full bg-green-500"></div>}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4">
                            {/* A-Side ISO */}
                            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="text-[9px] font-black text-red-400 uppercase mb-1 tracking-wider z-10">ISO (A)</div>
                                <div className="text-2xl font-mono font-black z-10">{pressureA}</div>
                                <div className="text-[8px] text-slate-400 font-bold z-10">PSI</div>
                                {/* Bar */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                    <div className="bg-red-500 h-full transition-all duration-300" style={{width: `${Math.min(pressureA / 2000 * 100, 100)}%`}}></div>
                                </div>
                            </div>

                            {/* B-Side RESIN */}
                            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="text-[9px] font-black text-blue-400 uppercase mb-1 tracking-wider z-10">RESIN (B)</div>
                                <div className="text-2xl font-mono font-black z-10">{pressureB}</div>
                                <div className="text-[8px] text-slate-400 font-bold z-10">PSI</div>
                                {/* Bar */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800">
                                    <div className="bg-blue-500 h-full transition-all duration-300" style={{width: `${Math.min(pressureB / 2000 * 100, 100)}%`}}></div>
                                </div>
                            </div>

                            {/* Strokes */}
                            <div className="bg-white/10 rounded-2xl p-3 border border-white/10 flex flex-col items-center justify-center">
                                <div className="text-[9px] font-black text-emerald-400 uppercase mb-1 tracking-wider">Strokes</div>
                                <div className="text-xl font-mono font-black">{strokeCount.toLocaleString()}</div>
                                <div className="text-[8px] text-slate-400 font-bold">Total Count</div>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Background for Tech Feel */}
                    <div className="absolute -right-4 -bottom-8 w-32 h-32 bg-brand/10 rounded-full blur-2xl"></div>
                </div>

                {/* Customer Info Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User className="w-4 h-4" /> Client & Location
                    </h3>
                    <div>
                        <div className="text-2xl font-black text-slate-900 mb-1">{selectedJob.customer.name}</div>
                        <div className="text-slate-500 font-medium text-lg leading-snug">
                            {selectedJob.customer.address}<br/>
                            {selectedJob.customer.city}, {selectedJob.customer.state} {selectedJob.customer.zip}
                        </div>
                    </div>
                </div>

                {/* Scope Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2"> 
                        <HardHat className="w-4 h-4"/> Install Specifications
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedJob.results.totalWallArea > 0 && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Walls</div>
                                <div className="text-slate-900 font-bold text-lg leading-tight">{selectedJob.wallSettings.type}</div>
                                <div className="text-slate-600 font-medium text-sm mt-1">@ {selectedJob.wallSettings.thickness}" Depth</div>
                                <div className="mt-3 pt-3 border-t border-slate-200 text-xs font-bold text-slate-400 text-right">{Math.round(selectedJob.results.totalWallArea).toLocaleString()} sqft</div>
                            </div>
                        )}
                        {selectedJob.results.totalRoofArea > 0 && (
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="text-[10px] text-brand font-black uppercase tracking-widest mb-1">Roof / Ceiling</div>
                                <div className="text-slate-900 font-bold text-lg leading-tight">{selectedJob.roofSettings.type}</div>
                                <div className="text-slate-600 font-medium text-sm mt-1">@ {selectedJob.roofSettings.thickness}" Depth</div>
                                <div className="mt-3 pt-3 border-t border-slate-200 text-xs font-bold text-slate-400 text-right">{Math.round(selectedJob.results.totalRoofArea).toLocaleString()} sqft</div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Load List Card */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Truck Load List
                    </h3>
                    <div className="space-y-3">
                         {selectedJob.materials?.openCellSets > 0 && (
                             <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <span className="font-bold text-slate-700">Open Cell Foam</span>
                                 <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-brand font-black shadow-sm">{selectedJob.materials.openCellSets.toFixed(2)} Sets</span>
                             </div>
                         )}
                         {selectedJob.materials?.closedCellSets > 0 && (
                             <div className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <span className="font-bold text-slate-700">Closed Cell Foam</span>
                                 <span className="bg-white px-3 py-1 rounded-lg border border-slate-200 text-brand font-black shadow-sm">{selectedJob.materials.closedCellSets.toFixed(2)} Sets</span>
                             </div>
                         )}
                         {selectedJob.materials?.inventory?.map((item) => (
                             <div key={item.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                 <span className="font-bold text-slate-700">{item.name}</span>
                                 <span className="text-slate-500 font-bold">{item.quantity} {item.unit}</span>
                             </div>
                         ))}
                    </div>
                </div>

                {/* Notes Card */}
                {selectedJob.notes && (
                    <div className="bg-amber-50 p-6 rounded-3xl shadow-sm border border-amber-100">
                        <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" /> Job Notes
                        </h3>
                        <p className="text-amber-900 text-sm font-medium leading-relaxed">
                            {selectedJob.notes}
                        </p>
                    </div>
                )}
            </div>

            {/* Completion Modal */}
            {showCompletionModal && (
                <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-6">Complete Job</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Total Labor Hours</label>
                                <input 
                                    type="number" 
                                    value={actuals.laborHours || ''} 
                                    onChange={(e) => setActuals({...actuals, laborHours: parseFloat(e.target.value) || 0})}
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-2xl text-center focus:ring-4 focus:ring-brand/20 outline-none"
                                />
                            </div>

                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest border-b border-slate-200 pb-2">Material Usage (Sets)</h4>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 flex justify-between mb-1"><span>Open Cell</span> <span>Est: {selectedJob.materials?.openCellSets.toFixed(2)}</span></label>
                                    <input 
                                        type="number" step="0.25"
                                        value={actuals.openCellSets} 
                                        onChange={(e) => setActuals({...actuals, openCellSets: parseFloat(e.target.value) || 0})}
                                        placeholder="0.00"
                                        className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:ring-2 focus:ring-brand outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-slate-500 flex justify-between mb-1"><span>Closed Cell</span> <span>Est: {selectedJob.materials?.closedCellSets.toFixed(2)}</span></label>
                                    <input 
                                        type="number" step="0.25"
                                        value={actuals.closedCellSets} 
                                        onChange={(e) => setActuals({...actuals, closedCellSets: parseFloat(e.target.value) || 0})}
                                        placeholder="0.00"
                                        className="w-full p-4 bg-white border border-slate-200 rounded-xl font-bold text-lg text-slate-900 focus:ring-2 focus:ring-brand outline-none"
                                    />
                                </div>
                            </div>

                            {/* PHOTO UPLOAD */}
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                                        <Camera className="w-4 h-4"/> Job Photos
                                    </h4>
                                    <label className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest cursor-pointer transition-colors flex items-center gap-2">
                                        {uploadQueue > 0 ? <Loader2 className="w-3 h-3 animate-spin"/> : <ImageIcon className="w-3 h-3"/>}
                                        {uploadQueue > 0 ? 'Uploading...' : 'Add Photos'}
                                        <input type="file" multiple accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploadQueue > 0}/>
                                    </label>
                                </div>
                                
                                {actuals.completionPhotos.length === 0 ? (
                                    <div className="text-center text-slate-400 text-xs italic py-4 border-2 border-dashed border-slate-200 rounded-xl">No photos uploaded</div>
                                ) : (
                                    <div className="grid grid-cols-3 gap-2">
                                        {actuals.completionPhotos.map((img, idx) => (
                                            <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 group">
                                                <img src={img.url} alt="Job Completion" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[9px] font-bold text-white uppercase tracking-widest">Added</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* CREW NOTES */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3"/> Crew Notes / Issues
                                </label>
                                <textarea
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm text-slate-900 focus:ring-2 focus:ring-brand outline-none resize-none h-24"
                                    placeholder="Mention any issues, extra materials used, or specific details for the office..."
                                    value={actuals.notes}
                                    onChange={(e) => setActuals({...actuals, notes: e.target.value})}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button onClick={() => setShowCompletionModal(false)} disabled={isCompleting || uploadQueue > 0} className="flex-1 p-4 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs tracking-widest text-slate-400 hover:bg-slate-50">Cancel</button>
                                <button onClick={handleCompleteJobSubmit} disabled={isCompleting || uploadQueue > 0} className="flex-1 p-4 bg-brand text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-brand-hover shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                                    {isCompleting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Submit & Finish"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- JOB LIST VIEW ---
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20">
        
        {/* Header */}
        <header className="bg-slate-900 text-white p-6 pb-12 rounded-b-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="relative z-10 flex justify-between items-start mb-6">
                <RFESmallLogo />
                <div className="flex gap-2">
                    <div className="text-right">
                        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status</div>
                        <div className="text-xs font-bold text-emerald-400 flex items-center justify-end gap-1">
                            {syncStatus === 'syncing' ? <RefreshCw className="w-3 h-3 animate-spin"/> : <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>}
                            {syncStatus === 'syncing' ? 'Syncing...' : 'Live'}
                        </div>
                    </div>
                    {installPrompt && (
                        <button onClick={onInstall} className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl hover:bg-emerald-500/40 transition-colors" title="Install App">
                            <Download className="w-5 h-5" />
                        </button>
                    )}
                    <button onClick={onLogout} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-black mb-1">Crew Dashboard</h1>
                    <p className="text-slate-400 text-sm font-medium">Select a Work Order to begin.</p>
                </div>
                <button 
                    onClick={() => setShowHistory(!showHistory)}
                    className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-2 ${showHistory ? 'bg-white text-slate-900 border-white' : 'bg-transparent text-slate-400 border-slate-700 hover:border-slate-500'}`}
                >
                    <History className="w-4 h-4" /> {showHistory ? 'Hide History' : 'History'}
                </button>
            </div>
            {/* Background Pattern */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand rounded-full filter blur-[80px] opacity-20 transform translate-x-1/3 -translate-y-1/3"></div>
        </header>

        {/* List */}
        <div className="px-4 -mt-8 relative z-20 space-y-4 max-w-2xl mx-auto">
            {displayedJobs.length === 0 ? (
                <div className="bg-white rounded-3xl p-10 text-center shadow-lg border border-slate-100">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-black text-slate-900 mb-2">{showHistory ? 'No Completed Jobs' : 'All Caught Up!'}</h3>
                    <p className="text-slate-500 text-sm">{showHistory ? 'Completed work orders will appear here.' : 'No pending work orders assigned.'}</p>
                    {!showHistory && (
                        <button onClick={() => onSync()} className="mt-6 text-brand font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:underline">
                            <RefreshCw className="w-4 h-4" /> Refresh List
                        </button>
                    )}
                </div>
            ) : (
                displayedJobs.map(job => (
                    <button 
                        key={job.id}
                        onClick={() => setSelectedJobId(job.id)}
                        className={`w-full bg-white p-6 rounded-3xl shadow-sm border border-slate-200 text-left hover:scale-[1.02] transition-transform active:scale-95 group relative overflow-hidden ${job.executionStatus === 'Completed' ? 'opacity-80 hover:opacity-100' : ''}`}
                    >
                        <div className={`absolute top-0 left-0 w-1 h-full transition-colors ${job.executionStatus === 'Completed' ? 'bg-emerald-500' : job.executionStatus === 'In Progress' ? 'bg-amber-500' : 'bg-slate-200 group-hover:bg-brand'}`}></div>
                        <div className="flex justify-between items-start mb-4 pl-4">
                            <div>
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-2">
                                    Work Order 
                                    {job.executionStatus === 'Completed' && <span className="bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded">DONE</span>}
                                    {job.executionStatus === 'In Progress' && <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
                                </div>
                                <div className="text-xl font-black text-slate-900">#{job.id.substring(0,8).toUpperCase()}</div>
                            </div>
                            <div className="bg-slate-50 p-2 rounded-xl text-slate-400 group-hover:text-brand transition-colors">
                                <ArrowRight className="w-5 h-5" />
                            </div>
                        </div>
                        <div className="pl-4 space-y-2">
                             <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                <User className="w-4 h-4 text-slate-400" /> {job.customer.name}
                             </div>
                             <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <MapPin className="w-4 h-4 text-slate-400" /> {job.customer.city}, {job.customer.state}
                             </div>
                             <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                                <Calendar className="w-4 h-4 text-slate-400" /> {job.scheduledDate ? new Date(job.scheduledDate).toLocaleDateString() : "Unscheduled"}
                             </div>
                        </div>
                    </button>
                ))
            )}
        </div>
    </div>
  );
};
