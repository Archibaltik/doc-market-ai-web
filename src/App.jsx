import React, { useState, useEffect } from 'react';
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
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_byok_key') || '');
  const [model, setModel] = useState('gemini-3.5-flash-lite');
  const [usedModelInfo, setUsedModelInfo] = useState('');

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

  useEffect(() => {
    if (apiKey.trim()) localStorage.setItem('gemini_byok_key', apiKey.trim());
    else localStorage.removeItem('gemini_byok_key');
  }, [apiKey]);

  const models = apiKey.trim()
    ? ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-4-argon']
    : ['gemini-3.5-flash-lite'];

  // Вызов Gemini API с авто-повтором (Retry) и резервным переключением моделей (Fallback) при 503/429
  const callGemini = async ({ parts, isJson = false, search = false }) => {
    if (!apiKey.trim()) throw new Error('Введите ваш бесплатный Gemini API Key слева (инструкция во вкладке «Гайд»).');
    setUsedModelInfo('');

    const fallbackChain = model === 'gemini-3.5-flash-lite'
      ? ['gemini-3.5-flash-lite', 'gemini-3.8-flash']
      : [model, 'gemini-3.5-flash-lite'];

    let lastError = null;

    for (const currentModel of fallbackChain) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey.trim()}`;
          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts }],
              generationConfig: {
                temperature: isJson ? 0.1 : 0.25,
                ...(isJson ? { responseMimeType: 'application/json' } : {})
              },
              ...(search ? { tools: [{ google_search: {} }] } : {})
            })
          });

          const data = await res.json();
          if (!res.ok) {
            const msg = data?.error?.message || `Ошибка API (${res.status})`;
            if (res.status === 503 || res.status === 429) {
              lastError = new Error(msg);
              await new Promise((r) => setTimeout(r, 2500));
              continue;
            }
            throw new Error(msg);
          }

          if (currentModel !== model) {
            setUsedModelInfo(`Выполнено резервной моделью: ${currentModel}`);
          }
          return data?.candidates?.[0]?.content?.parts?.[0]?.text || 'Пустой ответ.';
        } catch (err) {
          lastError = err;
        }
      }
    }
    throw lastError || new Error('Серверы Gemini временно перегружены. Повторите попытку через минуту.');
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
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="flex items-center gap-1.5"><Key className="w-3.5 h-3.5 text-[#2E9E5B]" /> API-ключ</span>
              {apiKey && (
                <button onClick={() => setApiKey('')} className="text-[11px] text-red-400 hover:underline cursor-pointer">
                  Очистить
                </button>
              )}
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
              {apiKey.trim() ? '✅ Ключ сохранен (BYOK активен)' : '🆓 Базовый режим: бесплатная модель'}
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
