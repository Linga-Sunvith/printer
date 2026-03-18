# Shared Printer SDK

Shared React Native printer module scaffold for:

- Retail POS on Android
- Retail POS on Windows
- Dino POS on Android
- Dino POS on Windows

The module is intentionally multi-consumer. It owns printer orchestration, rendering contracts, transport abstractions, and job/status APIs. Retail and Dino remain responsible only for mapping their internal business models into normalized payloads before calling the SDK.

## POC Scope

- 3-inch thermal receipt printing
- Label printing
- USB-first transport
- Seams for Bluetooth and Wi-Fi/socket transport
- Mock adapter for tests and demo flows

## Structure

- `docs/`: comparative analysis, architecture, API, mapper, and testing guidance
- `src/`: shared TypeScript SDK
- `android/`: React Native Android native skeleton
- `windows/`: React Native Windows native skeleton
- `example-app/`: MVVM integration sample
- `tests/`: contract, mapper, and renderer tests

## Important Boundary

The shared SDK never accepts Retail or Dino legacy models directly.

- Retail app: `RetailModel -> RetailMapper -> NormalizedReceiptPayload/NormalizedLabelPayload -> SDK`
- Dino app: `DinoModel -> DinoMapper -> NormalizedReceiptPayload/NormalizedLabelPayload -> SDK`

## Current State

This repo now contains a production-oriented scaffold and design baseline. Native adapters are skeletal by design and ready for phased implementation against the real Android and Windows device APIs.
