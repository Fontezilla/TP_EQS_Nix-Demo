// Passo 2: routing no cliente
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar.jsx';
import TabBar from './components/TabBar/TabBar.jsx';
import Footer from './components/Footer/Footer.jsx';
import Notifications from './components/Notifications/Notifications.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Catalog from './pages/Catalog/Catalog.jsx';
import ProducerProfile from './pages/ProducerProfile/ProducerProfile.jsx';
import Auctions from './pages/Auctions/Auctions.jsx';
import AuctionRoom from './pages/AuctionRoom/AuctionRoom.jsx';
import Cart from './pages/Cart/Cart.jsx';
import Orders from './pages/Orders/Orders.jsx';
import Login from './pages/Login/Login.jsx';
import Register from './pages/Register/Register.jsx';
import Dashboard from './pages/producer/Dashboard/Dashboard.jsx';
import CreateAuction from './pages/producer/CreateAuction/CreateAuction.jsx';
import ProducerOrders from './pages/producer/Orders/Orders.jsx';
import ProducerProducts from './pages/producer/Products/Products.jsx';
import NotFound from './pages/NotFound/NotFound.jsx';

export default function App() {
  return (
    <>
      <Navbar />
      <main className="container-xl">
        <Routes>
          {/* Visitante */}
          <Route path="/" element={<Catalog />} />
          <Route path="/producers/:id" element={<ProducerProfile />} />
          <Route path="/auctions" element={<Auctions />} />
          <Route path="/auctions/:id" element={<AuctionRoom />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Comprador */}
          <Route element={<ProtectedRoute roles={['buyer']} />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
          </Route>

          {/* Produtor */}
          <Route element={<ProtectedRoute roles={['producer']} />}>
            <Route path="/producer" element={<Dashboard />} />
            <Route path="/producer/orders" element={<ProducerOrders />} />
            <Route path="/producer/products" element={<ProducerProducts />} />
            <Route path="/producer/auctions/new" element={<CreateAuction />} />
          </Route>

          {/* A administração está no backoffice em Laravel (pasta backoffice/) */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <TabBar />
      <Notifications />
    </>
  );
}
