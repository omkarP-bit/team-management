const express = require("express");
const { normalizeCode, isCodeFormatValid, normalizeTeamEntry, isTeamEntryValid } = require("../validators/credentialValidator");
const { findByCode, upsertTeam, updateTeamSize, findMemberByPhone } = require("../services/credentialStore");
const { SINGLE_USE_CODES, ADMIN_TOKEN } = require("../config");

const router = express.Router();

function requireAdmin(req, res) {
  if (!ADMIN_TOKEN) {
    res.status(503).json({ success: false, message: "Admin token is not configured." });
    return false;
  }
  if (req.headers["x-admin-token"] !== ADMIN_TOKEN) {
    res.status(401).json({ success: false, message: "Unauthorized" });
    return false;
  }
  return true;
}

// User: get credentials by team code
router.post("/get-credentials", async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code);
    if (!isCodeFormatValid(code)) {
      return res.status(400).json({ success: false, message: "Enter a valid numeric access code." });
    }

    const team = await findByCode(code);
    if (!team) {
      return res.status(404).json({ success: false, message: "Invalid code. Please check and try again." });
    }

    if (SINGLE_USE_CODES && team.used) {
      return res.status(409).json({ success: false, message: "This code has already been used." });
    }

    if (SINGLE_USE_CODES) {
      await upsertTeam({ ...team, used: true, consumedAt: new Date().toISOString() });
    }

    return res.json({
      success: true,
      team_name: team.team_name,
      url: team.url,
      username: team.username,
      password: team.password,
      team_size: team.team_size ?? 4,
      members: team.members ?? []
    });
  } catch (error) {
    console.error("get-credentials error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// Admin: lookup a team
router.post("/admin/get-credential", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const code = normalizeCode(req.body?.code);
    if (!isCodeFormatValid(code)) {
      return res.status(400).json({ success: false, message: "Enter a valid numeric code." });
    }

    const team = await findByCode(code);
    if (!team) return res.json({ success: true, found: false, code });

    return res.json({ success: true, found: true, ...team });
  } catch (error) {
    console.error("admin get-credential error:", error);
    return res.status(500).json({ success: false, message: "Lookup failed." });
  }
});

// Admin: upsert a team (create or update)
router.post("/admin/update-credential", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const entry = normalizeTeamEntry(req.body || {});
    if (!isTeamEntryValid(entry)) {
      return res.status(400).json({ success: false, message: "Provide valid code, username, and password." });
    }

    const result = await upsertTeam(entry);
    return res.json({ success: true, message: `Team ${entry.code} saved.`, data: result });
  } catch (error) {
    console.error("admin update-credential error:", error);
    return res.status(500).json({ success: false, message: "Save failed." });
  }
});

// User: join a team
router.post("/join-team", async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code);
    const name = String(req.body?.name || "").trim();
    const phone = String(req.body?.phone || "").trim();
    const email = String(req.body?.email || "").trim();

    if (!isCodeFormatValid(code)) return res.status(400).json({ success: false, message: "Invalid code." });
    if (!name || !phone || !email) return res.status(400).json({ success: false, message: "Name, phone, and email are required." });

    // Check if phone already registered in any team
    const existing = await findMemberByPhone(phone);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `You already belong to a team (${existing.team_name || existing.team_code}).`
      });
    }

    const team = await findByCode(code);
    if (!team) return res.status(404).json({ success: false, message: "Team not found." });

    const members = team.members ?? [];
    if (members.length >= (team.team_size ?? 4)) return res.status(409).json({ success: false, message: `Team is full (max ${team.team_size ?? 4}).` });

    const updated = await upsertTeam({ ...team, members: [...members, { name, phone, email }] });
    return res.json({ success: true, members: updated.members });
  } catch (error) {
    console.error("join-team error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// Admin: lookup member by phone
router.post("/admin/lookup-member", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const phone = String(req.body?.phone || "").trim();
    if (!phone) return res.status(400).json({ success: false, message: "Phone number is required." });

    const result = await findMemberByPhone(phone);
    if (!result) return res.json({ success: true, found: false, message: "No member found with this phone number." });

    return res.json({
      success: true,
      found: true,
      team_code: result.team_code,
      team_name: result.team_name,
      member: result.member
    });
  } catch (error) {
    console.error("admin lookup-member error:", error);
    return res.status(500).json({ success: false, message: "Lookup failed." });
  }
});

// User: leave a team
router.post("/leave-team", async (req, res) => {
  try {
    const code = normalizeCode(req.body?.code);
    const name = String(req.body?.name || "").trim();

    if (!isCodeFormatValid(code)) return res.status(400).json({ success: false, message: "Invalid code." });
    if (!name) return res.status(400).json({ success: false, message: "Name is required." });

    const team = await findByCode(code);
    if (!team) return res.status(404).json({ success: false, message: "Team not found." });

    const members = (team.members ?? []).filter((m) => m.name !== name);
    const updated = await upsertTeam({ ...team, members });
    return res.json({ success: true, members: updated.members });
  } catch (error) {
    console.error("leave-team error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong." });
  }
});

// Admin: update team size only
router.post("/admin/update-team-size", async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const code = normalizeCode(req.body?.code);
    const team_size = Number(req.body?.team_size);

    if (!isCodeFormatValid(code) || !Number.isInteger(team_size) || team_size < 1) {
      return res.status(400).json({ success: false, message: "Valid code and team_size (≥1) required." });
    }

    const result = await updateTeamSize(code, team_size);
    return res.json({ success: true, message: `Team size updated to ${team_size}.`, data: result });
  } catch (error) {
    console.error("update-team-size error:", error);
    return res.status(500).json({ success: false, message: "Update failed." });
  }
});

module.exports = router;
