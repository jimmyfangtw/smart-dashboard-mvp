import React, { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "smart-dashboard-admin-v5";
const COLORS = ["#38bdf8", "#818cf8", "#22c55e", "#f59e0b", "#ef4444", "#a855f7", "#14b8a6"];

const DEFAULT_DATA = {
  menuDisplayDate: "2026-04-21",
  stats: {
    serviceCount: 96,
    avgAge: 34,
    maleCount: 58,
    femaleCount: 38,
    officialStaff: 24,
    outsourcedStaff: 11,
  },
  ageData: [
    { label: "18-29歲", value: 26, color: "#38bdf8" },
    { label: "30-39歲", value: 31, color: "#818cf8" },
    { label: "40-49歲", value: 24, color: "#22c55e" },
    { label: "50歲以上", value: 15, color: "#f59e0b" },
  ],
  disabilityData: [
    { label: "智能障礙", value: 40, color: "#38bdf8" },
    { label: "自閉症", value: 18, color: "#818cf8" },
    { label: "多重障礙", value: 22, color: "#22c55e" },
    { label: "其他", value: 16, color: "#f59e0b" },
  ],
  menu: {
    breakfast: "燕麥粥、銀絲卷、豆漿",
    lunch: "香菇雞湯、炒高麗菜、白飯、滷豆干",
    snack: "香蕉、優格",
    dinner: "番茄肉醬麵、青花菜、玉米濃湯",
  },
  locations: [
    { date: "2026-04-03", name: "台北101", note: "城市地標導覽", x: 72, y: 32 },
    { date: "2026-04-10", name: "國父紀念館", note: "社會適應參訪", x: 64, y: 37 },
    { date: "2026-04-17", name: "林安泰古厝", note: "文化體驗", x: 46, y: 26 },
  ],
  fitnessData: [
    { month: "11月", avg: 6.4, a: 6.0, b: 6.8 },
    { month: "12月", avg: 6.8, a: 6.5, b: 7.0 },
    { month: "1月", avg: 7.1, a: 6.9, b: 7.4 },
    { month: "2月", avg: 7.0, a: 6.7, b: 7.3 },
    { month: "3月", avg: 7.4, a: 7.1, b: 7.8 },
    { month: "4月", avg: 7.6, a: 7.3, b: 7.9 },
  ],
  highlightMonth: "2026-04",
  highlights: [
    {
      topic: "個別化支持計畫",
      content: "辦理本月個別化支持計畫檢討與修正。",
    },
    {
      topic: "社區適應活動",
      content: "社區適應活動增加 3 個外出據點。",
    },
    {
      topic: "值班交接流程",
      content: ["值班交接流程盤點完成。", "更新異常通報表單。"].join("\n"),
    },
    {
      topic: "體適能追蹤",
      content: "體適能平均時數較上月提升 0.2 小時。",
    },
  ],
  dutyDate: "2026-04-19",
  duties: [
    { shift: "早班", staff: "王小明", note: "1樓生活照護" },
    { shift: "中班", staff: "陳美華", note: "活動支援" },
    { shift: "晚班", staff: "林志宏", note: "夜間巡視" },
  ],
};

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function normalizeHighlights(highlights) {
  if (!Array.isArray(highlights)) return DEFAULT_DATA.highlights;
  return highlights.map((item) => {
    if (typeof item === "string") {
      return { topic: "工作主題", content: item };
    }
    return {
      topic: String(item?.topic || "工作主題"),
      content: String(item?.content || ""),
    };
  });
}

function cloneDefaults(data) {
  const safeMenuDisplayDate = isValidIsoDate(data?.menuDisplayDate)
    ? data.menuDisplayDate
    : DEFAULT_DATA.menuDisplayDate;
  const safeDutyDate = isValidIsoDate(data?.dutyDate)
    ? data.dutyDate
    : DEFAULT_DATA.dutyDate;

  return {
    ...DEFAULT_DATA,
    ...data,
    menuDisplayDate: safeMenuDisplayDate,
    dutyDate: safeDutyDate,
    stats: { ...DEFAULT_DATA.stats, ...(data?.stats || {}) },
    menu: { ...DEFAULT_DATA.menu, ...(data?.menu || {}) },
    ageData: Array.isArray(data?.ageData) ? data.ageData : DEFAULT_DATA.ageData,
    disabilityData: Array.isArray(data?.disabilityData) ? data.disabilityData : DEFAULT_DATA.disabilityData,
    locations: Array.isArray(data?.locations) ? data.locations : DEFAULT_DATA.locations,
    fitnessData: Array.isArray(data?.fitnessData) ? data.fitnessData : DEFAULT_DATA.fitnessData,
    highlights: normalizeHighlights(data?.highlights),
    duties: Array.isArray(data?.duties) ? data.duties : DEFAULT_DATA.duties,
  };
}

function loadData() {
  if (typeof window === "undefined") return cloneDefaults(DEFAULT_DATA);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return cloneDefaults(DEFAULT_DATA);
    return cloneDefaults(JSON.parse(raw));
  } catch {
    return cloneDefaults(DEFAULT_DATA);
  }
}

function formatNow() {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(new Date());
}

function weekdayText(dateString) {
  const map = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"];
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? "" : map[d.getDay()];
}

function specialMealText(dateString) {
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.getDay();
  if (day === 1) return "地中海餐";
  if (day === 4) return "快樂餐";
  if (day === 5) return "蔬食餐";
  return "";
}

function menuDateLine(dateString) {
  if (!isValidIsoDate(dateString)) return "請選擇日期";
  const d = new Date(dateString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const special = specialMealText(dateString);
  return `${y}/${m}/${day} ${weekdayText(dateString)}${special ? `  |  ${special}` : ""}`;
}

function normalizeSpaces(text) {
  return String(text || "")
    .replace(/[\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractDigitsLeft(text, endIndex, maxDigits = 3) {
  let result = "";
  let index = endIndex;
  while (index >= 0 && result.length < maxDigits) {
    const ch = text[index];
    if (ch >= "0" && ch <= "9") {
      result = ch + result;
      index -= 1;
    } else {
      break;
    }
  }
  return result;
}

function extractDigitsRight(text, startIndex, maxDigits = 2) {
  let result = "";
  let index = startIndex;
  while (index < text.length && result.length < maxDigits) {
    const ch = text[index];
    if (ch >= "0" && ch <= "9") {
      result += ch;
      index += 1;
    } else {
      break;
    }
  }
  return result;
}

function inferPdfYear(text, fallbackYear) {
  const yearIndex = text.indexOf("年");
  if (yearIndex === -1) return fallbackYear;
  const digits = extractDigitsLeft(text, yearIndex - 1, 3);
  if (!digits) return fallbackYear;
  const year = Number(digits);
  if (!Number.isFinite(year) || year <= 0) return fallbackYear;
  return year < 1911 ? year + 1911 : year;
}

function isValidIsoDate(dateString) {
  const text = String(dateString || "");
  if (text.length !== 10) return false;
  if (text[4] !== "-" || text[7] !== "-") return false;
  const y = Number(text.slice(0, 4));
  const m = Number(text.slice(5, 7));
  const d = Number(text.slice(8, 10));
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return false;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === y && date.getMonth() + 1 === m && date.getDate() === d;
}

function extractMonthDay(text) {
  const monthIndex = text.indexOf("月");
  if (monthIndex === -1) return null;
  const dayIndex = text.indexOf("日", monthIndex + 1);
  if (dayIndex === -1) return null;
  const monthText = extractDigitsLeft(text, monthIndex - 1, 2);
  const dayText = extractDigitsLeft(text, dayIndex - 1, 2);
  if (!monthText || !dayText) return null;
  const month = Number(monthText);
  const day = Number(dayText);
  if (!Number.isFinite(month) || !Number.isFinite(day)) return null;
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  return { month, day };
}

function normalizeImportedDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function buildPdfRows(items) {
  const buckets = new Map();
  items.forEach((item) => {
    const str = normalizeSpaces(item?.str || "");
    if (!str) return;
    const x = item?.transform?.[4] || 0;
    const y = item?.transform?.[5] || 0;
    const key = Math.round(y / 2) * 2;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push({ str, x, y });
  });
  return Array.from(buckets.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([, row]) => row.sort((a, b) => a.x - b.x));
}

function detectMealKey(lineText) {
  if (lineText.includes("早餐")) return "breakfast";
  if (lineText.includes("午餐")) return "lunch";
  if (lineText.includes("晚餐")) return "dinner";
  return "";
}

function cleanupMenuSummary(text) {
  let cleaned = normalizeSpaces(text);
  ["早餐", "午餐", "晚餐", "◎", "＊", "*", "#"].forEach((token) => {
    cleaned = cleaned.split(token).join(" ");
  });
  cleaned = normalizeSpaces(cleaned);
  return cleaned.split(" ").filter(Boolean).join("、");
}

function extractMenuSummaryFromRow(row, pageWidth) {
  const startX = pageWidth * 0.14;
  const endX = pageWidth * 0.79;
  const raw = row
    .filter((item) => item.x >= startX && item.x <= endX)
    .map((item) => item.str)
    .join(" ");
  return cleanupMenuSummary(raw);
}

async function parseMenuPdfFile(file, fallbackYear) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (pdfjs?.GlobalWorkerOptions) {
    try {
      const workerModule = await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url");
      if (workerModule?.default) {
        pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;
      }
    } catch {
      // 預覽環境若不支援 ?url，會在後續 getDocument 時拋錯，再交由外層顯示訊息
    }
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const pdf = await pdfjs.getDocument({ data: bytes }).promise;
  const pages = [];
  let fullText = "";

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 1 });
    const textContent = await page.getTextContent();
    const rows = buildPdfRows(textContent.items || []);
    fullText += ` ${textContent.items.map((item) => item.str).join(" ")}`;
    pages.push({ width: viewport.width, rows });
  }

  const year = inferPdfYear(fullText, fallbackYear);
  const resultMap = {};

  pages.forEach((page) => {
    let currentDate = "";
    page.rows.forEach((row) => {
      const lineText = normalizeSpaces(row.map((item) => item.str).join(" "));
      if (!lineText) return;

      const monthDay = extractMonthDay(lineText);
      if (monthDay) {
        currentDate = normalizeImportedDate(year, monthDay.month, monthDay.day);
        if (!resultMap[currentDate]) {
          resultMap[currentDate] = {
            date: currentDate,
            breakfast: "",
            lunch: "",
            dinner: "",
          };
        }
      }

      const mealKey = detectMealKey(lineText);
      if (!currentDate || !mealKey) return;

      const summary = extractMenuSummaryFromRow(row, page.width);
      if (!summary) return;
      resultMap[currentDate][mealKey] = summary;
    });
  });

  return Object.values(resultMap)
    .filter((item) => isValidIsoDate(item.date) && (item.breakfast || item.lunch || item.dinner))
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
}

function StatBox({ title, value, unit, sub }) {
  return (
    <div style={styles.statBox}>
      <div style={styles.statLabel}>{title}</div>
      <div style={styles.statValueRow}>
        <div style={styles.statValue}>{value}</div>
        {unit ? <div style={styles.statUnit}>{unit}</div> : null}
      </div>
      {sub ? <div style={styles.muted}>{sub}</div> : null}
    </div>
  );
}

function Card({ title, right, children, style }) {
  return (
    <div style={{ ...styles.card, ...(style || {}) }}>
      {title || right ? (
        <div style={styles.cardHeader}>
          <div style={styles.cardTitle}>{title}</div>
          <div style={styles.cardRight}>{right}</div>
        </div>
      ) : null}
      {children}
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div style={styles.field}>
      <div style={styles.fieldLabel}>{label}</div>
      {children}
      {hint ? <div style={styles.fieldHint}>{hint}</div> : null}
    </div>
  );
}

function downloadJson(filename, data) {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 300);
    return { ok: true, json };
  } catch {
    try {
      return { ok: false, json: JSON.stringify(data, null, 2) };
    } catch {
      return { ok: false, json: "" };
    }
  }
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function pieTotal(items) {
  return Math.max(items.reduce((sum, item) => sum + toNumber(item.value), 0), 1);
}

function PieChartBlock({ items }) {
  const total = pieTotal(items);
  let offset = 0;
  const r = 70;
  const c = 2 * Math.PI * r;

  return (
    <div style={styles.pieWrap}>
      <svg viewBox="0 0 220 220" width="182" height="182">
        <g transform="rotate(-90 110 110)">
          {items.map((item, idx) => {
            const dash = (toNumber(item.value) / total) * c;
            const node = (
              <circle
                key={`${item.label}-${idx}`}
                cx="110"
                cy="110"
                r={r}
                fill="none"
                stroke={item.color || COLORS[idx % COLORS.length]}
                strokeWidth="34"
                strokeDasharray={`${dash} ${c - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return node;
          })}
        </g>
        <circle cx="110" cy="110" r="34" fill="#0f172a" />
      </svg>
      <div style={styles.legendCol}>
        {items.map((item, idx) => (
          <div key={`${item.label}-legend-${idx}`} style={styles.legendItem}>
            <span style={{ ...styles.legendDot, background: item.color || COLORS[idx % COLORS.length] }} />
            <span>{item.label}：{item.value}人</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function linePath(rows, key, width, height, min, max) {
  const left = 50;
  const right = width - 30;
  const top = 20;
  const bottom = height - 40;
  const step = rows.length > 1 ? (right - left) / (rows.length - 1) : 0;
  const scaleY = (v) => bottom - ((v - min) / Math.max(max - min, 0.1)) * (bottom - top);
  return rows.map((row, i) => `${i === 0 ? "M" : "L"}${left + i * step},${scaleY(toNumber(row[key]))}`).join(" ");
}

export default function App() {
  const [data, setData] = useState(loadData);
  const [now, setNow] = useState(formatNow());
  const [mode, setMode] = useState("dashboard");
  const [adminTab, setAdminTab] = useState("basic");
  const [menuIndex, setMenuIndex] = useState(0);
    const [saveText, setSaveText] = useState("後台已載入");
  const [menuImportStatus, setMenuImportStatus] = useState("尚未匯入菜單 PDF");
  const [menuPdfOptions, setMenuPdfOptions] = useState([]);
  const [selectedMenuPdfDate, setSelectedMenuPdfDate] = useState("");
  const [menuPdfLoading, setMenuPdfLoading] = useState(false);
  const [menuPdfApplyDate, setMenuPdfApplyDate] = useState(DEFAULT_DATA.menuDisplayDate);
  const [jsonExportText, setJsonExportText] = useState("");
  const importRef = useRef(null);
  const menuPdfRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(formatNow()), 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    setSaveText(`已自動儲存：${formatNow()}`);
  }, [data]);

  useEffect(() => {
    if (isValidIsoDate(selectedMenuPdfDate)) {
      setMenuPdfApplyDate(selectedMenuPdfDate);
      return;
    }
    if (isValidIsoDate(data.menuDisplayDate)) {
      setMenuPdfApplyDate(data.menuDisplayDate);
    }
  }, [selectedMenuPdfDate, data.menuDisplayDate]);

  const genderTotal = toNumber(data.stats.maleCount) + toNumber(data.stats.femaleCount);
  const malePct = genderTotal ? Math.round((toNumber(data.stats.maleCount) / genderTotal) * 100) : 0;
  const femalePct = genderTotal ? Math.round((toNumber(data.stats.femaleCount) / genderTotal) * 100) : 0;

  const menuItems = useMemo(() => [
    { label: "早餐", text: data.menu.breakfast },
    { label: "午餐", text: data.menu.lunch },
    { label: "晚餐", text: data.menu.dinner },
  ], [data.menu]);

  const fitnessScale = useMemo(() => {
    const values = data.fitnessData.flatMap((r) => [toNumber(r.avg), toNumber(r.a), toNumber(r.b)]);
    return { min: Math.min(...values, 0) - 0.2, max: Math.max(...values, 1) + 0.2 };
  }, [data.fitnessData]);

  const sortedLocations = useMemo(() => {
    return [...data.locations].sort((a, b) => String(b.date).localeCompare(String(a.date)));
  }, [data.locations]);

  

  function updateStats(key, value) {
    setData((prev) => ({ ...prev, stats: { ...prev.stats, [key]: value } }));
  }

  function updateMenu(key, value) {
    setData((prev) => ({ ...prev, menu: { ...prev.menu, [key]: value } }));
  }

  function updateRoot(key, value) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateObjectArray(arrayKey, index, field, value) {
    setData((prev) => ({
      ...prev,
      [arrayKey]: prev[arrayKey].map((item, idx) => (idx === index ? { ...item, [field]: value } : item)),
    }));
  }

  function updateStringArray(arrayKey, index, value) {
    setData((prev) => ({
      ...prev,
      [arrayKey]: prev[arrayKey].map((item, idx) => (idx === index ? value : item)),
    }));
  }

  function addItem(arrayKey, item) {
    setData((prev) => ({ ...prev, [arrayKey]: [...prev[arrayKey], item] }));
  }

  function removeItem(arrayKey, index) {
    setData((prev) => ({ ...prev, [arrayKey]: prev[arrayKey].filter((_, idx) => idx !== index) }));
  }

  function handleMenuAnimationEnd() {
    setMenuIndex((prev) => (prev + 1) % menuItems.length);
  }

  function resetDefault() {
    setData(cloneDefaults(DEFAULT_DATA));
    setMenuPdfOptions([]);
    setSelectedMenuPdfDate("");
    setMenuImportStatus("尚未匯入菜單 PDF");
    setSaveText("已恢復預設資料");
  }

  function importJsonFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || "{}"));
        setData(cloneDefaults(parsed));
        setMenuPdfOptions([]);
        setSelectedMenuPdfDate("");
        setMenuImportStatus("已載入 JSON 備份");
        setSaveText("已載入 JSON 備份");
      } catch {
        setSaveText("JSON 載入失敗");
      }
    };
    reader.readAsText(file, "utf-8");
    event.target.value = "";
  }

  async function importMenuPdf(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setMenuPdfLoading(true);
    setMenuImportStatus("PDF 解析中...");

    try {
      const fallbackYear = new Date(data.menuDisplayDate).getFullYear() || new Date().getFullYear();
      const parsed = await parseMenuPdfFile(file, fallbackYear);
      setMenuPdfOptions(parsed);

      if (!parsed.length) {
        setSelectedMenuPdfDate("");
        setMenuPdfApplyDate(isValidIsoDate(data.menuDisplayDate) ? data.menuDisplayDate : DEFAULT_DATA.menuDisplayDate);
        setMenuImportStatus("未解析到可用菜單資料");
        return;
      }

      const matched = parsed.find((item) => item.date === data.menuDisplayDate);
      const targetDate = matched ? matched.date : parsed[0].date;
      setSelectedMenuPdfDate(targetDate);
      setMenuPdfApplyDate(isValidIsoDate(targetDate) ? targetDate : (isValidIsoDate(data.menuDisplayDate) ? data.menuDisplayDate : DEFAULT_DATA.menuDisplayDate));
      setMenuImportStatus(`PDF 解析完成，共 ${parsed.length} 天資料`);
    } catch (error) {
      const detail = error && typeof error === "object" && "message" in error ? String(error.message) : "未知錯誤";
      setMenuImportStatus(`PDF 匯入失敗：${detail}`);
    } finally {
      setMenuPdfLoading(false);
      event.target.value = "";
    }
  }

  function applyMenuPdfSelection(changeDisplayDate = true) {
    if (!selectedMenuPdfDate) return;
    const target = menuPdfOptions.find((item) => item.date === selectedMenuPdfDate);
    if (!target) return;

    const finalApplyDate = isValidIsoDate(menuPdfApplyDate)
      ? menuPdfApplyDate
      : (isValidIsoDate(target.date) ? target.date : data.menuDisplayDate);

    setData((prev) => ({
      ...prev,
      menuDisplayDate: changeDisplayDate ? finalApplyDate : prev.menuDisplayDate,
      menu: {
        ...prev.menu,
        breakfast: target.breakfast || prev.menu.breakfast,
        lunch: target.lunch || prev.menu.lunch,
        dinner: target.dinner || prev.menu.dinner,
      },
    }));
    setSaveText(`已套用 PDF 菜單：${finalApplyDate}`);
  }

  return (
    <div style={styles.page}>
      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Microsoft JhengHei, PingFang TC, sans-serif; }
        @keyframes scrollUpPreview {
          0% { transform: translateY(0); }
          100% { transform: translateY(-50%); }
        }
        @keyframes menuMarqueePreview {
          0% { transform: translateX(100%); opacity: 1; }
          100% { transform: translateX(-110%); opacity: 1; }
        }
        .scroll-track-preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: scrollUpPreview 24s linear infinite;
        }
        .highlight-scroll-track-preview {
          display: flex;
          flex-direction: column;
          gap: 12px;
          animation: scrollUpPreview 240s linear infinite;
        }
        .location-scroll-track-preview {
          display: flex;
          flex-direction: column;
          gap: 8px;
          animation: scrollUpPreview 60s linear infinite;
        }
        .menu-marquee-track-preview {
          display: inline-block;
          white-space: nowrap;
          animation: menuMarqueePreview 12s linear 1 forwards;
          padding-right: 24px;
        }
        @media (max-width: 1200px) {
          .dashboard-grid { grid-template-columns: 1fr !important; }
          .map-grid { grid-template-columns: 1fr !important; }
          .admin-layout { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 760px) {
          .stats-grid { grid-template-columns: 1fr !important; }
          .admin-grid { grid-template-columns: 1fr !important; }
          .system-grid { grid-template-columns: 1fr !important; }
          .row-grid-4, .row-grid-5, .row-grid-text { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <div style={styles.eyebrow}>Smart Dashboard</div>
            <h1 style={styles.title}>臺北市立陽明教養院智慧看板</h1>
            <div style={styles.headerSub}>前台已確認，後台為可操作版</div>
          </div>
          <div style={styles.headerRight}>            <div style={styles.toolbar}>
              <button style={{ ...styles.button, ...(mode === "dashboard" ? styles.buttonActive : {}) }} onClick={() => setMode("dashboard")}>前台看板</button>
              <button style={{ ...styles.button, ...(mode === "admin" ? styles.buttonActive : {}) }} onClick={() => setMode("admin")}>管理後台</button>
            </div>
          </div>
        </div>

        {mode === "dashboard" ? (
          <div className="dashboard-grid" style={styles.dashboardGrid}>
            <div style={styles.column}>
              <Card title="服務資訊" style={styles.leftTopCard}>
                <div className="stats-grid" style={styles.statsGrid}>
                  <StatBox title="服務對象人數" value={data.stats.serviceCount} unit="人" />
                  <StatBox title="平均年齡" value={data.stats.avgAge} unit="歲" />
                  <StatBox title="男性比例" value={malePct} unit="%" sub={`${data.stats.maleCount} 人`} />
                  <StatBox title="女性比例" value={femalePct} unit="%" sub={`${data.stats.femaleCount} 人`} />
                </div>
              </Card>

              <Card title="年齡分佈" style={styles.leftMiddleCard}>
                <PieChartBlock items={data.ageData} />
              </Card>

              <Card title="障礙等級" style={styles.leftBottomCard}>
                <PieChartBlock items={data.disabilityData} />
              </Card>
            </div>

            <div style={styles.column}>
              <Card title="今日菜單" style={styles.middleTopCard}>
                <div style={styles.menuDate}>{menuDateLine(data.menuDisplayDate)}</div>
                <div style={styles.menuViewport}>
                  <div key={`menu-${menuIndex}`} className="menu-marquee-track-preview" style={styles.menuTrack} onAnimationEnd={handleMenuAnimationEnd}>
                    {menuItems[menuIndex].label}：{menuItems[menuIndex].text}
                  </div>
                </div>
              </Card>

              <Card title="體適能時數" style={styles.middleMidCard}>
                <div style={styles.chartWrap}>
                  <svg viewBox="0 0 820 320" style={styles.chartSvg}>
                    {[0, 1, 2, 3, 4].map((i) => {
                      const y = 40 + i * 55;
                      return <line key={`grid-${i}`} x1="50" y1={y} x2="790" y2={y} stroke="#334155" strokeWidth="1" />;
                    })}
                    <line x1="50" y1="260" x2="790" y2="260" stroke="#334155" strokeWidth="1" />
                    <line x1="50" y1="20" x2="50" y2="260" stroke="#334155" strokeWidth="1" />
                    {data.fitnessData.map((row, index) => {
                      const x = 50 + index * ((790 - 50) / Math.max(data.fitnessData.length - 1, 1));
                      return <text key={`month-${index}`} x={x} y="292" textAnchor="middle" fill="#94a3b8" fontSize="14">{row.month}</text>;
                    })}
                    <path d={linePath(data.fitnessData, "avg", 820, 320, fitnessScale.min, fitnessScale.max)} fill="none" stroke="#38bdf8" strokeWidth="4" />
                    <path d={linePath(data.fitnessData, "a", 820, 320, fitnessScale.min, fitnessScale.max)} fill="none" stroke="#818cf8" strokeWidth="4" />
                    <path d={linePath(data.fitnessData, "b", 820, 320, fitnessScale.min, fitnessScale.max)} fill="none" stroke="#22c55e" strokeWidth="4" />
                    {data.fitnessData.map((row, index) => {
                      const x = 50 + index * ((790 - 50) / Math.max(data.fitnessData.length - 1, 1));
                      const yFor = (v) => 280 - ((toNumber(v) - fitnessScale.min) / Math.max(fitnessScale.max - fitnessScale.min, 0.1)) * 240;
                      return (
                        <g key={`dot-${index}`}>
                          <circle cx={x} cy={yFor(row.avg)} r="5" fill="#38bdf8" />
                          <circle cx={x} cy={yFor(row.a)} r="5" fill="#818cf8" />
                          <circle cx={x} cy={yFor(row.b)} r="5" fill="#22c55e" />
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </Card>

              <Card title="社會適應地點" style={styles.flexCard}>
                <div className="map-grid" style={styles.mapGrid}>
                  <div style={styles.mapBox}>
                    <div style={styles.mapRoads} />
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={styles.mapSvg}>
                      <polyline
                        points={data.locations.map((loc) => `${loc.x},${loc.y}`).join(" ")}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="1.3"
                      />
                    </svg>
                    {data.locations.map((loc, idx) => (
                      <div key={`marker-${idx}`} style={{ ...styles.marker, left: `${loc.x}%`, top: `${loc.y}%` }}>
                        <div style={styles.markerDot} />
                        <div style={styles.markerLabel}>{String(loc.date).slice(5)} {loc.name}</div>
                      </div>
                    ))}
                    {sortedLocations[0] ? (
                      <div style={styles.mapOverlayBadge}>
                        最近地點：{sortedLocations[0].name}
                      </div>
                    ) : null}
                  </div>
                  <div style={styles.locationListViewport}>
                    <div className="location-scroll-track-preview">
                      {[...sortedLocations, ...sortedLocations].map((loc, idx) => (
                        <div key={`loc-card-${idx}`} style={styles.locationCard}>
                          <div style={styles.locationDate}>{loc.date}</div>
                          <div style={styles.locationName}>{loc.name}</div>
                          <div style={styles.muted}>{loc.note}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            </div>

            <div style={styles.column}>
              <Card title="工作與人力資訊" style={styles.rightTopCard}>
                <div className="stats-grid" style={styles.statsGrid}>
                  <StatBox title="正式人力" value={data.stats.officialStaff} unit="人" />
                  <StatBox title="委外人力" value={data.stats.outsourcedStaff} unit="人" />
                </div>
              </Card>

              <Card title="本月工作重點" right={data.highlightMonth} style={styles.rightMiddleCard}>
                <div style={styles.highlightViewport}>
                  <div className="highlight-scroll-track-preview">
                    {[...data.highlights, ...data.highlights].map((item, idx) => (
                      <div key={`highlight-card-${idx}`} style={styles.highlightCard}>
                        <div style={styles.highlightTopicLabel}>工作主題</div>
                        <div style={styles.highlightTopic}>{item.topic || "未設定"}</div>
                        <div style={styles.highlightContentLabel}>工作內容</div>
                        <div style={styles.highlightContent}>{item.content || "尚未建立工作內容"}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>

              <Card title="值班表" right={data.dutyDate} style={styles.rightBottomCard}>
                <div style={styles.tableWrap}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>班別</th>
                        <th style={styles.th}>人員</th>
                        <th style={styles.th}>備註</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.duties.map((row, idx) => (
                        <tr key={`duty-${idx}`}>
                          <td style={styles.td}>{row.shift}</td>
                          <td style={styles.td}>{row.staff}</td>
                          <td style={styles.td}>{row.note}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <div className="admin-layout" style={styles.adminLayout}>
            <div>
              <Card title="後台功能選單">
                <div style={styles.saveBanner}>{saveText}</div>
                <div style={styles.tabList}>
                  {[
                    ["basic", "基本資料"],
                    ["menu", "今日菜單"],
                    ["location", "社會適應地點"],
                    ["fitness", "體適能時數"],
                    ["highlight", "本月工作重點"],
                    ["duty", "值班表"],
                    ["system", "系統資料"],
                  ].map(([key, label]) => (
                    <button key={key} style={{ ...styles.tabButton, ...(adminTab === key ? styles.tabButtonActive : {}) }} onClick={() => setAdminTab(key)}>
                      {label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            <div>
              {adminTab === "basic" ? (
                <Card title="基本資料維護">
                  <div className="admin-grid" style={styles.adminGrid}>
                    <Field label="服務對象人數"><input style={styles.input} type="number" value={data.stats.serviceCount} onChange={(e) => updateStats("serviceCount", toNumber(e.target.value))} /></Field>
                    <Field label="平均年齡"><input style={styles.input} type="number" value={data.stats.avgAge} onChange={(e) => updateStats("avgAge", toNumber(e.target.value))} /></Field>
                    <Field label="男性人數"><input style={styles.input} type="number" value={data.stats.maleCount} onChange={(e) => updateStats("maleCount", toNumber(e.target.value))} /></Field>
                    <Field label="女性人數"><input style={styles.input} type="number" value={data.stats.femaleCount} onChange={(e) => updateStats("femaleCount", toNumber(e.target.value))} /></Field>
                    <Field label="正式人力"><input style={styles.input} type="number" value={data.stats.officialStaff} onChange={(e) => updateStats("officialStaff", toNumber(e.target.value))} /></Field>
                    <Field label="委外人力"><input style={styles.input} type="number" value={data.stats.outsourcedStaff} onChange={(e) => updateStats("outsourcedStaff", toNumber(e.target.value))} /></Field>
                  </div>

                  <div style={styles.sectionTitle}>年齡分佈</div>
                  <div style={styles.stack}>
                    {data.ageData.map((item, idx) => (
                      <div key={`age-${idx}`} className="row-grid-4" style={styles.rowGrid4}>
                        <input style={styles.input} value={item.label} onChange={(e) => updateObjectArray("ageData", idx, "label", e.target.value)} placeholder="分類名稱" />
                        <input style={styles.input} type="number" value={item.value} onChange={(e) => updateObjectArray("ageData", idx, "value", toNumber(e.target.value))} placeholder="人數" />
                        <select style={styles.input} value={item.color} onChange={(e) => updateObjectArray("ageData", idx, "color", e.target.value)}>{COLORS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                        <button style={styles.dangerButton} onClick={() => removeItem("ageData", idx)}>刪除</button>
                      </div>
                    ))}
                    <button style={styles.secondaryButton} onClick={() => addItem("ageData", { label: "新分類", value: 0, color: COLORS[data.ageData.length % COLORS.length] })}>新增年齡分類</button>
                  </div>

                  <div style={styles.sectionTitle}>障礙等級</div>
                  <div style={styles.stack}>
                    {data.disabilityData.map((item, idx) => (
                      <div key={`dis-${idx}`} className="row-grid-4" style={styles.rowGrid4}>
                        <input style={styles.input} value={item.label} onChange={(e) => updateObjectArray("disabilityData", idx, "label", e.target.value)} placeholder="分類名稱" />
                        <input style={styles.input} type="number" value={item.value} onChange={(e) => updateObjectArray("disabilityData", idx, "value", toNumber(e.target.value))} placeholder="人數" />
                        <select style={styles.input} value={item.color} onChange={(e) => updateObjectArray("disabilityData", idx, "color", e.target.value)}>{COLORS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
                        <button style={styles.dangerButton} onClick={() => removeItem("disabilityData", idx)}>刪除</button>
                      </div>
                    ))}
                    <button style={styles.secondaryButton} onClick={() => addItem("disabilityData", { label: "新分類", value: 0, color: COLORS[data.disabilityData.length % COLORS.length] })}>新增障礙分類</button>
                  </div>
                </Card>
              ) : null}

              {adminTab === "menu" ? (
                <Card title="今日菜單維護" right="穩定版先保留手動維護">
                  <div style={styles.menuSingleGrid}>
                    <Field label="菜單日期" hint="星期一、四、五會自動帶出指定餐別名稱。若日期異常，這裡可直接重選。">
                      <input
                        style={styles.input}
                        type="date"
                        value={isValidIsoDate(data.menuDisplayDate) ? data.menuDisplayDate : ""}
                        onChange={(e) => updateRoot("menuDisplayDate", e.target.value)}
                      />
                    </Field>
                    <Field label="日期列預覽">
                      <div style={styles.previewBar}>{menuDateLine(data.menuDisplayDate)}</div>
                    </Field>
                  </div>
                  <div style={styles.stack}>
                    <Field label="早餐">
                      <textarea style={styles.textarea} value={data.menu.breakfast} onChange={(e) => updateMenu("breakfast", e.target.value)} />
                    </Field>
                    <Field label="午餐">
                      <textarea style={styles.textarea} value={data.menu.lunch} onChange={(e) => updateMenu("lunch", e.target.value)} />
                    </Field>
                    <Field label="晚餐">
                      <textarea style={styles.textarea} value={data.menu.dinner} onChange={(e) => updateMenu("dinner", e.target.value)} />
                    </Field>
                  </div>
                </Card>
              ) : null}

              {adminTab === "location" ? (
                <Card title="社會適應地點維護" right="右側顯示最近三筆並輪播">
                  <div style={styles.stack}>
                    {data.locations.map((item, idx) => (
                      <div key={`loc-${idx}`} className="row-grid-5" style={styles.rowGrid5}>
                        <input style={styles.input} type="date" value={item.date} onChange={(e) => updateObjectArray("locations", idx, "date", e.target.value)} />
                        <input style={styles.input} value={item.name} onChange={(e) => updateObjectArray("locations", idx, "name", e.target.value)} placeholder="地點名稱" />
                        <input style={styles.input} value={item.note} onChange={(e) => updateObjectArray("locations", idx, "note", e.target.value)} placeholder="備註" />
                        <input style={styles.input} type="number" value={item.x} onChange={(e) => updateObjectArray("locations", idx, "x", toNumber(e.target.value))} placeholder="X" />
                        <input style={styles.input} type="number" value={item.y} onChange={(e) => updateObjectArray("locations", idx, "y", toNumber(e.target.value))} placeholder="Y" />
                        <button style={styles.dangerButton} onClick={() => removeItem("locations", idx)}>刪除</button>
                      </div>
                    ))}
                    <button style={styles.secondaryButton} onClick={() => addItem("locations", { date: data.menuDisplayDate, name: "新地點", note: "請輸入說明", x: 50, y: 50 })}>新增地點</button>
                  </div>
                </Card>
              ) : null}

              {adminTab === "fitness" ? (
                <Card title="體適能時數維護">
                  <div style={styles.stack}>
                    {data.fitnessData.map((item, idx) => (
                      <div key={`fit-${idx}`} className="row-grid-5" style={styles.rowGrid5}>
                        <input style={styles.input} value={item.month} onChange={(e) => updateObjectArray("fitnessData", idx, "month", e.target.value)} placeholder="月份" />
                        <input style={styles.input} type="number" step="0.1" value={item.avg} onChange={(e) => updateObjectArray("fitnessData", idx, "avg", toNumber(e.target.value))} placeholder="平均" />
                        <input style={styles.input} type="number" step="0.1" value={item.a} onChange={(e) => updateObjectArray("fitnessData", idx, "a", toNumber(e.target.value))} placeholder="A組" />
                        <input style={styles.input} type="number" step="0.1" value={item.b} onChange={(e) => updateObjectArray("fitnessData", idx, "b", toNumber(e.target.value))} placeholder="B組" />
                        <div />
                        <button style={styles.dangerButton} onClick={() => removeItem("fitnessData", idx)}>刪除</button>
                      </div>
                    ))}
                    <button style={styles.secondaryButton} onClick={() => addItem("fitnessData", { month: "新月份", avg: 0, a: 0, b: 0 })}>新增月份</button>
                  </div>
                </Card>
              ) : null}

              {adminTab === "highlight" ? (
                <Card title="本月工作重點維護">
                  <div className="admin-grid" style={styles.adminGrid}>
                    <Field label="顯示月份"><input style={styles.input} value={data.highlightMonth} onChange={(e) => updateRoot("highlightMonth", e.target.value)} placeholder="例如：2026-04" /></Field>
                  </div>
                  <div style={styles.stack}>
                    {data.highlights.map((item, idx) => (
                      <div key={`highlight-edit-${idx}`} className="row-grid-text" style={styles.rowGridText}>
                        <div style={styles.highlightEditorFields}>
                          <Field label="工作主題">
                            <input style={styles.input} value={item.topic} onChange={(e) => updateObjectArray("highlights", idx, "topic", e.target.value)} />
                          </Field>
                          <Field label="工作內容" hint="可依輸入段落換行，前台會照段落顯示。">
                            <textarea style={styles.textarea} value={item.content} onChange={(e) => updateObjectArray("highlights", idx, "content", e.target.value)} />
                          </Field>
                        </div>
                        <button style={styles.dangerButton} onClick={() => removeItem("highlights", idx)}>刪除</button>
                      </div>
                    ))}
                    <button style={styles.secondaryButton} onClick={() => addItem("highlights", { topic: "新工作主題", content: "請輸入新的工作內容" })}>新增工作重點</button>
                  </div>
                </Card>
              ) : null}

              {adminTab === "duty" ? (
                <Card title="值班表維護">
                  <div className="admin-grid" style={styles.adminGrid}>
                    <Field label="值班表日期"><input style={styles.input} type="date" value={isValidIsoDate(data.dutyDate) ? data.dutyDate : ""} onChange={(e) => updateRoot("dutyDate", e.target.value)} /></Field>
                  </div>
                  <div style={styles.stack}>
                    {data.duties.map((item, idx) => (
                      <div key={`duty-edit-${idx}`} className="row-grid-4" style={styles.rowGrid4}>
                        <input style={styles.input} value={item.shift} onChange={(e) => updateObjectArray("duties", idx, "shift", e.target.value)} placeholder="班別" />
                        <input style={styles.input} value={item.staff} onChange={(e) => updateObjectArray("duties", idx, "staff", e.target.value)} placeholder="人員" />
                        <input style={styles.input} value={item.note} onChange={(e) => updateObjectArray("duties", idx, "note", e.target.value)} placeholder="備註" />
                        <button style={styles.dangerButton} onClick={() => removeItem("duties", idx)}>刪除</button>
                      </div>
                    ))}
                    <button style={styles.secondaryButton} onClick={() => addItem("duties", { shift: "新班別", staff: "", note: "" })}>新增值班列</button>
                  </div>
                </Card>
              ) : null}

              {adminTab === "system" ? (
                <Card title="系統資料工具">
                  <div className="system-grid" style={styles.systemGrid}>
                    <div style={styles.systemBox}>
                      <div style={styles.systemTitle}>匯出完整資料</div>
                      <div style={styles.muted}>將目前資料存成 JSON 備份。</div>
                      <button
                        style={styles.primaryButton}
                        onClick={() => {
                          const result = downloadJson("智慧看板資料備份.json", data);
                          setJsonExportText(result.json || "");
                          setSaveText(result.ok ? "JSON 匯出已觸發；若沒下載成功，可直接複製下方內容存成 .json" : "下載可能被環境攔截，請直接複製下方 JSON 內容");
                        }}
                      >匯出 JSON</button>
                    </div>
                    <div style={styles.systemBox}>
                      <div style={styles.systemTitle}>匯入完整資料</div>
                      <div style={styles.muted}>載入先前匯出的 JSON 備份。</div>
                      <input ref={importRef} type="file" accept="application/json" style={{ display: "none" }} onChange={importJsonFile} />
                      <button style={styles.primaryButton} onClick={() => importRef.current?.click()}>載入 JSON</button>
                    </div>
                    <div style={styles.systemBox}>
                      <div style={styles.systemTitle}>恢復預設資料</div>
                      <div style={styles.muted}>將目前內容重設為示範版本。</div>
                      <button style={styles.dangerButton} onClick={resetDefault}>恢復預設</button>
                    </div>
                    <div style={styles.systemBox}>
                      <div style={styles.systemTitle}>目前狀態</div>
                      <div style={styles.muted}>這一版是可預覽、可編輯、可本機保存的後台。下一步可再接 Excel 匯入、帳號登入、資料庫與正式部署。</div>
                    </div>
                    {jsonExportText ? (
                      <div style={styles.systemBox}>
                        <div style={styles.systemTitle}>JSON 備援匯出</div>
                        <div style={styles.muted}>若瀏覽器沒有真的落檔，直接複製這段內容，貼到記事本後另存為「智慧看板資料備份.json」。</div>
                        <textarea readOnly value={jsonExportText} style={styles.exportTextarea} />
                        <button
                          style={styles.primaryButton}
                          onClick={async () => {
                            const ok = await copyText(jsonExportText);
                            setSaveText(ok ? "JSON 已複製到剪貼簿" : "複製失敗，請手動全選複製");
                          }}
                        >複製 JSON 內容</button>
                      </div>
                    ) : null}
                  </div>
                </Card>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    height: "100vh",
    overflow: "hidden",
    background: "radial-gradient(circle at top, #0f3a53 0%, #08111f 35%, #020617 100%)",
    color: "#e2e8f0",
    padding: 12,
  },
  container: { maxWidth: "100%", margin: "0 auto", height: "100%", display: "flex", flexDirection: "column", minHeight: 0 },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    padding: 10,
    border: "1px solid rgba(255,255,255,.1)",
    background: "rgba(2,6,23,.55)",
    borderRadius: 22,
    boxShadow: "0 16px 36px rgba(0,0,0,.28)",
    marginBottom: 10,
    flexWrap: "wrap",
    minHeight: 72,
  },
  eyebrow: { color: "#67e8f9", fontSize: 12, letterSpacing: ".25em", textTransform: "uppercase", marginBottom: 6 },
  title: { margin: 0, fontSize: 24, color: "#fff" },
  headerSub: { color: "#94a3b8", marginTop: 4, fontSize: 11 },
  headerRight: { display: "flex", flexDirection: "row", alignItems: "center", gap: 8 },
  timeBox: { display: "none" },
  toolbar: { display: "flex", gap: 10, flexWrap: "wrap" },
  button: { border: "none", borderRadius: 12, padding: "10px 16px", fontSize: 14, cursor: "pointer", color: "white", background: "#1e293b" },
  buttonActive: { background: "#0891b2" },
  dashboardGrid: { display: "grid", gridTemplateColumns: "minmax(0, .95fr) minmax(0, 1.15fr) minmax(0, .95fr)", gap: 12, alignItems: "stretch", flex: 1, minHeight: 0 },
  column: { display: "flex", flexDirection: "column", gap: 12, height: "100%", minWidth: 0, overflow: "hidden" },
  card: { border: "1px solid rgba(34,211,238,.08)", background: "rgba(15,23,42,.78)", borderRadius: 20, padding: 12, boxShadow: "0 14px 28px rgba(0,0,0,.22)", minWidth: 0, width: "100%", overflow: "hidden" },
  cardHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,.08)", marginBottom: 10 },
  cardTitle: { fontSize: 17, fontWeight: 700, color: "#fff" },
  cardRight: { fontSize: 13, color: "#94a3b8" },
  statsGrid: { display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 },
  statBox: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 10 },
  statLabel: { fontSize: 12, color: "#cbd5e1", marginBottom: 6 },
  statValueRow: { display: "flex", alignItems: "end", gap: 6 },
  statValue: { fontSize: 24, fontWeight: 800, color: "#fff", lineHeight: 1 },
  statUnit: { color: "#94a3b8", fontSize: 13 },
  muted: { color: "#94a3b8", fontSize: 13, marginTop: 8, lineHeight: 1.7 },
  pieWrap: { display: "flex", gap: 8, alignItems: "center", flexWrap: "nowrap", justifyContent: "center" },
  legendCol: { display: "flex", flexDirection: "column", gap: 6, minWidth: 0 },
  legendItem: { display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#e2e8f0" },
  legendDot: { width: 14, height: 14, borderRadius: 4, display: "inline-block" },
  menuDate: { color: "#c7f9ff", fontSize: 16, fontWeight: 700, marginBottom: 10, letterSpacing: ".03em" },
  menuViewport: { width: "100%", minWidth: 0, maxWidth: "100%", overflow: "hidden", borderRadius: 18, border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.05)", padding: "10px 0", height: 52, minHeight: 52, display: "flex", alignItems: "center", position: "relative" },
  menuTrack: { color: "#fff", fontSize: 15, fontWeight: 700, letterSpacing: ".02em", display: "inline-block", whiteSpace: "nowrap", willChange: "transform", lineHeight: 1.35, padding: "2px 0" },
  chartWrap: { height: "100%", minHeight: 200, borderRadius: 22, background: "linear-gradient(180deg, rgba(255,255,255,.04), rgba(255,255,255,.02))", border: "1px solid rgba(255,255,255,.08)", padding: 8 },
  chartSvg: { width: "100%", height: "100%", display: "block" },
  flexCard: { flex: 1, display: "flex", flexDirection: "column" },
  leftTopCard: { flex: "0 0 248px", minHeight: 248, display: "flex", flexDirection: "column" },
  leftMiddleCard: { flex: "0 0 236px", minHeight: 236, display: "flex", flexDirection: "column", justifyContent: "center" },
  leftBottomCard: { flex: "0 0 236px", minHeight: 236, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" },
  rightTopCard: { flex: "0 0 132px", minHeight: 132, display: "flex", flexDirection: "column" },
  rightMiddleCard: { flex: 1, display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" },
  middleTopCard: { flex: "0 0 166px", minHeight: 166, display: "flex", flexDirection: "column" },
  middleMidCard: { flex: "0 0 190px", minHeight: 190, display: "flex", flexDirection: "column" },
  rightBottomCard: { flex: "0 0 204px", minHeight: 204, display: "flex", flexDirection: "column" },
  mapGrid: { display: "grid", gridTemplateColumns: "1.2fr .8fr", gap: 8, minHeight: 220, height: "100%", alignItems: "stretch" },
  mapBox: { height: "100%", borderRadius: 22, background: "linear-gradient(rgba(3,7,18,.2), rgba(3,7,18,.2)), radial-gradient(circle at 30% 35%, rgba(34,197,94,.18) 0 18%, transparent 19%), radial-gradient(circle at 72% 30%, rgba(14,165,233,.18) 0 14%, transparent 15%), radial-gradient(circle at 55% 70%, rgba(234,179,8,.18) 0 15%, transparent 16%), linear-gradient(135deg, #0f172a 0%, #0b2239 45%, #153b57 100%)", border: "1px solid rgba(255,255,255,.08)", position: "relative", overflow: "hidden" },
  mapOverlayBadge: { position: "absolute", left: 10, bottom: 10, padding: "8px 10px", borderRadius: 12, background: "rgba(2,6,23,.82)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", fontSize: 12, zIndex: 2 },
  mapRoads: { position: "absolute", inset: 0, backgroundImage: "linear-gradient(70deg, transparent 48%, rgba(255,255,255,.08) 49%, rgba(255,255,255,.08) 51%, transparent 52%), linear-gradient(20deg, transparent 58%, rgba(255,255,255,.07) 59%, rgba(255,255,255,.07) 61%, transparent 62%), linear-gradient(115deg, transparent 38%, rgba(255,255,255,.06) 39%, rgba(255,255,255,.06) 41%, transparent 42%)", opacity: 0.85 },
  mapSvg: { position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.9 },
  marker: { position: "absolute", transform: "translate(-50%, -50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 6 },
  markerDot: { width: 18, height: 18, borderRadius: "50%", background: "#22d3ee", border: "3px solid rgba(255,255,255,.95)", boxShadow: "0 0 0 6px rgba(34,211,238,.18)" },
  markerLabel: { background: "rgba(2,6,23,.82)", border: "1px solid rgba(255,255,255,.08)", color: "#fff", padding: "8px 10px", borderRadius: 12, fontSize: 12, whiteSpace: "nowrap" },
  locationListViewport: { height: "100%", minHeight: 0, overflow: "hidden" },
  locationCard: { background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 8, minHeight: 0, overflow: "hidden" },
  locationDate: { color: "#67e8f9", fontSize: 13, marginBottom: 6 },
  locationName: { fontWeight: 700, color: "#fff", marginBottom: 6 },
  highlightViewport: { flex: 1, minHeight: 0, height: "100%", overflow: "hidden" },
  highlightCard: { width: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 8, background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 16, padding: 12, color: "#fff" },
  highlightTopicLabel: { color: "#67e8f9", fontSize: 13, fontWeight: 700, letterSpacing: ".04em" },
  highlightTopic: { color: "#fff", fontSize: 17, fontWeight: 800, lineHeight: 1.3, marginBottom: 2, wordBreak: "break-word" },
  highlightContentLabel: { color: "#67e8f9", fontSize: 13, fontWeight: 700, letterSpacing: ".04em" },
  highlightContent: { color: "#fff", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-line", wordBreak: "break-word" },
  tableWrap: { flex: 1, overflow: "hidden", borderRadius: 16, border: "1px solid rgba(255,255,255,.08)", height: "100%", minHeight: 0 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "7px 8px", borderBottom: "1px solid rgba(255,255,255,.08)", textAlign: "left", fontSize: 11, color: "#cbd5e1", background: "rgba(2,6,23,.65)" },
  td: { padding: "7px 8px", borderBottom: "1px solid rgba(255,255,255,.08)", textAlign: "left", fontSize: 11, color: "#fff", background: "rgba(255,255,255,.03)", lineHeight: 1.3 },
  adminLayout: { display: "grid", gridTemplateColumns: "280px 1fr", gap: 16, alignItems: "start" },
  saveBanner: { marginBottom: 14, padding: "10px 12px", borderRadius: 14, background: "rgba(16,185,129,.12)", border: "1px solid rgba(16,185,129,.24)", color: "#d1fae5", fontSize: 13, lineHeight: 1.6 },
  tabList: { display: "flex", flexDirection: "column", gap: 10 },
  tabButton: { border: "1px solid rgba(255,255,255,.08)", background: "rgba(255,255,255,.04)", color: "#e2e8f0", borderRadius: 14, padding: "12px 14px", textAlign: "left", cursor: "pointer", fontSize: 15, fontWeight: 700 },
  tabButtonActive: { background: "rgba(6,182,212,.2)", border: "1px solid rgba(34,211,238,.35)", color: "#cffafe" },
  adminGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16, alignItems: "start" },
  field: { display: "flex", flexDirection: "column", gap: 8, minWidth: 0, width: "100%" },
  fieldLabel: { fontSize: 14, color: "#cbd5e1", fontWeight: 700 },
  fieldHint: { fontSize: 12, color: "#94a3b8", lineHeight: 1.6 },
  input: { width: "100%", minWidth: 0, border: "1px solid rgba(255,255,255,.12)", background: "rgba(2,6,23,.7)", color: "#fff", borderRadius: 14, padding: "12px 14px", fontSize: 14, outline: "none" },
  textarea: { width: "100%", minWidth: 0, minHeight: 90, border: "1px solid rgba(255,255,255,.12)", background: "rgba(2,6,23,.7)", color: "#fff", borderRadius: 14, padding: "12px 14px", fontSize: 14, outline: "none", resize: "vertical", lineHeight: 1.7 },
  previewBar: { width: "100%", minWidth: 0, borderRadius: 14, padding: "12px 14px", background: "rgba(6,182,212,.12)", border: "1px solid rgba(34,211,238,.2)", color: "#cffafe", fontSize: 14, fontWeight: 700 },
  sectionTitle: { marginTop: 28, marginBottom: 14, fontSize: 18, fontWeight: 800, color: "#fff" },
  stack: { display: "flex", flexDirection: "column", gap: 12, width: "100%", minWidth: 0 },
  menuSingleGrid: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 16, width: "100%", minWidth: 0, alignItems: "start" },
  rowGrid4: { display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr auto", gap: 12, alignItems: "center", padding: 14, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" },
  rowGrid5: { display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr)) auto", gap: 12, alignItems: "start", padding: 14, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" },
  rowGridText: { display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "start", padding: 14, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" },
  highlightEditorFields: { display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 12, width: "100%", minWidth: 0 },
  systemGrid: { display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 16 },
  systemBox: { padding: 16, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" },
  systemTitle: { color: "#fff", fontSize: 17, fontWeight: 700, marginBottom: 8 },
  pdfImportPanel: { display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap", alignItems: "center", padding: 16, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", marginBottom: 16 },
  pdfImportMain: { flex: 1, minWidth: 0, width: "100%" },
  pdfImportStatus: { marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "rgba(6,182,212,.12)", border: "1px solid rgba(34,211,238,.2)", color: "#cffafe", fontSize: 13, lineHeight: 1.6 },
  pdfImportActions: { display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" },
  pdfResultWrap: { display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 },
  pdfApplyButtons: { display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", width: "100%" },
  pdfPreviewCard: { width: "100%", minWidth: 0, padding: 16, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" },
  previewMealLine: { width: "100%", minWidth: 0, color: "#fff", lineHeight: 1.8, fontSize: 14, wordBreak: "break-word" },
  primaryButton: { border: "none", borderRadius: 12, padding: "10px 14px", background: "#0891b2", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 12, maxWidth: "100%", whiteSpace: "normal" },
  secondaryButton: { border: "none", borderRadius: 12, padding: "10px 14px", background: "#1e293b", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, width: "fit-content", maxWidth: "100%", whiteSpace: "normal" },
  dangerButton: { border: "none", borderRadius: 12, padding: "10px 14px", background: "#7f1d1d", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, width: "fit-content", height: "fit-content" },
  exportTextarea: { width: "100%", minHeight: 220, marginTop: 12, border: "1px solid rgba(255,255,255,.12)", background: "rgba(2,6,23,.7)", color: "#fff", borderRadius: 14, padding: "12px 14px", fontSize: 12, outline: "none", resize: "vertical", lineHeight: 1.6, fontFamily: "Consolas, Monaco, monospace" },
};
