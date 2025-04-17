import React from "react";
import fallbackImage from "../../assets/no-avatar.png";

interface AvatarProps {
  size?: number;
  imageUrl?: string;
  alt?: string;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({
  size = 40,
  imageUrl,
  alt = "User Avatar",
  className = "",
}) => {
  return (
    <img
      src={imageUrl || fallbackImage}
      alt={alt}
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        objectFit: "cover",
        display: "inline-block",
      }}
    />
  );
};

export default Avatar;
