export function shortAddress(address) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export const PRIORITY_LABEL = { 0: "LOW", 1: "MEDIUM", 2: "HIGH" };
export const PRIORITY_COLOR = {
  0: "bg-gray-200 text-gray-700",
  1: "bg-yellow-200 text-yellow-800",
  2: "bg-red-200 text-red-800",
};

export function formatDeadline(timestamp) {
  if (!timestamp || timestamp === 0n) return null;
  return new Date(Number(timestamp) * 1000).toLocaleDateString("ko-KR");
}

export function deadlineDday(timestamp) {
  if (!timestamp || timestamp === 0n) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(Number(timestamp) * 1000);
  target.setHours(0, 0, 0, 0);
  const diff = Math.round((target - now) / 86400000);
  if (diff === 0) return "D-day";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}
