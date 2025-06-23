"use client";
import React from 'react';
import PostCard from '@/components/post/PostCard';

export default function UserPostFeed({
                                         posts,
                                         profileName,
                                         currentUserMongoId,
                                         onUpdatePost,
                                         onDeletePost,
                                         onNavigateToProfile
                                     }) {
    return (
        <div className="p-4">
            <h3 className="mb-3">Posts by {profileName}</h3>
            {posts.map(post => (
                <PostCard
                    key={post._id}
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