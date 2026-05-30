export function isProtectedPath(pathname: string): boolean {
  return (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/planos") ||
    pathname.startsWith("/calendario") ||
    pathname.startsWith("/pendente") ||
    pathname.startsWith("/financeiro") ||
    pathname.startsWith("/benchmarking") ||
    pathname.startsWith("/simulador") ||
    pathname.startsWith("/empresas") ||
    pathname.startsWith("/escolas") ||
    pathname.startsWith("/help")
  );
}

export function isAuthPage(pathname: string): boolean {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/register")
  );
}

export function isApiRoute(pathname: string): boolean {
  return pathname.startsWith("/api");
}
