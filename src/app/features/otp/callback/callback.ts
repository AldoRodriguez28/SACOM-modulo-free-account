import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AUTH_API, AuthApi } from '../../../core/services/auth-api';
import { AuthMockService } from '../../../core/services/auth.mock.service';

/**
 * Landing de /otp/callback. Toma el `code` de la URL y lo valida contra el API:
 * - 200  => establece la sesión y redirige al dashboard.
 * - error => redirige a /no-autorizado.
 */
@Component({
  selector: 'app-callback',
  standalone: false,
  templateUrl: './callback.html',
  styleUrl: './callback.scss',
})
export class Callback implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthMockService,
    @Inject(AUTH_API) private authApi: AuthApi
  ) {}

  ngOnInit(): void {
    const code = this.route.snapshot.queryParamMap.get('code');

    if (!code) {
      this.router.navigate(['/no-autorizado']);
      return;
    }

    this.authApi.validateOtp(code).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        this.router.navigate(['/dashboard/metricas']);
      },
      error: () => {
        this.router.navigate(['/no-autorizado']);
      }
    });
  }
}
