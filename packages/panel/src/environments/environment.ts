// This file can be replaced during build by using the `fileReplacements` array.
// `ng build` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  // apiUrl: 'https://menno-backend.iran.liara.run/api',
  apiUrl: 'http://localhost:3000',
  localStorageUserKey: 'mennoPanelUser',
  appDomain: 'localhost:4300',
  localPrintServiceUrl: 'http://127.0.0.1:5072/',
  bucketUrl: 'https://menno.storage.iran.liara.space',
  printerZipUrl: 'https://menno.storage.iran.liara.space/assets/menno-pro-printer%201.1.0.zip',
  netFrameworkUrl: 'https://dl2.soft98.ir/soft/n/NET.Framework.4.7.2.rar',
  alopeykBaseUrl: 'https://api.alopeyk.com/api/v2',
  updateDocLink: 'https://docs.google.com/document/d/1mZ5SwfnZIlxR7HeOdMwpPXCi_Dln_wGaQdf4hShSELE/edit?usp=sharing',
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/plugins/zone-error';  // Included with Angular CLI.
