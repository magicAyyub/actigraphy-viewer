"use client"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { Activity, Table2 } from "lucide-react"
import { usePathname } from "next/navigation"

export function MainNav({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  const pathname = usePathname()
  
  return (
    <nav className={cn("flex items-center space-x-6", className)} {...props}>
      <Link
        href="/"
        className={cn(
          "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/" ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Activity className="h-4 w-4" />
        <span>Données d&apos;Actigraphie</span>
      </Link>
      <Link
        href="/donnees-tabulaires"
        className={cn(
          "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
          pathname === "/donnees-tabulaires" ? "text-primary" : "text-muted-foreground"
        )}
      >
        <Table2 className="h-4 w-4" />
        <span>Données Tabulaires</span>
      </Link>
    </nav>
  )
}