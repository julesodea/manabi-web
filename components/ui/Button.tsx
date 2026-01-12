import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-medium rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md";

  const variantStyles = {
    primary: "bg-gradient-to-r from-[#5B7FFF] to-[#4A6FEE] text-white",
    secondary: "bg-white text-gray-900 border-2 border-gray-200",
    danger: "bg-red-600 text-white",
    ghost: "bg-transparent text-gray-700 shadow-none",
  };

  const sizeStyles = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button
      className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
