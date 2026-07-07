import * as DepartmentModels from './model';

declare global {
  namespace TronClassApi {
    export import Department = DepartmentModels;
    export type Department = DepartmentModels.Department;

    export interface Endpoints {}
  }
}

export type * from './model';
