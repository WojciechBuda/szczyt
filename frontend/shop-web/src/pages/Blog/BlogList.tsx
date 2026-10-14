import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { BlogPost } from '../../types/Blog';
import './Blog.css';

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const { t, pick, locale } = useT();

  useEffect(() => { blogApi.listPublished().then(setPosts); }, []);

  return (
    <div className="blog-page">
      <h1>{t('blog.title')}</h1>
      <p className="blog-intro">{t('blog.intro')}</p>

      {posts.length === 0 && <p className="empty-msg">{t('blog.empty')}</p>}

      <div className="blog-grid">
        {posts.map((p) => (
          <Link to={`/blog/${p.slug}`} key={p.id} className="blog-card">
            {p.coverImageUrl && <img src={p.coverImageUrl} alt={pick(p.title, p.titleEn)} className="blog-card-image" />}
            <div className="blog-card-body">
              <span className="blog-card-date">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString(locale) : ''}</span>
              <h2>{pick(p.title, p.titleEn)}</h2>
              <p>{pick(p.excerpt, p.excerptEn)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
