import React from "react";

interface P1Props {
  children: React.ReactNode;
  className?: string;
}

const P1: React.FC<P1Props> = ({ children, className = "" }) => {
  return <p className={`text-base  ${className}`}>{children}</p>;
};

export default P1;
