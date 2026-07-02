import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Business, BusinessStatus } from '../../../../domain/business/business.entity';
import { Metrics } from '../../../../core/models/metrics.model';
import { MAX_PUBLISHED as MAX_PUBLISHED_LIMIT } from '../../../../domain/business/business.policies';

@Component({
  selector: 'app-business-list-card',
  standalone: false,
  templateUrl: './business-list-card.html',
  styleUrl: './business-list-card.scss'
})
export class BusinessListCard {
  @Input() businesses: Business[] = [];
  @Input() metrics: Metrics | null = null;
  @Input() publishedCount = 0;
  @Output() businessSelected = new EventEmitter<Business>();
  @Output() addRequested = new EventEmitter<void>();

  readonly MAX_PUBLISHED = MAX_PUBLISHED_LIMIT;

  statusLabel(status: BusinessStatus): string {
    return { published: 'Publicado', unpublished: 'No publicado', in_progress: 'En progreso' }[status] ?? status;
  }

  statusClass(status: BusinessStatus): string {
    return { published: 'status--published', unpublished: 'status--unpublished', in_progress: 'status--progress' }[status] ?? '';
  }
}
