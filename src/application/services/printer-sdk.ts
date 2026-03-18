import { CancelJob } from "../use-cases/cancel-job";
import { ConnectPrinter } from "../use-cases/connect-printer";
import { DiscoverPrinters } from "../use-cases/discover-printers";
import { DisconnectPrinter } from "../use-cases/disconnect-printer";
import { GetPrinterStatus } from "../use-cases/get-printer-status";
import { InitializePrinterModule } from "../use-cases/initialize-printer-module";
import { PrintLabel } from "../use-cases/print-label";
import { PrintReceipt } from "../use-cases/print-receipt";
import type { PrinterAdapter } from "../../domain/contracts/adapter";
import type { DeviceEvent, JobEvent } from "../../domain/models/events";
import type { LabelPayload, ReceiptPayload } from "../../domain/models/payloads";
import type { PrintJob, PrintResult } from "../../domain/models/job";
import type { AdapterCapabilityQuery, PrinterCapability, PrinterDevice, PrinterStatus } from "../../domain/models/printer";

type Listener<TEvent> = (event: TEvent) => void;

class EventStream<TEvent> {
  private listeners = new Set<Listener<TEvent>>();

  subscribe(listener: Listener<TEvent>): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: TEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}

export class PrinterSdk {
  private readonly jobEvents = new EventStream<JobEvent>();
  private readonly deviceEvents = new EventStream<DeviceEvent>();
  private readonly initializeUseCase: InitializePrinterModule;
  private readonly discoverUseCase: DiscoverPrinters;
  private readonly connectUseCase: ConnectPrinter;
  private readonly disconnectUseCase: DisconnectPrinter;
  private readonly statusUseCase: GetPrinterStatus;
  private readonly printReceiptUseCase: PrintReceipt;
  private readonly printLabelUseCase: PrintLabel;
  private readonly cancelJobUseCase: CancelJob;

  constructor(private readonly adapter: PrinterAdapter) {
    this.initializeUseCase = new InitializePrinterModule(adapter);
    this.discoverUseCase = new DiscoverPrinters(adapter);
    this.connectUseCase = new ConnectPrinter(adapter);
    this.disconnectUseCase = new DisconnectPrinter(adapter);
    this.statusUseCase = new GetPrinterStatus(adapter);
    this.printReceiptUseCase = new PrintReceipt(adapter);
    this.printLabelUseCase = new PrintLabel(adapter);
    this.cancelJobUseCase = new CancelJob(adapter);
  }

  async initialize(): Promise<void> {
    await this.initializeUseCase.execute();
  }

  async discoverPrinters(): Promise<PrinterDevice[]> {
    const printers = await this.discoverUseCase.execute();
    printers.forEach((printer) =>
      this.deviceEvents.emit({
        type: "discovered",
        printer,
        timestamp: new Date().toISOString()
      })
    );
    return printers;
  }

  async connect(printerId: string): Promise<PrinterDevice> {
    const printer = await this.connectUseCase.execute(printerId);
    this.deviceEvents.emit({
      type: "connected",
      printer,
      timestamp: new Date().toISOString()
    });
    return printer;
  }

  async disconnect(printerId?: string): Promise<void> {
    await this.disconnectUseCase.execute(printerId);
    this.deviceEvents.emit({
      type: "disconnected",
      timestamp: new Date().toISOString()
    });
  }

  async getConnectedPrinter(): Promise<PrinterDevice | null> {
    return this.adapter.getConnectedPrinter();
  }

  async getStatus(printerId?: string): Promise<PrinterStatus> {
    const status = await this.statusUseCase.execute(printerId);
    this.deviceEvents.emit({
      type: "statusChanged",
      status,
      timestamp: new Date().toISOString()
    });
    return status;
  }

  async printReceipt(job: PrintJob, payload: ReceiptPayload): Promise<PrintResult> {
    this.jobEvents.emit({ type: "queued", jobId: job.id, timestamp: new Date().toISOString() });
    const result = await this.printReceiptUseCase.execute(job, payload);
    this.jobEvents.emit({
      type: result.status === "completed" ? "completed" : "failed",
      jobId: job.id,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  async printLabel(job: PrintJob, payload: LabelPayload): Promise<PrintResult> {
    this.jobEvents.emit({ type: "queued", jobId: job.id, timestamp: new Date().toISOString() });
    const result = await this.printLabelUseCase.execute(job, payload);
    this.jobEvents.emit({
      type: result.status === "completed" ? "completed" : "failed",
      jobId: job.id,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  async cancelJob(jobId: string): Promise<PrintResult> {
    const result = await this.cancelJobUseCase.execute(jobId);
    this.jobEvents.emit({
      type: "cancelled",
      jobId,
      message: result.message,
      timestamp: new Date().toISOString()
    });
    return result;
  }

  async getCapabilities(query: AdapterCapabilityQuery): Promise<PrinterCapability[]> {
    return this.adapter.getCapabilities(query);
  }

  observeJobEvents(listener: Listener<JobEvent>): () => void {
    return this.jobEvents.subscribe(listener);
  }

  observeDeviceEvents(listener: Listener<DeviceEvent>): () => void {
    return this.deviceEvents.subscribe(listener);
  }
}
