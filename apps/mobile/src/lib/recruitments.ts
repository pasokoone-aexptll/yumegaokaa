export type Recruitment = {
  id: string;
  title: string;
  longitude: number;
  latitude: number;
  expires_at: string;
  revision: number;
  mine: boolean;
  author_id: string;
  icon_path: string | null;
  icon_until: string;
  display_name: string;
};
