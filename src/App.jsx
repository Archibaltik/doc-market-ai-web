import React, { useState } from 'react';
import {
  FileText, BarChart3, Scale, BookOpen, Sun, Moon, Key, Upload,
  Sparkles, Download, TrendingUp, ExternalLink, Layers, AlertCircle, Loader2, Cpu
} from 'lucide-react';
import { DEMO_DATA, DonutChart, AreaChart } from './charts';

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (err) => reject(err);
});

export default function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gemini-3.5-flash-lite');

  const [agentFile, setAgentFile] = useState(null);
  const [agentPrompt, setAgentPrompt] = useState('Найди ключевые финансовые показатели за последние 2 года, рассчитай их темп роста и сформулируй 3 главных вывода.');
  const [useSearch, setUseSearch] = useState(false);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentResult, setAgentResult] = useState('');
  const [agentError, setAgentError] = useState('');

  const [dashFile, setDashFile] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);
  const [dashData, setDashData] = useState(DEMO_DATA);
  const [dashError, setDashError] = useState('');

  const [cmpFile1, setCmpFile1] = useState(null);
  const [cmpFile2, setCmpFile2] = useState(null);
  const [cmpPrompt, setCmpPrompt] = useState('Сравни два документа: выдели ключевые изменения в метриках, стратегические сдвиги и итоговое резюме.');
  const [cmpLoading, setCmpLoading] = useState(false);
  const [cmpResult, setCmpResult] = useState('');
  const [cmpError, setCmpError] = useState('');

  const models = apiKey.trim()
    ? ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon']
    : ['gemini-3.5-flash-lite'];

  const callGemini = async ({ parts, isJson = false, search = false }) => {
    if (!apiKey.trim()) throw new Error('Введите ваш бесплатный Gemini API Key слева (инструкция во вкладке «Гайд»).');
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts }],
        generationConfig: { temperature: isJson ? 0.1 : 0.25, ...(isJson ? { responseMimeType: 'application/json' } : {}) },
        ...(search ? { tools: [{ google_search: {} }] } : {})
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || `Ошибка API (${res.status})`);
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Пустой ответ.';
  };

  const runAgent = async () => {
    setAgentError(''); setAgentResult('');
    if (!agentFile) return setAgentError('Загрузите PDF-файл.');
    setAgentLoading(true);
    try {
      const b64 = await fileToBase64(agentFile);
      const out = await callGemini({
        parts: [{ inlineData: { mimeType: 'application/pdf', data: b64 } }, { text: agentPrompt }],
        search: useSearch
      });
      setAgentResult(out);
    } catch (e) { setAgentError(e.message); }
    finally { setAgentLoading(false); }
  };

  const runDash = async () => {
    setDashError('');
    if (!dashFile) return setDashError('Загрузите PDF-файл.');
    setDashLoading(true);
    try {
      const b64 = await fileToBase64(dashFile);
      const prompt = `Верни СТРОГО валидный JSON без markdown: {"company_name":"","period":"","ai_smart_insight":"","key_metrics_cards":[{"label":"","value":"","delta":""}],"breakdown_title":"","structure_breakdown":[{"category":"","amount":10}],"chart_series":{"metric_name":"","data_points":[{"year":"2023","value":100},{"year":"2024","value":120}]},"strategic_findings":[""],"marketing_and_clients":[""],"tech_and_ai":[""],"growth_hypotheses":[""]}`;
      const raw = await callGemini({
        parts: [{ inlineData: { mimeType: 'application/pdf', data: b64 } }, { text: prompt }],
        isJson: true
      });
      setDashData(JSON.parse(raw.replace(/```json|```/g, '').trim()));
    } catch (e) { setDashError(e.message); }
    finally { setDashLoading(false); }
  };

  const runCompare = async () => {
    setCmpError(''); setCmpResult('');
    if (!cmpFile1 || !cmpFile2) return setCmpError('Загрузите оба PDF-документа.');
    setCmpLoading(true);
    try {
      const b1 = await fileToBase64(cmpFile1);
      const b2 = await fileToBase64(cmpFile2);
      const out = await callGemini({
        parts: [
          { text: 'Документ №1:' }, { inlineData: { mimeType: 'application/pdf', data: b1 } },
          { text: 'Документ №2:' }, { inlineData: { mimeType: 'application/pdf', data: b2 } },
          { text: cmpPrompt }
        ]
      });
      setCmpResult(out);
    } catch (e) { setCmpError(e.message); }
    finally { setCmpLoading(false); }
  };

  const downloadMd = () => {
    const md = `# ${dashData.company_name} (${dashData.period})\n\n> ${dashData.ai_smart_insight}\n\n## KPI\n` +
      dashData.key_metrics_cards.map((c) => `- **${c.label}**: ${c.value} (${c.delta})`).join('\n') +
      `\n\n## Выводы\n` + dashData.strategic_findings.map((f) => `- ${f}`).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown;charset=utf-8;' }));
    a.download = `Report_${dashData.company_name}.md`;
    a.click();
  };

  const bgMain = darkMode ? 'bg-[#0B0E0D] text-[#F0F6F2]' : 'bg-[#F4F7F4] text-[#122118]';
  const bgSide = darkMode ? 'bg-[#101513] border-[#222D28]' : 'bg-[#ECF2EC] border-[#DCE7DD]';
  const bgCard = darkMode ? 'bg-[#141A18] border-[#232F2A]' : 'bg-white border-[#E0EAE1]';
  const muted = darkMode ? 'text-[#8FA89B]' : 'text-[#5E7366]';
  const inp = darkMode ? 'bg-[#1B2320] border-[#2B3933] text-white' : 'bg-white border-[#D3E2D5] text-[#122118]';

  const tabs = [
    { id: 'dashboard', label: 'Дашборд', icon: BarChart3 },
    { id: 'agent', label: 'Агент', icon: FileText },
    { id: 'compare', label: 'Сравнение 2 PDF', icon: Scale },
    { id: 'guide', label: 'Гайд', icon: BookOpen }
  ];

  return (
    <div className={`min-h-screen flex flex-col lg:flex-row transition-colors duration-300 ${bgMain}`}>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .page-anim { animation: slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>

      <aside className={`w-full lg:w-72 flex-shrink-0 border-b lg:border-b-0 lg:border-r p-5 flex flex-col justify-between ${bgSide}`}>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#112418] text-[#6EE79E] flex items-center justify-center font-bold">🌿</div>
              <div>
                <div className="font-bold text-sm">Doc & Market AI</div>
                <div className={`text-xs ${muted}`}>Analytics Studio</div>
              </div>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl border active:scale-95 transition-all cursor-pointer ${
                darkMode ? 'bg-[#1C2521] border-[#2C3A34] text-amber-300' : 'bg-white border-[#D5E3D7] text-[#122118]'
              }`}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className={`p-4 rounded-2xl border space-y-3 ${bgCard}`}>
            <div className="flex items-center gap-2 text-xs font-bold">
              <Key className="w-3.5 h-3.5 text-[#2E9E5B]" />
              <span>API-ключ и модель</span>
            </div>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
                if (!e.target.value.trim()) setModel('gemini-3.5-flash-lite');
              }}
              placeholder="Вставьте AIzaSy..."
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none ${inp}`}
            />
            <div className={`text-[11px] px-2.5 py-1.5 rounded-lg ${
              apiKey.trim() ? 'bg-emerald-500/15 text-emerald-500 font-medium' : muted
            }`}>
              {apiKey.trim() ? '✅ BYOK активен: открыты все модели' : '🆓 Базовый режим: бесплатная модель'}
            </div>
            <div>
              <label className={`text-[11px] flex items-center gap-1 mb-1 ${muted}`}>
                <Cpu className="w-3 h-3" /> Модель:
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className={`w-full px-2.5 py-2 text-xs rounded-xl border outline-none ${inp}`}
              >
                {models.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className={`mt-5 pt-3 border-t text-xs ${darkMode ? 'border-[#222D28]' : 'border-[#DCE7DD]'} ${muted}`}>
          <button onClick={() => setActiveTab('guide')} className="text-[#2E9E5B] font-semibold hover:underline cursor-pointer">
            📖 Как получить ключ за 15 сек →
          </button>
        </div>
      </aside>

      <main className="flex-1 p-5 sm:p-8 max-w-6xl mx-auto w-full">
        <div className={`p-1.5 rounded-2xl border grid grid-cols-2 sm:grid-cols-4 gap-2 mb-7 ${
          darkMode ? 'bg-[#121715] border-[#222D28]' : 'bg-[#E5EFE6] border-[#D5E3D7]'
        }`}>
          {tabs.map((t) => {
            const Icon = t.icon;
            const act = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-sm font-semibold transition-all active:scale-95 cursor-pointer ${
                  act
                    ? darkMode
                      ? 'bg-[#1E2824] text-white border border-[#34463E] shadow-lg'
                      : 'bg-white text-[#122118] border border-[#D4E2D6] shadow-md'
                    : muted
                }`}
              >
                <Icon className={`w-4 h-4 ${act ? 'text-[#2E9E5B]' : ''}`} />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {activeTab === 'dashboard' && (
          <div key="dash" className="page-anim space-y-6">
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${bgCard}`}>
              <label className="flex items-center gap-2 px-4 py-2 rounded-xl border border-dashed border-[#2E9E5B] cursor-pointer text-sm font-medium">
                <Upload className="w-4 h-4 text-[#2E9E5B]" />
                <span>{dashFile ? dashFile.name : 'Загрузить свой PDF-отчет'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setDashFile(e.target.files?.[0] || null)} />
              </label>
              <button
                onClick={runDash}
                disabled={dashLoading}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-[#2E9E5B] hover:bg-[#25854B] active:scale-95 text-white font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                {dashLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{dashLoading ? 'Анализирую...' : 'Построить дашборд'}</span>
              </button>
            </div>

            {dashError && (
              <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-500 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> <span>{dashError}</span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl font-bold">{dashData.company_name}</h1>
                <p className={`text-xs ${muted}`}>{dashData.period}</p>
              </div>
              <button onClick={downloadMd} className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${bgCard}`}>
                <Download className="w-3.5 h-3.5 text-[#2E9E5B]" /> Скачать (.md)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {dashData.key_metrics_cards.map((c, i) => (
                <div key={i} className={`p-5 rounded-2xl border ${i === 0 ? 'bg-[#112418] text-white border-[#1E422C]' : bgCard}`}>
                  <div className={`text-xs mb-1.5 ${i === 0 ? 'text-[#A6C4B0]' : muted}`}>{c.label}</div>
                  <div className="text-2xl font-bold mb-2">{c.value}</div>
                  {c.delta && (
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
                      i === 0 ? 'bg-emerald-400/20 text-[#6EE79E]' : 'bg-emerald-500/15 text-[#2E9E5B]'
                    }`}>
                      <TrendingUp className="w-3 h-3" /> {c.delta}
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className={`lg:col-span-7 p-5 rounded-2xl border ${bgCard}`}>
                <h3 className="font-bold text-sm mb-4">{dashData.breakdown_title}</h3>
                <DonutChart items={dashData.structure_breakdown || []} darkMode={darkMode} />
              </div>
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="p-5 rounded-2xl bg-[#112418] text-white border border-[#234A33]">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6EE79E] mb-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> AI Smart Insight
                  </div>
                  <p className="text-sm leading-relaxed text-[#EBF5EE]">{dashData.ai_smart_insight}</p>
                </div>
                <div className={`p-4 rounded-2xl border flex-1 ${bgCard}`}>
                  <AreaChart series={dashData.chart_series} darkMode={darkMode} />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { title: '🎯 Стратегические выводы', items: dashData.strategic_findings },
                { title: '💡 Гипотезы роста', items: dashData.growth_hypotheses },
                { title: '👥 Маркетинг и клиенты', items: dashData.marketing_and_clients },
                { title: '💻 Технологии и AI', items: dashData.tech_and_ai }
              ].map((blk, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border ${bgCard}`}>
                  <h3 className="font-bold text-sm mb-2.5">{blk.title}</h3>
                  <ul className="space-y-2 text-sm">
                    {(blk.items || []).map((txt, j) => (
                      <li key={j} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#2E9E5B] mt-2 flex-shrink-0" />
                        <span>{txt}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'agent' && (
          <div key="agent" className="page-anim space-y-5">
            <div className={`p-6 rounded-2xl border space-y-4 ${bgCard}`}>
              <h2 className="text-base font-bold">🛠️ Вопрос к документу</h2>
              <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-[#2E9E5B]/50 cursor-pointer">
                <Upload className="w-6 h-6 text-[#2E9E5B] mb-1.5" />
                <span className="text-sm font-medium">{agentFile ? agentFile.name : 'Выберите PDF-файл'}</span>
                <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setAgentFile(e.target.files?.[0] || null)} />
              </label>
              <textarea rows={3} value={agentPrompt} onChange={(e) => setAgentPrompt(e.target.value)} className={`w-full p-3 text-sm rounded-xl border outline-none ${inp}`} />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs cursor-pointer">
                  <input type="checkbox" checked={useSearch} onChange={(e) => setUseSearch(e.target.checked)} className="accent-[#2E9E5B]" />
                  <span>Google Search</span>
                </label>
                <button onClick={runAgent} disabled={agentLoading} className="px-5 py-2.5 rounded-xl bg-[#2E9E5B] text-white font-semibold text-sm flex items-center gap-2 cursor-pointer">
                  {agentLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  <span>Запустить</span>
                </button>
              </div>
            </div>
            {agentError && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-500 text-sm">{agentError}</div>}
            {agentResult && <div className={`p-5 rounded-2xl border whitespace-pre-wrap text-sm leading-relaxed ${bgCard}`}>{agentResult}</div>}
          </div>
        )}

        {activeTab === 'compare' && (
          <div key="cmp" className="page-anim space-y-5">
            <div className={`p-6 rounded-2xl border space-y-4 ${bgCard}`}>
              <h2 className="text-base font-bold">⚖️ Сравнение двух отчетов</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-[#2E9E5B]/50 cursor-pointer">
                  <Layers className="w-5 h-5 text-[#2E9E5B] mb-1" />
                  <span className="text-xs font-semibold">{cmpFile1 ? cmpFile1.name : 'Документ №1'}</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setCmpFile1(e.target.files?.[0] || null)} />
                </label>
                <label className="flex flex-col items-center justify-center p-5 rounded-xl border-2 border-dashed border-[#2E9E5B]/50 cursor-pointer">
                  <Layers className="w-5 h-5 text-[#2E9E5B] mb-1" />
                  <span className="text-xs font-semibold">{cmpFile2 ? cmpFile2.name : 'Документ №2'}</span>
                  <input type="file" accept="application/pdf" className="hidden" onChange={(e) => setCmpFile2(e.target.files?.[0] || null)} />
                </label>
              </div>
              <textarea rows={3} value={cmpPrompt} onChange={(e) => setCmpPrompt(e.target.value)} className={`w-full p-3 text-sm rounded-xl border outline-none ${inp}`} />
              <button onClick={runCompare} disabled={cmpLoading} className="px-5 py-2.5 rounded-xl bg-[#2E9E5B] text-white font-semibold text-sm flex items-center gap-2 cursor-pointer">
                {cmpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scale className="w-4 h-4" />}
                <span>Сравнить</span>
              </button>
            </div>
            {cmpError && <div className="p-3.5 rounded-xl bg-red-500/10 text-red-500 text-sm">{cmpError}</div>}
            {cmpResult && <div className={`p-5 rounded-2xl border whitespace-pre-wrap text-sm leading-relaxed ${bgCard}`}>{cmpResult}</div>}
          </div>
        )}

        {activeTab === 'guide' && (
          <div key="guide" className="page-anim space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl border space-y-2 text-sm ${bgCard}`}>
                <h3 className="font-bold">🆓 1. Бесплатный режим и BYOK</h3>
                <p>По умолчанию выбрана легкая модель <b>gemini-3.5-flash-lite</b> с широкими бесплатными лимитами. Вставьте свой личный API-ключ слева, чтобы разблокировать старшие модели (<b>gemini-3.8-flash</b>, <b>gemini-4-argon</b>).</p>
              </div>
              <div className={`p-5 rounded-2xl border space-y-2 text-sm ${bgCard}`}>
                <h3 className="font-bold">🔑 2. Как создать ключ за 15 секунд</h3>
                <p>Откройте Google AI Studio, нажмите <b>«Create API key»</b>, скопируйте ключ (<code className="text-[#2E9E5B]">AIzaSy...</code>) и вставьте его в поле слева.</p>
              </div>
            </div>
            <div className={`p-5 rounded-2xl border grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm ${bgCard}`}>
              <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="p-3 rounded-xl border border-[#2E9E5B]/30 flex items-center justify-between hover:border-[#2E9E5B]">
                <span>🔑 Создать API-ключ (AI Studio)</span> <ExternalLink className="w-4 h-4 text-[#2E9E5B]" />
              </a>
              <a href="https://aistudio.google.com/usage" target="_blank" rel="noreferrer" className="p-3 rounded-xl border border-[#2E9E5B]/30 flex items-center justify-between hover:border-[#2E9E5B]">
                <span>📊 Мониторинг квот и лимитов</span> <ExternalLink className="w-4 h-4 text-[#2E9E5B]" />
              </a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
