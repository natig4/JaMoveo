import { Link } from "react-router-dom";

interface LogoProps {
  linkTo?: string;
  className?: string;
}

function Logo({ linkTo, className = "" }: LogoProps) {
  const logoContent = (
    <div className={`logo ${className}`}>
      <span className='logo-icon'>🎧</span> JAMOVEO
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>;
  }

  return logoContent;
}

export default Logo;
