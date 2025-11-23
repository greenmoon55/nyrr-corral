import { useState } from "react";

const CORRAL_TABLE = {
  "1M": [ { max: 480, label: "A" }, { max: 600, label: "B" }, { max: 720, label: "C" }, { max: Infinity, label: "D" } ],
  "5K": [ { max: 1200, label: "A" }, { max: 1500, label: "B" }, { max: 1800, label: "C" }, { max: Infinity, label: "D" } ],
  "5M": [ { max: 2400, label: "A" }, { max: 3000, label: "B" }, { max: 3600, label: "C" }, { max: Infinity, label: "D" } ],
  "10K": [ { max: 2400, label: "A" }, { max: 2700, label: "B" }, { max: 3000, label: "C" }, { max: 3300, label: "D" }, { max: Infinity, label: "E" } ],
  "Half": [ { max: 6000, label: "A" }, { max: 7200, label: "B" }, { max: 7800, label: "C" }, { max: Infinity, label: "D" } ],
  "Full": [ { max: 14400, label: "A" }, { max: 16200, label: "B" }, { max: 18000, label: "C" }, { max: Infinity, label: "D" } ]
};

const SLIDER_RANGES = {
  "1M": { time: [60, 1200], pace: [300, 900] },
  "5K": { time: [300, 2000], pace: [300, 1200] },
  "5M": { time: [600, 4000], pace: [300, 1200] },
  "10K": { time: [600, 6000], pace: [300, 1200] },
  "Half": { time: [1800, 9000], pace: [360, 1200] },
  "Full": { time: [3600, 20000], pace: [420, 1500] }
};

export default function NYRRCorralPicker() {
  const [race, setRace] = useState("10K");
  const [mode, setMode] = useState("time");
  const [seconds, setSeconds] = useState(3000);
  const [pace, setPace] = useState(480);

  const raceMiles = { "1M": 1, "5K": 3.1069, "5M": 5, "10K": 6.2137, Half: 13.1094, Full: 26.2188 }[race];

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
  const sliderMax = SLIDER_RANGES[race][mode][1];
  const sliderOnChange = (e) => mode === 'time' ? updateTime(Number(e.target.value)) : updatePace(Number(e.target.value));

  return (
    <div className="p-6 space-y-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold">NYRR Corral Picker</h1>

      <div className="space-y-2">
        <label className="font-medium">Race Distance</label>
        <select className="p-2 rounded border" value={race} onChange={(e)=>setRace(e.target.value)}>
          <option>1M</option>
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
