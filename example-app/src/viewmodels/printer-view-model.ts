import { PrinterSdk } from "../../../src/application/services/printer-sdk";
import { DinoReceiptMapper, type DinoReceiptSource } from "../../../src/mappers/dino/dino-printer-mapper";
import {
  RetailLabelMapper,
  RetailReceiptMapper,
  type RetailLabelSource,
  type RetailReceiptSource
} from "../../../src/mappers/retail/retail-printer-mapper";
import type { PrintJob } from "../../../src/domain/models/job";

export class PrinterViewModel {
  private readonly retailReceiptMapper = new RetailReceiptMapper();
  private readonly retailLabelMapper = new RetailLabelMapper();
  private readonly dinoReceiptMapper = new DinoReceiptMapper();
  private connectedPrinterId: string | null = null;

  constructor(private readonly sdk: PrinterSdk) {}

  async initialize(): Promise<void> {
    await this.sdk.initialize();
  }

  async discover() {
    return this.sdk.discoverPrinters();
  }

  async connect(printerId: string) {
    const printer = await this.sdk.connect(printerId);
    this.connectedPrinterId = printer.id;
    return printer;
  }

  async printRetailReceipt(source: RetailReceiptSource) {
    const payload = this.retailReceiptMapper.map(source);
    const targetPrinterId = await this.getTargetPrinterId();
    const job: PrintJob = {
      id: `retail-${Date.now()}`,
      documentType: "receipt",
      targetPrinterId,
      createdAt: new Date().toISOString(),
      payload
    };
    return this.sdk.printReceipt(job, payload);
  }

  async printDinoReceipt(source: DinoReceiptSource) {
    const payload = this.dinoReceiptMapper.map(source);
    const targetPrinterId = await this.getTargetPrinterId();
    const job: PrintJob = {
      id: `dino-${Date.now()}`,
      documentType: "receipt",
      targetPrinterId,
      createdAt: new Date().toISOString(),
      payload
    };
    return this.sdk.printReceipt(job, payload);
  }

  async printRetailLabel(source: RetailLabelSource) {
    const payload = this.retailLabelMapper.map(source);
    const targetPrinterId = await this.getTargetPrinterId();
    const job: PrintJob = {
      id: `label-${Date.now()}`,
      documentType: "label",
      targetPrinterId,
      createdAt: new Date().toISOString(),
      payload
    };
    return this.sdk.printLabel(job, payload);
  }

  private async getTargetPrinterId(): Promise<string> {
    if (this.connectedPrinterId) {
      return this.connectedPrinterId;
    }

    const printer = await this.sdk.getConnectedPrinter();
    if (!printer) {
      throw new Error("No connected printer.");
    }

    this.connectedPrinterId = printer.id;
    return printer.id;
  }
}
