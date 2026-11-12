import React, { useState } from 'react';
import {
  FileText, BarChart3, Scale, BookOpen, Sun, Moon, Key, Upload,
  Sparkles, Download, TrendingUp, CheckCircle2, ExternalLink,
  Layers, AlertCircle, Loader2, Cpu
} from 'lucide-react';

const DEMO_DATA = {
  company_name: "Технологический Лидер (Демо)",
  period: "2024–2025 гг.",
  ai_smart_insight: "Выручка выросла на 28.4% за счет масштабирования облачных AI-сервисов и снижения стоимости привлечения клиентов на 14%. Доля цифровых продуктов впервые превысила 62%.",
  key_metrics_cards: [
    { label: "Общая выручка", value: "1 480 млрд ₽", delta: "+28.4%" },
    { label: "Чистая прибыль", value: "312 млрд ₽", delta: "+19.1%" },
    { label: "Рентабельность", value: "34.8%", delta: "+3.2 п.п." },
    { label: "Активные клиенты", value: "42.5 млн", delta: "+15.0%" }
  ],
  breakdown_title: "Структура выручки по сегментам",
  structure_breakdown: [
    { category: "Облако и AI", amount: 42 },
    { category: "Финтех и платежи", amount: 28 },
    { category: "Подписки и сервисы", amount: 18 },
    { category: "B2B-реклама", amount: 12 }
  ],
  chart_series: {
    metric_name: "Динамика выручки (млрд ₽)",
    data_points: [
      { year: "2021", value: 690 },
      { year: "2022", value: 840 },
      { year: "2023", value: 1152 },
      { year: "2024", value: 1310 },
      { year: "2025", value: 1480 }
    ]
  },
  strategic_findings: [
    "Переход корпоративных клиентов на собственные AI-модели снизил зависимость от внешних подрядчиков.",
    "Операционные расходы на инфраструктуру сократились на 11% за счет оптимизации вычислений.",
    "Свободный денежный поток вырос на 24%, позволяя финансировать R&D без внешнего долга."
  ],
  marketing_and_clients: [
    "Единая подписка увеличила частоту транзакций на одного клиента на 22%.",
    "Стоимость привлечения (CAC) в B2B снизилась на 14% благодаря органическому притоку."
  ],
  tech_and_ai: [
    "Более 45% клиентских обращений обрабатываются с участием AI-ассистентов.",
    "Время вывода новых продуктов на рынок сократилось в 1.8 раза."
  ],
  growth_hypotheses: [
    "Отраслевые AI-агенты для малого бизнеса дадут +120 млрд ₽ выручки за 18 месяцев.",
    "Интеграция финтех-инструментов в B2B-тарифы повысит средний чек на 18–20%."
  ]
};

const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result.split(',')[1]);
  reader.onerror = (err) => reject(err);
});

function DonutChart({ items, darkMode }) {
  const [hovered, setHovered] = useState(null);
  const colors = darkMode
    ? ['#3DD679', '#269954', '#6EE79E', '#1E6B3E', '#8FA89B']
    : ['#112418', '#2E9E5B', '#6BCB77', '#A3E4A8', '#C8E6C9'];

  const total = items.reduce((sum, x) => sum + Number(x.amount || 0), 0) || 1;
  const size = 196;
  const stroke = 28;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  let offsetAcc = 0;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90 transform">
          {items.map((item, i) => {
            const pct = (Number(item.amount) / total) * 100;
            const dash = `${(pct / 100) * circ} ${circ}`;
            const offset = -((offsetAcc / 100) * circ);
            offsetAcc += pct;
            return (
              <circle
                key={i}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="transparent"
                stroke={colors[i % colors.length]}
                strokeWidth={hovered === i ? stroke + 4 : stroke}
                strokeDasharray={dash}
                strokeDashoffset={offset}
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-3 pointer-events-none">
          <span className={`text-[11px] ${darkMode ? 'text-emerald-300/70' : 'text-emerald-900/60'}`}>
            {hovered !== null ? items[hovered].category : 'Сегментов'}
          </span>
          <span className="text-lg font-bold">
            {hovered !== null ? `${((Number(items[hovered].amount) / total) * 100).toFixed(1)}%` : items.length}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full space-y-2">
        {items.map((item, i) => {
          const share = ((Number(item.amount) / total) * 100).toFixed(0);
          return (
            <div
              key={i}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
              className={`flex items-center justify-between px-3 py-2 rounded-xl transition-all cursor-pointer ${
                hovered === i ? (darkMode ? 'bg-emerald-950/60' : 'bg-emerald-50') : ''
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[i % colors.length] }} />
                <span className="text-sm font-medium">{item.category}</span>
              </div>
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                darkMode ? 'bg-emerald-900/60 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {share}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AreaChart({ series, darkMode }) {
  const [idx, setIdx] = useState(null);
  const pts = series?.data_points || [];
  if (pts.length < 2) return null;

  const w = 440, h = 155, px = 26, py = 22;
  const vals = pts.map((p) => Number(p.value));
  const minV = Math.min(...vals) * 0.85;
  const maxV = Math.max(...vals) * 1.08 || 1;

  const coords = pts.map((p, i) => ({
    x: px + (i / (pts.length - 1)) * (w - px * 2),
    y: h - py - ((Number(p.value) - minV) / (maxV - minV)) * (h - py * 2),
    year: p.year,
    value: p.value
  }));

  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const area = `${line} L ${coords[coords.length - 1].x} ${h - py} L ${coords[0].x} ${h - py} Z`;
  const stroke = darkMode ? '#3DD679' : '#2E9E5B';

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-semibold">{series.metric_name}</span>
        {idx !== null && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            darkMode ? 'bg-emerald-900/70 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {coords[idx].year}: {coords[idx].value}
          </span>
        )}
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-36 overflow-visible">
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
            <stop offset="100%" stopColor={stroke} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaGrad)" />
        <path d={line} fill="none" stroke={stroke} strokeWidth="3" strokeLinecap="round" />
        {coords.map((c, i) => (
          <g key={i} className="cursor-pointer" onMouseEnter={() => setIdx(i)} onMouseLeave={() => setIdx(null)}>
            <circle cx={c.x} cy={c.y} r={idx === i ? 6.5 : 4} fill={stroke} stroke={darkMode ? '#141A18' : '#FFF'} strokeWidth="2" />
            <text x={c.x} y={h - 4} textAnchor="middle" fontSize="11" fill={darkMode ? '#8FA89B' : '#5E7366'}>{c.year}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

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
    if (!apiKey.trim()) {
      throw new Error('Введите ваш бесплатный Gemini API Key в боковой панели слева (инструкция во вкладке «Гайд»).');
    }
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey.trim()}`;
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
