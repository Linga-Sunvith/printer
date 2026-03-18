# App Mapper Design

## Normalized Receipt Payload

The shared module receives only normalized sections:

- header
- line items
- taxes
- payments
- totals
- footer
- barcode/QR
- notes
- customer
- app extensions

## Normalized Label Payload

- layout identifier
- label size
- copies
- text fields
- barcode/QR fields
- optional vendor hints

## Mapper Strategy

- one mapper interface per document family
- app-owned mapper implementations
- validation before payload crosses into SDK
- fallback defaults for absent optional fields

## Common Fields

- business name
- address
- document number
- printed timestamp
- cashier/operator
- items
- quantities
- unit price
- totals
- tax lines
- payment lines
- footer notes

## App-Specific Optional Fields

Retail:

- refund metadata
- GRN/PO/report sections
- GST/FSSAI/composite details
- e-invoice URL/QR details

Dino:

- table number
- waiter/server
- KOT course/station
- token number
- pre-bill markers

## Recommendation

Mappers should live outside the shared SDK package in the consuming apps, or in app-owned packages within a monorepo. This repo includes sample mappers only as examples.
