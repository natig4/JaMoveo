import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentUser } from "./store/auth-slice";
import { AppDispatch, RootState } from "./store";
import { SocketProvider } from "./contexts/SocketContext";
import Routes from "./Routes";
import LoadingPage from "./components/Loading/Loading";

function App() {
  const dispatch = useDispatch<AppDispatch>();
  const { initialized } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchCurrentUser());
  }, [dispatch]);

  if (!initialized) {
    return <LoadingPage />;
  }

  return (
    <BrowserRouter>
      <SocketProvider>
        <Routes />
      </SocketProvider>
    </BrowserRouter>
  );
}

export default App;
