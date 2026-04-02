export const CREATE_USER_MOTIVATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS user_motivations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    motivations TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;
