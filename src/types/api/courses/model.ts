import type { Nullable } from '../util';

export interface CourseAttributes {
  data: Record<string, any>;
  practice_hours: Nullable<number>;
  student_count: number;
  teaching_class_name: Nullable<string>;
}

export interface Grade {
  id: string;
  name: string;
}

export interface Klass {
  id: string;
  name: string;
}

export interface Instructor {
  id: number;
  user_no: string;
  email: string;
  avatar_big_url: string;
  avatar_small_url: string;
  name: string;
  portfolio_url: string;
}

export interface CourseFullModel {
  id: number;
  name: string;
  display_name: string;
  second_name: Nullable<string>;
  course_code: string; // _uuid_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  subject_code: Nullable<string>;
  cover: string;

  academic_year: null; // IDK
  semester: null; // IDK
  start_date: string; // yyyy-MM-dd
  end_date: string; // yyyy-MM-dd
  classroom_schedule: string;

  course_type: 1; // IDK if there are other types
  credit: null; // IDK
  credit_state: null; // IDK
  compulsory: Nullable<boolean>; // IDK
  audit_status: 'agree' | 'pending' | 'reject' | (string & {});
  public_scope: 'private' | 'public' | (string & {});
  learning_mode: 'checkpoint' | (string & {});
  teaching_mode: 'traditional' | (string & {});
  is_blocked: Nullable<boolean>;
  imported_from: Nullable<string>;

  students_count: number;

  score_published: boolean;
  syllabus_enabled: boolean;
  has_ai_ability: boolean;
  allow_admin_update_basic_info: boolean;
  allow_update_basic_info: boolean;
  allowed_to_invite_assistant: boolean;
  allowed_to_invite_student: boolean;
  allowed_to_join_course: boolean;

  created_user: { id: number; name: string };

  course_outline: {
    id: number;
    is_closed: boolean;
    status: 'empty'; // IDK if there are other statuses
    end_date: null; // IDK
    external_url: null; // IDK
    comment_chinese: {
      id: 0;
      key: null;
      title: null;
      description: null;
      uploads: null;
    };
    common_fields: { key: string; title: string; description: string }[];
    custom_fields: {}[]; // IDK
  };
  course_attributes: CourseAttributes;
  department: Nullable<TronClassApi.Department>;
  grade: Nullable<Grade>;
  klass: Nullable<Klass>;
  instructors: Instructor[];
  org: TronClassApi.Organization;
}
