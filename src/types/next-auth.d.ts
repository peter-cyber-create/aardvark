import 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface User {
    id: string;
    username: string;
    email: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      username: string;
      email: string;
      role: Role;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    username: string;
    email: string;
    role: Role;
  }
}
