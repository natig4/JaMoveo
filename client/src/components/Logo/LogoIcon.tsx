interface IIconProps {
  color?: string;
  height?: number;
  width?: number;
}

function LogoIcon({ color = "#fff", height = 24, width = 24 }: IIconProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <path
        d='M12 2C6.48 2 2 6.48 2 12v7c0 1.1.9 2 2 2h3v-8H5v-1c0-3.87 3.13-7 7-7s7 3.13 7 7v1h-2v8h3c1.1 0 2-.9 2-2v-7c0-5.52-4.48-10-10-10z'
        fill={color}
      />
      <path
        d='M7 12v7c0 1.1.9 2 2 2h1v-9H7zm8 0v9h1c1.1 0 2-.9 2-2v-7h-3z'
        fill={color}
      />
    </svg>
  );
}

export default LogoIcon;
