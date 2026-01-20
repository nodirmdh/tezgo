# Домены и сущности

## Users
- id, tg_id, username, created_at, status

## Clients
- user_id, phone, full_name, birth_date

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
- created_at, accepted_at, ready_at, picked_up_at, delivered_at
- prep_eta_minutes, pickup_code_hash, pickup_attempts

## Reviews
- order_id, client_user_id, outlet_id, courier_user_id
- rating_outlet, comment_outlet, rating_courier, comment_courier

## Courier Locations
- order_id, courier_user_id, lat, lng, updated_at
