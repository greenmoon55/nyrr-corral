import React, { useMemo, useState } from "react";

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
  Full: { label: "Marathon", miles: 26.22436296, factor: 0.22 },
};

const MANUAL_RACES = ["5K", "4M", "5M", "10K", "Half", "Full"];
const TARGET_RACES = ["5K", "4M", "10K", "10M", "Half", "Full"];
const BEST_PACE_WINDOW_YEARS = 2;
const BEST_PACE_MINIMUM_MILES = 3;
const RIEGEL_EXPONENT = 1.06;

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

const formatChartMonth = (dateString) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short" });
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

const getRaceDefinition = (distanceName) => {
  const normalized = (distanceName || "").toString().toLowerCase().replace(/\s+/g, " ").trim();
  const raceKey = DISTANCE_ALIASES[normalized];
  if (raceKey) return { raceKey, raceInfo: RACES[raceKey] };

  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*(kilometers?|km|miles?|mi)$/);
  if (!match) return { raceKey: null, raceInfo: null };

  const value = Number(match[1]);
  if (!Number.isFinite(value) || value <= 0) return { raceKey: null, raceInfo: null };

  const isMetric = match[2].startsWith("k");
  const miles = isMetric ? value * 0.6215040398 : value;
  const label = isMetric ? `${value}K` : `${value}M`;
  return {
    raceKey: label,
    raceInfo: {
      estimated: true,
      factor: (RACES["10K"].miles / miles) ** RIEGEL_EXPONENT,
      label,
      miles,
    },
  };
};

const extractRunnerId = (value) => {
  const text = value.trim();
  const urlMatch = text.match(/\/runner\/(\d+)/i);
  if (urlMatch) return urlMatch[1];
  return /^\d+$/.test(text) ? text : null;
};

const getCorral = (bestPace, category) => {
  const roundedPace = Math.round(bestPace);

  if (roundedPace > paceSeconds("11:36")) {
    return { label: "L", min: paceSeconds("11:37"), max: paceSeconds("25:00") };
  }

  if (category === "men") {
    if (roundedPace <= paceSeconds("5:04")) {
      return { label: "AA-m", min: paceSeconds("4:00"), max: paceSeconds("5:04") };
    }
    if (roundedPace <= paceSeconds("6:19")) {
      return { label: "A-m", min: paceSeconds("5:05"), max: paceSeconds("6:19") };
    }
  }

  if (roundedPace <= paceSeconds("6:19")) {
    return { label: CATEGORIES[category].aaLabel, min: paceSeconds("4:00"), max: paceSeconds("6:19") };
  }

  return CORRAL_RANGES.find((range) => roundedPace >= range.min && roundedPace <= range.max) || CORRAL_RANGES[CORRAL_RANGES.length - 1];
};

const getResultCorral = ({ time, raceInfo, category }) => {
  const best10KTime = time * raceInfo.factor;
  const bestPace = best10KTime / RACES["10K"].miles;
  return { bestPace, corral: getCorral(bestPace, category) };
};

const manualValueToTime = (value, mode, raceInfo) => (
  mode === "time" ? value : Math.round(value * raceInfo.miles)
);

const getManualSliderLimits = (mode, raceInfo) => {
  const minimumBestPace = paceSeconds("4:00");
  const maximumBestPace = paceSeconds("11:36");
  const timeScale = RACES["10K"].miles / raceInfo.factor;
  const searchMax = mode === "time"
    ? Math.ceil((maximumBestPace + 1) * timeScale) + 2
    : Math.ceil(((maximumBestPace + 1) * timeScale) / raceInfo.miles) + 2;
  const min = mode === "time" ? Math.floor(minimumBestPace * timeScale) : minimumBestPace;
  let max = null;

  for (let value = min; value <= searchMax; value += 1) {
    const time = manualValueToTime(value, mode, raceInfo);
    const roundedBestPace = Math.round((time * raceInfo.factor) / RACES["10K"].miles);
    if (roundedBestPace <= maximumBestPace) {
      max = value;
    } else if (max !== null && roundedBestPace > maximumBestPace) {
      break;
    }
  }

  return { min, max };
};

const getManualCorralRanges = ({ category, max, min, mode, raceInfo }) => {
  const ranges = {};
  for (let value = min; value <= max; value += 1) {
    const time = manualValueToTime(value, mode, raceInfo);
    const label = getResultCorral({ time, raceInfo, category }).corral.label;
    if (!ranges[label]) ranges[label] = { min: value, max: value };
    else ranges[label].max = value;
  }
  return ranges;
};

const getCorralPercent = (bestPace, corral) => {
  if (!corral || !Number.isFinite(corral.max) || corral.max === corral.min) return null;
  const percent = ((corral.max - bestPace) / (corral.max - corral.min)) * 100;
  return Math.round(Math.max(0, Math.min(100, percent)));
};

const getEligibilityWindowStart = () => {
  const start = new Date();
  start.setFullYear(start.getFullYear() - BEST_PACE_WINDOW_YEARS);
  return start;
};

const getRaceEligibility = (race, raceInfo) => {
  if (raceInfo && raceInfo.miles < BEST_PACE_MINIMUM_MILES) {
    return { eligible: false, label: "Below 3-mile minimum" };
  }

  if (/\bvirtual\b/i.test(race.eventName || "")) {
    return { eligible: false, label: "Virtual - not eligible" };
  }

  const raceDate = new Date(race.startDateTime);
  if (Number.isNaN(raceDate.getTime())) {
    return { eligible: false, label: "Date unavailable" };
  }

  const now = new Date();
  const eligible = raceDate >= getEligibilityWindowStart() && raceDate <= now;
  return {
    eligible,
    label: eligible ? "In best-pace window" : "Outside 2-year window",
  };
};

const addYears = (dateString, years) => {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return null;
  date.setFullYear(date.getFullYear() + years);
  return date;
};

const getNextCorralTarget = (calculated, category) => {
  const targetBestPace = calculated.corral.min - 1;
  const nextCorral = getCorral(targetBestPace, category);
  if (nextCorral.label === calculated.corral.label) return null;

  return {
    bestPace: targetBestPace,
    corral: nextCorral,
    raceTimes: TARGET_RACES.map((raceKey) => ({
      raceKey,
      time: (targetBestPace * RACES["10K"].miles) / RACES[raceKey].factor,
    })),
  };
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
  const [candidatePage, setCandidatePage] = useState(1);
  const [candidateQuery, setCandidateQuery] = useState("");
  const [candidateTotal, setCandidateTotal] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
    setQuery("");
    setSelectedRunner(null);
    setRaces([]);
    setCandidates([]);
    setCandidatePage(1);
    setCandidateQuery("");
    setCandidateTotal(0);
    setIsLoadingMore(false);
    setError("");
    setSearchStatus("idle");
    setRaceStatus("idle");
  };

  const searchRunner = async (event) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;

    setError("");
    setCandidates([]);
    setCandidatePage(1);
    setCandidateQuery(trimmed);
    setCandidateTotal(0);
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
      setCandidateTotal(data.totalItems || data.items?.length || 0);
      setSearchStatus("success");
    } catch (e) {
      setError(e.message || "Could not search NYRR results.");
      setSearchStatus("error");
    }
  };

  const loadMoreCandidates = async () => {
    if (isLoadingMore || candidates.length >= candidateTotal) return;

    const nextPage = candidatePage + 1;
    setError("");
    setIsLoadingMore(true);
    try {
      const data = await postNyrr("/runners/search", {
        searchString: candidateQuery,
        pageIndex: nextPage,
        pageSize: 12,
        sortDescending: false,
      });
      setCandidates((current) => {
        const existingIds = new Set(current.map((runner) => runner.runnerId));
        return [...current, ...(data.items || []).filter((runner) => !existingIds.has(runner.runnerId))];
      });
      setCandidatePage(nextPage);
      setCandidateTotal(data.totalItems || candidateTotal);
    } catch (e) {
      setError(e.message || "Could not load more runners.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const selectedCategory = getCategoryFromGender(selectedRunner?.gender);

  return (
    <section className="panel space-y-4">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Check NYRR Results</h2>
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
          {candidates.length < candidateTotal && (
            <button className="load-more-button" disabled={isLoadingMore} onClick={loadMoreCandidates} type="button">
              {isLoadingMore ? "Loading" : "Load more"}
            </button>
          )}
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
          <button className="px-3 py-1 rounded bg-gray-200" onClick={clearRunner} type="button">Clear</button>
        </div>
      )}

      {raceStatus === "loading" && <div className="notice">Loading races...</div>}

      {raceStatus === "success" && selectedRunner && (
        <RaceResults races={races} category={selectedCategory} />
      )}
    </section>
  );
}

function CurrentBestSummary({ result, results, category }) {
  const { race, calculated } = result;
  const racePace = parseTime(race.actualTime) / result.raceInfo.miles;
  const progress = getCorralPercent(calculated.bestPace, calculated.corral);
  const nextTarget = getNextCorralTarget(calculated, category);
  const nextTargetRaceTime = nextTarget
    ? (nextTarget.bestPace * RACES["10K"].miles) / result.raceInfo.factor
    : null;
  const nextTargetTimeGap = nextTargetRaceTime === null
    ? null
    : Math.max(0, parseTime(race.actualTime) - nextTargetRaceTime);
  const nextTargetPaceGap = nextTargetTimeGap === null
    ? null
    : nextTargetTimeGap / result.raceInfo.miles;
  const expiresOn = addYears(race.startDateTime, BEST_PACE_WINDOW_YEARS);
  const bestResultForDistance = (raceKey) => results
    .filter((item) => item.eligibility.eligible && item.raceKey === raceKey && parseTime(item.race.actualTime))
    .reduce((best, item) => {
      const time = parseTime(item.race.actualTime);
      return !best || time < best.time ? { item, time } : best;
    }, null);

  return (
    <section className="best-summary" aria-labelledby="best-summary-title">
      <div className="best-summary-heading">
        <div>
          <div className="summary-eyebrow">Current Best</div>
          <h3 id="best-summary-title">{race.eventName}</h3>
          <div className="text-sm text-gray-600">
            {formatDate(race.startDateTime)} | {result.raceKey} | {race.actualTime}
            {expiresOn ? ` | Window ends ${formatDate(expiresOn)}` : ""}
          </div>
        </div>
        <div className="best-pace-value">
          <div>
            <span>Race pace</span>
            <strong>{formatPace(racePace)}</strong>
          </div>
        </div>
      </div>

      <div className="summary-grid">
        <div className="summary-metric summary-progress-card">
          <span className="summary-label">Corral progress</span>
          <div className="summary-corral-row">
            <span className="summary-corral">{calculated.corral.label}</span>
            {progress !== null && <strong>{progress}%</strong>}
          </div>
          {progress !== null && (
            <div
              aria-label={`${progress}% toward the faster edge of ${calculated.corral.label} corral`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={progress}
              className="summary-progress"
              role="progressbar"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
          )}
          <span className="summary-help">Higher means closer to moving up.</span>
        </div>

        <div className="summary-metric summary-target-card">
          <span className="summary-label">Next corral target</span>
          {nextTarget ? (
            <>
              <div className="next-corral-line">
                <strong>{nextTarget.corral.label}</strong>
                <span>
                  {result.raceInfo.label} {formatTime(nextTargetRaceTime)} target
                  <span aria-hidden="true"> | </span>
                  {formatTime(nextTargetTimeGap)} faster
                  <span aria-hidden="true"> | </span>
                  {formatTime(nextTargetPaceGap)}/mi faster
                </span>
              </div>
              <div className="target-context">Compared with your recent best.</div>
              <div className="target-times" aria-label={`Target finish times for ${nextTarget.corral.label} corral`}>
                {nextTarget.raceTimes.map(({ raceKey, time }) => {
                  const currentBest = bestResultForDistance(raceKey);
                  const timeGap = currentBest ? currentBest.time - time : null;

                  return (
                    <div className="target-time" key={raceKey}>
                      <span>{raceKey === "Full" ? "Marathon" : RACES[raceKey].label}</span>
                      <strong>{formatTime(time)}</strong>
                      {timeGap !== null && (
                        <>
                          <small>{timeGap > 0 ? `${formatTime(timeGap)} faster` : "Target met"}</small>
                          <small className="target-source" title={currentBest.item.race.eventName}>
                            {currentBest.item.race.eventName}
                          </small>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="next-corral-line"><strong>Fastest listed corral</strong></div>
          )}
        </div>
      </div>

      <div className="summary-note">
        Estimated from eligible NYRR results in the current two-year window. NYRR may apply additional rules.
      </div>
    </section>
  );
}

function BestPaceProgression({ results }) {
  const [activeIndex, setActiveIndex] = useState(null);
  const progression = results
    .filter((result) => {
      const raceDate = new Date(result.race.startDateTime);
      return result.calculated
        && result.raceInfo?.miles >= BEST_PACE_MINIMUM_MILES
        && !/\bvirtual\b/i.test(result.race.eventName || "")
        && !Number.isNaN(raceDate.getTime())
        && raceDate <= new Date();
    })
    .sort((a, b) => new Date(a.race.startDateTime) - new Date(b.race.startDateTime))
    .reduce((records, result) => {
      const previousBest = records[records.length - 1];
      if (!previousBest || result.calculated.bestPace < previousBest.calculated.bestPace) {
        records.push(result);
      }
      return records;
    }, []);

  if (progression.length < 2) return null;

  const horizontalPadding = 74;
  const pointSpacing = progression.length <= 6 ? 72 : 56;
  const width = Math.min(720, Math.max(260, horizontalPadding + (progression.length - 1) * pointSpacing));
  const height = 230;
  const padding = { top: 20, right: 18, bottom: 36, left: 56 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const paces = progression.map((result) => result.calculated.bestPace);
  const fastestPace = Math.min(...paces);
  const slowestPace = Math.max(...paces);
  const paceRange = Math.max(1, slowestPace - fastestPace);
  const points = progression.map((result, index) => ({
    result,
    x: padding.left + (index / (progression.length - 1)) * chartWidth,
    y: padding.top + ((result.calculated.bestPace - fastestPace) / paceRange) * chartHeight,
  }));
  const yTicks = [fastestPace, (fastestPace + slowestPace) / 2, slowestPace];
  const first = progression[0];
  const latest = progression[progression.length - 1];
  const dateLabelStep = Math.max(1, Math.ceil(progression.length / 6));
  const dateLabelIndexes = progression
    .map((_, index) => index)
    .filter((index) => index % dateLabelStep === 0);
  const lastDateIndex = progression.length - 1;
  const lastShownDateIndex = dateLabelIndexes[dateLabelIndexes.length - 1];
  if (lastShownDateIndex !== lastDateIndex) {
    if (lastDateIndex - lastShownDateIndex < dateLabelStep) dateLabelIndexes.pop();
    dateLabelIndexes.push(lastDateIndex);
  }
  const selectedIndex = activeIndex === null ? progression.length - 1 : Math.min(activeIndex, progression.length - 1);
  const selected = progression[selectedIndex];

  return (
    <section className="progression-chart" aria-labelledby="progression-title">
      <div className="progression-heading">
        <div>
          <span className="summary-label">Best Pace Milestones</span>
          <h3 id="progression-title">{progression.length - 1} improvements</h3>
        </div>
        <div className="progression-change">
          <span>{formatTime(first.calculated.bestPace * RACES["10K"].miles)}</span>
          <span aria-hidden="true">to</span>
          <strong>{formatTime(latest.calculated.bestPace * RACES["10K"].miles)}</strong>
        </div>
      </div>
      <div aria-live="polite" className="progression-race-detail">
        <strong>{selected.race.eventName}</strong>
        <span>
          {formatDate(selected.race.startDateTime)} | {selected.raceKey} | {selected.race.actualTime} | 10K equivalent {formatTime(selected.calculated.bestPace * RACES["10K"].miles)} | Corral {selected.calculated.corral.label}
        </span>
      </div>
      <div className="progression-plot">
        <svg
          aria-describedby="progression-description"
          height={height}
          role="img"
          viewBox={`0 0 ${width} ${height}`}
          width={width}
        >
          <desc id="progression-description">
            Record-setting NYRR results from oldest to newest. Higher points represent faster 10K-equivalent finish times.
          </desc>
          {yTicks.map((pace) => {
            const y = padding.top + ((pace - fastestPace) / paceRange) * chartHeight;
            return (
              <g key={pace}>
                <line className="progression-grid-line" x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
                <text className="progression-axis-label" textAnchor="end" x={padding.left - 8} y={y + 4}>
                  {formatTime(pace * RACES["10K"].miles)}
                </text>
              </g>
            );
          })}
          <polyline
            className="progression-line"
            points={points.map(({ x, y }) => `${x},${y}`).join(" ")}
          />
          {points.map(({ result, x, y }, index) => (
            <circle
              aria-label={`${result.race.eventName}, ${formatDate(result.race.startDateTime)}, ${result.raceKey} ${result.race.actualTime}, Corral ${result.calculated.corral.label}`}
              className={`progression-point${index === points.length - 1 ? " is-latest" : ""}${index === selectedIndex ? " is-active" : ""}`}
              cx={x}
              cy={y}
              key={`${result.race.eventCode}-${result.race.startDateTime}`}
              onClick={() => setActiveIndex(index)}
              onFocus={() => setActiveIndex(index)}
              onMouseEnter={() => setActiveIndex(index)}
              r={index === selectedIndex ? 7 : index === points.length - 1 ? 5.5 : 4}
              role="button"
              tabIndex="0"
            >
              <title>
                {`${formatDate(result.race.startDateTime)} | ${result.race.eventName} | ${result.raceKey} ${result.race.actualTime} | 10K equivalent ${formatTime(result.calculated.bestPace * RACES["10K"].miles)} | Corral ${result.calculated.corral.label}`}
              </title>
            </circle>
          ))}
          {dateLabelIndexes.map((index) => (
            <text
              className="progression-axis-label"
              key={index}
              textAnchor={index === 0 ? "start" : index === progression.length - 1 ? "end" : "middle"}
              x={points[index].x}
              y={height - 10}
            >
              {formatChartMonth(progression[index].race.startDateTime)}
            </text>
          ))}
        </svg>
      </div>
      <p className="progression-note">
        10K-equivalent time. Only new bests are shown.
      </p>
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

  const evaluatedRaces = races.map((race) => {
    const time = parseTime(race.actualTime);
    const { raceKey, raceInfo } = getRaceDefinition(race.distanceName);
    const eligibility = getRaceEligibility(race, raceInfo);
    let status = null;
    let calculated = null;

    if (!raceInfo) status = "No corral conversion";
    else if (!time) status = "Missing official time";
    else calculated = getResultCorral({ time, raceInfo, category });

    return { race, raceKey, raceInfo, time, eligibility, status, calculated };
  });
  const currentBest = evaluatedRaces
    .filter((result) => result.eligibility.eligible && result.calculated)
    .sort((a, b) => a.calculated.bestPace - b.calculated.bestPace)[0];

  return (
    <div className="results-block">
      {currentBest ? (
        <CurrentBestSummary category={category} result={currentBest} results={evaluatedRaces} />
      ) : (
        <div className="notice">No eligible results were found in the current two-year window.</div>
      )}
      <BestPaceProgression results={evaluatedRaces} />
      {!currentBest && (
        <div className="results-legend">
          <span className="font-semibold">Corral progress</span>
          <span>Higher means closer to moving up.</span>
        </div>
      )}
      <div className="results-wrap">
        <table className="results-table">
        <thead>
          <tr>
            <th className="corral-column">Corral Estimate</th>
            <th>Race</th>
            <th>Distance</th>
            <th>Time</th>
            <th>Pace</th>
          </tr>
        </thead>
        <tbody>
          {evaluatedRaces.map((result) => {
            const { race, raceKey, raceInfo, time, eligibility, status, calculated } = result;
            const isCurrentBest = result === currentBest;
            const resultUrl = getRaceResultUrl(race);
            const corralPercent = calculated ? getCorralPercent(calculated.bestPace, calculated.corral) : null;

            return (
              <tr className={isCurrentBest ? "is-current-best" : ""} key={`${race.eventCode}-${race.bib}-${race.startDateTime}`}>
                <td data-label="Corral Estimate">
                  {status ? (
                    <span className="muted-label">{status}</span>
                  ) : (
                    <div className="corral-cell-content">
                      <span className="corral-label">{calculated.corral.label}</span>
                      {corralPercent !== null && (
                        <div className="corral-progress-row">
                          <div
                            aria-label={`${corralPercent}% toward the faster edge of ${calculated.corral.label} corral`}
                            aria-valuemax="100"
                            aria-valuemin="0"
                            aria-valuenow={corralPercent}
                            className="corral-progress"
                            role="progressbar"
                            title={`${corralPercent}% toward the faster edge of ${calculated.corral.label} corral`}
                          >
                            <span style={{ width: `${corralPercent}%` }} />
                          </div>
                          <span className="corral-progress-value">{corralPercent}%</span>
                        </div>
                      )}
                    </div>
                  )}
                </td>
                <td data-label="Race">
                  <div className="font-medium">
                    {isCurrentBest && (
                      <span aria-label="Current best" className="best-result-icon" title="Current best">&#9733;</span>
                    )}
                    {resultUrl ? (
                      <a href={resultUrl} rel="noreferrer" target="_blank">{race.eventName}</a>
                    ) : (
                      race.eventName
                    )}
                  </div>
                  <div className="race-meta text-sm text-gray-600">
                    <span>{formatDate(race.startDateTime)}{race.bib ? ` | Bib ${race.bib}` : ""}</span>
                    <span className={`eligibility-badge ${isCurrentBest ? "is-best" : eligibility.eligible ? "is-eligible" : ""}`}>
                      {isCurrentBest ? "Best pace" : eligibility.label}
                    </span>
                  </div>
                </td>
                <td data-label="Distance">{raceKey || race.distanceName || "-"}</td>
                <td data-label="Time">{race.actualTime || "-"}</td>
                <td className="pace-cell" data-label="Pace">{race.actualPace ? `${race.actualPace}/mi` : time && raceInfo ? formatPace(time / raceInfo.miles) : "-"}</td>
              </tr>
            );
          })}
        </tbody>
        </table>
      </div>
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

  const sliderLimits = useMemo(() => getManualSliderLimits(mode, raceInfo), [mode, raceInfo]);
  const rawSliderValue = mode === "time" ? seconds : pace;
  const sliderValue = Math.max(sliderLimits.min, Math.min(sliderLimits.max, rawSliderValue));
  const enteredTime = manualValueToTime(sliderValue, mode, raceInfo);
  const { bestPace, corral } = getResultCorral({ time: enteredTime, raceInfo, category });
  const sliderOnChange = (e) => mode === "time" ? updateTime(Number(e.target.value)) : updatePace(Number(e.target.value));
  const corralRanges = useMemo(
    () => getManualCorralRanges({
      category,
      max: sliderLimits.max,
      min: sliderLimits.min,
      mode,
      raceInfo,
    }),
    [category, mode, raceInfo, sliderLimits.max, sliderLimits.min],
  );
  const currentRange = corralRanges[corral.label];
  const corralRange = mode === "time"
    ? `${formatTime(currentRange.min)} - ${formatTime(currentRange.max)}`
    : `${formatPace(currentRange.min)} - ${formatPace(currentRange.max)}`;

  const progressPercent = getCorralPercent(bestPace, corral) ?? 0;

  return (
    <section className="panel space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Manual Check</h2>
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
        <label className="font-medium">Distance</label>
        <select className="p-2 rounded border" value={race} onChange={(e) => setRace(e.target.value)}>
          {MANUAL_RACES.map((raceKey) => (
            <option key={raceKey} value={raceKey}>{RACES[raceKey].label}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="font-medium">Input</label>
        <div className="flex gap-4">
          <button className={`px-3 py-1 rounded ${mode === "time" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => setMode("time")}>Time</button>
          <button className={`px-3 py-1 rounded ${mode === "pace" ? "bg-black text-white" : "bg-gray-200"}`} onClick={() => setMode("pace")}>Pace</button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="font-medium">{mode === "time" ? "Race Time" : "Pace (min/mile)"}</label>
        <input type="range" min={sliderLimits.min} max={sliderLimits.max} value={sliderValue} onChange={sliderOnChange} className="w-full" />
        <div className="text-xl font-semibold">{mode === "time" ? formatTime(sliderValue) : formatPace(sliderValue)}</div>
      </div>

      <div className="p-4 rounded-xl bg-gray-100 space-y-4">
        <div className="text-lg">Corral: <span className="font-bold text-xl manual-corral-value">{corral.label}</span></div>
        <div className="space-y-2">
          <div className="text-sm text-gray-600">Range</div>
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
  const [activeView, setActiveView] = useState("results");

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">NYRR Corral Progress</h1>
        <div className="text-sm text-gray-600">Unofficial tool using NYRR's published best-pace corral cuts (2026).</div>
        <div className="text-sm text-gray-600">Look up NYRR results or check a race time to see your corral progress and next target.</div>
      </div>

      <div aria-label="Corral progress mode" className="view-tabs" role="tablist">
        <button
          aria-controls="nyrr-results-panel"
          aria-selected={activeView === "results"}
          className={`view-tab ${activeView === "results" ? "is-active" : ""}`}
          onClick={() => setActiveView("results")}
          role="tab"
          type="button"
        >
          NYRR Results
        </button>
        <button
          aria-controls="manual-check-panel"
          aria-selected={activeView === "manual"}
          className={`view-tab ${activeView === "manual" ? "is-active" : ""}`}
          onClick={() => setActiveView("manual")}
          role="tab"
          type="button"
        >
          Manual Check
        </button>
      </div>

      <div hidden={activeView !== "results"} id="nyrr-results-panel" role="tabpanel">
        <RunnerLookup />
      </div>
      <div hidden={activeView !== "manual"} id="manual-check-panel" role="tabpanel">
        <ManualCalculator />
      </div>

      <footer className="site-footer">
        Built by greenmoon55
      </footer>
    </div>
  );
}
