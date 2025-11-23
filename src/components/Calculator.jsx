import React, { useState } from "react";
import csvRaw from '/NYRR Corral Placements - regular corrals_ miles.csv?raw';

// Corrals will be populated from the provided CSV at runtime. Keys are internal race keys
// like "4M", "5K", "5M", "10K", "Half", "Full".
const CORRAL_TABLE = {};

// map of parsed A-row times (seconds) per race key (e.g., '10K', '4M')
const A_TIME_BY_RACE = {};

// Parse the provided CSV and populate CORRAL_TABLE for supported race columns.
try {
  const lines = csvRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  // find header row within the first ~10 lines (the CSV's first line contains race short names)
  const headerRowIndex = Math.min(lines.length, 10);
  let headerCols = null;
  for (let i = 0; i < headerRowIndex; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    // pick the row that contains at least one of the known race names (like '5K' or '10K')
    if (cols.some(c => /5k|10k|4 miles|half marathon|marathon|5 miles/i.test(c))) {
      headerCols = cols;
      break;
    }
  }

  if (headerCols) {
    // mapping from CSV header -> internal key used in the app
    const CSV_TO_KEY = {
      '5k': '5K',
      '4 miles': '4M',
      '5 miles': '5M',
      '10k': '10K',
      'half marathon': 'Half',
      'marathon': 'Full'
    };

    // helper to normalize header text
    const norm = (s) => (s || '').toString().toLowerCase().trim();

    // find the row index for the 'A' row to capture A-time more reliably
    const aLine = lines.find(l => l.split(',')[0]?.trim() === 'A');
    const aCols = aLine ? aLine.split(',') : null;

    // iterate all header columns and parse supported races
    headerCols.forEach((h, colIndex) => {
      const key = CSV_TO_KEY[norm(h)];
      if (!key) return; // unsupported/unused column

      const table = [];
      for (const line of lines) {
        const cols = line.split(',');
        const name = cols[0]?.trim();
        if (!name) continue;
        if (/^[A-K]$/.test(name)) {
          const cell = (cols[colIndex] || '').trim();
          const m = cell.match(/(\d+:)?\d{1,2}:\d{2}/);
          if (m) {
            const timeStr = m[0];
            const parts = timeStr.split(':').map(Number);
            let seconds = 0;
            if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
            else if (parts.length === 2) seconds = parts[0]*60 + parts[1];
            else seconds = Number(timeStr);
            table.push({ max: seconds, label: name });
          } else {
            table.push({ max: null, label: name });
          }
        }
      }

      // stop at first missing (null) value to get contiguous rows from A..?
      const cleaned = [];
      for (const row of table) {
        if (row.max == null) break;
        cleaned.push(row);
      }

      if (cleaned.length > 0) {
        // If CSV included a K row, keep its value. If not, make final bucket open-ended.
        const lastRow = cleaned[cleaned.length - 1];
        if (lastRow.label !== 'K') lastRow.max = Infinity;
        CORRAL_TABLE[key] = cleaned;
        console.debug(`Parsed corrals for ${key}:`, cleaned.map(r => ({label: r.label, max: r.max})));

        // capture A time for slider minimum if available
        if (aCols && aCols[colIndex]) {
          const aCell = (aCols[colIndex] || '').trim();
          const m2 = aCell.match(/(\d+:)?\d{1,2}:\d{2}/);
          if (m2) {
            const timeStr = m2[0];
            const parts = timeStr.split(':').map(Number);
            let seconds = 0;
            if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
            else if (parts.length === 2) seconds = parts[0]*60 + parts[1];
            else seconds = Number(timeStr);
            A_TIME_BY_RACE[key] = seconds;
            console.debug(`Parsed A time for ${key}:`, seconds);
          }
        }
      } else {
        console.debug(`No cleaned corrals parsed for column ${h} (key ${key})`);
      }
    });
  }
} catch (e) {
  console.warn('Failed to parse CSV for corrals', e);
}

// (A_TIME_BY_RACE populated above)

const SLIDER_RANGES = {
  "4M": { time: [600, 4000], pace: [300, 1200] },
  "5K": { time: [300, 2000], pace: [300, 1200] },
  "5M": { time: [600, 4000], pace: [300, 1200] },
  "10K": { time: [600, 6000], pace: [300, 1200] },
  "Half": { time: [1800, 9000], pace: [360, 1200] },
  "Full": { time: [3600, 20000], pace: [420, 1500] }
};

export default function Calculator() {
  const [race, setRace] = useState("10K");
  const [mode, setMode] = useState("time");
  const [seconds, setSeconds] = useState(3000);
  const [pace, setPace] = useState(480);

  const raceMiles = { "4M": 4, "5K": 3.107520199, "5M": 5, "10K": 6.215040398, Half: 13.11218148, Full: 26.22436296 }[race];

  const formatTime = (t) => {
    const h = Math.floor(t / 3600);
    const m = Math.floor((t % 3600) / 60);
    const s = String(t % 60).padStart(2, "0");
    return h > 0 ? `${h}:${String(m).padStart(2,"0")}:${s}` : `${m}:${s}`;
  };

  const paceToTime = (p) => Math.round(p * raceMiles);
  const timeToPace = (t) => t / raceMiles;

  const formatPace = (p) => {
    const min = Math.floor(p / 60);
    const sec = String(Math.round(p % 60)).padStart(2, '0');
    return `${min}:${sec}/mi`;
  };

  const updateTime = (t) => {
    setSeconds(t);
    setPace(timeToPace(t));
  };

  const updatePace = (p) => {
    setPace(p);
    setSeconds(paceToTime(p));
  };

  const corrals = CORRAL_TABLE[race] || [];
  // use the current input value (time seconds) when finding the matching corral
  const valForFind = mode === 'time' ? seconds : paceToTime(pace);
  let corral = corrals.find(c => valForFind <= c.max);
  let idx;
  let prevMax;
  if (!corral) {
    // no matching corral found (e.g., input > last corral max).
    if (corrals.length > 0) {
      // fallback to the last corral in the table
      idx = corrals.length - 1;
      corral = corrals[idx];
      prevMax = idx === 0 ? 0 : (corrals[idx - 1]?.max ?? 0);
    } else {
      // no corrals available for this race (shouldn't normally happen) -> use safe defaults
      corral = { max: Infinity, label: '?' };
      idx = 0;
      prevMax = 0;
    }
  } else {
    idx = corrals.indexOf(corral);
    prevMax = idx === 0 ? 0 : (corrals[idx - 1]?.max ?? 0);
  }

  const corralRange = (() => {
    const min = prevMax;
    const max = corral.max;
    if(mode === 'time') return `${formatTime(min)} - ${formatTime(max)}`;
    const minPace = formatPace(min / raceMiles);
    const maxPace = formatPace(max / raceMiles);
    return `${minPace} - ${maxPace}`;
  })();

  const progressPercent = (() => {
    let val = mode === 'time' ? seconds : paceToTime(pace);
    return ((val - prevMax) / (corral.max - prevMax)) * 100;
  })();

  const sliderValue = mode === 'time' ? seconds : pace;
  // Compute slider min/max dynamically from CSV data (A time and last corral) with fallbacks
  const defaultSliderMin = SLIDER_RANGES[race][mode][0];
  const defaultSliderMax = SLIDER_RANGES[race][mode][1];
  // Prefer the parsed A-time as a realistic lower bound
  let sliderMin = defaultSliderMin;
  const aTime = A_TIME_BY_RACE[race];
  if (aTime && Number.isFinite(aTime)) {
    if (mode === 'time') sliderMin = Math.max(defaultSliderMin, Math.floor(aTime * 0.7));
    else sliderMin = Math.max(defaultSliderMin, Math.floor((aTime / raceMiles) * 0.7));
  }
  let sliderMax = defaultSliderMax;
  const raceTable = CORRAL_TABLE[race];
  if (raceTable && raceTable.length > 0) {
    const last = raceTable[raceTable.length - 1];
    if (Number.isFinite(last.max)) {
      sliderMax = (mode === 'time') ? last.max : Math.round(last.max / raceMiles);
    } else {
      // last.max is Infinity (K is open-ended). Use the previous corral's max as the cap (no +10min).
      const prev = raceTable.length >= 2 ? raceTable[raceTable.length - 2].max : defaultSliderMax;
      if (prev && Number.isFinite(prev)) {
        sliderMax = (mode === 'time') ? prev : Math.round(prev / raceMiles);
      } else {
        sliderMax = defaultSliderMax;
      }
    }
  }
  // ensure sliderMin is strictly less than sliderMax; if not, relax sliderMin
  if (sliderMin >= sliderMax) {
    sliderMin = Math.max(defaultSliderMin, Math.floor(sliderMax * 0.5));
  }
  const sliderOnChange = (e) => mode === 'time' ? updateTime(Number(e.target.value)) : updatePace(Number(e.target.value));

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Calculator</h1>

      <div className="space-y-2">
        <label className="font-medium">Race Distance</label>
        <select className="p-2 rounded border" value={race} onChange={(e)=>setRace(e.target.value)}>
          <option>4M</option>
          <option>5K</option>
          <option>5M</option>
          <option>10K</option>
          <option>Half</option>
          <option>Full</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Input Mode</label>
        <div className="flex gap-4">
          <button className={`px-3 py-1 rounded ${mode==='time'?'bg-black text-white':'bg-gray-200'}`} onClick={()=>setMode('time')}>Time</button>
          <button className={`px-3 py-1 rounded ${mode==='pace'?'bg-black text-white':'bg-gray-200'}`} onClick={()=>setMode('pace')}>Pace</button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-medium">{mode==='time'?'Race Time':'Pace (min/mile)'}</label>
        <input type="range" min={sliderMin} max={sliderMax} value={sliderValue} onChange={sliderOnChange} className="w-full" />
        <div className="text-xl font-semibold">{mode==='time'?formatTime(seconds):formatPace(pace)}</div>
      </div>

      <div className="p-4 rounded-xl bg-gray-100 space-y-4">
        <div className="text-lg">Corral: <span className="font-bold text-xl">{corral.label}</span></div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Corral Range</div>
          <div className="w-full h-3 bg-gray-300 rounded-full relative">
            <div className="h-3 bg-black rounded-full" style={{width:`${Math.max(0, Math.min(100, progressPercent))}%`}} />
          </div>
          <div className="text-sm text-gray-600">{corralRange}</div>
        </div>
      </div>
    </div>
  );
}
