import * as OrganizationModels from './model';

declare global {
  namespace TronClassApi {
    export import Organization = OrganizationModels;
    export type Organization = OrganizationModels.Organization;

    export interface Endpoints {}
  }
}

export type * from './model';
