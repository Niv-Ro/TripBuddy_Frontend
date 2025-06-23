"use client";
import React from "react";

// isActive - boolean indicating if this chat is currently selected/open
// onClick - function called when user clicks to open this chat
// boolean showing if this chat is currently being deleted
export default function ConversationListItem({ chat, isActive, onClick, onDelete, isDeleting }) {
    const { displayName, displayImageUrl, latestMessageText, isGroupChat, canDelete, id } = chat;
    // displayName - name to show (group name or other person's name)
    // canDelete - whether user can delete this chat
    // id - unique identifier for this chat
    return (
        //active class - highlights the currently selected chat with blue background
        <div className={`list-group-item p-0 ${isActive ? 'active' : ''}`}>
            <div className="d-flex align-items-center">
                <button
                    type="button"
                    className="btn btn-link text-start p-3 flex-grow-1 text-decoration-none border-0"
                    style={{ color: 'inherit' }}
                    onClick={onClick}
                >
                    {/*if its group the group emoji will be shown, else the other users profile picture*/}
                    <div className="d-flex align-items-center">
                        {isGroupChat ? (
                            <div className="chat-avatar bg-secondary text-white">👥</div>
                        ) : (
                            <img
                                src={displayImageUrl}
                                alt={displayName}
                                className="chat-avatar"
                            />
                        )}
                        {/*will show below the name of the chat, its last message*/}
                        <div className="ms-3">
                            <h6 className="mb-1 text-truncate">{displayName}</h6>
                            <small className="text-muted text-truncate d-block">
                                {latestMessageText}
                            </small>
                        </div>
                    </div>
                </button>
                {/*only when 1 on 1 chats can be deleted*/}
                {canDelete && (
                    <button
                        //e.stopPropagation() - prevents chat from being selected when delete is clicked
                        className="btn btn-outline-danger btn-sm me-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id, displayName);
                        }}
                        disabled={isDeleting}
                        title="Delete chat"
                    >
                        {/*if in deleting process show spinner(loading)
                        else show the "X"*/}
                        {isDeleting ? (
                            <span className="spinner-border spinner-border-sm"></span>
                        ) : (
                            <i>X</i>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}