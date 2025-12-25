import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Card - O container principal do cartão
 *
 * Explicação para iniciantes:
 * - React.forwardRef permite que componentes pais acessem o elemento DOM diretamente
 * - HTMLDivElement é o tipo TypeScript para elementos <div>
 * - React.HTMLAttributes<HTMLDivElement> traz todas as props que um <div> aceita
 * - O "cn" combina classes CSS, permitindo customização
 */
const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      // Classes base do Card:
      "rounded-lg border border-[#e5e7eb] bg-white text-gray-900 shadow",
      className // Classes extras passadas pelo usuário
    )}
    {...props}
  />
));
Card.displayName = "Card";

/**
 * CardHeader - Área superior do cartão (título e descrição)
 */
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6", // Flexbox vertical, espaço entre itens, padding
      className
    )}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

/**
 * CardTitle - Título do cartão (usa <h3> para semântica HTML)
 */
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

/**
 * CardDescription - Subtítulo/descrição do cartão
 */
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-gray-500", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

/**
 * CardContent - Área principal de conteúdo do cartão
 */
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("p-6 pt-0", className)} // Padding, mas sem padding-top (já vem do header)
    {...props}
  />
));
CardContent.displayName = "CardContent";

/**
 * CardFooter - Área inferior do cartão (botões, ações)
 */
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Exporta todos os subcomponentes
export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};