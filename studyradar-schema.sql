CREATE TABLE users (
  id          SERIAL PRIMARY KEY,
  name    TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE CHECK (POSITION('@' IN email) > 1),
  password    TEXT NOT NULL,

  imgurl TEXT,

  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE groups (
  id          SERIAL PRIMARY KEY,
  name TEXT DEFAULT '',

  description TEXT DEFAULT '',

  date_time TEXT DEFAULT '',

  capacity INTEGER DEFAULT 0,

  created_by TEXT DEFAULT '',
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE groups_users(
  id          SERIAL PRIMARY KEY,
  group_id INT REFERENCES groups(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,

  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);


