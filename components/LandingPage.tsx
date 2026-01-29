
import React from 'react';
import {
    ShieldCheck, ArrowRight, BookOpen, Smartphone, Users, LayoutDashboard, Calculator, CheckCircle2, DollarSign, Box, Menu
} from 'lucide-react';

interface LandingPageProps {
    onEnterApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onEnterApp }) => {

    const handleEnter = () => {
        localStorage.setItem('foamProTrialAccess', 'true');
        onEnterApp();
    };

    const RFELogo = () => (
        <div className="inline-flex flex-col select-none">
            <div className="flex items-center gap-3">
                {/* Red Box Part */}
                <div className="bg-[#E30613] text-white px-2 py-0 -skew-x-12 transform origin-bottom-left shadow-sm">
                    <span className="skew-x-12 block font-black text-3xl tracking-tighter py-1">RFE</span>
                </div>

                {/* Text Part - Dark for Light Theme */}
                <div className="flex items-baseline">
                    <span className="text-slate-900 font-black text-3xl italic tracking-tight">RFE</span>
                    <div className="w-2.5 h-2.5 bg-[#E30613] rounded-full ml-1 mb-1.5"></div>
                </div>
            </div>
            {/* Subtext Part - Dark for Light Theme */}
            <div className="mt-1 pl-1">
                <span className="text-slate-900 font-bold text-[0.65rem] tracking-[0.3em] uppercase block">FOAM EQUIPMENT</span>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">

            {/* Header */}
            <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-40">
                <div className="max-w-5xl mx-auto px-6 h-20 flex items-center justify-between">
                    <RFELogo />
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-full">
                            <ShieldCheck className="w-3 h-3 text-brand" /> Beta Documentation
                        </div>
                        <button
                            onClick={handleEnter}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-colors flex items-center gap-2"
                        >
                            Log In <ArrowRight className="w-3 h-3" />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-6 py-12">

                {/* Title Section */}
                <div className="mb-12 text-center border-b border-slate-200 pb-12">
                    <div className="inline-flex items-center gap-2 text-brand font-bold uppercase tracking-widest text-xs mb-4 bg-red-50 px-3 py-1 rounded-full">
                        <BookOpen className="w-4 h-4" /> User Manual v3.0
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-tight">
                        FoamApp Pro v3: <br />
                        <span className="text-slate-500">Professional User Guide</span>
                    </h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
                        Welcome to FoamApp Pro v3, the definitive management solution for professional insulation contractors. This guide provides a step-by-step walkthrough of the platform, from initial setup to final financial reconciliation.
                    </p>
                </div>

                <div className="space-y-16">

                    {/* Section 1: Getting Started */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">1</div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Getting Started</h2>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Smartphone className="w-5 h-5 text-brand" /> Installation
                                </h3>
                                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                                    FoamApp Pro is built as a Progressive Web App (PWA). This means you can install it directly onto your device without using an app store, providing offline capabilities and faster access.
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <strong className="block text-xs uppercase tracking-widest text-slate-900 mb-2">Mobile (iOS)</strong>
                                        <p className="text-xs text-slate-500">Open in Safari, tap the Share icon, and select <span className="font-bold text-slate-700">Add to Home Screen</span>.</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <strong className="block text-xs uppercase tracking-widest text-slate-900 mb-2">Mobile (Android)</strong>
                                        <p className="text-xs text-slate-500">Open in Chrome, tap the three-dot menu, and select <span className="font-bold text-slate-700">Install App</span>.</p>
                                    </div>
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <strong className="block text-xs uppercase tracking-widest text-slate-900 mb-2">Desktop</strong>
                                        <p className="text-xs text-slate-500">Click the Install icon (monitor with arrow) located on the right side of the address bar.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Users className="w-5 h-5 text-brand" /> User Roles & Access
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Admin Dashboard</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-3">High-level control over estimates, inventory management, detailed financials, and company-wide settings.</p>
                                        <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-xs font-mono text-slate-600">
                                            Login: Registered Username & Password
                                        </div>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">Crew Dashboard</h4>
                                        <p className="text-xs text-slate-500 leading-relaxed mb-3">A simplified, mobile-optimized interface for field teams to view schedules, navigate to jobs, and log material usage.</p>
                                        <div className="bg-slate-50 px-3 py-2 rounded border border-slate-200 text-xs font-mono text-slate-600">
                                            Login: Company ID + 4-digit Crew PIN
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-4 text-[10px] text-slate-400 italic">* The Crew PIN is generated and managed within the Admin Settings.</p>
                            </div>
                        </div>
                    </section>

                    {/* Section 2: Admin Workflow */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">2</div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Admin Workflow</h2>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <LayoutDashboard className="w-5 h-5 text-brand" /> Dashboard Overview
                                </h3>
                                <ul className="space-y-3 text-sm text-slate-600">
                                    <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0"></span><span><strong>Active Jobs:</strong> Track the lifecycle of projects from Draft to Work Order to Invoiced.</span></li>
                                    <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0"></span><span><strong>Financial Summary:</strong> A high-level view of revenue, expenses, and net profit for the current period.</span></li>
                                    <li className="flex gap-3"><span className="w-1.5 h-1.5 rounded-full bg-brand mt-2 flex-shrink-0"></span><span><strong>Inventory Status:</strong> Automated alerts for low-stock items in the warehouse.</span></li>
                                </ul>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                    <Calculator className="w-5 h-5 text-brand" /> Creating a Professional Estimate
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-slate-600">
                                    <p><strong className="text-slate-900">Start New:</strong> Select the New Estimate button.</p>
                                    <p><strong className="text-slate-900">Customer Selection:</strong> Attach to an existing profile or create new.</p>
                                    <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl border border-slate-100 my-2">
                                        <strong className="block text-xs uppercase tracking-widest text-slate-900 mb-2">Calculation Modes</strong>
                                        <ul className="text-xs space-y-1">
                                            <li>• <strong>Building:</strong> Input full dimensions (Length × Width × Height × Pitch).</li>
                                            <li>• <strong>Walls Only:</strong> Input total linear footage and wall height.</li>
                                            <li>• <strong>Flat Area:</strong> Direct input of total square footage.</li>
                                        </ul>
                                    </div>
                                    <p><strong className="text-slate-900">Spray Specs:</strong> Configure depth, foam type (Open/Closed), and waste %.</p>
                                    <p><strong className="text-slate-900">Pricing Models:</strong> Choose between Cost Plus (markup) or Fixed SqFt Price.</p>
                                    <p><strong className="text-slate-900">Inventory:</strong> Add billable consumables. Use "+ Create New" for ad-hoc items.</p>
                                </div>
                            </div>

                            <div className="border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Managing Job Lifecycle</h3>
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 bg-white border-l-4 border-slate-200 pl-4 py-1">
                                        <strong className="block text-sm text-slate-900">1. Conversion</strong>
                                        <span className="text-xs text-slate-500">Mark as Sold / Work Order</span>
                                    </div>
                                    <div className="flex-1 bg-white border-l-4 border-brand pl-4 py-1">
                                        <strong className="block text-sm text-slate-900">2. Scheduling</strong>
                                        <span className="text-xs text-slate-500">Assign date & add notes</span>
                                    </div>
                                    <div className="flex-1 bg-white border-l-4 border-slate-900 pl-4 py-1">
                                        <strong className="block text-sm text-slate-900">3. Generation</strong>
                                        <span className="text-xs text-slate-500">Creates Crew Digital WO</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 3: Crew Workflow */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">3</div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Crew Workflow</h2>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2">Time Tracking & Execution</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                        Field personnel tap <strong>Start Job</strong> to begin accurate labor-hour tracking. They can view site address, contact info, and spray depths directly on the tablet.
                                    </p>
                                    <div className="bg-slate-100 p-3 rounded-lg text-xs font-mono text-slate-600 inline-block">
                                        Tap address to Launch Maps Navigation
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2">Completion & Actuals</h3>
                                    <p className="text-sm text-slate-600 leading-relaxed mb-4">
                                        Once finished, the crew taps <strong>Complete Job</strong> to log:
                                    </p>
                                    <ul className="text-sm text-slate-600 list-disc pl-4 space-y-1">
                                        <li>Exact chemical sets (A & B) consumed.</li>
                                        <li>Inventory items (poly, tape) used.</li>
                                        <li>Upload "Before" & "After" photos.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 4: Financials */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">4</div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Financials & Reconciliation</h2>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-700 mt-1"><CheckCircle2 className="w-5 h-5" /></div>
                                <div>
                                    <strong className="text-slate-900 block mb-1">Reconcile Actuals</strong>
                                    <p className="text-sm text-slate-600">
                                        When a job completes, click <strong>Review Actuals</strong>. Compare quoted vs. actual usage. The system highlights discrepancies (e.g., used 12% more foam). You can update the invoice to reflect this or stick to the quote.
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <div className="bg-sky-100 p-2 rounded-lg text-sky-700 mt-1"><DollarSign className="w-5 h-5" /></div>
                                <div>
                                    <strong className="text-slate-900 block mb-1">Payments & Profitability</strong>
                                    <p className="text-sm text-slate-600">
                                        Click <strong>Generate Invoice</strong> to finalize. Once paid, mark as <strong>Paid in Full</strong>. This automatically updates your P&L reports and business health metrics.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Section 5: Inventory */}
                    <section>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-lg shadow-lg">5</div>
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Inventory & Settings</h2>
                        </div>

                        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Box className="w-4 h-4 text-brand" /> Warehouse Management</h3>
                                    <ul className="text-sm text-slate-600 space-y-2">
                                        <li>• <strong>Consumables:</strong> Real-time tracking of foam sets.</li>
                                        <li>• <strong>Equipment:</strong> Logs for rigs, guns, and pumps.</li>
                                        <li>• <strong>Restocking:</strong> Update quantities when shipments arrive.</li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2"><Menu className="w-4 h-4 text-brand" /> System Settings</h3>
                                    <ul className="text-sm text-slate-600 space-y-2">
                                        <li>• <strong>Company Profile:</strong> Logo and address for PDF headers.</li>
                                        <li>• <strong>Security:</strong> Manage the 4-digit Crew PIN.</li>
                                        <li>• <strong>Data Integrity:</strong> Use "Force Refresh" to sync manually.</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                </div>

                {/* Bottom Action */}
                <div className="mt-20 pt-10 border-t border-slate-200 text-center">
                    <h3 className="text-xl font-bold text-slate-900 mb-6">Ready to begin?</h3>
                    <button
                        onClick={handleEnter}
                        className="bg-[#E30613] hover:bg-red-700 text-white py-5 px-12 rounded-2xl font-black uppercase text-sm tracking-widest transition-all shadow-xl shadow-red-200 hover:shadow-red-300 transform hover:-translate-y-1 flex items-center gap-3 mx-auto"
                    >
                        Access Platform <ArrowRight className="w-5 h-5" />
                    </button>
                    <p className="text-xs text-slate-400 mt-6 font-medium">
                        © {new Date().getFullYear()} RFE Foam Equipment. Beta Version 3.0
                    </p>
                </div>

            </div >
        </div >
    );
};
