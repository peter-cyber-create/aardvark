import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/app/api/auth/[...nextauth]/auth';
import RoomManagement from '@/components/RoomManagement';

export default async function RoomsPage() {
  const session = await getServerSession(authOptions);
  
  // Allow both STAFF and ADMIN to access this page. 
  // Role-based action restrictions are handled within the RoomManagement component.
  if (!session?.user) {
    redirect('/auth/login'); // Redirect to login if not authenticated
  }

  return (
    <div className="p-6 space-y-6">
      <RoomManagement />
    </div>
  );
}
