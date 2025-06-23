"use client";
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import axios from 'axios';
import UserSearch from '../groups/UserSearch';

// Displays individual messages as chat bubbles
function MessageBubble({ msg, isOwnMessage, onEdit, onDelete, otherUser }) {
    const [isHovered, setIsHovered] = useState(false);
    const canPerformActions = () => { //will be able to edit or delete only if it is its own message
        if (!isOwnMessage) return false;
        // You can only edit/delete your own messages within 5 minutes of sending
        const timeDiff = (new Date() - new Date(msg.createdAt)) / 60000;
        return timeDiff <= 5;
    };

    return (
        // If it's your message place your message on the right place on the screen
        <div className={`d-flex mb-2 gap-2 ${isOwnMessage ? 'justify-content-end' : 'justify-content-start'}`} onMouseEnter={() => setIsHovered(true)} onMouseLeave={() => setIsHovered(false)}>
            {!isOwnMessage && (
                //if the message is not your own put the profile picture of the other user
                <img src={msg.sender?.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'} alt={msg.sender?.fullName} className="rounded-circle" style={{width: '30px', height: '30px', objectFit: 'cover', alignSelf: 'flex-end'}}/>
            )}
            {/* If it's your message Blue background (primary theme color) with white text
             else white background with black text */}
            <div className={`p-2 rounded shadow-sm position-relative ${isOwnMessage ? 'bg-primary text-white' : 'bg-white'}`} style={{ maxWidth: '70%' }}>
                {/* shows the sender's name if not your own message and not in a 1-on-1 chat*/}
                {!isOwnMessage && !otherUser && <strong className="d-block small">{msg.sender.fullName}</strong>}
                <div className="mb-0">{msg.content}</div>
                {/* Edit/Delete dropdown appears on hover */}
                {isHovered && canPerformActions() && (
                    <div className="dropdown position-absolute" style={{top: -5, right: isOwnMessage ? 'auto' : -25, left: isOwnMessage ? -25 : 'auto'}}>
                        <button className="btn btn-sm btn-light py-0 px-1 opacity-75" type="button" data-bs-toggle="dropdown">⋮</button>
                        <ul className="dropdown-menu dropdown-menu-end">
                            <li><button className="dropdown-item" onClick={() => onEdit(msg)}>Edit</button></li>
                            <li><button className="dropdown-item text-danger" onClick={() => onDelete(msg._id)}>Delete</button></li>
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

// a modal to handle message editing
function EditMessageModal({ message, onSave, onCancel }) {
    const [text, setText] = useState(message.content);
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h5>Edit Message</h5>
                <textarea className="form-control" rows="3" value={text} onChange={e => setText(e.target.value)} autoFocus/>
                <div className="d-flex justify-content-end gap-2 mt-3">
                    <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="btn btn-primary" onClick={() => onSave(message._id, text)}>Save</button>
                </div>
            </div>
        </div>
    );
}

function ChatWindow({ chat, socket, onBack, onChatUpdate }) {
    const { mongoUser } = useAuth();
    const [messages, setMessages] = useState([]); // all message array
    const [newMessage, setNewMessage] = useState(""); // new message currently typing
    const [isLoading, setIsLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingMessage, setEditingMessage] = useState(null);
    const [isManaging, setIsManaging] = useState(false); // Controls member management panel visibility if admin or not
    const [showJoinRequest, setShowJoinRequest] = useState(false); // Controls join request modal for non-members
    const [showJoinRequests, setShowJoinRequests] = useState(false); // Controls join requests management modal for admins
    const messagesEndRef = useRef(null); // Ref for Auto-scrolling

    //Loads all existing messages when chat changes
    useEffect(() => {
        if (!chat?._id) return;
        setIsLoading(true);
        axios.get(`http://localhost:5000/api/messages/${chat._id}`)
            .then(res => setMessages(res.data))
            .catch(err => console.error("Failed to fetch messages", err))
            .finally(() => setIsLoading(false));
    }, [chat]);

    // Real-time Socket Events
    useEffect(() => {
        if (!socket || !chat?._id) return;
        //Tells server you're viewing this chat
        socket.emit('join chat', chat._id);
        //New messages - Instantly appear without refresh
        const messageReceivedHandler = (newMessage) => { if (newMessage.chat?._id === chat._id) { setMessages(prev => [...prev, newMessage]); }};
        //Message updates - Edits appear immediately
        const messageUpdatedHandler = (updatedMessage) => { if (updatedMessage.chat?._id === chat._id) { setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m)); }};
        //Message delete - message deletes immediately
        const messageDeletedHandler = (deletedMessage) => { if (deletedMessage.chatId === chat._id) { setMessages(prev => prev.filter(m => m._id !== deletedMessage.messageId)); }};

        // Listen for join request events and chat updates
        const joinRequestHandler = (updatedChat) => {
            if (updatedChat._id === chat._id) {
                onChatUpdate(updatedChat);
            }
        };
        //listeners
        socket.on('message received', messageReceivedHandler);
        socket.on('message updated', messageUpdatedHandler);
        socket.on('message deleted', messageDeletedHandler);
        socket.on('join request received', joinRequestHandler);
        socket.on('chat updated', joinRequestHandler);

        return () => {
            //clean listeners in order to create new one
            socket.off('message received', messageReceivedHandler);
            socket.off('message updated', messageUpdatedHandler);
            socket.off('message deleted', messageDeletedHandler);
            socket.off('join request received', joinRequestHandler);
            socket.off('chat updated', joinRequestHandler);
        };
    }, [chat?._id, socket, onChatUpdate]);

    //Automatic scrolling, Smoothly scrolls to the bottom to show the newest message
    useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, searchTerm]);

    const sendMessage = async (e) => {
        //prevents page to refresh
        e.preventDefault();
        //Check message isn't empty and user/socket exist
        if (newMessage.trim() === "" || !mongoUser || !socket) return;
        const tempId = Date.now().toString();
        const optimisticMessage = { _id: tempId, sender: { _id: mongoUser._id, fullName: mongoUser.fullName }, content: newMessage, chat: { _id: chat._id, members: chat.members }};
        //Show message immediately with temporary ID
        setMessages(prev => [...prev, optimisticMessage]);
        //Empty the message input
        setNewMessage("");
        try {
            const { data: savedMessage } = await axios.post('http://localhost:5000/api/messages', { content: newMessage, chatId: chat._id, senderId: mongoUser._id });
            //Emit to other users via Socket.IO
            socket.emit('new message', savedMessage);
            //Replace temporary message with real one from server
            setMessages(prev => prev.map(msg => msg._id === tempId ? savedMessage : msg));
        } catch (error) {
            setMessages(prev => prev.filter(msg => msg._id !== tempId));
        }
    };

    const handleUpdateMessage = async (messageId, newContent) => {
        try {
            //Update message content on server
            const { data: updatedMessage } = await axios.put(`http://localhost:5000/api/messages/${messageId}`, { content: newContent, userId: mongoUser._id });
            // Notify other users of the edit
            socket.emit('update message', updatedMessage);
            // will iterate over each message on the array and find the correct message id, then update the message in it.
            setMessages(prev => prev.map(m => m._id === updatedMessage._id ? updatedMessage : m));
            setEditingMessage(null);
        } catch(error) { alert(error.response?.data?.message || "Failed to edit message."); }
    };

    const handleDeleteMessage = async (messageId) => {
        if (!window.confirm("Delete this message?")) return;
        try {
            //Delete from server database
            await axios.delete(`http://localhost:5000/api/messages/${messageId}`, { data: { userId: mongoUser._id } });
            // Notify other users of deletion
            socket.emit('delete message', { messageId, chatId: chat._id });
            setMessages(prev => prev.filter(m => m._id !== messageId));
        } catch(error) { alert(error.response?.data?.message || "Failed to delete message."); }
    };

    // Is current user the group administrator?
    const isAdmin = useMemo(() => mongoUser?._id === chat?.admin?._id, [mongoUser, chat]);
    // Is current user a member of this chat?
    const isMember = useMemo(() => chat?.members?.some(m => m.user?._id === mongoUser?._id), [chat, mongoUser]);
    // For 1-on-1 chats, who is the other person?
    const otherUser = useMemo(() => {
        if (chat?.isGroupChat || !mongoUser || !chat?.members) return null;
        return chat.members.find(m => m.user?._id !== mongoUser._id)?.user;
    }, [chat, mongoUser]);
    // Array of all member IDs (used for excluding when adding members)
    const memberIds = useMemo(() => chat?.members.map(m => m.user._id) || [], [chat]);
    // All join requests for this group
    const joinRequests = useMemo(() => chat?.joinRequests || [], [chat]);
    // Only pending requests awaiting approval
    const pendingJoinRequests = useMemo(() => joinRequests.filter(req => req.status === 'pending'), [joinRequests]);

    // Adding Members
    const handleAddMember = async (userToAdd) => {
        try {
            // updates new member in database
            const { data: updatedChat } = await axios.put(`http://localhost:5000/api/chats/${chat._id}/add-member`, { adminId: mongoUser._id, userIdToAdd: userToAdd._id });
            onChatUpdate(updatedChat);
            setIsManaging(false);
        } catch (error) { alert(error.response?.data?.message || "Failed to add member."); }
    };

    //Removing Members
    const handleRemoveMember = async (userIdToRemove) => {
        if (!window.confirm("Are you sure?")) return;
        try {
            // updates deletion member in database
            const { data: updatedChat } = await axios.put(`http://localhost:5000/api/chats/${chat._id}/remove-member`, { adminId: mongoUser._id, userIdToRemove: userIdToRemove });
            onChatUpdate(updatedChat);
        } catch (error) { alert(error.response?.data?.message || "Failed to remove member."); }
    };

    // Leaving Chat
    const handleLeaveChat = async () => {
        if (!window.confirm("Are you sure you want to leave this group chat?")) return;
        try {
            // updates member removal in database
            await axios.put(`http://localhost:5000/api/chats/${chat._id}/leave`, { userId: mongoUser._id });
            onBack();
        } catch (error) {
            alert(error.response?.data?.message || "Failed to leave chat.");
        }
    };

    // Sending Join Request
    const handleSendJoinRequest = async (message) => {
        try {
            // adds new join request to the specific chat in the database with the information included
            const { data: updatedChat } = await axios.post(`http://localhost:5000/api/chats/${chat._id}/join-request`, {
                userId: mongoUser._id,
                message: message
            });
            onChatUpdate(updatedChat);
            setShowJoinRequest(false);
            alert("Join request sent successfully!");
        } catch (error) {
            alert(error.response?.data?.message || "Failed to send join request.");
        }
    };

    // Handling Join Request Response (only admin)
    const handleJoinRequestResponse = async (requestUserId, approve) => {
        try {
            // updates chat with the new member
            //only if the approval made by the admin
            const { data: updatedChat } = await axios.put(`http://localhost:5000/api/chats/${chat._id}/join-request-response`, {
                adminId: mongoUser._id,
                requestUserId: requestUserId,
                approve: approve
            });
            // update chat with the new information
            onChatUpdate(updatedChat);
            alert(`Join request ${approve ? 'approved' : 'rejected'} successfully!`);
        } catch (error) {
            alert(error.response?.data?.message || `Failed to ${approve ? 'approve' : 'reject'} join request.`);
        }
    };

    // Message Filtering
    // Optimized with useMemo to prevent unnecessary recalculations
    const filteredMessages = useMemo(() => {
        if (!searchTerm) return messages;
        // Case-insensitive search through message content
        return messages.filter(msg => msg.content.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [messages, searchTerm]);

    //Chat Name Helper
    const getChatName = (chat) => {
        // if the chat is a group chat, use the group name
        if (chat.isGroupChat) return chat.name;
        // else return the name of the chat
        // 1-on-1 chats show the other person's name
        return otherUser?.fullName || "Chat";
    };

    // window of request to join to a group
    // If user is not a member of the group chat and not linked to a group, show join request option
    if (chat?.isGroupChat && !chat?.linkedGroup && !isMember) {
        return (
            <div className="d-flex flex-column h-100 justify-content-center align-items-center bg-light">
                <div className="text-center p-5">
                    <div className="mb-4">
                        <div className="bg-secondary text-white rounded-circle mx-auto d-flex align-items-center justify-content-center" style={{width: '100px', height: '100px', fontSize: '3rem'}}>
                            👥
                        </div>
                    </div>
                    <h3 className="mb-3">{getChatName(chat)}</h3>
                    <p className="text-muted mb-4 lead">You are not a member of this group chat.</p>

                    <div className="d-flex gap-3 justify-content-center">
                        <button
                            className="btn btn-primary btn-lg"
                            onClick={() => setShowJoinRequest(true)}
                        >
                            <i className="bi bi-person-plus-fill me-2"></i>
                            Request to Join
                        </button>
                        <button
                            className="btn btn-outline-secondary btn-lg"
                            onClick={onBack}
                        >
                            <i className="bi bi-arrow-left me-2"></i>
                            Back to Chats
                        </button>
                    </div>
                </div>

                {/*the join request modal to send the request to join group chat*/}
                {showJoinRequest && (
                    <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                        <div className="modal-content bg-white rounded shadow" style={{maxWidth: '500px', width: '90%'}}>
                            <div className="modal-header p-3 border-bottom">
                                <h5 className="modal-title mb-0">
                                    <i className="bi bi-person-plus-fill me-2"></i>
                                    Request to Join "{getChatName(chat)}"
                                </h5>
                            </div>
                            <div className="modal-body p-3">
                                <div className="mb-3">
                                    <label className="form-label">Message (optional)</label>
                                    <textarea
                                        className="form-control"
                                        rows="4"
                                        value={showJoinRequest.message || ""}
                                        //updates the message
                                        onChange={e => setShowJoinRequest({...showJoinRequest, message: e.target.value})}
                                        placeholder="Add a message to your join request..."
                                        autoFocus
                                    />
                                    <div className="form-text">Let the admin know why you'd like to join this group.</div>
                                </div>
                            </div>
                            <div className="modal-footer p-3 border-top d-flex gap-2">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowJoinRequest(false)}
                                >
                                    <i className="bi bi-x me-1"></i>
                                    Cancel
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        // checks if It's an object (user has typed something)
                                        // if its true then: gets the message property, or empty string if message is undefined/null
                                        //if not returns empty string
                                        const message = typeof showJoinRequest === 'object' ? showJoinRequest.message || "" : "";
                                        handleSendJoinRequest(message);
                                    }}
                                >
                                    <i className="bi bi-send me-1"></i>
                                    Send Request
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }
    // chat window
    return (
        <div className="d-flex flex-column h-100">
            <div className="p-3 border-bottom bg-white">
                <div className="d-flex align-items-center gap-3 mb-2">
                    <button className="btn btn-outline-secondary btn-sm" onClick={onBack}>
                        <i className="bi bi-arrow-left"></i> Back
                    </button>
                    {otherUser ? (
                        //avatar logic
                        //1-on-1 Chat: Shows other person's profile picture
                        <img src={otherUser.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'} alt={otherUser.fullName} className="rounded-circle" style={{width: '40px', height: '40px', objectFit: 'cover'}}/>
                    ) : (
                        //Group Chat: Shows group icon (👥)
                        <div className="chat-avatar bg-secondary text-white d-flex align-items-center justify-content-center" style={{width: '40px', height: '40px', borderRadius: '50%', fontSize: '1.2rem'}}>
                            👥
                        </div>
                    )}
                    <div className="me-auto">
                        <h5 className="mb-0">{getChatName(chat)}</h5>
                        {/*if it is a group chat show the number of members*/}
                        {chat.isGroupChat && <small className="text-muted">{chat.members.length} members</small>}
                    </div>
                    {/*a box to search messages*/}
                    <input type="text" className="form-control form-control-sm" style={{width: '200px'}} placeholder="Search messages..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>

                {/* Action buttons for group chats not linked to groups */}
                {chat.isGroupChat && !chat.linkedGroup && (
                    <div className="d-flex gap-2 flex-wrap">
                        {/* Admin buttons */}
                        {isAdmin && (
                            <>
                                <button
                                    className={`btn btn-sm ${isManaging ? 'btn-primary' : 'btn-outline-primary'}`}
                                    onClick={() => setIsManaging(prev => !prev)}
                                >
                                    <i className="bi bi-people-fill"></i> {isManaging ? 'Close Manage' : 'Manage Members'}
                                </button>
                                {/* join request button,
                                Only shows if there are pending requests */}
                                {pendingJoinRequests.length > 0 && (
                                    <button
                                        className="btn btn-sm btn-warning position-relative"
                                        onClick={() => setShowJoinRequests(true)}
                                    >
                                        <i className="bi bi-person-plus-fill"></i> Join Requests
                                        {/*Badge: Red circle showing number of pending requests*/}
                                        <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                                            {pendingJoinRequests.length}
                                        </span>
                                    </button>
                                )}
                            </>
                        )}

                        {/* Leave button for non-admin members */}
                        {!isAdmin && (
                            <button className="btn btn-sm btn-outline-danger" onClick={handleLeaveChat}>
                                <i className="bi bi-box-arrow-right"></i> Leave Chat
                            </button>
                        )}

                        {/* Admin can also leave */}
                        {isAdmin && chat.members.length > 1 && (
                            <button className="btn btn-sm btn-outline-danger" onClick={handleLeaveChat}>
                                <i className="bi bi-box-arrow-right"></i> Leave & Transfer Admin
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Join Requests Management Modal */}
            {showJoinRequests && (
                <div className="modal-overlay" style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                    <div className="modal-content bg-white rounded shadow" style={{maxWidth: '600px', width: '90%', maxHeight: '80%', overflow: 'auto'}}>
                        <div className="modal-header p-3 border-bottom d-flex justify-content-between align-items-center">
                            <h5 className="modal-title mb-0">
                                <i className="bi bi-person-plus-fill me-2"></i>
                                Join Requests ({pendingJoinRequests.length})
                            </h5>
                            <button
                                type="button"
                                className="btn-close"
                                onClick={() => setShowJoinRequests(false)}
                                aria-label="Close"
                            ></button>
                        </div>
                        {/*here we check if there are any pending request and if so for each one
                        we use the user profile image, its name, the message sent with the request
                         along with date of the request and approve or reject button  */}
                        <div className="modal-body p-3">
                            {pendingJoinRequests.length === 0 ? (
                                <div className="text-center text-muted py-4">
                                    <i className="bi bi-inbox display-4 d-block mb-2"></i>
                                    No pending join requests
                                </div>
                            ) : (
                                <div className="list-group list-group-flush">
                                    {pendingJoinRequests.map(request => (
                                        <div key={request.user._id} className="list-group-item border rounded mb-2">
                                            <div className="d-flex align-items-start gap-3">
                                                <img
                                                    src={request.user.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                                    alt={request.user.fullName}
                                                    className="rounded-circle"
                                                    style={{width: '40px', height: '40px', objectFit: 'cover'}}
                                                />
                                                <div className="flex-grow-1">
                                                    <h6 className="mb-1">{request.user.fullName}</h6>
                                                    {request.message && (
                                                        <p className="mb-2 text-muted small bg-light p-2 rounded">
                                                            <i className="bi bi-chat-quote me-1"></i>
                                                            "{request.message}"
                                                        </p>
                                                    )}
                                                    <small className="text-muted">
                                                        <i className="bi bi-clock me-1"></i>
                                                        Requested {new Date(request.createdAt).toLocaleDateString()}
                                                    </small>
                                                </div>
                                                <div className="d-flex flex-column gap-2">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        onClick={() => handleJoinRequestResponse(request.user._id, true)}
                                                    >
                                                        <i className="bi bi-check-lg me-1"></i>
                                                        Approve
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-outline-danger"
                                                        onClick={() => handleJoinRequestResponse(request.user._id, false)}
                                                    >
                                                        <i className="bi bi-x-lg me-1"></i>
                                                        Reject
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Member Management Panel */}
            {isManaging && isAdmin && (
                <div className="border-bottom bg-light">
                    <div className="p-3">
                        <div className="d-flex justify-content-between align-items-center mb-3">
                            <h6 className="mb-0">
                                <i className="bi bi-people-fill me-2"></i>
                                Manage Members
                            </h6>
                            <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => setIsManaging(false)}
                            >
                                <i className="bi bi-x"></i> Close
                            </button>
                        </div>

                        {/* Add Members Section */}
                        <div className="card mb-3">
                            <div className="card-header bg-primary text-white py-2">
                                <h6 className="mb-0">
                                    <i className="bi bi-person-plus me-2"></i>
                                    Add New Members
                                </h6>
                            </div>
                            <div className="card-body">
                                {/*Excludes existing members from search results*/}
                                <UserSearch onUserSelect={handleAddMember} existingMemberIds={memberIds} displayMode="list" />
                            </div>
                        </div>

                        {/* Current Members Section */}
                        <div className="card">
                            <div className="card-header bg-info text-white py-2">
                                <h6 className="mb-0">
                                    <i className="bi bi-people me-2"></i>
                                    {/*see the number of members*/}
                                    Current Members ({chat.members.length})
                                </h6>
                            </div>
                            <div className="card-body p-0">
                                <div className="list-group list-group-flush">
                                    {/* list of all the members*/}
                                    {chat.members.map(({ user, role }) => (
                                        <div key={user._id} className="list-group-item d-flex align-items-center justify-content-between">
                                            <div className="d-flex align-items-center gap-3">
                                                <img
                                                    src={user.profileImageUrl || 'https://i.sndcdn.com/avatars-000437232558-yuo0mv-t240x240.jpg'}
                                                    alt={user.fullName}
                                                    className="rounded-circle"
                                                    style={{width: '35px', height: '35px', objectFit: 'cover'}}
                                                />
                                                <div>
                                                    <span className="fw-medium">{user.fullName}</span>
                                                    {/*the admin will be marked*/}
                                                    {chat.admin._id === user._id && (
                                                        <span className="badge bg-primary ms-2">
                                                            <i className="bi bi-star-fill me-1"></i>
                                                            Admin
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            {/*an option to remove members (except the admin but only done by admin)*/}
                                            {chat.admin._id !== user._id && (
                                                <button
                                                    className="btn btn-sm btn-outline-danger"
                                                    onClick={() => handleRemoveMember(user._id)}
                                                    title="Remove member"
                                                >
                                                    <i className="bi bi-person-dash"></i> Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/*Messages Area*/}
            <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: '#f0f2f5' }}>
                {/*will show all the filtered messages*/}
                {isLoading ? <p>Loading messages...</p> : filteredMessages.map(msg => (
                    <MessageBubble key={msg._id} msg={msg} isOwnMessage={msg.sender?._id === mongoUser?._id} onEdit={setEditingMessage} onDelete={handleDeleteMessage} otherUser={otherUser} />
                ))}
                <div ref={messagesEndRef} />
            </div>
            {/*Message Input*/}
            <form onSubmit={sendMessage} className="p-3 border-top bg-white d-flex">
                <input type="text" className="form-control" placeholder="Type a message..." value={newMessage} onChange={e => setNewMessage(e.target.value)} autoComplete="off" />
                <button className="btn btn-primary ms-2" type="submit" disabled={!newMessage.trim()}>Send</button>
            </form>
            {/*Edit Message Modal*/}
            disables the Send button when there's no meaningful text to send, preventing users from sending empty or whitespace-only messages.
            {/*disable - disables the Send button when there's no meaningful text to send, preventing users from sending empty or whitespace-only messages.*/}
            {editingMessage && <EditMessageModal message={editingMessage} onSave={handleUpdateMessage} onCancel={() => setEditingMessage(null)} />}
        </div>
    );
}

export default ChatWindow;