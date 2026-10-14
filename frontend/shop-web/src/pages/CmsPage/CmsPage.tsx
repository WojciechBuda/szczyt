import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { pageBuilderApi } from '../../api/pageBuilderApi';
import { PageBlock } from '../../types/PageBuilder';
import { PageRenderer } from '../../components/PageBlocks/PageRenderer';

/** Renders any page created in the admin page builder, served under /p/:slug. */
export function CmsPage() {
  const { slug = '' } = useParams();
  const [blocks, setBlocks] = useState<PageBlock[]>([]);
  const { t } = useT();
  const [state, setState] = useState<'loading' | 'ready' | 'missing'>('loading');

  useEffect(() => {
    let cancelled = false;
    setState('loading');
    pageBuilderApi
      .getPageBySlug(slug)
      .then((res) => {
        if (cancelled) return;
        if (!res) setState('missing');
        else { setBlocks(res.blocks); setState('ready'); }
      })
      .catch(() => !cancelled && setState('missing'));
    return () => { cancelled = true; };
  }, [slug]);

  if (state === 'loading') return <div className="page-message"><p>{t('common.loading')}</p></div>;
  if (state === 'missing') return <div className="page-message"><h1>{t('common.notFound')}</h1></div>;
  return <PageRenderer blocks={blocks} />;
}
