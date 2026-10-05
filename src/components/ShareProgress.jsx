import React, { useEffect, useRef, useState } from "react";

export default function ShareProgress({ runner, best, results, target, formatTime, tenKMiles }) {
  const [hidden, setHidden] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);
  const copyTimer = useRef(null);
  useEffect(() => {
    setCopied(false);
    return () => clearTimeout(copyTimer.current);
  }, [runner.runnerId]);
  const name = [runner.firstName, runner.lastName].filter(Boolean).join(" ") || "Runner";
  const title = hidden ? "NYRR Corral Progress" : `${name}'s NYRR Progress`;

  async function copyRunnerLink() {
    const url = new URL("https://nyrr-corral.netlify.app/");
    url.hash = new URLSearchParams({ runner: String(runner.runnerId) }).toString();
    try {
      await navigator.clipboard.writeText(url.href);
      setMessage("");
      setCopied(true);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setMessage("Could not copy. Copy the URL from your address bar instead.");
    }
  }

  async function download() {
    setBusy(true);
    setMessage("");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1200;
      canvas.height = 1200;
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas unavailable");
      ctx.fillStyle = "#f5f8fa";
      ctx.fillRect(0, 0, 1200, 1200);
      const text = (value, x, y, size = 26, color = "#1d2937") => {
        ctx.fillStyle = color;
        ctx.font = `600 ${size}px system-ui, sans-serif`;
        ctx.fillText(value, x, y, 1072);
      };
      text("NYRR CORRAL PROGRESS", 64, 78, 24, "#24638b");
      text(title, 64, 143, 42);
      text("Current best · eligible results from the past two years", 64, 200, 23, "#596778");
      if (best) {
        text(`${best.raceKey}  ${formatTime(best.time)}  ·  Estimated Corral ${best.calculated.corral.label}`, 64, 263, 38);
        text(best.race.eventName, 64, 308, 23);
      } else {
        text("No current eligible best", 64, 263, 34);
      }
      text(target ? `Target times for Corral ${target.corral.label}` : best ? "Fastest listed corral" : "Historical milestones", 64, 377, 26, "#24638b");
      target?.raceTimes.forEach(({ raceKey, time }, i) => {
        const x = 64 + (i % 3) * 358;
        const y = 430 + Math.floor(i / 3) * 60;
        text(`${raceKey === "Full" ? "Marathon" : raceKey}  ${formatTime(time)}`, x, y, 27);
      });
      const milestones = results.filter((r) => r.calculated && r.raceInfo?.miles >= 3 && !/\bvirtual\b/i.test(r.race.eventName || "") && new Date(r.race.startDateTime) <= new Date())
        .sort((a, b) => new Date(a.race.startDateTime) - new Date(b.race.startDateTime))
        .reduce((list, r) => {
          if (!list.length || r.calculated.bestPace < list[list.length - 1].calculated.bestPace) list.push(r);
          return list;
        }, []);
      text("Best Pace Milestones", 64, 574, 32);
      text("10K-equivalent time · only new bests", 64, 612, 23, "#596778");
      if (milestones.length) {
        const values = milestones.map((r) => r.calculated.bestPace * tenKMiles);
        const low = Math.min(...values), high = Math.max(...values);
        const range = Math.max(1, high - low);
        [...new Set([low, (low + high) / 2, high])].forEach((v) => {
          const y = 675 + (v - low) / range * 260;
          ctx.strokeStyle = "#d7e1e6";
          ctx.beginPath(); ctx.moveTo(175, y); ctx.lineTo(1100, y); ctx.stroke();
          text(formatTime(v), 64, y + 8, 22, "#596778");
        });
        const points = values.map((v, i) => ({ x: 185 + i / Math.max(1, values.length - 1) * 895, y: 675 + (v - low) / range * 260 }));
        ctx.strokeStyle = "#24638b"; ctx.lineWidth = 5; ctx.beginPath();
        points.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
        points.forEach((p) => { ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, Math.PI * 2); ctx.fillStyle = "#24638b"; ctx.fill(); });
        text(new Date(milestones[0].race.startDateTime).toLocaleDateString("en-US", { month: "short", year: "numeric" }), 175, 980, 22);
        if (milestones.length > 1) text(new Date(milestones[milestones.length - 1].race.startDateTime).toLocaleDateString("en-US", { month: "short", year: "numeric" }), 950, 980, 22);
      } else text("No eligible milestones available", 64, 760, 28);
      text("Unofficial estimates, not NYRR-assigned corrals", 64, 1070, 23, "#596778");
      text("nyrr-corral.netlify.app", 64, 1135, 30, "#24638b");
      const blob = await new Promise((resolve, reject) => canvas.toBlob((value) => value ? resolve(value) : reject(new Error("Image export failed")), "image/png"));
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl; link.download = "nyrr-progress.png";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      setMessage("Image downloaded.");
    } catch {
      setMessage("Could not create the image. Please try again.");
    } finally { setBusy(false); }
  }

  return <div className="share-progress">
    <div className="share-progress-actions">
      <button type="button" onClick={download} disabled={busy}>{busy ? "Exporting..." : "Export image"}</button>
      <button type="button" onClick={copyRunnerLink} style={{ minWidth: "9rem" }} aria-live="polite">{copied ? "Copied!" : "Copy runner link"}</button>
      <label><input type="checkbox" checked={hidden} onChange={(e) => setHidden(e.target.checked)} /> Hide name on image</label>
    </div>
    {message && <div role="status">{message}</div>}
  </div>;
}
