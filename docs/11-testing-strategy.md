# Testing Strategy

## Coverage Areas

- shared contract stability
- mapper correctness
- renderer correctness
- adapter contract consistency
- discovery/connection behavior
- failure handling
- regression coverage against legacy scenarios

## Test Layers

- unit tests for models and use cases
- mapper tests for Retail and Dino
- renderer tests for receipt and label output
- adapter contract tests using mock adapters
- integration tests through `PrinterSdk`
- platform-difference tests for capability fallbacks

## CI Guidance

- run `npm test`
- run `npm run build`
- keep assertions focused on semantic sections and command markers
- add fixture payloads for Retail and Dino normalized jobs
