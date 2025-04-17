import { Link } from "react-router-dom";
import styles from "./Logo.module.scss";
import LogoIcon from "./LogoIcon";

interface LogoProps {
  linkTo?: string;
  className?: string;
  color?: string;
  size?: number;
}

function Logo({
  linkTo,
  className = "",
  color = "#fff",
  size = 50,
}: LogoProps) {
  const logoContent = (
    <div
      className={`${styles.logo} ${className}`}
      style={{ "--logo-color": color } as React.CSSProperties}
    >
      <LogoIcon height={size} width={size} color={color} />
      <span className='bebas-neue-regular'>JAMOVEO</span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>;
  }

  return logoContent;
}

export default Logo;
