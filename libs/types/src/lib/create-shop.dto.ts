import { Plugin } from "./plugin.enum";
import { BusinessCategory } from "./shop";

export class CreateShopDto {
  firstName: string;
  lastName: string;
  title: string;
  businessCategory: BusinessCategory;
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
