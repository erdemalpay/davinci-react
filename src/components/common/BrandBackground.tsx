import logoImage from "../../assets/login/logo.png";

interface Props {
  className?: string;
  children: React.ReactNode;
}

// Giriş sayfası ve herkese açık sayfaların krem arka planı ve silik logo deseni
const BrandBackground = ({ className = "", children }: Props) => (
  <div
    className={`relative overflow-hidden bg-gradient-to-br from-[#f5f5f0] via-[#e8e8dd] to-[#f5f5f0] ${className}`}
  >
    <div
      className="absolute inset-0 opacity-[0.03] pointer-events-none"
      style={{
        backgroundImage: `url(${logoImage})`,
        backgroundRepeat: "repeat",
        backgroundSize: "250px auto",
        backgroundPosition: "-25px 0",
        filter: "grayscale(1) brightness(0.5)",
      }}
    />
    {children}
  </div>
);

export default BrandBackground;
