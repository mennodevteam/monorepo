import { Route } from "@angular/router";
import { DetailsComponent } from "./details/details.component";

export const ordersRoutes: Route[] = [
  {path: ':id', component: DetailsComponent}
]