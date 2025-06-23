"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from 'axios';
// נצטרך רכיבים נפרדים להצגת כל סוג צ'אט
// import PrivateChatWindow from "./PrivateChatWindow";
// import GroupChatWindow from "./GroupChatWindow";

export default function Chats() {
    const { mongoUser } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ State דינמי שיגיע מהשרת
    const [conversations, setConversations] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // ✅ State שינהל איזה צ'אט פעיל כרגע
    const [activeChat, setActiveChat] = useState(null); // למשל: { id: '...', name: '...', type: 'group' }

    useEffect(() => {
        // ✅ השרת יצטרך לספק נקודת קצה שמאחדת את כל השיחות של המשתמש
        // (גם פרטיות וגם קבוצתיות)
        if (mongoUser) {
            axios.get(`/api/chats/my-conversations`)
                .then(res => {
                    setConversations(res.data);
                    setIsLoading(false);
                })
                .catch(err => console.error("Failed to fetch conversations", err));
        }
    }, [mongoUser]);

    const filteredConversations = conversations.filter(chat =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // אם לא נבחר צ'אט, הצג את רשימת השיחות
    if (!activeChat) {
        return (
            <div className="d-flex flex-column" style={{ height: '100vh' }}>
                <nav className="bg-white border-bottom shadow-sm p-3 d-flex align-items-center">
                    <h2 className="me-4 mb-0">Chats</h2>
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="form-control w-50 mx-auto"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    {/* אפשר להוסיף כאן כפתור ליצירת צ'אט חדש */}
                </nav>

                <div className="flex-grow-1 overflow-y-auto p-4">
                    {isLoading ? <p>Loading chats...</p> : (
                        <div className="list-group">
                            {filteredConversations.map((chat) => (
                                <button
                                    key={chat.id} // ה-ID יכול להיות ID של קבוצה או ID של משתמש אחר
                                    type="button"
                                    className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                    onClick={() => setActiveChat(chat)}
                                >
                                    <div>
                                        {chat.type === 'group' && '👥 '} {/* אייקון לקבוצה */}
                                        {chat.name}
                                    </div>
                                    {/* אפשר להוסיף כאן חיווי להודעות שלא נקראו */}
                                    <span className="badge text-bg-primary rounded-pill">3</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // אם נבחר צ'אט, הצג את חלון הצ'אט המתאים
    return (
        <div className="d-flex flex-column" style={{ height: '100vh' }}>
            {/* כאן נציג את חלון הצ'אט עצמו */}
            {/* לדוגמה: */}
            {/* {activeChat.type === 'group'
                ? <GroupChatWindow chatInfo={activeChat} onBack={() => setActiveChat(null)} />
                : <PrivateChatWindow chatInfo={activeChat} onBack={() => setActiveChat(null)} />
            } */}
            <p>
                Displaying {activeChat.type} chat with "{activeChat.name}".
                <button onClick={() => setActiveChat(null)} className="btn btn-link">Back to list</button>
            </p>
        </div>
    );
}