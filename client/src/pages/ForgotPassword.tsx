import { Link } from "react-router-dom";
import AuthFormShell from "../components/AuthFormShell/AuthFormShell";
import StyledButton from "../components/StyledButton/StyledButton";

export default function ForgotPassword() {
  return (
    <AuthFormShell title='Forgot Password'>
      <p>
        This feature wasn't implemented yet but we hope to take care of it
        really soon
      </p>
      <Link to={"/"}>
        <StyledButton>Back</StyledButton>
      </Link>
    </AuthFormShell>
  );
}
