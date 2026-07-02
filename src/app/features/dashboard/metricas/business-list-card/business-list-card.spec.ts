import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';

import { BusinessListCard } from './business-list-card';

describe('BusinessListCard', () => {
  let component: BusinessListCard;
  let fixture: ComponentFixture<BusinessListCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BusinessListCard],
      imports: [CommonModule]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BusinessListCard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('emits businessSelected with the clicked business', () => {
    const biz = { id: 'b1', businessName: 'X', category: 'C', address: { colony: 'Y' } } as any;
    fixture.componentRef.setInput('businesses', [biz]);
    fixture.detectChanges();
    spyOn(component.businessSelected, 'emit');
    const rows: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.biz-list-card__row');
    const row = Array.from(rows).find((r: HTMLElement) => !r.classList.contains('biz-list-card__row--add')) as HTMLElement;
    row.click();
    expect(component.businessSelected.emit).toHaveBeenCalledWith(biz);
  });

  it('emits addRequested when the add row is clicked', () => {
    fixture.detectChanges();
    spyOn(component.addRequested, 'emit');
    const addRow: HTMLElement = fixture.nativeElement.querySelector('.biz-list-card__row--add');
    addRow.click();
    expect(component.addRequested.emit).toHaveBeenCalled();
  });
});
