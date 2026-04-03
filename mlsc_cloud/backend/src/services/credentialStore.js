const { createClient } = require("@supabase/supabase-js");
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = require("../config");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
const TABLE = "teams";

async function findByCode(code) {
  const { data, error } = await supabase.from(TABLE).select("*").eq("code", code).single();
  if (error) return null;
  return data;
}

async function upsertTeam(entry) {
  const { data, error } = await supabase.from(TABLE).upsert(entry, { onConflict: "code" }).select().single();
  if (error) throw error;
  return data;
}

async function updateTeamSize(code, team_size) {
  const { data, error } = await supabase.from(TABLE).update({ team_size }).eq("code", code).select().single();
  if (error) throw error;
  return data;
}

async function findMemberByPhone(phone) {
  const { data, error } = await supabase.from(TABLE).select("code, team_name, members");
  if (error) throw error;
  for (const team of data) {
    const members = team.members ?? [];
    const match = members.find((m) => m.phone === phone);
    if (match) return { team_code: team.code, team_name: team.team_name, member: match };
  }
  return null;
}

module.exports = { findByCode, upsertTeam, updateTeamSize, findMemberByPhone };
