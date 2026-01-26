-- Order cancellation reasons and records

ALTER TABLE orders ADD COLUMN cancelled_at TEXT;

CREATE TABLE IF NOT EXISTS cancel_reasons (
  code TEXT PRIMARY KEY,
  group_code TEXT NOT NULL CHECK (group_code IN ('client','partner','courier')),
  label_ru TEXT NOT NULL,
  label_uz TEXT NOT NULL,
  label_kaa TEXT NOT NULL,
  label_en TEXT NOT NULL,
  requires_comment INTEGER NOT NULL DEFAULT 0,
  effects_json TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE IF NOT EXISTS order_cancellations (
  id TEXT PRIMARY KEY,
  order_id INTEGER NOT NULL,
  group_code TEXT NOT NULL,
  reason_code TEXT NOT NULL,
  comment TEXT,
  notify_client INTEGER NOT NULL DEFAULT 0,
  client_notified INTEGER NOT NULL DEFAULT 0,
  effects_json TEXT NOT NULL,
  created_by_role TEXT,
  created_by_tg_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (reason_code) REFERENCES cancel_reasons(code)
);

CREATE INDEX IF NOT EXISTS idx_cancel_reasons_group ON cancel_reasons(group_code);
CREATE INDEX IF NOT EXISTS idx_order_cancellations_order ON order_cancellations(order_id);

INSERT OR IGNORE INTO cancel_reasons
  (code, group_code, label_ru, label_uz, label_kaa, label_en, requires_comment, effects_json, is_active)
VALUES
  ('client_changed_mind','client','Клиент передумал','Mijoz fikrini o''zgartirdi','Klient pikirin ózgertti','Client changed mind',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('wrong_address','client','Неверный адрес','Noto''g''ri manzil','Qate adres','Wrong address',1,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('duplicate_order','client','Дубликат заказа','Buyurtma dublikati','Buyırtpa dublikatı','Duplicate order',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('found_cheaper','client','Нашли дешевле','Arzonroq topildi','Arzannı tawdı','Found cheaper',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":false,"issue_promo":false}',1),
  ('long_wait','client','Долгое ожидание','Uzoq kutish','Uzaq kútiw','Long wait time',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('client_other','client','Другая причина клиента','Mijozning boshqa sababi','Klienttiń basqa sebebi','Other client reason',1,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":false,"issue_promo":false}',1),
  ('out_of_stock','partner','Нет в наличии','Omborda yo''q','Tawarda joq','Out of stock',1,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":true,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('partner_closed','partner','Точка закрыта','Shoxobcha yopiq','Nokta jabıq','Outlet closed',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":true,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('kitchen_issue','partner','Проблема на кухне','Oshxona muammosi','Asxanada másele','Kitchen issue',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":true,"penalty_courier":false,"restore_promo":false,"issue_promo":false}',1),
  ('did_not_accept_changes','partner','Не приняли изменения','O''zgartirishlar qabul qilinmadi','Ózgerisler qabıllanbadı','Did not accept changes',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('partner_no_response','partner','Нет ответа от партнёра','Hamkordan javob yo''q','Hamkardan juwap joq','Partner no response',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":true,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('partner_other','partner','Другая причина партнёра','Hamkorning boshqa sababi','Hamkardıń basqa sebebi','Other partner reason',1,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":false,"issue_promo":false}',1),
  ('courier_no_show','courier','Курьер не вышел','Kuryer chiqmagan','Kuryer kelmedi','Courier no show',0,
   '{"refund_client":true,"compensate_partner":true,"penalty_partner":false,"penalty_courier":true,"restore_promo":true,"issue_promo":false}',1),
  ('courier_cancelled','courier','Курьер отменил','Kuryer bekor qildi','Kuryer biykar qıldı','Courier cancelled',0,
   '{"refund_client":true,"compensate_partner":true,"penalty_partner":false,"penalty_courier":true,"restore_promo":true,"issue_promo":false}',1),
  ('courier_accident','courier','Авария/инцидент','Avariya/voqea','Avariya/waqıya','Accident/incident',0,
   '{"refund_client":true,"compensate_partner":true,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('courier_weather','courier','Плохая погода','Yomon ob-havo','Jaman awa-rayı','Bad weather',0,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":true,"issue_promo":false}',1),
  ('courier_other','courier','Другая причина курьера','Kuryerning boshqa sababi','Kuryerdiń basqa sebebi','Other courier reason',1,
   '{"refund_client":true,"compensate_partner":false,"penalty_partner":false,"penalty_courier":false,"restore_promo":false,"issue_promo":false}',1);
