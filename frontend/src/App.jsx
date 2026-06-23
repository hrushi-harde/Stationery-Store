import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Components/Navbar.jsx';
import AuthBootstrap from './Components/AuthBootstrap.jsx';
import Home from './Pages/Home.jsx';
import About from './Pages/About.jsx';
import ContactUs from './Pages/ContactUs';
import ProtectedRoute from './Components/ProtectedRoute';
import ChatbotWidget from './Components/ChatbotWidget';

const Shop = lazy(() => import('./Pages/Shop.jsx'));
const ProductDetails = lazy(() => import('./Components/ProductDetails.jsx'));
const Cart = lazy(() => import('./Pages/Cart'));
const Login = lazy(() => import('./Pages/Login'));
const SignIn = lazy(() => import('./Pages/SignIn'));
const Checkout = lazy(() => import('./Pages/Checkout'));
const OrderSummary = lazy(() => import('./Pages/OrderSummary'));
const OrderSuccess = lazy(() => import('./Pages/OrderSuccess'));
const Profile = lazy(() => import('./Pages/Profile'));
const OrderHistory = lazy(() => import('./Pages/OrderHistory'));
const OwnerProducts = lazy(() => import('./Pages/OwnerProducts'));
const OwnerQueries = lazy(() => import('./Pages/OwnerQueries'));
const OwnerContacts = lazy(() => import('./Pages/OwnerContacts'));

function App() {
  return (
    <>
      <Navbar />

      <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
        <AuthBootstrap>
          <Routes>
          <Route path='/' element={<Home />} />
          <Route path='/about-us' element={<About />} />
          <Route path='/contact' element={<ContactUs />} />
          <Route path='/product/:id' element={<ProductDetails />} />
          <Route path='/shop/:category' element={<Shop />} />
          <Route path='/cart' element={<Cart />} />
          <Route path='/login' element={<Login />} />
          <Route path='/signin' element={<SignIn />} />
          <Route path='/order-summary' element={<OrderSummary />} />
          <Route path='/checkout' element={<Checkout />} />
          <Route path='/order-success' element={<OrderSuccess />} />
          <Route
            path='/owner'
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path='/owner/queries'
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerQueries />
              </ProtectedRoute>
            }
          />
          <Route
            path='/owner/contacts'
            element={
              <ProtectedRoute allowedRoles={['owner']}>
                <OwnerContacts />
              </ProtectedRoute>
            }
          />
          <Route
            path='/profile'
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path='/orders'
            element={
              <ProtectedRoute>
                <OrderHistory />
              </ProtectedRoute>
            }
          />
          </Routes>
        </AuthBootstrap>
      </Suspense>
      <ChatbotWidget />
    </>
  );
}

export default App;
