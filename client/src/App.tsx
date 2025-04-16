import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store";
import "./App.css";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import AuthRedirect from "./components/AuthRedirect";
import SignupPage from "./pages/SignupPage";
import SigninPage from "./pages/SigninPage";
import PlayerPage from "./pages/PlayerPage";

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Routes>
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
                <Navbar />
                <PlayerPage />
              </ProtectedRoute>
            }
          />
          <Route path='*' element={<Navigate to='/' replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
