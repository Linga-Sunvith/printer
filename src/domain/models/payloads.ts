export interface MoneyValue {
  amount: number;
  currency: string;
}

export interface ReceiptTextSection {
  kind: "text";
  id: string;
  title?: string;
  lines: string[];
}

export interface ReceiptKeyValueRow {
  label: string;
  value: string;
  emphasis?: "normal" | "strong";
}

export interface ReceiptKeyValueSection {
  kind: "keyValue";
  id: string;
  title?: string;
  rows: ReceiptKeyValueRow[];
}

export interface ReceiptItemLine {
  sku?: string;
  name: string;
  quantity: number;
  unitPrice?: MoneyValue;
  total: MoneyValue;
  unitOfMeasure?: string;
  taxLabel?: string;
  notes?: string[];
}

export interface ReceiptItemsSection {
  kind: "items";
  id: string;
  title?: string;
  items: ReceiptItemLine[];
}

export interface ReceiptCodeSection {
  kind: "barcode" | "qrcode";
  id: string;
  value: string;
  label?: string;
}

export interface ReceiptExtensionSection {
  kind: "extension";
  id: string;
  extensionType: string;
  data: Record<string, unknown>;
}

export type ReceiptSection =
  | ReceiptTextSection
  | ReceiptKeyValueSection
  | ReceiptItemsSection
  | ReceiptCodeSection
  | ReceiptExtensionSection;

export interface ReceiptPayload {
  documentType: "receipt";
  documentVariant?: string;
  printerWidthInches: 3;
  locale?: string;
  copyCount?: number;
  header: ReceiptSection[];
  body: ReceiptSection[];
  totals: ReceiptSection[];
  footer: ReceiptSection[];
  extensions?: ReceiptExtensionSection[];
  metadata?: Record<string, unknown>;
}

export interface LabelField {
  id: string;
  value: string;
  x?: number;
  y?: number;
  font?: string;
}

export interface LabelCodeField {
  id: string;
  symbology: "code128" | "ean13" | "qr";
  value: string;
  x?: number;
  y?: number;
}

export interface LabelPayload {
  documentType: "label";
  layout: string;
  sizeMm: string;
  copyCount: number;
  textFields: LabelField[];
  codeFields: LabelCodeField[];
  metadata?: Record<string, unknown>;
}
