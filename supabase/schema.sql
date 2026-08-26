-- Esamaï — schéma commandes / stock / prix
-- À exécuter dans Supabase → SQL Editor

create extension if not exists pgcrypto;

create table if not exists public.products (
  id text primary key,
  category text not null,
  name text not null,
  description text not null default '',
  price integer not null check (price >= 0),
  stock integer not null default 0 check (stock >= 0),
  weight text default '',
  brand text default 'Esamaï',
  tags text[] not null default '{}',
  image_url text,
  active boolean not null default true,
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  customer_name text,
  customer_phone text,
  note text,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'preparing', 'done', 'cancelled')),
  total integer not null default 0 check (total >= 0),
  channel text not null default 'whatsapp'
);

create table if not exists public.order_items (
  id bigserial primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id text not null references public.products(id),
  product_name text not null,
  unit_price integer not null check (unit_price >= 0),
  qty integer not null check (qty > 0),
  line_total integer not null check (line_total >= 0)
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists order_items_order_id_idx on public.order_items (order_id);
create index if not exists products_category_idx on public.products (category);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- Place une commande + décrémente le stock (atomique)
create or replace function public.place_order(
  p_items jsonb,
  p_customer_name text default null,
  p_customer_phone text default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order_id uuid;
  v_total integer := 0;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_line integer;
begin
  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'Panier vide';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = v_item->>'id' and active = true for update;
    if not found then
      raise exception 'Produit introuvable: %', v_item->>'id';
    end if;

    v_qty := greatest((v_item->>'qty')::integer, 0);
    if v_qty <= 0 then
      raise exception 'Quantité invalide pour %', v_product.name;
    end if;
    if v_product.stock < v_qty then
      raise exception 'Stock insuffisant pour % (dispo: %)', v_product.name, v_product.stock;
    end if;

    v_total := v_total + (v_product.price * v_qty);
  end loop;

  insert into public.orders (customer_name, customer_phone, note, total, status)
  values (p_customer_name, p_customer_phone, p_note, v_total, 'pending')
  returning id into v_order_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select * into v_product from public.products where id = v_item->>'id' for update;
    v_qty := (v_item->>'qty')::integer;
    v_line := v_product.price * v_qty;

    update public.products
      set stock = stock - v_qty
      where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, unit_price, qty, line_total)
    values (v_order_id, v_product.id, v_product.name, v_product.price, v_qty, v_line);
  end loop;

  return v_order_id;
end;
$$;

grant execute on function public.place_order(jsonb, text, text, text) to anon, authenticated;

alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Lecture publique des produits actifs
drop policy if exists "Public read active products" on public.products;
create policy "Public read active products"
  on public.products for select
  to anon, authenticated
  using (active = true);

-- Admin authentifié : tout sur products
drop policy if exists "Admin full products" on public.products;
create policy "Admin full products"
  on public.products for all
  to authenticated
  using (true)
  with check (true);

-- Admin lit les commandes
drop policy if exists "Admin read orders" on public.orders;
create policy "Admin read orders"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "Admin update orders" on public.orders;
create policy "Admin update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

drop policy if exists "Admin read order items" on public.order_items;
create policy "Admin read order items"
  on public.order_items for select
  to authenticated
  using (true);

-- Seed menu Esamaï
insert into public.products (id, category, name, description, price, stock, weight, brand, tags, image_url, sort_order) values
('k1', 'burgers', 'Le Kassoumaï', 'Double smash steak, cheddar fondu, sauce maison.', 3500, 50, '320 g', 'Esamaï Smash', array['bestseller'], 'images/6c970db3dc2c5aeae885a0c89b22db9a.jpg', 1),
('k2', 'burgers', 'Le Mamelles', 'Poulet pané croustillant, coleslaw, sauce piquante.', 3000, 50, '300 g', 'Esamaï Smash', array['spicy'], 'images/6c970db3dc2c5aeae885a0c89b22db9a.jpg', 2),
('k3', 'burgers', 'Le Classique', 'Steak, salade, tomate, oignons, sauce burger.', 2500, 50, '280 g', 'Esamaï Smash', array[]::text[], 'images/6c970db3dc2c5aeae885a0c89b22db9a.jpg', 3),
('k4', 'burgers', 'Le Végétarien', 'Galette de légumes grillée, cheddar, sauce maison.', 3000, 40, '270 g', 'Esamaï Smash', array['veggie'], 'images/6c970db3dc2c5aeae885a0c89b22db9a.jpg', 4),
('s1', 'sandwichs', 'Poulet Braisé', 'Poulet braisé, oignons caramélisés, sauce maison.', 2500, 50, '290 g', 'Sandwich House', array['bestseller'], 'images/6506fbf5f37817d960e0fb4d937035c7.jpg', 5),
('s2', 'sandwichs', 'Merguez', 'Merguez grillées, poivrons, harissa douce.', 2000, 50, '260 g', 'Sandwich House', array['spicy'], 'images/6506fbf5f37817d960e0fb4d937035c7.jpg', 6),
('s3', 'sandwichs', 'Thon Mayo', 'Thon, mayo maison, crudités fraîches.', 2200, 50, '250 g', 'Sandwich House', array[]::text[], 'images/6506fbf5f37817d960e0fb4d937035c7.jpg', 7),
('sa1', 'salades', 'César Poulet', 'Romaine, poulet grillé, parmesan, croûtons.', 2800, 40, '340 g', 'Fresh Bowl', array[]::text[], 'images/6506fbf5f37817d960e0fb4d937035c7.jpg', 8),
('sa2', 'salades', 'Salade Fraîcheur', 'Avocat, tomate, mozzarella, vinaigrette.', 2600, 40, '320 g', 'Fresh Bowl', array['veggie'], 'images/6506fbf5f37817d960e0fb4d937035c7.jpg', 9),
('b1', 'bols', 'Bowl Poulet Teriyaki', 'Riz, poulet teriyaki, légumes, sésame.', 3200, 40, '420 g', 'Bowl Lab', array['bestseller'], 'images/31e9acf8abd1794aded0c4c3989071f5.jpg', 10),
('b2', 'bols', 'Bowl Falafel', 'Falafels, houmous, légumes, sauce yaourt.', 2900, 40, '400 g', 'Bowl Lab', array['veggie'], 'images/31e9acf8abd1794aded0c4c3989071f5.jpg', 11),
('b3', 'bols', 'Bowl Bœuf Épicé', 'Bœuf épicé, riz, oignons croustillants.', 3400, 40, '430 g', 'Bowl Lab', array['spicy'], 'images/31e9acf8abd1794aded0c4c3989071f5.jpg', 12),
('d1', 'desserts', 'Gaufre Caramel', 'Gaufre moelleuse, caramel beurre salé.', 1500, 60, '180 g', 'Sweet Spot', array['bestseller'], 'images/31e9acf8abd1794aded0c4c3989071f5.jpg', 13),
('d2', 'desserts', 'Cookie Choco', 'Cookie moelleux aux pépites de chocolat.', 1000, 60, '90 g', 'Sweet Spot', array['veggie'], 'images/31e9acf8abd1794aded0c4c3989071f5.jpg', 14),
('d3', 'desserts', 'Brownie', 'Brownie fondant, éclats de noix.', 1200, 60, '110 g', 'Sweet Spot', array['veggie'], 'images/31e9acf8abd1794aded0c4c3989071f5.jpg', 15),
('bo1', 'boissons', 'Calypso Ocean Blue', 'Boisson rafraîchissante citronnade.', 1000, 100, '50 cl', 'Drink Bar', array['veggie'], 'images/image.png', 16),
('bo2', 'boissons', 'Tropico', 'Jus de fruits pétillant.', 800, 100, '33 cl', 'Drink Bar', array['veggie'], 'images/image.png', 17),
('bo3', 'boissons', 'Jus de Bissap Maison', 'Bissap frais préparé maison.', 1000, 100, '40 cl', 'Drink Bar', array['veggie'], 'images/image.png', 18),
('bo4', 'boissons', 'Eau Minérale', 'Eau minérale 50cl.', 500, 100, '50 cl', 'Drink Bar', array['veggie'], 'images/image.png', 19)
on conflict (id) do update set
  price = excluded.price,
  description = excluded.description,
  weight = excluded.weight,
  brand = excluded.brand,
  tags = excluded.tags,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order,
  active = true;
