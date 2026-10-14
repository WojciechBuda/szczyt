import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { productApi } from '../../api/productApi';
import { Product } from '../../types/Product';
import { useCartStore } from '../../store/cartStore';
import { Button } from '../../components/Button/Button';
import './ProductDetails.css';

export function ProductDetails() {
  const { id } = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (id) productApi.getById(Number(id)).then(setProduct);
  }, [id]);

  if (!product) return <div className="pd-loading">Ładowanie...</div>;

  return (
    <div className="product-details">
      <img
        src={product.imageUrl || 'https://placehold.co/500x400?text=Brak+zdjecia'}
        alt={product.name}
        className="pd-image"
      />
      <div className="pd-info">
        <span className="pd-category">{product.categoryName}</span>
        <h1>{product.name}</h1>
        <p className="pd-description">{product.description}</p>
        <div className="pd-price">{product.price.toFixed(2)} zł</div>
        <div className="pd-stock">
          {product.stock > 0 ? `Dostępne: ${product.stock} szt.` : 'Produkt niedostępny'}
        </div>

        {product.stock > 0 && (
          <div className="pd-actions">
            <input
              type="number"
              min={1}
              max={product.stock}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, Number(e.target.value))))}
            />
            <Button onClick={() => { addItem(product, quantity); setAdded(true); setTimeout(() => setAdded(false), 1500); }}>
              {added ? 'Dodano!' : 'Dodaj do koszyka'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
