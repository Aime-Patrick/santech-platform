"use client";

import * as React from "react";
import { type PermissionKey } from "@/lib/authorization/permissions";

interface PermissionContextValue {
  permissions: string[];
  roles: string[];
  hasPermission: (permission: PermissionKey | string) => boolean;
  hasAnyPermission: (permissions: (PermissionKey | string)[]) => boolean;
  hasAllPermissions: (permissions: (PermissionKey | string)[]) => boolean;
  isRole: (role: string) => boolean;
}

const PermissionContext = React.createContext<PermissionContextValue | null>(null);

export interface PermissionProviderProps {
  permissions: string[];
  roles: string[];
  children: React.ReactNode;
}

export function PermissionProvider({
  permissions,
  roles,
  children,
}: PermissionProviderProps) {
  const permSet = React.useMemo(() => new Set(permissions), [permissions]);
  const roleSet = React.useMemo(
    () => new Set(roles.map((r) => r.toLowerCase())),
    [roles]
  );

  const hasPermission = React.useCallback(
    (permission: PermissionKey | string) => permSet.has(permission),
    [permSet]
  );

  const hasAnyPermission = React.useCallback(
    (perms: (PermissionKey | string)[]) => perms.some((p) => permSet.has(p)),
    [permSet]
  );

  const hasAllPermissions = React.useCallback(
    (perms: (PermissionKey | string)[]) => perms.every((p) => permSet.has(p)),
    [permSet]
  );

  const isRole = React.useCallback(
    (role: string) => roleSet.has(role.toLowerCase()),
    [roleSet]
  );

  const value = React.useMemo(
    () => ({
      permissions,
      roles,
      hasPermission,
      hasAnyPermission,
      hasAllPermissions,
      isRole,
    }),
    [permissions, roles, hasPermission, hasAnyPermission, hasAllPermissions, isRole]
  );

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
}

export function usePermissions() {
  const context = React.useContext(PermissionContext);
  if (!context) {
    // Graceful fallback if used outside provider (e.g. testing)
    return {
      permissions: [],
      roles: [],
      hasPermission: () => false,
      hasAnyPermission: () => false,
      hasAllPermissions: () => false,
      isRole: () => false,
    };
  }
  return context;
}

/**
 * Declarative component that renders its children only if the user has the required permission(s).
 */
export interface PermissionGateProps {
  permission?: PermissionKey | string;
  anyPermission?: (PermissionKey | string)[];
  allPermissions?: (PermissionKey | string)[];
  role?: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGate({
  permission,
  anyPermission,
  allPermissions,
  role,
  fallback = null,
  children,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isRole } = usePermissions();

  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  if (anyPermission && !hasAnyPermission(anyPermission)) {
    return <>{fallback}</>;
  }

  if (allPermissions && !hasAllPermissions(allPermissions)) {
    return <>{fallback}</>;
  }

  if (role && !isRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
