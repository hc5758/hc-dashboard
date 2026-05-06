@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@layer base {
  * { box-sizing: border-box; }
  html { font-family: 'Inter', system-ui, sans-serif; }
  body { @apply bg-slate-50 text-slate-900 antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded; }
}

@layer components {
  /* ── Layout ── */
  .page-wrapper { @apply flex flex-col h-screen overflow-hidden; }
  .page-content { @apply flex-1 overflow-y-auto p-6 space-y-5; }

  /* ── Card ── */
  .card { @apply bg-white border border-slate-200 rounded-xl overflow-hidden; }
  .card-head { @apply flex items-center justify-between px-5 py-3 border-b border-slate-100; }
  .card-title { @apply text-[13px] font-semibold text-slate-800; }
  .card-body { @apply p-5; }

  /* ── KPI ── */
  .kpi-card { @apply bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3; }
  .kpi-icon { @apply w-11 h-11 rounded-full flex items-center justify-center text-xl flex-shrink-0; }
  .kpi-label { @apply text-[11px] text-slate-400 font-medium mb-1; }
  .kpi-value { @apply text-2xl font-semibold text-slate-900 leading-none; }
  .kpi-change { @apply inline-flex items-center gap-1 text-[10.5px] font-medium mt-1.5; }
  .ch-up { @apply text-emerald-700; }
  .ch-down { @apply text-red-700; }
  .ch-flat { @apply text-slate-400; }

  /* ── Badge ── */
  .badge { @apply inline-flex items-center text-[10.5px] font-semibold px-2 py-0.5 rounded-full border; }
  .badge-teal   { @apply bg-teal-50 text-teal-700 border-teal-200; }
  .badge-navy   { @apply bg-slate-100 text-slate-700 border-slate-200; }
  .badge-red    { @apply bg-red-50 text-red-700 border-red-200; }
  .badge-amber  { @apply bg-amber-50 text-amber-700 border-amber-200; }
  .badge-blue   { @apply bg-blue-50 text-blue-700 border-blue-200; }
  .badge-purple { @apply bg-purple-50 text-purple-700 border-purple-200; }
  .badge-green  { @apply bg-green-50 text-green-700 border-green-200; }
  .badge-gray   { @apply bg-slate-100 text-slate-600 border-slate-200; }

  /* ── Buttons ── */
  .btn { @apply inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-semibold cursor-pointer border transition-all duration-150; }
  .btn-primary { @apply bg-[#0f1e3d] text-teal-300 border-[#0f1e3d] hover:bg-[#1a2d5a]; }
  .btn-teal    { @apply bg-[#2ab89a] text-[#0f1e3d] border-[#2ab89a] hover:bg-[#1a8a76] hover:text-white; }
  .btn-ghost   { @apply bg-white text-slate-700 border-slate-200 hover:bg-slate-50; }
  .btn-sm      { @apply px-3 py-1.5 text-[11px]; }

  /* ── Table ── */
  .tbl { @apply w-full border-collapse; }
  .tbl th { @apply text-[9.5px] font-semibold text-slate-400 uppercase tracking-wider px-4 py-2.5 bg-slate-50 border-b border-slate-100 text-left whitespace-nowrap; }
  .tbl td { @apply text-[12.5px] text-slate-700 px-4 py-2.5 border-b border-slate-50 align-middle; }
  .tbl tr:last-child td { @apply border-b-0; }
  .tbl tr:hover td { @apply bg-slate-50/70; }

  /* ── Form ── */
  .form-input { @apply w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-[12.5px] text-slate-800 outline-none focus:border-[#2ab89a] focus:ring-2 focus:ring-[#2ab89a]/20 transition-all; }
  .form-label { @apply block text-[10.5px] font-semibold text-slate-400 mb-1.5 uppercase tracking-wider; }

  /* ── Progress ── */
  .prog-bar  { @apply h-1.5 bg-slate-100 rounded-full overflow-hidden; }
  .prog-fill { @apply h-full rounded-full transition-all duration-500; }

  /* ── Funnel ── */
  .funnel-row   { @apply flex items-center gap-3 py-2.5 border-b border-slate-100 last:border-0; }
  .funnel-lbl   { @apply text-[12px] text-slate-500 w-20 flex-shrink-0; }
  .funnel-track { @apply flex-1 h-7 bg-slate-50 rounded-lg overflow-hidden; }
  .funnel-fill  { @apply h-full rounded-lg flex items-center px-3 transition-all; }
  .funnel-pct   { @apply text-[11px] font-semibold text-slate-400 w-9 text-right flex-shrink-0; }

  /* ── Inline bar ── */
  .bar-row   { @apply flex items-center gap-3 mb-2.5 last:mb-0; }
  .bar-lbl   { @apply text-[11px] text-slate-500 w-24 flex-shrink-0 text-right; }
  .bar-track { @apply flex-1 h-6 bg-slate-50 rounded-lg overflow-hidden; }
  .bar-fill  { @apply h-full rounded-lg flex items-center px-2.5 transition-all; }

  /* ── Sidebar ── */
  .sb-item { @apply flex items-center gap-2.5 px-4 py-2 text-[12.5px] font-medium text-slate-500 border-l-2 border-transparent cursor-pointer transition-all duration-150; }
  .sb-item:hover { @apply text-slate-800 bg-slate-50; }
  .sb-item.active { @apply text-[#0f1e3d] bg-teal-50 border-l-[#2ab89a] font-semibold; }

  /* ── Insight ── */
  .insight { @apply rounded-xl p-5; }
  .insight-dark { @apply bg-[#0f1e3d]; }

  /* ── Checklist toggle ── */
  .chk-btn { @apply w-6 h-6 rounded-md border text-[10px] font-bold inline-flex items-center justify-center cursor-pointer transition-all duration-150; }
  .chk-on  { @apply bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100; }
  .chk-off { @apply bg-slate-50 text-slate-300 border-slate-200 hover:bg-slate-100; }
}
