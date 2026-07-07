import type { Nullable } from '../util';

export interface Department {
  id: string;
  code: string;
  name: string;
  short_name: Nullable<string>; // IDK
  cover: string;
  email: string;
  parent_id: number;
  sort: number;
  stopped: boolean;
  is_show_on_homepage: boolean;

  storage_assigned: number;
  storage_used: number;

  created_at: string; // yyyy-MM-ddThh:mm:ssZ
  created_user: { name: string };
  updated_at: string; // yyyy-MM-ddThh:mm:ssZ
  updated_user: { name: null }; // IDK
  org: TronClassApi.Organization;
}
