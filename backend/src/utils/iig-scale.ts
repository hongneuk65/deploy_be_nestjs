const L: Record<number, number> = {
  0:5,5:25,10:50,15:75,20:105,25:130,30:155,35:180,40:205,
  45:235,50:270,55:305,60:340,65:380,70:415,75:440,80:465,
  85:480,90:490,95:495,100:495,
};
const R: Record<number, number> = {
  0:5,5:25,10:50,15:75,20:105,25:140,30:175,35:210,40:245,
  45:275,50:310,55:340,60:375,65:400,70:425,75:450,80:465,
  85:480,90:490,95:495,100:495,
};

function interpolate(table: Record<number, number>, pct: number): number {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  for (let i = 0; i < keys.length - 1; i++) {
    if (pct >= keys[i] && pct <= keys[i + 1]) {
      const ratio = (pct - keys[i]) / (keys[i + 1] - keys[i]);
      return Math.round(table[keys[i]] + ratio * (table[keys[i + 1]] - table[keys[i]]));
    }
  }
  return table[keys[keys.length - 1]];
}

export function rawToScaled(correct: number, total: number, section: 'L' | 'R'): number {
  if (total === 0) return 5;
  const pct = Math.round((correct / total) * 100);
  return interpolate(section === 'L' ? L : R, Math.max(0, Math.min(100, pct)));
}