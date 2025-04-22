import { Routes, Route, Navigate } from "react-router-dom";
import AuthRedirect from "./components/AuthRedirect";
import Signup from "./pages/Signup";
import Player from "./pages/Player/Player";
import Signin from "./pages/Signin";
import SignupAdmin from "./pages/SignupAdmin";
import User from "./pages/User/User";
import ForgotPassword from "./pages/ForgotPassword";
import MainView from "./components/MainView/MainView";

function SiteRoutes() {
  return (
    <Routes>
      <Route
        path='/forgot-password'
        element={
          <AuthRedirect>
            <ForgotPassword />
          </AuthRedirect>
        }
      />
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
          <MainView>
            <User />
          </MainView>
        }
      />
      <Route
        path='/'
        element={
          <MainView>
            <Player />
          </MainView>
        }
      />
      <Route path='*' element={<Navigate to='/' replace />} />
    </Routes>
  );
}

export default SiteRoutes;
