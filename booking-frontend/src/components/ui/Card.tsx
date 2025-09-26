import React from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "outline" | "filled";
  padding?: "none" | "sm" | "md" | "lg";
  rounded?: "sm" | "md" | "lg" | "xl";
  shadow?: "none" | "sm" | "md" | "lg";
  hoverable?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      padding = "md",
      rounded = "lg",
      shadow = "sm",
      hoverable = false,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base styles
          "bg-white border transition-all duration-200",

          // Variants
          {
            "border-gray-200": variant === "default",
            "border-gray-300 bg-transparent": variant === "outline",
            "border-gray-200 bg-gray-50": variant === "filled",
          },

          // Padding
          {
            "p-0": padding === "none",
            "p-3": padding === "sm",
            "p-6": padding === "md",
            "p-8": padding === "lg",
          },

          // Rounded corners
          {
            rounded: rounded === "sm",
            "rounded-md": rounded === "md",
            "rounded-lg": rounded === "lg",
            "rounded-xl": rounded === "xl",
          },

          // Shadow
          {
            "shadow-none": shadow === "none",
            "shadow-sm": shadow === "sm",
            "shadow-md": shadow === "md",
            "shadow-lg": shadow === "lg",
          },

          // Hover effects
          {
            "hover:shadow-md cursor-pointer": hoverable && shadow === "sm",
            "hover:shadow-lg cursor-pointer": hoverable && shadow === "md",
            "hover:shadow-xl cursor-pointer": hoverable && shadow === "lg",
          },

          // Dark mode
          "dark:bg-gray-800 dark:border-gray-700",

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

// Card subcomponents
export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, title, subtitle, actions, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-start justify-between border-b border-gray-200 pb-4",
          "dark:border-gray-700",
          className
        )}
        {...props}
      >
        <div className="flex-1">
          {title && (
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {subtitle}
            </p>
          )}
          {children}
        </div>
        {actions && <div className="ml-4 flex-shrink-0">{actions}</div>}
      </div>
    );
  }
);

CardHeader.displayName = "CardHeader";

export interface CardContentProps
  extends React.HTMLAttributes<HTMLDivElement> {}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn("pt-4", className)} {...props} />;
  }
);

CardContent.displayName = "CardContent";

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  actions?: React.ReactNode;
  justify?: "start" | "center" | "end" | "between";
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, actions, justify = "end", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center pt-4 mt-4 border-t border-gray-200",
          "dark:border-gray-700",
          {
            "justify-start": justify === "start",
            "justify-center": justify === "center",
            "justify-end": justify === "end",
            "justify-between": justify === "between",
          },
          className
        )}
        {...props}
      >
        {children || actions}
      </div>
    );
  }
);

CardFooter.displayName = "CardFooter";

// Export card with subcomponents
const CardWithSubComponents = Object.assign(Card, {
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
});

export default CardWithSubComponents;
