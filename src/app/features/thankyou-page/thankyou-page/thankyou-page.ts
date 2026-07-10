import { Component, OnDestroy, OnInit } from '@angular/core';
import confetti from 'canvas-confetti';

@Component({
  selector: 'app-thankyou-page',
  standalone: false,
  templateUrl: './thankyou-page.html',
  styleUrl: './thankyou-page.scss',
})
export class ThankyouPage implements OnInit, OnDestroy {
  /** Paleta de confeti: amarillo de marca + acentos festivos. */
  private readonly colors = ['#FFD800', '#FFC107', '#111827', '#4ADE80', '#60A5FA'];
  private timeouts: ReturnType<typeof setTimeout>[] = [];

  ngOnInit(): void {
    this.launchConfetti();
  }

  ngOnDestroy(): void {
    this.timeouts.forEach(clearTimeout);
    confetti.reset();
  }

  /** Ráfaga central seguida de dos cañones laterales. Respeta prefers-reduced-motion. */
  private launchConfetti(): void {
    const prefersReducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    if (prefersReducedMotion) return;

    const defaults = { colors: this.colors, disableForReducedMotion: true };

    confetti({ ...defaults, particleCount: 90, spread: 70, startVelocity: 45, origin: { y: 0.6 } });

    this.timeouts.push(
      setTimeout(
        () => confetti({ ...defaults, particleCount: 60, angle: 60, spread: 55, origin: { x: 0, y: 0.65 } }),
        180
      )
    );
    this.timeouts.push(
      setTimeout(
        () => confetti({ ...defaults, particleCount: 60, angle: 120, spread: 55, origin: { x: 1, y: 0.65 } }),
        320
      )
    );
  }
}
