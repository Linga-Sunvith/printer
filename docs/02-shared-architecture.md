# Shared Architecture

## High-Level Architecture

```text
Retail App / Dino App
        |
        v
App-Specific Mapper Layer
        |
        v
Shared TypeScript SDK
  - domain contracts
  - use cases
  - job orchestration
  - renderer abstractions
  - adapter contracts
        |
        v
React Native Bridge
        |
   +----+----+
   |         |
   v         v
Android    Windows
Adapters   Adapters
   |         |
   v         v
USB / BT / Socket / Native Print APIs
```

## Shared vs App-Specific Boundaries

Shared:

- printer discovery/connect/disconnect/status
- job submission and lifecycle
- receipt/label payload contracts
- renderer selection and transport routing
- capability checks and graceful degradation

App-specific:

- Retail and Dino model mapping
- optional section creation from business rules
- consumer app MVVM wiring and UI concerns

## Folder Structure

```text
src/
  domain/
  application/
  infrastructure/
  mappers/
  react-native/
example-app/
android/
windows/
tests/
docs/
```

## Sequence Flow

1. Consumer app loads printer SDK.
2. App maps internal model into normalized receipt or label payload.
3. SDK validates payload against selected printer capabilities.
4. SDK chooses renderer strategy and target adapter.
5. Adapter connects through platform transport.
6. Renderer emits command stream or platform document model.
7. Adapter executes job and emits lifecycle/status events.
8. ViewModel updates the view from SDK events.

## Component Responsibilities

- `PrinterSdk`: main application service and stable public entry point.
- Use cases: one use case per operation for testability.
- `PrinterAdapter`: capability-based platform boundary.
- `ReceiptRenderer` / `LabelRenderer`: document-to-command transformation.
- App mappers: Retail/Dino model normalization only.
- Mock adapter: deterministic tests and demo mode.

## Design Rationale

- Strategy: receipt and label renderers, vendor-specific command dialects.
- Factory: choose renderer and adapter by platform/capability.
- Adapter: Android and Windows native layers behind shared contracts.
- Command: print job execution pipeline and cancel support.
- Mapper: Retail/Dino normalization boundary.
- Dependency inversion: use cases depend on adapter contracts, not concrete transports.
