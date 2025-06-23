"use client";
import React from 'react';
import PostCard from '../post/PostCard';

export default function GroupFeed({
                                      posts,
                                      isMember,
                                      isJoining,
                                      onNewPost,
                                      onJoin,
                                      currentUserMongoId,
                                      onUpdatePost,
                                      onDeletePost,
                                      onNavigateToProfile
                                  }) {
    return (
        <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Group Feed</h4>
                {isMember ? (
                    <button className="btn btn-primary" onClick={onNewPost}>+ New Post</button>
                ) : (
                    <button className="btn btn-success" onClick={onJoin} disabled={isJoining}>
                        {isJoining ? "Joining..." : "Join Group"}
                    </button>
                )}
            </div>
            <hr />
            {posts.length > 0 ? (
                posts.map(post =>
                    <PostCard
                        key={post._id}
                        post={post}
                        currentUserMongoId={currentUserMongoId}
                        onUpdate={onUpdatePost}
                        onDelete={onDeletePost}
                        onNavigateToProfile={onNavigateToProfile}
                    />
                )
            ) : (
                <div className="text-center p-4 bg-light rounded">
                    <p className="text-muted mb-0">No posts in this group yet.</p>
                </div>
            )}
        </div>
    );
}