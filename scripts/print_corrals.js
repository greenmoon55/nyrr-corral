const paceSeconds = (pace) => {
  const [minutes, seconds] = pace.split(':').map(Number);
  return minutes * 60 + seconds;
};

const formatPace = (pace) => {
  const rounded = Math.round(pace);
  const minutes = Math.floor(rounded / 60);
  const seconds = String(rounded % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

const corrals = [
  ['AA-m', '4:00', '5:04'],
  ['AA-w', '4:00', '6:19'],
  ['AA-x', '4:00', '6:19'],
  ['A-m', '5:05', '6:19'],
  ['A', '6:20', '6:29'],
  ['B', '6:30', '7:03'],
  ['C', '7:04', '7:28'],
  ['D', '7:29', '7:52'],
  ['E', '7:53', '8:12'],
  ['F', '8:13', '8:33'],
  ['G', '8:34', '8:56'],
  ['H', '8:57', '9:20'],
  ['I', '9:21', '9:51'],
  ['J', '9:52', '10:30'],
  ['K', '10:31', '11:36'],
];

for (const [label, min, max] of corrals) {
  console.log(`${label}: ${formatPace(paceSeconds(min))}-${formatPace(paceSeconds(max))}/mi`);
}
