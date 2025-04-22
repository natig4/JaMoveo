import ProtectedRoute from "../ProtectedRoute";
import SiteHeader from "../SiteHeader/SiteHeader";

const MainView: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProtectedRoute>
      <SiteHeader />
      {children}
    </ProtectedRoute>
  );
};

export default MainView;
