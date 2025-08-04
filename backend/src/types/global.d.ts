// Type declarations for packages without official types

declare module 'mongoose-sanitize' {
  interface SanitizeOptions {
    replaceWith?: string;
    onSanitize?: (payload: { key: string; value: any }) => void;
  }
  
  function mongooseSanitize(options?: SanitizeOptions): (req: any, res: any, next: any) => void;
  export = mongooseSanitize;
}
