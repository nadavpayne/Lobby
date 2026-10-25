-- Lobby can turn down a business that signed up: it stays on record but never goes live.
alter type public.business_status add value if not exists 'declined';
