"use client";
import React from 'react';
import PostCard from '@/components/post/PostCard';

// A presentational component responsible for rendering a list of posts for a specific user.
export default function UserPostFeed({
                                         posts,               // An array of post objects to display.
                                         profileName,         // The name of the profile owner, for the header.
                                         currentUserMongoId,  // The ID of the logged-in user, passed down to PostCard.
                                         onUpdatePost,        // Callback function to handle post updates.
                                         onDeletePost,        // Callback function to handle post deletions.
                                         onNavigateToProfile  // Callback function for navigation.
                                     }) {
    return (
        <div className="p-4">
            <h3 className="mb-3">Posts by {profileName}</h3>
            {/* Maps over the posts array and renders a PostCard for each post. */}
            {posts.map(post => (
                <PostCard
                    key={post._id} // A unique key is essential for list rendering in React
                    post={post}
                    currentUserMongoId={currentUserMongoId}
                    onUpdate={onUpdatePost}
                    onDelete={onDeletePost}
                    onNavigateToProfile={onNavigateToProfile}
                />
            ))}
        </div>
    );
}