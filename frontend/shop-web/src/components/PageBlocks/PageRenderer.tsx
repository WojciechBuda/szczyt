import { PageBlock } from '../../types/PageBuilder';
import { HeroBlock } from './HeroBlock';
import { RichTextBlock } from './RichTextBlock';
import { GalleryBlock } from './GalleryBlock';
import { CategoriesBlock } from './CategoriesBlock';
import { FeaturedProductsBlock } from './FeaturedProductsBlock';
import { BannerBlock } from './BannerBlock';

/** Renderuje listę bloków strony — działa dla dowolnej strony (home, nowe podstrony). */
export function PageRenderer({ blocks }: { blocks: PageBlock[] }) {
  return (
    <div>
      {blocks.map((block) => {
        switch (block.type) {
          case 'hero': return <HeroBlock key={block.id} block={block} />;
          case 'rich_text': return <RichTextBlock key={block.id} block={block} />;
          case 'gallery': return <GalleryBlock key={block.id} block={block} />;
          case 'categories': return <CategoriesBlock key={block.id} block={block} />;
          case 'featured_products': return <FeaturedProductsBlock key={block.id} block={block} />;
          case 'banner': return <BannerBlock key={block.id} block={block} />;
          default: return null;
        }
      })}
    </div>
  );
}
