# Thanikc

Personal portfolio website built with Angular — showcasing a Full-Stack Engineer profile and an interactive retirement calculator that uses live World Bank API data for nest-egg projections. Standalone components, Signals, Angular Material, and Tailwind CSS.

## Project Structure

```text
src/
├── app/
│   ├── domains/                     # Domain-driven feature modules
│   │   ├── ads/                     # Ads domain (Google AdSense)
│   │   ├── portfolio/               # Portfolio domain (profile, experience timeline)
│   │   └── retirement-calculator/   # Retirement calculator domain (data fetching, state, logic, charts)
│   │
│   ├── shared/                      # Cross-domain reusable UI components & layout wrappers
│   │
│   ├── app.component.ts             # Root layout component
│   ├── app.config.ts                # App configuration & providers
│   └── app.routes.ts                # Application routing
│
├── assets/                          # Static assets & images
└── styles/                          # Global styles & Tailwind CSS configuration

```

## Key Features & Standards

- **Accessibility (a11y) & Semantic HTML**: Built with screen-reader friendly elements, keyboard navigation, and proper ARIA guidelines to ensure an inclusive web experience.
- **Domain-Driven Architecture**: Each feature (`portfolio`, `retirement-calculator`) is fully self-contained with its own data services, state management, components, and models.
- **Signal-Based Reactive State**: Calculations and external World Bank API data streams are managed reactively using Angular Signals.
- **Shared UI Layer**: Non-domain-specific components, global navigation, and Material helpers are isolated under `shared/`.

## Development server

Run `ng serve` and navigate to `http://localhost:4200/`.

## Build

Run `ng build` to build the project. Artifacts land in `dist/`.

## Running unit tests

Run `ng test` to execute unit tests via Vitest.
