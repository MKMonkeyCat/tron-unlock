export type ActivityType = 'online_video' | (string & {});

export interface Activities {
  id: number;
  course_id: number;
  module_id: number;
  announce_answer_and_explanation: boolean;
  completion_criterion: string; // e.g. "需累積觀看 80%(含)以上"
  completion_criterion_key: 'completeness'; // IDK if there are other keys
  completion_criterion_value: `${number}`; // percentage string, e.g. '80'

  data: {
    ai_generate_contents: boolean;
    allow_download: boolean;
    allow_forward_seeking: boolean;
    description: string;
    pause_when_leaving_window: boolean;
    publish_count: number;
    publish_time: '2026-05-16T05:27:00Z';
    teaching_method: 0; // IDK what this means
    week: number;
  };

  enable_edit: boolean;
  end_time: null; // IDK
  imported_from: null; // IDK
  is_in_progress: boolean;
  is_transfer_arrears: boolean;
  prerequisites: {
    activity_id: number;
    activity_type: ActivityType; // IDK if there are other types
    completion_criterion: {
      completion_info: string;
      completion_key: 'completed'; // IDK if there are other keys
      completion_value: number;
      criterion_key: 'online_video.completeness' | (string & {}); // IDK if there are other keys
      criterion_text: string;
      criterion_value: number;
      has_completed: boolean;
      is_in_progress: boolean;
      published: boolean;
    };
    key: string;
    title: string;
  }[];
  published: boolean;
  sort: 3;
  start_time: null;
  submit_times: 1;
  syllabus_id: 10973;
  teaching_model: 'online';
  title: string;
  type: ActivityType;
  uploads: [
    {
      id: number;
      allow_download: boolean;
      audio: null; // IDK
      caption_permission: { create: boolean; upload: boolean };
      caption_translate_permission: 'false'; // IDK
      chapter_permission: { management: boolean; view: boolean };
      deleted: boolean;
      key: string; // TODO check is sha or not
      link: null; // IDK
      name: string;
      origin_allow_download: boolean;
      owner_id: number;
      reference_id: number;
      size: number;
      source: string;
      status: 'ready';
      third_part_referrer_id: number;
      topic_permission: {
        manage: []; // IDK
        view: ('published' | (string & {}))[]; // IDK if there are other statuses
      };
      type: 'video' | (string & {}); // IDK if there are other types
      video_src_type: 'video/mp4' | (string & {}); // IDK if there are other types
      videos: {
        id: number;
        duration: number;
        resolution: 'QVGA' | 'VGA' | 'HD'; // IDK if there are other resolutions
      }[];
    },
  ];
  using_phase: 'unspecified' | (string & {}); // IDK if there are other phases
}
