import { Role } from "./role.enum";

export class AuthPayload {
    id: string;
    username?: string;
    mobilePhone?: string;
    shopId?: string;
    role: Role;
}