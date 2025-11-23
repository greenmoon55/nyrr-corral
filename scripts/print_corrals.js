const fs = require('fs');
const path = require('path');
const csvRaw = fs.readFileSync(path.join(__dirname,'..','NYRR Corral Placements - regular corrals_ miles.csv'),'utf8');

const CORRAL_TABLE = {};
const A_TIME_BY_RACE = {};
try {
  const lines = csvRaw.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const headerRowIndex = Math.min(lines.length, 10);
  let headerCols = null;
  for (let i = 0; i < headerRowIndex; i++) {
    const cols = lines[i].split(',').map(c => c.trim());
    if (cols.some(c => /5k|10k|4 miles|half marathon|marathon|5 miles/i.test(c))) {
      headerCols = cols; break;
    }
  }
  if (headerCols) {
    const CSV_TO_KEY = {'5k':'5K','4 miles':'4M','5 miles':'5M','10k':'10K','half marathon':'Half','marathon':'Full'};
    const norm = (s) => (s || '').toString().toLowerCase().trim();
    const aLine = lines.find(l => l.split(',')[0]?.trim() === 'A');
    const aCols = aLine ? aLine.split(',') : null;
    headerCols.forEach((h, colIndex) => {
      const key = CSV_TO_KEY[norm(h)];
      if (!key) return;
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
      const cleaned = [];
      for (const row of table) { if (row.max == null) break; cleaned.push(row); }
      if (cleaned.length>0) {
        const lastRow = cleaned[cleaned.length-1];
        if (lastRow.label !== 'K') lastRow.max = Infinity;
        CORRAL_TABLE[key] = cleaned;
        if (aCols && aCols[colIndex]) {
          const aCell = (aCols[colIndex]||'').trim();
          const m2 = aCell.match(/(\d+:)?\d{1,2}:\d{2}/);
          if (m2) {
            const timeStr = m2[0];
            const parts = timeStr.split(':').map(Number);
            let seconds = 0;
            if (parts.length === 3) seconds = parts[0]*3600 + parts[1]*60 + parts[2];
            else if (parts.length === 2) seconds = parts[0]*60 + parts[1];
            else seconds = Number(timeStr);
            A_TIME_BY_RACE[key] = seconds;
          }
        }
      }
    });
  }
} catch(e){ console.error(e); }

console.log(Object.keys(CORRAL_TABLE));
for (const k of Object.keys(CORRAL_TABLE)) {
  console.log(k, CORRAL_TABLE[k].map(r=> r.label+":"+(Number.isFinite(r.max)?r.max:'Inf')));
}
console.log('A times:', A_TIME_BY_RACE);
