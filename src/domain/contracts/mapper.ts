import type { LabelPayload, ReceiptPayload } from "../models/payloads";

export interface ReceiptPayloadMapper<TSource> {
  map(source: TSource): ReceiptPayload;
}

export interface LabelPayloadMapper<TSource> {
  map(source: TSource): LabelPayload;
}
