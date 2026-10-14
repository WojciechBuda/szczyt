import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { BlogPost as BlogPostType } from '../../types/Blog';
import './Blog.css';

export function BlogPost() {
  const { slug } = useParams();
  const [post, setPost] = useState<BlogPostType | null | undefined>(undefined);

  useEffect(() => {
    if (slug) blogApi.getBySlug(slug).then(setPost);
  }, [slug]);

  if (post === undefined) return <div className="blog-post-page"><p>Ładowanie...</p></div>;
  if (post === null) return <div className="blog-post-page"><p>Nie znaleziono wpisu.</p><Link to="/blog">← Wróć do bloga</Link></div>;

  return (
    <article className="blog-post-page">
      <Link to="/blog" className="blog-back-link">← Wróć do bloga</Link>
      {post.coverImageUrl && <img src={post.coverImageUrl} alt={post.title} className="blog-post-cover" />}
      <h1>{post.title}</h1>
      <div className="blog-post-meta">
        {post.authorName} · {post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('pl-PL') : ''}
      </div>
      {/* Treść wpisuje tylko admin (RLS) — zaufany kanał, jak edytor Wordpressa. */}
      <div className="blog-post-content" dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  );
}
