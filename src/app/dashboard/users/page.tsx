import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
// import CreateUserForm from '@/components/CreateUserForm';
import UserManagement from '@/components/UserManagement';
// Update the import path if the file is located elsewhere, for example:
// import CreateUserForm from '../../components/CreateUserForm';
// Or, if the file does not exist, create 'src/components/CreateUserForm.tsx' with a basic component:

// Example CreateUserForm.tsx:
// import React from 'react';
// export default function CreateUserForm() {
//   return <form>{/* form fields here */}</form>;
// }

export default async function UsersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="p-6 space-y-6">
      <UserManagement />
    </div>
  );
}
