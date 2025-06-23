"use client";
import React from "react";

export default function ConversationListItem({ chat, isActive, onClick, onDelete, isDeleting }) {
    const { displayName, displayImageUrl, latestMessageText, isGroupChat, canDelete, id } = chat;

    return (
        <div className={`list-group-item p-0 ${isActive ? 'active' : ''}`}>
            <div className="d-flex align-items-center">
                <button
                    type="button"
                    className="btn btn-link text-start p-3 flex-grow-1 text-decoration-none border-0"
                    style={{ color: 'inherit' }}
                    onClick={onClick}
                >
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
                        <div className="ms-3">
                            <h6 className="mb-1 text-truncate">{displayName}</h6>
                            <small className="text-muted text-truncate d-block">
                                {latestMessageText}
                            </small>
                        </div>
                    </div>
                </button>
                {canDelete && (
                    <button
                        className="btn btn-outline-danger btn-sm me-2"
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(id, displayName);
                        }}
                        disabled={isDeleting}
                        title="Delete chat"
                    >
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