import { Rssi, Millisecond } from "../metaLanguage/Types";
import { Observable } from "rxjs";
import {
    ReadableCharacteristic,
    WritableCharacteristic
} from "./Characteristic";
import Exception from "../metaLanguage/Exception";

type ExceptionType =
    | {
          type: "BluetoothPoweredOff";
          data: [];
      }
    | {
          type: "BluetoothUnauthorized";
          data: [];
      }
    | {
          type: "ConnectionLostUnexpectedly";
          data: [];
      }
    | {
          type: "FailedToConnect";
          data: [];
      }
    | {
          type: "FailedToDisconnect";
          data: [];
      }
    | {
          type: "FailedToEnableBluetooth";
          data: [];
      }
    | {
          type: "FailedToRead";
          data: [];
      }
    | {
          type: "FailedToWrite";
          data: [];
      }
    | {
          type: "FailedToStartScan";
          data: [];
      }
    | {
          type: "FailedToStopScan";
          data: [];
      }
    | {
          type: "ScanAlreadyStarted";
          data: [];
      }
    | {
          type: "ScanTimeout";
          data: [];
      };

export class BluetoothException extends Exception<ExceptionType> {
    static get BluetoothPoweredOff(): BluetoothException {
        return new this(
            { type: "BluetoothPoweredOff", data: [] },
            "Bluetooth is powered off.",
            "warn"
        );
    }

    static get BluetoothUnauthorized(): BluetoothException {
        return new this(
            { type: "BluetoothUnauthorized", data: [] },
            "This application isn’t authorized to use the Bluetooth.",
            "warn"
        );
    }

    static ConnectionLostUnexpectedly(
        peripheralId: string,
        sourceException?: unknown
    ): BluetoothException {
        return new this(
            { type: "ConnectionLostUnexpectedly", data: [] },
            `Connection to Bluetooth device (${peripheralId}) lost unexpectedly.`,
            "warn",
            sourceException
        );
    }

    static FailedToConnect(
        peripheralId: string,
        sourceException?: unknown
    ): BluetoothException {
        return new this(
            { type: "FailedToConnect", data: [] },
            `Failed to connect to Bluetooth device (${peripheralId}).`,
            "log",
            sourceException
        );
    }

    static FailedToDisconnect(
        peripheralId: string,
        sourceException?: unknown
    ): BluetoothException {
        return new this(
            { type: "FailedToDisconnect", data: [] },
            `Failed to disconnect from Bluetooth device (${peripheralId}).`,
            "warn",
            sourceException
        );
    }

    static FailedToEnableBluetooth(
        sourceException?: unknown
    ): BluetoothException {
        return new this(
            { type: "FailedToEnableBluetooth", data: [] },
            `Bluetooth is disabled, failed to enable.`,
            "error",
            sourceException
        );
    }

    static FailedToRead(
        characteristic: string,
        peripheralId: string,
        sourceException?: unknown
    ): BluetoothException {
        return new this(
            { type: "FailedToRead", data: [] },
            `Failed to read characteristic (${characteristic}) of Bluetooth device (${peripheralId}).`,
            "error",
            sourceException
        );
    }

    static FailedToWrite(
        value: string,
        characteristic: string,
        peripheralId: string,
        sourceException?: unknown
    ): BluetoothException {
        return new this(
            { type: "FailedToWrite", data: [] },
            `Failed to write (${value}) to characteristic (${characteristic}) of Bluetooth device (${peripheralId}).`,
            "error",
            sourceException
        );
    }

    static FailedToStartScan(sourceException?: unknown): BluetoothException {
        return new this(
            { type: "FailedToStartScan", data: [] },
            "Failed to start Bluetooth device scanning.",
            "error",
            sourceException
        );
    }

    static FailedToStopScan(sourceException?: unknown): BluetoothException {
        return new this(
            { type: "FailedToStopScan", data: [] },
            "Failed to stop Bluetooth device scanning.",
            "error",
            sourceException
        );
    }

    static get ScanAlreadyStarted(): BluetoothException {
        return new this(
            { type: "ScanAlreadyStarted", data: [] },
            "Bluetooth device scanning has already started.",
            "warn"
        );
    }

    static get ScanTimeout(): BluetoothException {
        return new this(
            { type: "ScanTimeout", data: [] },
            "Bluetooth device scanning has timed out.",
            "log"
        );
    }
}

export enum ScanMode {
    Opportunistic = -1,
    LowPower,
    Balanced,
    LowLatency
}

export interface Advertising {
    readonly isConnectable: boolean | undefined;
    readonly manufacturerData: Buffer;
    readonly serviceUuids: Array<string>;
    readonly serviceData: Record<string, unknown>;
    readonly txPowerLevel: number | undefined;
}

export type PeripheralId = string & { readonly _: unique symbol };

export type TaskId = string & { readonly _: unique symbol };

export interface Peripheral {
    readonly advertising: Advertising;
    readonly id: PeripheralId;
    readonly name: string;
    readonly rssi: Rssi | undefined;
}

export default interface BluetoothPort {
    cancelTask(taskId: TaskId): void;
    connect(
        peripheralId: PeripheralId,
        timeout?: Millisecond
    ): Observable<void>;
    disconnect(peripheralId: PeripheralId): Promise<void>;
    read<T>(
        peripheralId: PeripheralId,
        characteristic: ReadableCharacteristic<T>
    ): Promise<T>;
    startScan(
        serviceUuids: Array<string>,
        timeout?: Millisecond,
        scanMode?: ScanMode
    ): Observable<Peripheral>;
    stopScan(): Promise<void>;
    write<T>(
        peripheralId: PeripheralId,
        characteristic: WritableCharacteristic<T>,
        value: T,
        taskId?: TaskId
    ): Promise<void>;
}
