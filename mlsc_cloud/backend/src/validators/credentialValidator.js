const CODE_PATTERN = /^\d{4,10}$/;

function normalizeCode(rawCode) {
  if (rawCode === null || rawCode === undefined) return "";
  return String(rawCode).trim();
}

function isCodeFormatValid(code) {
  return CODE_PATTERN.test(code);
}

function normalizeTeamEntry(entry) {
  return {
    code: normalizeCode(entry.code),
    team_name: String(entry.team_name || "").trim(),
    url: String(entry.url || "").trim(),
    username: String(entry.username || "").trim(),
    password: String(entry.password || "").trim(),
    team_size: Number(entry.team_size) || 4,
    members: Array.isArray(entry.members) ? entry.members : []
  };
}

function isTeamEntryValid(entry) {
  return (
    isCodeFormatValid(entry.code) &&
    entry.username.length > 0 &&
    entry.password.length > 0
  );
}

module.exports = { normalizeCode, isCodeFormatValid, normalizeTeamEntry, isTeamEntryValid };
