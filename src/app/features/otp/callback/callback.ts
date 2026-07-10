import { Component, Inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { AUTH_API, AuthApi } from '../../../core/services/auth-api';
import { AuthMockService } from '../../../core/services/auth.mock.service';

/**
 * Landing de /otp/callback. Toma el `code` de la URL y lo valida contra el API:
 * - 200 con origen RegistraTuEmpresa => sesión + página de agradecimiento.
 * - 200 con cualquier otro origen    => sesión + dashboard.
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
    const state = this.route.snapshot.queryParamMap.get('state');

    if (!code || !state) {
      this.router.navigate(['/no-autorizado']);
      return;
    }

    this.authApi.validateOtp(code, state).subscribe({
      next: (res) => {
        this.auth.setSession(res);
        const destino =
          res.origen === environment.OTP_ORIGEN_REGISTRA_TUEMPRESA
            ? ['/thankyou-page']
            : ['/dashboard/metricas'];
        this.router.navigate(destino);
      },
      error: () => {
        this.router.navigate(['/no-autorizado']);
      }
    });
  }
}
