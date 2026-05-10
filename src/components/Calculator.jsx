import React, { useState } from "react";

const NYRR_API = "https://rmsprodapi.nyrr.org/api/v2";

const RACES = {
  "5K": { label: "5K", miles: 3.107520199, factor: 2.09 },
  "4M": { label: "4M", miles: 4, factor: 1.6 },
  "8K": { label: "8K", miles: 4.972032318, factor: 1.27 },
  "5M": { label: "5M", miles: 5, factor: 1.26 },
  "10K": { label: "10K", miles: 6.215040398, factor: 1 },
  "7M": { label: "7M", miles: 7, factor: 0.87 },
  "12K": { label: "12K", miles: 7.458048477, factor: 0.82 },
  "15K": { label: "15K", miles: 9.322560597, factor: 0.65 },
  "10M": { label: "10M", miles: 10, factor: 0.6 },
  "12M": { label: "12M", miles: 12, factor: 0.4978728826 },
  "20K": { label: "20K", miles: 12.4300808, factor: 0.48 },
  Half: { label: "Half", miles: 13.11218148, factor: 0.45 },
  "25K": { label: "25K", miles: 15.53760099, factor: 0.38 },
  "30K": { label: "30K", miles: 18.64512119, factor: 0.31 },
  "20M": { label: "20M", miles: 20, factor: 0.29 },
  Full: { label: "Full", miles: 26.22436296, factor: 0.22 },
};

const MANUAL_RACES = ["5K", "4M", "5M", "10K", "Half", "Full"];

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

const DISTANCE_ALIASES = {
  "5 kilometers": "5K",
  "5 kilometer": "5K",
  "5k": "5K",
  "4 miles": "4M",
  "4 mile": "4M",
  "8 kilometers": "8K",
  "8 kilometer": "8K",
  "8k": "8K",
  "5 miles": "5M",
  "5 mile": "5M",
  "10 kilometers": "10K",
  "10 kilometer": "10K",
  "10k": "10K",
  "7 miles": "7M",
  "7 mile": "7M",
  "12 kilometers": "12K",
  "12 kilometer": "12K",
  "12k": "12K",
  "15 kilometers": "15K",
  "15 kilometer": "15K",
  "15k": "15K",
  "10 miles": "10M",
  "10 mile": "10M",
  "12 miles": "12M",
  "12 mile": "12M",
  "20 kilometers": "20K",
  "20 kilometer": "20K",
  "20k": "20K",
  "half marathon": "Half",
  "half-marathon": "Half",
  "13.1 miles": "Half",
  "25 kilometers": "25K",
  "25 kilometer": "25K",
  "25k": "25K",
  "30 kilometers": "30K",
  "30 kilometer": "30K",
  "30k": "30K",
  "20 miles": "20M",
  "20 mile": "20M",
  marathon: "Full",
  "26.2 miles": "Full",
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

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
};

const parseTime = (value) => {
  if (!value) return null;
  const parts = value.split(":").map(Number);
  if (parts.some((part) => Number.isNaN(part))) return null;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return null;
};

const getCategoryFromGender = (gender) => {
  const normalized = (gender || "").toString().trim().toUpperCase();
  if (normalized === "M" || normalized === "MEN" || normalized === "MALE") return "men";
  if (normalized === "W" || normalized === "F" || normalized === "WOMEN" || normalized === "FEMALE") return "women";
  if (normalized === "X" || normalized === "NB" || normalized === "NONBINARY" || normalized === "NON-BINARY") return "nonbinary";
  return null;
};

const getRaceKeyFromDistance = (distanceName) => {
  const normalized = (distanceName || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  return DISTANCE_ALIASES[normalized] || null;
};

const extractRunnerId = (value) => {
  const text = value.trim();
  const urlMatch = text.match(/\/runner\/(\d+)/i);
  if (urlMatch) return urlMatch[1];
  return /^\d+$/.test(text) ? text : null;
};

const getCorral = (bestPace, category) => {
  if (bestPace > paceSeconds("11:36")) {
    return { label: "L omitted", min: paceSeconds("11:37"), max: Infinity, omittedL: true };
  }

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

const getResultCorral = ({ time, raceInfo, category }) => {
  const best10KTime = time * raceInfo.factor;
  const bestPace = best10KTime / RACES["10K"].miles;
  return { bestPace, corral: getCorral(bestPace, category) };
};

const getCorralPercent = (bestPace, corral) => {
  if (!corral || corral.omittedL || !Number.isFinite(corral.max) || corral.max === corral.min) return null;
  const percent = ((bestPace - corral.min) / (corral.max - corral.min)) * 100;
  return Math.round(Math.max(0, Math.min(100, percent)));
};

const postNyrr = async (path, body) => {
  const response = await fetch(`${NYRR_API}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`NYRR request failed: ${response.status}`);
  return response.json();
};

const runnerName = (runner) => [runner?.firstName, runner?.lastName].filter(Boolean).join(" ") || "Unknown runner";

const runnerLocation = (runner) => [runner?.city, runner?.stateProvince || runner?.countryCode].filter(Boolean).join(", ");

const getRaceResultUrl = (race) => {
  if (!race?.bib || !race?.eventCode) return null;
  return `https://results.nyrr.org/runner/${encodeURIComponent(race.bib)}/result/${encodeURIComponent(race.eventCode)}`;
};

function RunnerLookup() {
  const [query, setQuery] = useState("");
  const [candidates, setCandidates] = useState([]);
  const [selectedRunner, setSelectedRunner] = useState(null);
  const [races, setRaces] = useState([]);
  const [searchStatus, setSearchStatus] = useState("idle");
  const [raceStatus, setRaceStatus] = useState("idle");
  const [error, setError] = useState("");

  const fetchRaces = async (runner) => {
    setRaceStatus("loading");
    setRaces([]);
    try {
      const data = await postNyrr("/runners/races", {
        runnerId: runner.runnerId,
        pageIndex: 1,
        pageSize: 100,
        sortColumn: "EventDate",
        sortDescending: true,
      });
      setRaces(data.items || []);
      setRaceStatus("success");
    } catch (e) {
      setError(e.message || "Could not load runner races.");
      setRaceStatus("error");
    }
  };

  const selectRunner = async (runner) => {
    setSelectedRunner(runner);
    setCandidates([]);
    await fetchRaces(runner);
  };

  const clearRunner = () => {
    setSelectedRunner(null);
    setRaces([]);
    setCandidates([]);
    setSearchStatus("idle");
    setRaceStatus("idle");
  };

  const searchRunner = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError("");
    setCandidates([]);
    setSelectedRunner(null);
    setRaces([]);
    setSearchStatus("loading");
    setRaceStatus("idle");

    try {
      const runnerId = extractRunnerId(trimmed);
      if (runnerId) {
        const data = await postNyrr("/runners/details", { runnerId });
        const runner = data.details || data;
        setSearchStatus("success");
        await selectRunner(runner);
        return;
      }

      const data = await postNyrr("/runners/search", {
        searchString: trimmed,
        pageIndex: 1,
        pageSize: 12,
        sortDescending: false,
      });
      setCandidates(data.items || []);
      setSearchStatus("success");
    } catch (e) {
      setError(e.message || "Could not search NYRR results.");
      setSearchStatus("error");
    }
  };

  const selectedCategory = getCategoryFromGender(selectedRunner?.gender);

  return (
    <section className="panel space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">NYRR Result Import</h2>
        <div className="text-sm text-gray-600">Search by runner name, NYRR runner ID, or runner results URL.</div>
        <div className="text-sm text-gray-600">Imported results are mapped using the current corral cuts, not the corral rules from the race date.</div>
      </div>

      <form className="lookup-form" onSubmit={searchRunner}>
        <input
          className="p-2 rounded border lookup-input"
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Runner name, NYRR runner ID, or runner results URL"
          value={query}
        />
        <button className="px-3 py-1 rounded bg-black text-white" disabled={searchStatus === "loading"} type="submit">
          {searchStatus === "loading" ? "Searching" : "Search"}
        </button>
      </form>

      {error && <div className="notice notice-error">{error}</div>}

      {searchStatus === "success" && candidates.length === 0 && !selectedRunner && (
        <div className="notice">No runner candidates found.</div>
      )}

      {candidates.length > 0 && (
        <div className="space-y-2">
          <div className="font-medium">Select Runner</div>
          <div className="candidate-list">
            {candidates.map((runner) => (
              <button className="candidate-row" key={runner.runnerId} onClick={() => selectRunner(runner)} type="button">
                <span className="font-bold">{runnerName(runner)}</span>
                <span>#{runner.runnerId}</span>
                <span>{[runner.gender, runner.age ? `Age ${runner.age}` : null].filter(Boolean).join(" | ")}</span>
                <span>{runnerLocation(runner)}</span>
                {runner.teamName && <span>{runner.teamName}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {selectedRunner && (
        <div className="selected-runner">
          <div>
            <div className="font-bold">{runnerName(selectedRunner)}</div>
            <div className="text-sm text-gray-600">
              #{selectedRunner.runnerId} | {[selectedRunner.gender, selectedRunner.age ? `Age ${selectedRunner.age}` : null, runnerLocation(selectedRunner), selectedRunner.teamName].filter(Boolean).join(" | ")}
            </div>
          </div>
          <button className="px-3 py-1 rounded bg-gray-200" onClick={clearRunner} type="button">Hide results</button>
        </div>
      )}

      {raceStatus === "loading" && <div className="notice">Loading races...</div>}

      {raceStatus === "success" && selectedRunner && (
        <RaceResults races={races} category={selectedCategory} />
      )}
    </section>
  );
}

function RaceResults({ races, category }) {
  if (!category) {
    return <div className="notice notice-error">Runner category is unavailable, so corrals cannot be calculated.</div>;
  }

  if (races.length === 0) {
    return <div className="notice">No races found for this runner.</div>;
  }

  return (
    <div className="results-wrap">
      <table className="results-table">
        <thead>
          <tr>
            <th className="corral-column">Corral</th>
            <th>Race</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
          </tr>
        </thead>
        <tbody>
          {races.map((race) => {
            const time = parseTime(race.actualTime);
            const raceKey = getRaceKeyFromDistance(race.distanceName);
            const raceInfo = raceKey ? RACES[raceKey] : null;
            let status = null;
            let calculated = null;

            if (!raceInfo) status = "Unsupported distance";
            else if (!time) status = "Missing official time";
            else calculated = getResultCorral({ time, raceInfo, category });
            const resultUrl = getRaceResultUrl(race);

            return (
              <tr key={`${race.eventCode}-${race.bib}-${race.startDateTime}`}>
                <td data-label="Corral">
                  {status ? (
                    <span className="muted-label">{status}</span>
                  ) : (
                    <>
                      <span className={calculated.corral.omittedL ? "omitted-label" : "corral-label"}>{calculated.corral.label}</span>
                      {getCorralPercent(calculated.bestPace, calculated.corral) !== null && (
                        <div className="text-sm text-gray-600">Top {getCorralPercent(calculated.bestPace, calculated.corral)}% of {calculated.corral.label}</div>
                      )}
                    </>
                  )}
                </td>
                <td data-label="Race">
                  <div className="font-medium">
                    {resultUrl ? (
                      <a href={resultUrl} rel="noreferrer" target="_blank">{race.eventName}</a>
                    ) : (
                      race.eventName
                    )}
                  </div>
                  <div className="text-sm text-gray-600">{formatDate(race.startDateTime)}{race.bib ? ` | Bib ${race.bib}` : ""}</div>
                </td>
                <td data-label="Distance">{raceKey || race.distanceName || "-"}</td>
                <td data-label="Time">{race.actualTime || "-"}</td>
                <td data-label="Pace">{race.actualPace ? `${race.actualPace}/mi` : calculated ? formatPace(calculated.bestPace) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ManualCalculator() {
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
  const { bestPace, corral } = getResultCorral({ time: enteredTime, raceInfo, category });
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
    <section className="panel space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Manual Calculator</h2>
      </div>

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
          {MANUAL_RACES.map((raceKey) => (
            <option key={raceKey} value={raceKey}>{RACES[raceKey].label}</option>
          ))}
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
    </section>
  );
}

export default function Calculator() {
  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Calculator</h1>
        <div className="text-sm text-gray-600">Unofficial calculator using NYRR's published best-pace corral cuts.</div>
        <div className="text-sm text-gray-600">Pace cuts effective beginning with the NYRR Fred Lebow Half Marathon on January 25, 2026.</div>
        <div className="text-sm text-gray-600">L corral is omitted.</div>
      </div>

      <RunnerLookup />
      <ManualCalculator />
    </div>
  );
}
