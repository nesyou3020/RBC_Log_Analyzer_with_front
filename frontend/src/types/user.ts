export type UserRole = 'validator' | 'engineer';

export type UserPublic = {
  user_id: string;
  username: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  last_login: string | null;
};

export type LoginResponse = {
  token: string;
  user_id: string;
  username: string;
  role: UserRole;
};

export type CreateUserRequest = {
  username: string;
  password: string;
  role: UserRole;
};
