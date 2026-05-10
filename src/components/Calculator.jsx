import React, { useState } from "react";

const RACES = {
  "5K": { miles: 3.107520199, factor: 2.09 },
  "4M": { miles: 4, factor: 1.6 },
  "5M": { miles: 5, factor: 1.26 },
  "10K": { miles: 6.215040398, factor: 1 },
  Half: { miles: 13.11218148, factor: 0.45 },
  Full: { miles: 26.22436296, factor: 0.22 },
};

const CATEGORIES = {
  men: { label: "Men", aaLabel: "AA-m" },
  women: { label: "Women", aaLabel: "AA-w" },
  nonbinary: { label: "Non-binary", aaLabel: "AA-x" },
};

const paceSeconds = (pace) => {
  const [minutes, seconds] = pace.split(":").map(Number);
  return minutes * 60 + seconds;
};

const CORRAL_RANGES = [
  { label: "A", min: paceSeconds("6:20"), max: paceSeconds("6:29") },
  { label: "B", min: paceSeconds("6:30"), max: paceSeconds("7:03") },
  { label: "C", min: paceSeconds("7:04"), max: paceSeconds("7:28") },
  { label: "D", min: paceSeconds("7:29"), max: paceSeconds("7:52") },
  { label: "E", min: paceSeconds("7:53"), max: paceSeconds("8:12") },
  { label: "F", min: paceSeconds("8:13"), max: paceSeconds("8:33") },
  { label: "G", min: paceSeconds("8:34"), max: paceSeconds("8:56") },
  { label: "H", min: paceSeconds("8:57"), max: paceSeconds("9:20") },
  { label: "I", min: paceSeconds("9:21"), max: paceSeconds("9:51") },
  { label: "J", min: paceSeconds("9:52"), max: paceSeconds("10:30") },
  { label: "K", min: paceSeconds("10:31"), max: paceSeconds("11:36") },
];

const SLIDER_RANGES = {
  "5K": { timeMax: 2177, paceMax: paceSeconds("11:36") },
  "4M": { timeMax: 2849, paceMax: paceSeconds("11:36") },
  "5M": { timeMax: 3611, paceMax: paceSeconds("11:36") },
  "10K": { timeMax: 4326, paceMax: paceSeconds("11:36") },
  Half: { timeMax: 9612, paceMax: paceSeconds("11:36") },
  Full: { timeMax: 19661, paceMax: paceSeconds("11:36") },
};

const formatTime = (time) => {
  const rounded = Math.round(time);
  const h = Math.floor(rounded / 3600);
  const m = Math.floor((rounded % 3600) / 60);
  const s = String(rounded % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
};

const formatPace = (pace) => {
  const rounded = Math.round(pace);
  const min = Math.floor(rounded / 60);
  const sec = String(rounded % 60).padStart(2, "0");
  return `${min}:${sec}/mi`;
};

const getCorral = (bestPace, category) => {
  if (category === "men") {
    if (bestPace <= paceSeconds("5:04")) {
      return { label: "AA-m", min: paceSeconds("4:00"), max: paceSeconds("5:04") };
    }
    if (bestPace <= paceSeconds("6:19")) {
      return { label: "A-m", min: paceSeconds("5:05"), max: paceSeconds("6:19") };
    }
  }

  if (bestPace <= paceSeconds("6:19")) {
    return { label: CATEGORIES[category].aaLabel, min: paceSeconds("4:00"), max: paceSeconds("6:19") };
  }

  return CORRAL_RANGES.find((range) => bestPace >= range.min && bestPace <= range.max) || CORRAL_RANGES[CORRAL_RANGES.length - 1];
};

export default function Calculator() {
  const [race, setRace] = useState("10K");
  const [category, setCategory] = useState("men");
  const [mode, setMode] = useState("time");
  const [seconds, setSeconds] = useState(3000);
  const [pace, setPace] = useState(480);

  const raceInfo = RACES[race];
  const raceMiles = raceInfo.miles;

  const paceToTime = (p) => Math.round(p * raceMiles);
  const timeToPace = (t) => t / raceMiles;

  const updateTime = (t) => {
    setSeconds(t);
    setPace(timeToPace(t));
  };

  const updatePace = (p) => {
    setPace(p);
    setSeconds(paceToTime(p));
  };

  const enteredTime = mode === "time" ? seconds : paceToTime(pace);
  const best10KTime = enteredTime * raceInfo.factor;
  const bestPace = best10KTime / RACES["10K"].miles;
  const corral = getCorral(bestPace, category);
  const sliderValue = mode === "time" ? seconds : pace;
  const sliderOnChange = (e) => mode === "time" ? updateTime(Number(e.target.value)) : updatePace(Number(e.target.value));
  const bestPaceToRaceTime = (p) => (p * RACES["10K"].miles) / raceInfo.factor;
  const fastestPace = paceSeconds("4:00");
  const sliderMin = mode === "time" ? Math.floor(bestPaceToRaceTime(fastestPace)) : fastestPace;
  const sliderMax = mode === "time" ? SLIDER_RANGES[race].timeMax : SLIDER_RANGES[race].paceMax;
  const corralRange = Number.isFinite(corral.max)
    ? mode === "time"
      ? `${formatTime(bestPaceToRaceTime(corral.min))} - ${formatTime(bestPaceToRaceTime(corral.max))}`
      : `${formatPace(corral.min)} - ${formatPace(corral.max)}`
    : mode === "time"
      ? `${formatTime(bestPaceToRaceTime(corral.min))}+`
      : `${formatPace(corral.min)}+`;

  const progressPercent = Number.isFinite(corral.max)
    ? ((bestPace - corral.min) / (corral.max - corral.min)) * 100
    : 100;

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">Calculator</h1>
      <div className="text-sm text-gray-600">Unofficial calculator using NYRR's published best-pace corral cuts.</div>
      <div className="text-sm text-gray-600">Pace cuts effective beginning with the NYRR Fred Lebow Half Marathon on January 25, 2026.</div>
      <div className="text-sm text-gray-600">L corral is omitted.</div>

      <div className="space-y-2">
        <label className="font-medium">Category</label>
        <select className="p-2 rounded border" value={category} onChange={(e) => setCategory(e.target.value)}>
          {Object.entries(CATEGORIES).map(([value, item]) => (
            <option key={value} value={value}>{item.label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Race Distance</label>
        <select className="p-2 rounded border" value={race} onChange={(e) => setRace(e.target.value)}>
          <option>5K</option>
          <option>4M</option>
          <option>5M</option>
          <option>10K</option>
          <option>Half</option>
          <option>Full</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Input Mode</label>
        <div className="flex gap-4">
          <button className={`px-3 py-1 rounded ${mode === "time" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => setMode("time")}>Time</button>
          <button className={`px-3 py-1 rounded ${mode === "pace" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => setMode("pace")}>Pace</button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-medium">{mode === "time" ? "Race Time" : "Pace (min/mile)"}</label>
        <input type="range" min={sliderMin} max={sliderMax} value={sliderValue} onChange={sliderOnChange} className="w-full" />
        <div className="text-xl font-semibold">{mode === "time" ? formatTime(seconds) : formatPace(pace)}</div>
      </div>

      <div className="p-4 rounded-xl bg-gray-100 space-y-4">
        <div className="text-lg">Corral: <span className="font-bold text-xl">{corral.label}</span></div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Corral Range</div>
          <div className="w-full h-3 bg-gray-300 rounded-full relative">
            <div className="h-3 bg-black rounded-full" style={{ width: `${Math.max(0, Math.min(100, progressPercent))}%` }} />
          </div>
          <div className="text-sm text-gray-600">{corralRange}</div>
        </div>
      </div>
    </div>
  );
}
