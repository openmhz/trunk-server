// Message to show for a failed RTK Query call: JSON {message}, a plain-text body, or a generic fallback.
export const getErrorMessage = (error) =>
  error?.data?.message ??
  (typeof error?.data === "string" ? error.data : "Something went wrong. Please try again.");

// "5 minutes ago", "3 days ago" ... for a date or date string.
export const timeAgo = (date) => {
  const then = new Date(date).getTime();
  if (!then) return "";
  const seconds = Math.max(0, Math.round((Date.now() - then) / 1000));
  const units = [
    ["year", 31536000],
    ["month", 2592000],
    ["day", 86400],
    ["hour", 3600],
    ["minute", 60]
  ];
  for (const [name, size] of units) {
    if (seconds >= size) {
      const n = Math.floor(seconds / size);
      return `${n} ${name}${n === 1 ? "" : "s"} ago`;
    }
  }
  return "just now";
};

export const TRUNK_RECORDER_URL = "https://github.com/TrunkRecorder/trunk-recorder";

export const publicSystemUrl = (shortName) =>
  `${process.env.REACT_APP_FRONTEND_SERVER}/system/${shortName}`;

export const uploadConfigExample = (system) =>
  '{\n\t"systems": [\n\t\t{\n\t\t\t"shortName": "' +
  system.shortName +
  '",\n\t\t\t"apiKey": "' +
  system.key +
  '"\n\t\t}\n\t],\n\t"uploadServer": "' +
  process.env.REACT_APP_BACKEND_SERVER +
  '"\n}';
