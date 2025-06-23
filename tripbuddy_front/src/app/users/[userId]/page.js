// src/app/users/[userId]/page.js
'use client';
import ProfilePage from '@/components/profile/ProfilePage';
import { useParams } from 'next/navigation';

export default function UserProfileWrapperPage() {
    const params = useParams();
    const userId = params?.userId;

    if (!userId) {
        return <div>User not found.</div>;
    }

    return <ProfilePage userId={userId} />;
}