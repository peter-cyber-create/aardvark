import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { Role } from '@prisma/client';

// Mock users for development
const mockUsers = [
  {
    id: '1',
    username: 'admin',
    email: 'admin@example.com',
    password: '$2b$10$qc4XxBq8J/Ka75MBr3ZR8.dHgbJzJO4409/5qeYcUqCnZwg0w7Q.C', // password: admin123
    role: Role.ADMIN
  },
  {
    id: '2',
    username: 'staff',
    email: 'staff@example.com',
    password: '$2b$10$qc4XxBq8J/Ka75MBr3ZR8.dHgbJzJO4409/5qeYcUqCnZwg0w7Q.C', // password: admin123
    role: Role.STAFF
  }
];

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        username: { label: "Username", type: "text", placeholder: "Enter your username" },
        password: { label: "Password", type: "password", placeholder: "Enter your password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error('Please enter your username and password');
        }

        try {
          const user = mockUsers.find(u => u.username === credentials.username);

          if (!user) {
            throw new Error('Invalid username or password');
          }

          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

          if (!isPasswordValid) {
            throw new Error('Invalid username or password');
          }

          return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            name: user.username // required by NextAuth
          };
        } catch (error) {
          console.error('Auth error:', error);
          throw new Error('Authentication failed');
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.username = user.username;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.role = token.role as Role;
        session.user.username = token.username as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
}

