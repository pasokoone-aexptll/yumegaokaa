export type Member = {
  account_id: string;
  display_name: string;
  active: boolean;
  withdrawn_at: string | null;
  chat_restricted_until: string | null;
  weekly_limit: number;
  invite_paused: boolean;
};
