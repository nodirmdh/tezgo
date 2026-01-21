-- Promo outlets for global campaigns

CREATE TABLE IF NOT EXISTS promo_outlets (
  promo_code_id INTEGER NOT NULL,
  outlet_id INTEGER NOT NULL,
  PRIMARY KEY (promo_code_id, outlet_id),
  FOREIGN KEY (promo_code_id) REFERENCES promo_codes(id) ON DELETE CASCADE,
  FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO promo_outlets (promo_code_id, outlet_id)
SELECT id, outlet_id
FROM promo_codes
WHERE outlet_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_promo_outlets_promo_code_id ON promo_outlets(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_outlets_outlet_id ON promo_outlets(outlet_id);
