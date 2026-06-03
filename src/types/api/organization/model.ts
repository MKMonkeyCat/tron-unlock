export interface Organization {
  id: number;
  code: string;
  name: string;
  raw_name: string;
  domain: string;
  type: 'university'; // IDK if there are other types
  flag: number; // IDK 0 ?
  parent_id: number;
  org_names: {}; // IDK
  copyright: null; // IDK
  current_org_plan_id: number;

  enable_external_domain: boolean;
  external_domain: null; // IDK
  filing_number: null; // IDK
  show_logo: boolean;
  show_name: boolean;
  sub_domain: null; // IDK

  is_enterprise_or_organization: boolean;
  is_transfer_arrears: boolean;
  storage_assigned: number;
  storage_total: number;
  unspecified_storage_assigned: number;
  unspecified_storage_used: number;

  service_window_name: null; // IDK
  service_window_phone: null; // IDK
}
