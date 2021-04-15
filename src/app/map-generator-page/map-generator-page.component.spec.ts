import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { DynamicMap } from '../dynamic-map/dynamic-map';
import { DynamicTokens } from '../dynamic-tokens/dynamic-tokens';
import { ShowMapComponent } from '../show-map/show-map.component';
import { ToastComponent } from '../toast/toast.component';

import { MapGeneratorPageComponent } from './map-generator-page.component';
import { MapLegendComponent } from '../show-map/map-legend/map-legend.component';

describe('MapGeneratorComponent', () => {
  let component: MapGeneratorPageComponent;
  let fixture: ComponentFixture<MapGeneratorPageComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        MapGeneratorPageComponent,
        ShowMapComponent,
        ToastComponent,
        MapLegendComponent
      ],
      providers: [
        DynamicMap,
        DynamicTokens
      ],
      imports: [
        RouterTestingModule.withRoutes(
          [{path: 'app', component: MapGeneratorPageComponent}]
        ),
        NgbTooltipModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MapGeneratorPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
