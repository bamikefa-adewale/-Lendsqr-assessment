export interface UserRow {
  id: string;
  email: string;
  phone_number: string;
  first_name: string;
  last_name: string;
  password_hash: string;
  is_blacklisted: boolean;
  created_at: Date;
  updated_at: Date;
}
