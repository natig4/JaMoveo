import { Routes, Route, Navigate } from "react-router-dom";
import AuthRedirect from "./components/AuthRedirect";
import ProtectedRoute from "./components/ProtectedRoute";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import Signup from "./pages/Signup";
import Player from "./pages/Player";
import Signin from "./pages/Signin";
import SignupAdmin from "./pages/SignupAdmin";
import User from "./pages/User/User";

function SiteRoutes() {
  return (
    <Routes>
      <Route
        path='/signup-admin'
        element={
          <AuthRedirect>
            <SignupAdmin />
          </AuthRedirect>
        }
      />
      <Route
        path='/signup'
        element={
          <AuthRedirect>
            <Signup />
          </AuthRedirect>
        }
      />
      <Route
        path='/signin'
        element={
          <AuthRedirect>
            <Signin />
          </AuthRedirect>
        }
      />
      <Route
        path='/user'
        element={
          <ProtectedRoute>
            <SiteHeader />
            <User />
          </ProtectedRoute>
        }
      />
      <Route
        path='/'
        element={
          <ProtectedRoute>
            <SiteHeader />
            <Player />
          </ProtectedRoute>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default SiteRoutes;
