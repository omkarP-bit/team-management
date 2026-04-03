const boolFromEnv = (value, defaultValue) => {
  if (value === undefined) {
    return defaultValue;
  }
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
};

module.exports = {
  PORT: Number(process.env.PORT || 4000),
  ADMIN_TOKEN: process.env.ADMIN_TOKEN || "",
  SINGLE_USE_CODES: boolFromEnv(process.env.SINGLE_USE_CODES, false),
  SUPABASE_URL: process.env.SUPABASE_URL || "",
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  CORS_ORIGIN: process.env.CORS_ORIGIN || "*"
};
