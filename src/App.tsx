import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "./lib/auth";
import { AuthGate, type AuthMode } from "./components/AuthGate";
import { ThemeProvider } from "./lib/theme";
import { CartProvider } from "./lib/cart";
import { NavProvider, useNav } from "./lib/nav";
import { FlyToCartProvider } from "./lib/flyToCart";
import { AddedNoticeProvider } from "./lib/addedNotice";
import { QuickViewProvider } from "./lib/quickView";
import { Nav } from "./components/Nav";
import { Footer } from "./components/Footer";
import * as SearchOverlay from "./components/SearchOverlay";
import { CartDrawer } from "./views/CartDrawer";
import { QuickViewModal } from "./components/QuickViewModal";
import { LoadingScreen } from "./components/LoadingScreen";
import { ScrollProgress } from "./components/ScrollProgress";
import { SmoothScroll } from "./components/SmoothScroll";
import { PageWipe } from "./components/PageWipe";
import { NewsletterPopup } from "./components/NewsletterPopup";
import { ExitIntentPopup } from "./components/ExitIntentPopup";
import { ShopBot } from "./components/ShopBot";
import { Home } from "./views/Home";
import { Shop } from "./views/Shop";
import { Categories } from "./views/Categories";
import { Collections } from "./views/Collections";
import { Deals } from "./views/Deals";
import { About } from "./views/About";
import { Wishlist } from "./views/Wishlist";
import { Orders } from "./views/Orders";
import { Manage } from "./views/Manage";
import { Account } from "./views/Account";
import { Checkout } from "./views/Checkout";
import { ProductDetail } from "./views/ProductDetail";
import { OrderDetail } from "./views/OrderDetail";
import type { Auth } from "./lib/auth";

const APP_NAME = "NextGenify";
const AUTH_MODE: AuthMode = "accounts";

function Shell({ auth }: { auth: Auth }) {
  const { view, productId, orderId } = useNav();

  return (
    <div className="min-h-screen flex flex-col">
      <SmoothScroll />
      <div className="grain-vignette" />
      <PageWipe />
      <ScrollProgress />
      <Nav auth={auth} />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-28 sm:pt-32 pb-24 lg:pb-10">
        <AnimatePresence mode="wait">
          <motion.div key={productId ?? orderId ?? view} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22, ease: "easeOut" }}>
            {productId ? (
              <ProductDetail />
            ) : orderId ? (
              <OrderDetail />
            ) : (
              <>
                {view === "home" && <Home />}
                {view === "shop" && <Shop />}
                {view === "categories" && <Categories />}
                {view === "collections" && <Collections />}
                {view === "deals" && <Deals />}
                {view === "about" && <About />}
                {view === "wishlist" && <Wishlist />}
                {view === "orders" && <Orders />}
                {view === "manage" && (auth.user?.role === "admin" ? <Manage /> : <Home />)}
                {view === "account" && <Account auth={auth} />}
                {view === "checkout" && <Checkout />}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
      <SearchOverlay.SearchOverlay />
      <CartDrawer />
      <QuickViewModal />
      <NewsletterPopup />
      <ExitIntentPopup />
      <ShopBot />
    </div>
  );
}

export default function App() {
  const auth = useAuth();

  return (
    <>
      <LoadingScreen />
      <AuthGate auth={auth} appName={APP_NAME} mode={AUTH_MODE}>
        <ThemeProvider>
          <CartProvider>
            <FlyToCartProvider>
              <AddedNoticeProvider>
                <QuickViewProvider>
                  <NavProvider>
                    <Shell auth={auth} />
                  </NavProvider>
                </QuickViewProvider>
              </AddedNoticeProvider>
            </FlyToCartProvider>
          </CartProvider>
        </ThemeProvider>
      </AuthGate>
    </>
  );
}
