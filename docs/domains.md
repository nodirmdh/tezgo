# Домены и сущности

## Users
- id, tg_id, username, created_at, status

## Clients
- user_id, phone, full_name, birth_date

## Client CRM Notes
- id, client_user_id, note
- updated_by_role, updated_by_tg_id
- created_at, updated_at

## Client Subscriptions
- client_user_id
- email_opt_in, push_opt_in, sms_opt_in
- food_email, food_push, food_sms
- market_email, market_push, market_sms
- taxi_email, taxi_push, taxi_sms
- updated_at, updated_by_role, updated_by_tg_id

## Client Sensitive Actions
- id, client_user_id
- action_type, reason
- created_by_role, created_by_tg_id, created_at

## Partners
- id, name, display_name, legal_name, inn, legal_type
- director_full_name, phone, email, legal_address
- bank_account, bank_name, bank_mfo
- verification_status, verification_comment
- payout_hold, commission_percent
- created_at, updated_at

## Partner Users
- user_id, partner_id, role_in_partner

## Points
- id, partner_id, name, address, address_comment
- phone, work_hours, status, created_at, updated_at

## Menu Categories (points)
- id, point_id, name, name_normalized
- created_at, updated_at

## Menu Items (points)
- id, point_id, category_id
- name, description, price, is_available, photo_url
- created_at, updated_at

## Outlets
- id, partner_id, type, name, address, lat, lng, is_active

## Couriers
- user_id, is_active, rating_avg, rating_count

## Catalog Items
### Items
- id, title, short_title, sku, category, categories
- description, photo_url, image_url, image_enabled
- priority, is_adult, kcal, protein, fat, carbs
- core_id, origin_id, weight_grams, created_at, updated_at

### Outlet Items
- outlet_id, item_id, category_id, base_price
- is_available, is_visible
- stock, stock_qty
- stoplist_active, stoplist_until, stoplist_reason
- unavailable_reason, unavailable_until
- delivery_methods, updated_at

### Outlet Categories
- id, outlet_id, name, normalized_name, created_at

## Orders
- id, order_number, client_user_id, outlet_id, courier_user_id
- status, subtotal_food, courier_fee, service_fee
- restaurant_commission, restaurant_penalty, courier_penalty
- total_weight_grams, distance_meters
- created_at, accepted_at, ready_at, picked_up_at, delivered_at, cancelled_at
- courier_assigned_at, courier_picked_up_at, courier_delivered_at
- delivery_status, delivery_fee, delivery_provider
- cancel_source, cancel_reason, penalty_amount
- prep_eta_minutes, pickup_code_hash, pickup_attempts
- handoff_code_hash, handoff_code_encrypted, handoff_code_last4
- handoff_code_expires_at, handoff_code_used_at, handoff_failed_attempts
- fulfillment_type, pickup_time, utensils_count, napkins_count
- customer_comment, partner_comment, reject_reason
- handed_over_at, closed_at
- food_total, commission_percent_snapshot, commission_from_food, partner_net

## Cancel Reasons
- code, group_code
- label_ru, label_uz, label_kaa, label_en
- requires_comment, effects_json, is_active

## Order Cancellations
- id, order_id, group_code, reason_code
- comment, notify_client, client_notified
- effects_json, created_by_role, created_by_tg_id, created_at

## Reviews
- order_id, client_user_id, outlet_id, courier_user_id
- rating_outlet, comment_outlet, rating_courier, comment_courier

## Courier Locations
- order_id, courier_user_id, lat, lng, updated_at

## Campaigns
- id, outlet_id, type, title, description, priority
- status, start_at, end_at, active_days, active_hours
- min_order_amount, max_uses_total, max_uses_per_client
- delivery_methods, stoplist_policy
- bundle_fixed_price, bundle_percent_discount
- created_by_role, created_by_tg_id, created_at, updated_at, archived_at

## Campaign Items
- id, campaign_id, outlet_id, item_id
- qty, required, discount_type, discount_value
- created_at, updated_at

## Campaign Usage
- id, campaign_id, order_id, client_user_id
- discount_amount, applied_at

## Finance Ledger
- id, title, amount, status, type
- user_id, partner_id, order_id
- balance_delta, category
- entity_type, entity_id, currency, meta_json
- created_by_role, created_by_tg_id, created_at

## Order Adjustments
- id, order_id, kind, amount
- reason_code, comment
- created_by_role, created_by_tg_id, created_at

## Audit Log
- id, entity_type, entity_id, action
- actor_user_id, actor_role, request_id
- before_json, after_json, created_at

## Problem Flags
- id, order_id
- type, severity, description
- created_at, resolved_at, resolved_by
- meta_json
