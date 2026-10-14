declare module "qrcode" {
  export interface QRCodeToCanvasOptions {
    width?: number;
    margin?: number;
    scale?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    errorCorrectionLevel?: "low" | "medium" | "quartile" | "high" | "L" | "M" | "Q" | "H";
  }

  export function toCanvas(
    canvasElement: HTMLCanvasElement,
    text: string | Array<{ data: string | Uint8Array; mode?: string }>,
    options?: QRCodeToCanvasOptions
  ): Promise<HTMLCanvasElement>;

  export function toDataURL(
    text: string,
    options?: QRCodeToCanvasOptions
  ): Promise<string>;
}
