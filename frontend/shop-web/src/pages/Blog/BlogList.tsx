import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { blogApi } from '../../api/blogApi';
import { BlogPost } from '../../types/Blog';
import './Blog.css';

export function BlogList() {
  const [posts, setPosts] = useState<BlogPost[]>([]);

  useEffect(() => { blogApi.listPublished().then(setPosts); }, []);

  return (
    <div className="blog-page">
      <h1>Blog</h1>
      <p className="blog-intro">Porady, relacje z gór i nowości ze świata sprzętu outdoorowego.</p>

      {posts.length === 0 && <p className="empty-msg">Brak jeszcze żadnych wpisów.</p>}

      <div className="blog-grid">
        {posts.map((p) => (
          <Link to={`/blog/${p.slug}`} key={p.id} className="blog-card">
            {p.coverImageUrl && <img src={p.coverImageUrl} alt={p.title} className="blog-card-image" />}
            <div className="blog-card-body">
              <span className="blog-card-date">{p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('pl-PL') : ''}</span>
              <h2>{p.title}</h2>
              <p>{p.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
