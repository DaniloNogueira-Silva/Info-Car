export class User {
  id: string;
  nickname: string;
  name: string;
  email: string;
  created_at: Date;
  updated_at: Date;
  created_by: string;

  constructor(partial?: Partial<User>) {
    Object.assign(this, partial);
  }
}
