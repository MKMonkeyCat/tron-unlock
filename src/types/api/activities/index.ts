import * as ActivitiesModels from './model';

declare global {
  namespace TronClassApi {
    export import Activities = ActivitiesModels;
    export type Activities = ActivitiesModels.Activities;

    export interface Endpoints {
      'GET /api/activities/:id': {
        query: { sub_course_id?: number };
        body: never;
        response: TronClassApi.Activities;
      };
    }
  }
}

export type * from './model';
