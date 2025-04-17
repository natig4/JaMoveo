import { Link } from "react-router-dom";
import styles from "./Logo.module.scss";
import LogoIcon from "./LogoIcon";

interface LogoProps {
  linkTo?: string;
  className?: string;
  color?: string;
}

function Logo({ linkTo, className = "", color = "#fff" }: LogoProps) {
  const logoContent = (
    <div
      className={`${styles.logo} ${className}`}
      style={{ "--logo-color": color } as React.CSSProperties}
    >
      <LogoIcon height={50} width={50} color={color} />
      <span>JAMOVEO</span>
    </div>
  );

  if (linkTo) {
    return <Link to={linkTo}>{logoContent}</Link>;
  }

  return logoContent;
}

export default Logo;
