import { useEffect, useState } from 'react';
import { pageBuilderApi } from '../../api/pageBuilderApi';
import { PageBlock } from '../../types/PageBuilder';
import { PageRenderer } from '../../components/PageBlocks/PageRenderer';

export function Home() {
  const [blocks, setBlocks] = useState<PageBlock[]>([]);

  useEffect(() => {
    pageBuilderApi.getPageBySlug('home').then((res) => setBlocks(res?.blocks || []));
  }, []);

  return <PageRenderer blocks={blocks} />;
}
