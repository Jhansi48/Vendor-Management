import { Injectable, Injector } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  private authService?: AuthService;
  private router?: Router;

  constructor(private injector: Injector) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    if (!this.router) {
      this.router = this.injector.get(Router);
    }

    const token = this.authService.getToken();
    const isApiUrl = request.url.includes('/api');
    
    if (token && isApiUrl) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle expired token or revoked session (excluding initial login attempt)
        if (error.status === 401 && !request.url.includes('/auth/login')) {
          if (this.authService) {
            this.authService.logout();
          }
          if (this.router) {
            this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
          }
        }
        return throwError(() => error);
      })
    );
  }
}
