'use client';
import React, { useState } from 'react';
import axios from 'axios';
import { storage } from '@/services/fireBase'; // ודא שיש לך ייצוא של storage
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from '@/context/AuthContext'; // כדי לדעת מי המשתמש

export default function CreatePost({onPostCreated}) {
    const { user } = useAuth();
    const [text, setText] = useState('');
    const [files, setFiles] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        if (e.target.files.length > 10) {
            setError('You can select up to 10 files.');
            return;
        }
        setFiles(Array.from(e.target.files));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text || files.length === 0 || !user) {
            setError('Please fill in text and select at least one file.');
            return;
        }

        setIsUploading(true);
        setError('');

        try {
            // העלאת כל הקבצים ל-Firebase Storage
            const uploadPromises = files.map(file => {
                const storageRef = ref(storage, `posts/${user.uid}/${Date.now()}_${file.name}`);
                return uploadBytes(storageRef, file).then(snapshot =>
                    getDownloadURL(snapshot.ref).then(url => ({
                        url: url,
                        type: file.type, // 🔥 שומרים את סוג הקובץ מהקובץ המקורי
                        path: filePath
                    }))
                );
            });

            const mediaData = await Promise.all(uploadPromises);

            // שליחת המידע לשרת שלנו
            const postData = {
                authorId: user.uid,
                text,
                media: mediaData, // 🔥 שולחים את המערך החדש
                taggedCountries: [],
            };

            await axios.post('http://localhost:5000/api/posts', postData);

            // איפוס הטופס
            setText('');
            setFiles([]);
            setIsUploading(false);
            alert('Post created successfully!');
            // כאן תוכל להפעיל פונקציה שמרעננת את הפיד
            if(onPostCreated){
                onPostCreated();
            }
        } catch (err) {
            // console.error('Error creating post:', err);
            // setError('Failed to create post.');
            // setIsUploading(false);
            console.error('Error creating post:', err.response ? err.response.data : err.message);
            setError('Failed to create post. See console for details.');
            setIsUploading(false);
        }
    };

    return (
        <div className="card p-3 mb-4 shadow-sm">
            <h5 className="card-title">Create a new post</h5>
            <form onSubmit={handleSubmit}>
                <textarea
                    className="form-control mb-2"
                    rows="3"
                    placeholder="What's on your mind?"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    required
                ></textarea>
                <input
                    type="file"
                    className="form-control mb-2"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                />
                <button type="submit" className="btn btn-primary" disabled={isUploading}>
                    {isUploading ? 'Posting...' : 'Post'}
                </button>
                {error && <p className="text-danger mt-2">{error}</p>}
                {files.length > 0 && <p className="text-muted mt-2">{files.length} files selected.</p>}
            </form>
        </div>
    );
}