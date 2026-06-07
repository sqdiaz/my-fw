insert into public.universities (slug, name)
values
  ('dlsu', 'De La Salle University'),
  ('upd', 'University of the Philippines Diliman'),
  ('ust', 'University of Santo Tomas'),
  ('admu', 'Ateneo de Manila University')
on conflict (slug) do update
set
  name = excluded.name;
