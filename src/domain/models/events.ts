import type { PrinterDevice, PrinterStatus } from "./printer";

export interface JobEvent {
  type: "queued" | "started" | "progress" | "completed" | "failed" | "cancelled";
  jobId: string;
  message?: string;
  timestamp: string;
}

export interface DeviceEvent {
  type: "discovered" | "connected" | "disconnected" | "statusChanged";
  printer?: PrinterDevice;
  status?: PrinterStatus;
  timestamp: string;
}
