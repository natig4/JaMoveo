import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchCurrentUser } from "./store/auth-slice";
import { AppDispatch, RootState } from "./store";
import SiteHeader from "./components/SiteHeader/SiteHeader";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import SignupPage from "./pages/SignupPage";
import SignupPageAdmin from "./pages/SignupPageAdmin";
import SigninPage from "./pages/SigninPage";
import PlayerPage from "./pages/PlayerPage";

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { initialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (!initialized) {
    return <div className='app-loading'>Loading...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/signup-admin'
          element={
            <AuthRedirect>
              <SignupPageAdmin />
            </AuthRedirect>
          }
        />
        <Route
          path='/signup'
          element={
            <AuthRedirect>
              <SignupPage />
            </AuthRedirect>
          }
        />
        <Route
          path='/signin'
          element={
            <AuthRedirect>
              <SigninPage />
            </AuthRedirect>
          }
        />
        <Route
          path='/'
          element={
            <ProtectedRoute>
              <SiteHeader />
              <PlayerPage />
            </ProtectedRoute>
          }
        />
        <Route path='*' element={<Navigate to='/' replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
