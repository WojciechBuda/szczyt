import { useT } from '../../i18n';
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { BlogPost as BlogPostType } from '../../types/Blog';
import './Blog.css';

export function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostType | null | undefined>(undefined);
  const { t, pick, locale } = useT();

  useEffect(() => {
    if (slug) blogApi.getBySlug(slug).then(setPost);
  }, [slug]);

  if (post === undefined) return <div className="blog-post-page"><p>{t('common.loading')}</p></div>;
  if (post === null) return <div className="blog-post-page"><p>{t('blog.notFound')}</p><Link to="/blog">{t('blog.back')}</Link></div>;

  return (
    <article className="blog-post-page">
      <Link to="/blog" className="blog-back-link">{t('blog.back')}</Link>
      {post.coverImageUrl && <img src={post.coverImageUrl} alt={pick(post.title, post.titleEn)} className="blog-post-cover" />}
      <h1>{pick(post.title, post.titleEn)}</h1>
      <div className="blog-post-meta">
        {post.authorName} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString(locale) : ''}
      </div>
      {/* Treść wpisuje tylko admin (RLS) — zaufany kanał, jak edytor Wordpressa. */}
      <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: pick(post.content, post.contentEn) }} />
    </article>
  );
}
