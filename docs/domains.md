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
- id, name

## Outlets
- id, partner_id, type, name, address, lat, lng, is_active

## Couriers
- user_id, is_active, rating_avg, rating_count

## Catalog Items
- id, outlet_id, title, price, weight_grams, description, is_available

## Orders
- id, order_number, client_user_id, outlet_id, courier_user_id
- status, subtotal_food, courier_fee, service_fee
- restaurant_commission, restaurant_penalty, courier_penalty
- total_weight_grams, distance_meters
- created_at, accepted_at, ready_at, picked_up_at, delivered_at, cancelled_at
- prep_eta_minutes, pickup_code_hash, pickup_attempts

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
