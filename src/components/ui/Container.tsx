// src/components/ui/Container.tsx

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({ 
  children, 
  className = "", 
  maxWidth = "xl" 
}: ContainerProps) {
  const maxWidthClasses = {
    sm: "max-w-3xl",
    md: "max-w-4xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div className={`${maxWidthClasses[maxWidth]} mx-auto px-6 ${className}`}>
      {children}
    </div>
  );
}