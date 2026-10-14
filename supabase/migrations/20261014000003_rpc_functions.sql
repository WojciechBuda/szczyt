-- 0003 · Transactional RPCs called from the frontend via supabase.rpc().

-- Creates an order from cart lines. Locks product rows, validates stock,
-- decrements it and snapshots name/image/price — all in one transaction.
create or replace function public.create_order(items jsonb, shipping jsonb)
returns public.orders
language plpgsql
security definer set search_path = public
as $$
declare
  v_order    public.orders;
  v_item     jsonb;
  v_product  public.products;
  v_qty      integer;
  v_total    numeric(10,2) := 0;
begin
  if auth.uid() is null then
    raise exception 'Musisz być zalogowany, aby złożyć zamówienie.';
  end if;

  if items is null or jsonb_typeof(items) <> 'array' or jsonb_array_length(items) = 0 then
    raise exception 'Koszyk jest pusty.';
  end if;

  if coalesce(trim(shipping->>'street'), '') = ''
     or coalesce(trim(shipping->>'city'), '') = ''
     or coalesce(trim(shipping->>'postalCode'), '') = ''
     or coalesce(trim(shipping->>'country'), '') = '' then
    raise exception 'Uzupełnij adres dostawy.';
  end if;

  insert into public.orders (user_id, status, shipping_street, shipping_city, shipping_postal_code, shipping_country)
  values (auth.uid(), 'Pending', shipping->>'street', shipping->>'city', shipping->>'postalCode', shipping->>'country')
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(items)
  loop
    v_qty := (v_item->>'quantity')::integer;
    if v_qty is null or v_qty <= 0 then
      raise exception 'Ilość musi być większa od zera.';
    end if;

    select * into v_product
    from public.products
    where id = (v_item->>'productId')::integer and is_active
    for update;

    if v_product.id is null then
      raise exception 'Produkt % nie istnieje lub jest niedostępny.', v_item->>'productId';
    end if;
    if v_product.stock < v_qty then
      raise exception 'Za mało towaru na stanie: %.', v_product.name;
    end if;

    update public.products set stock = stock - v_qty where id = v_product.id;

    insert into public.order_items (order_id, product_id, product_name, image_url, unit_price, quantity)
    values (v_order.id, v_product.id, v_product.name, v_product.image_url, v_product.price, v_qty);

    v_total := v_total + v_product.price * v_qty;
  end loop;

  update public.orders set total_amount = v_total where id = v_order.id
  returning * into v_order;

  return v_order;
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon;
grant execute on function public.create_order(jsonb, jsonb) to authenticated;

-- Dashboard numbers for the admin panel.
create or replace function public.get_admin_stats()
returns table (total_products bigint, total_orders bigint, total_users bigint, revenue numeric)
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Brak uprawnień administratora.';
  end if;

  return query
    select
      (select count(*) from public.products where is_active),
      (select count(*) from public.orders),
      (select count(*) from public.profiles),
      coalesce((select sum(total_amount) from public.orders where status in ('Paid', 'Shipped', 'Completed')), 0);
end;
$$;

revoke all on function public.get_admin_stats() from public, anon;
grant execute on function public.get_admin_stats() to authenticated;
