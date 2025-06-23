"use client";
import React from 'react';
import PostCard from '../post/PostCard';

export default function GroupFeed({
                                      posts, isMember, isJoining, onNewPost, onJoin,
                                      currentUserMongoId, onUpdatePost, onDeletePost, onNavigateToProfile
                                  }) {
    return (
        <div>
            {/* The header section of the feed. */}
            <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Group Feed</h4>

                {/* Conditionally renders the main action button. */}
                {isMember ? (
                    // If the user is a member, show the "New Post" button.
                    <button className="btn btn-primary" onClick={onNewPost}>+ New Post</button>
                ) : (
                    // If the user is not a member, show the "Join Group" button.
                    <button className="btn btn-success" onClick={onJoin} disabled={isJoining}>
                        {isJoining ? "Joining..." : "Join Group"}
                    </button>
                )}
            </div>
            <hr />

            {/* Renders the list of posts if the array is not empty. */}
            {posts.length > 0 ? (
                // Maps over the posts array and renders a PostCard for each one, passing down necessary props.
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
                // If there are no posts, displays a placeholder message.
                <div className="text-center p-4 bg-light rounded">
                    <p className="text-muted mb-0">No posts in this group yet.</p>
                </div>
            )}
        </div>
    );
}