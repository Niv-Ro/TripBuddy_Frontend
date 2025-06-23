'use client';
import React, { useCallback, useState, useEffect } from 'react';
import axios from 'axios';
import StatsGraphs from './StatsGraphs';

const StatsModal = ({ isOpen, onClose, userId }) => {
    const [statsData, setStatsData] = useState({ posts: [], comments: [] });
    const [loadingStats, setLoadingStats] = useState(false);

    // This function fetches all necessary data from various API endpoints.
    const fetchStatsData = useCallback(async () => {
        if (!userId) return;

        setLoadingStats(true);
        // Makes multiple API calls to get all posts, then processes them client-side.
        try {
            // Fetch all user posts (including group posts) for comments analysis
            const allPostsResponse = await axios.get(`http://localhost:5000/api/posts/user/${userId}/all`);
            const allUserPosts = allPostsResponse.data;

            // Fetch all posts to get comments by this user
            const allPostsForCommentsResponse = await axios.get(`http://localhost:5000/api/posts/all`);
            const allPosts = allPostsForCommentsResponse.data;

            // Process posts data
            const postsOverTime = processPostsOverTime(allUserPosts);

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

    // A function to aggregate posts by day for statistical charting.
    const processPostsOverTime = (posts) => {

        //Initialize an empty object to act as a counter.
        // The keys will be the dates and the values will be the count.
        const dailyData = {};

        // Loop over every single post in the input array.
        posts.forEach(post => {
            // For each post, create a standardized date key in 'YYYY-MM-DD' format.
            // This ensures that all posts from the same day get the same key.
            const date = new Date(post.createdAt);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

            // checks if a key for this day already exists. If not, it initializes it to 0, then increments by 1.
            dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
        });

        //  Convert the aggregated object back into an array suitable for charting.
        return Object.entries(dailyData)
            // Transforms `[['2025-07-14', 3], ['2025-07-15', 1]]` into `[{day: '2025-07-14', count: 3}, ...]`.
            .map(([day, count]) => ({ day, count }))
            //Sorts the final array chronologically by date string.
            .sort((a, b) => a.day.localeCompare(b.day));
    };

    const processCommentsOverTime = (comments) => {
        //Initialize an empty object to act as a counter.
        // The keys will be the dates and the values will be the count.
        const dailyData = {};

        // Loop over every single comment in the input array.
        comments.forEach(comment => {
            // For each comment, create a standardized date key in 'YYYY-MM-DD' format.
            // This ensures that all comments from the same day get the same key.
            const date = new Date(comment.createdAt);
            const dayKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
            dailyData[dayKey] = (dailyData[dayKey] || 0) + 1;
        });

        //  Convert the aggregated object back into an array suitable for charting.
        return Object.entries(dailyData)
            // Transforms `[['2025-07-14', 3], ['2025-07-15', 1]]` into `[{day: '2025-07-14', count: 3}, ...]`.
            .map(([day, count]) => ({ day, count }))
            //Sorts the final array chronologically by date string.
            .sort((a, b) => a.day.localeCompare(b.day));
    };

    //Searches user comment's within all posts available
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

    // This effect triggers the data fetching only when the modal is opened.
    useEffect(() => {
        if (isOpen) {
            fetchStatsData();
        }
    }, [isOpen, fetchStatsData]);

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