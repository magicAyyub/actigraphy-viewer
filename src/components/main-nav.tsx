import Link from "next/link"
import { cn } from "@/lib/utils"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <Link
        href="/"
        className="text-sm font-medium transition-colors hover:text-primary"
      >
        Accueil
      </Link>
      <Link
        href="/fenetres-analyse"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Fenêtres d&apos;Analyse
      </Link>
      <Link
        href="/donnees-tabulaires"
        className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
      >
        Données Tabulaires
      </Link>
    </nav>
  )
}

