'use client';
import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import StatsGraphs from './StatsGraphs';

const StatsModal = ({ isOpen, onClose, userId, isOwnProfile }) => {
    const [statsData, setStatsData] = useState({ posts: [], comments: [] });
    const [loadingStats, setLoadingStats] = useState(false);

    const fetchStatsData = useCallback(async () => {
        if (!userId) return;

        setLoadingStats(true);
        try {
            // Fetch all user posts (including group posts) for comments analysis
            const allPostsResponse = await axios.get(`http://localhost:5000/api/posts/user/${userId}/all`);
            const allUserPosts = allPostsResponse.data;

            // Fetch all posts to get comments by this user
            const allPostsForCommentsResponse = await axios.get(`http://localhost:5000/api/posts/all`);
            const allPosts = allPostsForCommentsResponse.data;

            // Process posts data (only posts with group: null)
            const postsWithNullGroup = allUserPosts.filter(post => post.group === null);
            const postsOverTime = processPostsOverTime(postsWithNullGroup);

            // Process comments data
            const userComments = extractUserComments(allPosts, userId);
            const commentsOverTime = processCommentsOverTime(userComments);

            setStatsData({
                posts: postsOverTime,
                comments: commentsOverTime
            });
        } catch (error) {
            console.error('Error fetching stats data:', error);
            setStatsData({ posts: [], comments: [] });
        } finally {
            setLoadingStats(false);
        }
    }, [userId]);

    const processPostsOverTime = (posts) => {
        const dailyData = {};

        posts.forEach(post => {
            const date = new Date(post.createdAt);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
        });

        return Object.entries(dailyData)
            .map(([day, count]) => ({ day, count }))
            .sort((a, b) => a.day.localeCompare(b.day));
    };

    const processCommentsOverTime = (comments) => {
        const dailyData = {};

        comments.forEach(comment => {
            const date = new Date(comment.createdAt);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
        });

        return Object.entries(dailyData)
            .map(([day, count]) => ({ day, count }))
            .sort((a, b) => a.day.localeCompare(b.day));
    };

    const extractUserComments = (allPosts, userId) => {
        const userComments = [];

        allPosts.forEach(post => {
            if (post.comments && Array.isArray(post.comments)) {
                post.comments.forEach(comment => {
                    if (comment.author && comment.author._id === userId) {
                        userComments.push(comment);
                    }
                });
            }
        });

        return userComments;
    };

    useEffect(() => {
        if (isOpen && isOwnProfile) {
            fetchStatsData();
        }
    }, [isOpen, isOwnProfile, fetchStatsData]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999
        }}>
            <div className="modal-content" style={{
                maxWidth: '95vw',
                width: '1200px',
                maxHeight: '90vh',
                overflow: 'auto',
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '20px',
                position: 'relative'
            }}>
                <button
                    className="modal-close-btn"
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '10px',
                        right: '15px',
                        background: 'none',
                        border: 'none',
                        fontSize: '24px',
                        cursor: 'pointer',
                        color: '#666'
                    }}
                >
                    &times;
                </button>
                <h5 className="mb-4">📊 User Statistics</h5>

                <StatsGraphs statsData={statsData} loadingStats={loadingStats} />
            </div>
        </div>
    );
};

export default StatsModal;