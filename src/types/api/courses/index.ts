import * as CourseModels from './model';
import type { FieldsToResponse } from '../util';

declare global {
  namespace TronClassApi {
    export import Courses = CourseModels;

    export interface Endpoints<
      QueryParams extends Record<string, string> = any,
    > {
      'GET /api/courses/:id': {
        query: { fields: string };
        body: never;
        response: FieldsToResponse<
          QueryParams['fields'],
          TronClassApi.Courses.CourseFullModel
        >;
      };
      'GET /api/courses/:id/modules': {
        response: {
          modules: {
            id: number;
            imported_from: null; // IDK
            is_hidden: 0 | 1; // Maybe ?
            name: string;
            sort: number;
            sticky_time: null; // IDK
            syllabuses: {
              comments: null; // IDK
              date: null; // IDK
              id: number;
              imported_from: null; // IDK
              module_id: number;
              objective: null; // IDK
              sort: number;
              summary: string;
              syllabus_id: number;
              teaching_type: 'face_to_face'; // IDK if there are other types
              teaching_week: null; // IDK
            }[];
          }[];
        };
      };
    }
  }
}

export type * from './model';
