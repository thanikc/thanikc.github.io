import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { ThemeMode, ThemeService } from './theme.service';

interface ThemeOption {
  readonly mode: ThemeMode;
  readonly label: string;
  readonly icon: string;
}

const THEME_OPTIONS: readonly ThemeOption[] = [
  { mode: 'system', label: 'System', icon: 'brightness_auto' },
  { mode: 'light', label: 'Light', icon: 'light_mode' },
  { mode: 'dark', label: 'Dark', icon: 'dark_mode' },
];

@Component({
  selector: 'app-theme-toggle',
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  templateUrl: './theme-toggle.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ThemeToggleComponent {
  private readonly theme = inject(ThemeService);

  readonly options = THEME_OPTIONS;
  readonly mode = this.theme.mode;
  readonly icon = computed(
    () => THEME_OPTIONS.find(option => option.mode === this.mode())?.icon ?? 'brightness_auto',
  );

  selectMode(mode: ThemeMode): void {
    this.theme.setMode(mode);
  }
}
