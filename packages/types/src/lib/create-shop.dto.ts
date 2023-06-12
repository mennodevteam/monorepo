import { Plugin } from "./plugin.enum";

export class CreateShopDto {
  firstName: string;
  lastName: string;
  title: string;
  username: string;
  loginUsername: string;
  loginPassword: string;
  pluginDescription?: string;
  plugins: Plugin[];
  expiredAt: Date;
  regionId: string;
  regionTitle: string;
  mobilePhone: string;
  otp?: string;
}
