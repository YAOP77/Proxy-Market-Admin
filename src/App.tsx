/**
 * Composant App - Point d'entrée principal de l'application
 * 
 * Ce composant configure le routage de l'application Proxy Market Dashboard.
 * Il utilise React Router pour gérer la navigation entre les différentes pages.
 * 
 * Structure des routes :
 * - Routes avec layout (AppLayout) : Dashboard, Profil, Calendrier, etc.
 * - Routes d'authentification : Connexion, Inscription
 * - Route 404 : Page non trouvée
 */

import { BrowserRouter as Router, Routes, Route } from "react-router";

// Layout et utilitaires
import AppLayout from "./layout/AppLayout";
import { ScrollToTop } from "./components/common/ScrollToTop";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import PublicRoute from "./components/auth/PublicRoute";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";

// Pages avec layout
import Home from "./pages/Dashboard/Home";
import Statistics from "./pages/Statistics";
import UserProfiles from "./pages/UserProfiles";
// import Blank from "./pages/Blank"; // Masqué - redirige vers 404
import FormElements from "./pages/Forms/FormElements";
import AddFranchise from "./pages/Franchises/AddFranchise";
import BoutiqueDetails from "./pages/Franchises/BoutiqueDetails";
import AddBoutiqueUser from "./pages/Franchises/AddBoutiqueUser";
import BoutiqueUserDetails from "./pages/Franchises/BoutiqueUserDetails";
import AddAdmin from "./pages/Admins/AddAdmin";
import AddProduct from "./pages/Products/AddProduct";
import ProductDetails from "./pages/Products/ProductDetails";
import AddBanner from "./pages/Banners/AddBanner";
import BannersList from "./pages/Banners/BannersList";
import BasicTables from "./pages/Tables/BasicTables";
import UsersTablePage from "./pages/Tables/UsersTable";
import AdminsTablePage from "./pages/Tables/AdminsTable";
import BoutiqueUsersTablePage from "./pages/Tables/BoutiqueUsersTable";
import ProductsTablePage from "./pages/Tables/ProductsTable";
import SalesTablePage from "./pages/Tables/SalesTable";
import LivreursTablePage from "./pages/Tables/LivreursTable";
import LivreurDetails from "./pages/Livreurs/LivreurDetails";
import ClientDetails from "./pages/Clients/ClientDetails";
import AdminDetails from "./pages/Admins/AdminDetails";
import OrdersList from "./pages/Orders/OrdersList";
import OrderDetails from "./pages/Orders/OrderDetails";
import SearchResults from "./pages/Search/SearchResults";

// Pages UI Elements - Masquées
// import Alerts from "./pages/UiElements/Alerts";
// import Avatars from "./pages/UiElements/Avatars";
// import Badges from "./pages/UiElements/Badges";
// import Buttons from "./pages/UiElements/Buttons";
// import Images from "./pages/UiElements/Images";
// import Videos from "./pages/UiElements/Videos";

// Pages Charts - Masquées
// import LineChart from "./pages/Charts/LineChart";
// import BarChart from "./pages/Charts/BarChart";

// Pages d'authentification
import SignIn from "./pages/AuthPages/SignIn";
// import SignUp from "./pages/AuthPages/SignUp"; // Masqué - redirige vers 404

// Page 404
import NotFound from "./pages/OtherPage/NotFound";

export default function App() {
  return (
    <GoogleMapsProvider>
      <Router>
        {/* Scroll automatique vers le haut lors du changement de route */}
        <ScrollToTop />
        
        <Routes>
          {/* Routes d'authentification (sans layout, accessibles uniquement si non authentifié) */}
          <Route
            path="/signin"
            element={
              <PublicRoute>
                <SignIn />
              </PublicRoute>
            }
          />
          {/* Route Inscription masquée - redirige vers 404 */}
          <Route path="/signup" element={<NotFound />} />

          {/* Routes protégées avec layout principal (sidebar + header) */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Dashboard */}
            <Route index path="/" element={<Home />} />
            <Route path="/statistics" element={<Statistics />} />

            {/* Pages utilisateur */}
            <Route path="/profile" element={<UserProfiles />} />
            {/* TODO: Réactiver quand nécessaire */}
            {/* <Route path="/calendar" element={<Calendar />} /> */}
            {/* Route Page vierge masquée - redirige vers 404 */}
            <Route path="/blank" element={<NotFound />} />

            {/* Formulaires */}
            <Route path="/form-elements" element={<FormElements />} />
            <Route path="/add-franchise" element={<AddFranchise />} />
            <Route path="/add-boutique-user" element={<AddBoutiqueUser />} />
            <Route path="/add-admin" element={<AddAdmin />} />
            <Route path="/add-product" element={<AddProduct />} />
            <Route path="/add-banner" element={<AddBanner />} />

            {/* Tableaux */}
            <Route path="/basic-tables" element={<BasicTables />} />
            <Route path="/boutiques/:boutiqueId" element={<BoutiqueDetails />} />
            <Route path="/users-table" element={<UsersTablePage />} />
            <Route path="/users/:clientId" element={<ClientDetails />} />
            <Route path="/admins-table" element={<AdminsTablePage />} />
            <Route path="/admins/:adminId" element={<AdminDetails />} />
            <Route path="/boutique-users-table" element={<BoutiqueUsersTablePage />} />
            <Route path="/boutique-user/:id" element={<BoutiqueUserDetails />} />
            <Route path="/livreurs-table" element={<LivreursTablePage />} />
            <Route path="/livreurs/:livreurId" element={<LivreurDetails />} />

            {/* Produits */}
            <Route path="/products-table" element={<ProductsTablePage />} />
            <Route path="/products/:productId" element={<ProductDetails />} />
            <Route path="/sales-table" element={<SalesTablePage />} />

            {/* Commandes */}
            <Route path="/orders" element={<OrdersList />} />
            <Route path="/order/:orderId" element={<OrderDetails />} />

            {/* Bannieres */}
            <Route path="/banners" element={<BannersList />} />

            {/* Recherche */}
            <Route path="/search" element={<SearchResults />} />

            {/* Éléments UI - Masqués - redirigent vers 404 */}
            <Route path="/alerts" element={<NotFound />} />
            <Route path="/avatars" element={<NotFound />} />
            <Route path="/badge" element={<NotFound />} />
            <Route path="/buttons" element={<NotFound />} />
            <Route path="/images" element={<NotFound />} />
            <Route path="/videos" element={<NotFound />} />

            {/* Graphiques - Masqués - redirigent vers 404 */}
            <Route path="/line-chart" element={<NotFound />} />
            <Route path="/bar-chart" element={<NotFound />} />
          </Route>

          {/* Route 404 - Page non trouvée */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </GoogleMapsProvider>
  );
}
