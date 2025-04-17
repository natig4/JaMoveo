import { FaHeadphonesAlt } from "react-icons/fa";

interface IIconProps {
  color?: string;
  height?: number;
  width?: number;
}

function LogoIcon({ color = "#fff", height = 24, width = 24 }: IIconProps) {
  return <FaHeadphonesAlt width={width} height={height} color={color} />;
}

export default LogoIcon;
