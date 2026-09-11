import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth, UserRole } from "@/lib/auth-context";

export function ProtectedRoleRoute({
  children,
  allowedRoles,
}: {
  children: ReactNode;
  allowedRoles: UserRole[];
}) {
  const { role, isLoading } = useAuth();

  if (isLoading) return <div className="p-10 text-center">Authenticating...</div>;
  if (!allowedRoles.includes(role)) return <Redirect to="/" />;

  return <>{children}</>;
}
