import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from './lib/supabaseClient';
import { loadProfile } from './api/authApi';
import { useAuthStore } from './store/authStore';
import { Navbar } from './components/Navbar/Navbar';
import { Footer } from './components/Footer/Footer';
import { SupportChat } from './components/SupportChat/SupportChat';
import { Home } from './pages/Home/Home';
import { Products } from './pages/Products/Products';
import { ProductDetails } from './pages/ProductDetails/ProductDetails';
import { Login } from './pages/Login/Login';
import { Register } from './pages/Register/Register';
import { Cart } from './pages/Cart/Cart';
import { Checkout } from './pages/Checkout/Checkout';
import { Account } from './pages/Account/Account';
import { Admin } from './pages/Admin/Admin';
import { BlogList } from './pages/Blog/BlogList';
import { BlogPost } from './pages/Blog/BlogPost';
import { CmsPage } from './pages/CmsPage/CmsPage';
import { PaymentReturn } from './pages/PaymentReturn/PaymentReturn';

function App() {
  const { setUser, setInitialized } = useAuthStore();

  useEffect(() => {
    if (!isSupabaseConfigured) { setInitialized(true); return; }
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) setUser(await loadProfile(session.user.id, session.user.email || ''));
      setInitialized(true);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) setUser(await loadProfile(session.user.id, session.user.email || ''));
      else setUser(null);
    });

    return () => subscription.subscription.unsubscribe();
  }, [setUser, setInitialized]);

  if (!isSupabaseConfigured) {
    return (
      <div className="page-message">
        <h1>Brak konfiguracji</h1>
        <p>
          Ustaw <code>VITE_SUPABASE_URL</code> i <code>VITE_SUPABASE_ANON_KEY</code> (plik <code>.env</code> lokalnie
          albo zmienne budowania na Cloudflare) i zbuduj aplikację ponownie.
        </p>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/products/:id" element={<ProductDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment-return" element={<PaymentReturn />} />
        <Route path="/account" element={<Account />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/blog" element={<BlogList />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="/p/:slug" element={<CmsPage />} />
      </Routes>
      <Footer />
      <SupportChat />
    </>
  );
}

export default App;
