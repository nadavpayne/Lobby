-- Business logos: one photo per business (businesses.logo_url), also its profile picture in the resident app.
-- Public bucket: anyone can view a logo; only our server (secret key) uploads, after checking the owner and the file.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('business-logos', 'business-logos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
