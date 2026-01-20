-- Initial schema for Kungrad Delivery Platform (SQLite MVP)

CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tg_id TEXT UNIQUE NOT NULL,
  username TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active'
);

CREATE TABLE clients (
  user_id INTEGER PRIMARY KEY,
  phone TEXT,
  full_name TEXT,
  birth_date TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE partners (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL
);

CREATE TABLE outlets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  partner_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL,
  lng REAL,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (partner_id) REFERENCES partners(id)
);

CREATE TABLE couriers (
  user_id INTEGER PRIMARY KEY,
  is_active INTEGER DEFAULT 1,
  rating_avg REAL DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE catalog_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  outlet_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  weight_grams INTEGER NOT NULL,
  description TEXT,
  is_available INTEGER DEFAULT 1,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id)
);

CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_number TEXT NOT NULL,
  client_user_id INTEGER NOT NULL,
  outlet_id INTEGER NOT NULL,
  courier_user_id INTEGER,
  status TEXT NOT NULL,
  subtotal_food INTEGER DEFAULT 0,
  courier_fee INTEGER DEFAULT 0,
  service_fee INTEGER DEFAULT 0,
  restaurant_commission INTEGER DEFAULT 0,
  restaurant_penalty INTEGER DEFAULT 0,
  courier_penalty INTEGER DEFAULT 0,
  total_weight_grams INTEGER DEFAULT 0,
  distance_meters INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  accepted_at TEXT,
  ready_at TEXT,
  picked_up_at TEXT,
  delivered_at TEXT,
  prep_eta_minutes INTEGER,
  pickup_code_hash TEXT,
  pickup_attempts INTEGER DEFAULT 0,
  FOREIGN KEY (client_user_id) REFERENCES users(id),
  FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  FOREIGN KEY (courier_user_id) REFERENCES users(id)
);

CREATE TABLE reviews (
  order_id INTEGER PRIMARY KEY,
  client_user_id INTEGER NOT NULL,
  outlet_id INTEGER NOT NULL,
  courier_user_id INTEGER NOT NULL,
  rating_outlet INTEGER,
  comment_outlet TEXT,
  rating_courier INTEGER,
  comment_courier TEXT,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (client_user_id) REFERENCES users(id),
  FOREIGN KEY (outlet_id) REFERENCES outlets(id),
  FOREIGN KEY (courier_user_id) REFERENCES users(id)
);

CREATE TABLE courier_locations (
  order_id INTEGER NOT NULL,
  courier_user_id INTEGER NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (order_id, courier_user_id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (courier_user_id) REFERENCES users(id)
);
