import { useEffect } from "react";
import { BrowserRouter } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import { fetchCurrentUser } from "./store/auth-slice";
import { AppDispatch, RootState } from "./store";

import Routes from "./Routes";

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
      <Routes />
    </BrowserRouter>
  );
}

export default App;
