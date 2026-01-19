declare module "cors";
declare module "multer";
declare module "png-chunk-text";
declare module "png-chunks-encode";
declare module "png-chunks-extract";

declare module "express-serve-static-core" {
  interface Request {
    file?: any;
  }
}
