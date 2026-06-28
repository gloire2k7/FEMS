import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth.service';

/** Require an authenticated session, otherwise bounce to sign-in. */
export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  if (auth.getUser()) {
    return true;
  }
  router.navigate(['/signin']);
  return false;
};

/**
 * Permission-driven route guard. Reads `data.anyOf` (a list of permission keys)
 * and allows access when the user holds at least one of them. Super Admin always
 * passes (handled inside AuthService.hasPermission). Unauthorized users are sent
 * back to the dashboard rather than seeing a blank/forbidden page.
 */
export const permissionGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  if (!auth.getUser()) {
    router.navigate(['/signin']);
    return false;
  }

  const anyOf: string[] = (route.data?.['anyOf'] as string[]) ?? [];
  if (anyOf.length === 0 || anyOf.some((p) => auth.hasPermission(p))) {
    return true;
  }

  router.navigate(['/dashboard']);
  return false;
};
