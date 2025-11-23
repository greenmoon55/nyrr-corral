import React, { useState } from "react";
import csvRaw from '/NYRR Corral Placements - regular corrals_ miles.csv?raw';

const CORRAL_TABLE = {
  // 4M values are loaded from the CSV (A..K). We'll include K as the final bucket (Infinity)
  // 4M will be filled at runtime from the CSV when possible; placeholder for now
  "4M": [],

  // Updated existing races: remove L and make K the final (Infinity)
  "5K": [
    { max: 1157, label: "A" },
    { max: 1285, label: "B" },
    { max: 1374, label: "C" },
    { max: 1439, label: "D" },
    { max: 1514, label: "E" },
    { max: 1588, label: "F" },
    { max: 1656, label: "G" },
    { max: 1746, label: "H" },
    { max: 1832, label: "I" },
    { max: 1969, label: "J" },
    { max: Infinity, label: "K" }
  ],

  "5M": [
    { max: 1919, label: "A" },
    { max: 2131, label: "B" },
    { max: 2279, label: "C" },
    { max: 2387, label: "D" },
    { max: 2511, label: "E" },
    { max: 2634, label: "F" },
    { max: 2747, label: "G" },
    { max: 2895, label: "H" },
    { max: 3038, label: "I" },
    { max: 3265, label: "J" },
    { max: Infinity, label: "K" }
  ],

  "10K": [
    { max: 2418, label: "A" },
    { max: 2685, label: "B" },
    { max: 2871, label: "C" },
    { max: 3008, label: "D" },
    { max: 3163, label: "E" },
    { max: 3319, label: "F" },
    { max: 3462, label: "G" },
    { max: 3648, label: "H" },
    { max: 3828, label: "I" },
    { max: 4114, label: "J" },
    { max: Infinity, label: "K" }
  ],

  "Half": [
    { max: 5373, label: "A" },
    { max: 5966, label: "B" },
    { max: 6381, label: "C" },
    { max: 6685, label: "D" },
    { max: 8325, label: "E" },
    { max: 8734, label: "F" },
    { max: 9110, label: "G" },
    { max: 9601, label: "H" },
    { max: 10075, label: "I" },
    { max: 10827, label: "J" },
    { max: Infinity, label: "K" }
  ],

  "Full": [
    { max: 10989, label: "A" },
    { max: 12204, label: "B" },
    { max: 13052, label: "C" },
    { max: 13673, label: "D" },
    { max: 14379, label: "E" },
    { max: 15086, label: "F" },
    { max: 15735, label: "G" },
    { max: 16583, label: "H" },
    { max: 17402, label: "I" },
    { max: 18702, label: "J" },
    { max: Infinity, label: "K" }
  ]
};

// map of parsed A-row times (seconds) per race key (e.g., '10K', '4M')
const A_TIME_BY_RACE = {};

// Parse the provided CSV for desired columns (4 miles and 10K) and populate CORRAL_TABLE
try {
  const lines = csvRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  // look for header row (first ~10 lines) and find column indices for target headers
  const targets = [{ header: '4 miles', key: '4M' }, { header: '10K', key: '10K' }];
  const headerRowIndex = Math.min(lines.length, 10);
  let headerCols = null;
  for (let i = 0; i < headerRowIndex; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    // check if this row contains any of the target headers (case-insensitive)
    const found = targets.some(t => cols.findIndex(c => c.toLowerCase() === t.header.toLowerCase()) !== -1);
    if (found) { headerCols = cols; break; }
  }

  if (headerCols) {
    for (const t of targets) {
  const colIndex = headerCols.findIndex(c => c.toLowerCase() === t.header.toLowerCase());
      if (colIndex === -1) continue;

      const table = [];
      for (const line of lines) {
        const cols = line.split(',');
        const name = cols[0]?.trim();
        if (!name) continue;
        if (/^[A-K]$/.test(name)) {
          const cell = (cols[colIndex] || '').trim();
          // extract time like H:MM:SS or M:SS or 0:25:11 or plain ---
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

      const cleaned = [];
      for (const row of table) {
        if (row.max == null) break; // stop at first missing value
        cleaned.push(row);
      }
      if (cleaned.length > 0) {
        cleaned[cleaned.length-1].max = Infinity;
        CORRAL_TABLE[t.key] = cleaned;
        console.debug(`Parsed corrals for ${t.key}:`, cleaned.map(r => ({label: r.label, max: r.max})));
      } else {
        console.debug(`No cleaned corrals parsed for ${t.key}`);
      }

      // also capture the 'A' row exact time for this column to use as slider minimum
      const aLine = lines.find(l => l.split(',')[0]?.trim() === 'A');
      if (aLine) {
        const aCols = aLine.split(',');
        const aCell = (aCols[colIndex] || '').trim();
        const m2 = aCell.match(/(\d+:)?\d{1,2}:\d{2}/);
        if (m2) {
          const timeStr = m2[0];
          const parts = timeStr.split(':').map(Number);
          let seconds = 0;
          if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
          else if (parts.length === 2) seconds = parts[0]*60 + parts[1];
          else seconds = Number(timeStr);
          A_TIME_BY_RACE[t.key] = seconds;
          console.debug(`Parsed A time for ${t.key}:`, seconds);
        }
      }
    }
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

  const corrals = CORRAL_TABLE[race];
  const corral = corrals.find(c => seconds <= c.max);
  const idx = corrals.indexOf(corral);
  const prevMax = idx === 0 ? 0 : corrals[idx-1].max;

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
  const sliderMin = SLIDER_RANGES[race][mode][0];
  // Make slider max equal to the K corral slowest time for this race when possible.
  const defaultSliderMax = SLIDER_RANGES[race][mode][1];
  let sliderMax = defaultSliderMax;
  const raceTable = CORRAL_TABLE[race];
  if (raceTable && raceTable.length > 0) {
    const last = raceTable[raceTable.length - 1];
    if (Number.isFinite(last.max)) {
      sliderMax = last.max;
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
