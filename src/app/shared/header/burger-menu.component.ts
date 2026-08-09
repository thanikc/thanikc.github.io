import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { AdBannerToggleComponent } from '../../domains/ads/ad-banner-toggle.component';

@Component({
  selector: 'app-burger-menu',
  imports: [RouterLink, MatButtonModule, MatIconModule, MatMenuModule, AdBannerToggleComponent],
  templateUrl: './burger-menu.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BurgerMenuComponent {}
