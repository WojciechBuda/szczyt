-- 0008 · Serve images from the site itself (/img/*.jpg, see tools/generate_images.py)
-- instead of random external placeholders. Only rows that still use a placeholder
-- (empty, picsum.photos or placehold.co) are changed; your own uploads are kept.

update public.products p
set image_url = '/img/product-' || case c.name
    when 'Odzież górska'        then 'clothing'
    when 'Sprzęt wspinaczkowy'  then 'climbing'
    when 'Plecaki i akcesoria'  then 'backpacks'
    when 'Obuwie trekkingowe'   then 'boots'
    else 'default' end || '.jpg'
from public.categories c
where c.id = p.category_id
  and (p.image_url is null or p.image_url = '' or p.image_url ~ '(picsum\.photos|placehold\.co)');

update public.page_blocks
set style = jsonb_set(style, '{backgroundImageUrl}', to_jsonb(
    case type when 'hero' then '/img/hero.jpg' else '/img/banner-winter.jpg' end))
where style->>'backgroundImageUrl' ~ '(picsum\.photos|placehold\.co)';

update public.blog_posts
set cover_image_url = case slug
    when 'jak-dobrac-buty-trekkingowe'                  then '/img/blog-boots.jpg'
    when 'co-spakowac-do-plecaka-na-jednodniowa-wycieczke' then '/img/blog-backpack.jpg'
    when 'warstwowy-ubior-w-gorach'                     then '/img/blog-layers.jpg'
    when 'jak-dbac-o-sprzet-gorski'                     then '/img/blog-care.jpg'
    else '/img/product-default.jpg' end
where cover_image_url is null or cover_image_url = '' or cover_image_url ~ '(picsum\.photos|placehold\.co)';
