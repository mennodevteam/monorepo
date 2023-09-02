import { HttpStatusCode } from "@angular/common/http";

export class ApiError extends Error {
  status: HttpStatusCode;
}