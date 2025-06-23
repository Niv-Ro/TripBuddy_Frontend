"use client";
import React from "react";
import ConversationListItem from "./ConversationListItem";

export default function ChatSidebar({
                                        isLoading,
                                        conversations,
                                        activeChatId,
                                        searchTerm,
                                        onSearchTermChange, // function to update search text
                                        onNewChat, // function to start creating a new chat
                                        onFindChats, // function to browse/search for chats to join
                                        onSelectChat,
                                        onDeleteChat,
                                        isDeletingId
                                    }) {

    // When user has no chats at all it displays a message and two buttons as a placeholder
    const NoChatsPlaceholder = () => (
        <div className="p-4 text-center text-muted">
            <i className="bi bi-chat-dots display-6 d-block mb-2"></i>
            <p className="mb-2">No chats yet</p>
            <div className="d-flex flex-column gap-2">
                <button className="btn btn-primary btn-sm" onClick={onNewChat}>
                    Start New Chat
                </button>
                <button className="btn btn-outline-primary btn-sm" onClick={onFindChats}>
                    Find Chats
                </button>
            </div>
        </div>
    );

    // When user searches but no existing chats match it displays a message and also a button
    // find  chats in order to search the chat not in your chats(search a chat in find chat)
    const NoSearchResultsPlaceholder = () => (
        <div className="p-4 text-center text-muted">
            <i className="bi bi-search display-6 d-block mb-2"></i>
            <p className="mb-2">No chats found</p>
            <button className="btn btn-outline-primary btn-sm" onClick={onFindChats}>
                Find Chats
            </button>
        </div>
    );

    return (

        <div className="border-end d-flex flex-column bg-white" style={{ width: '350px', flexShrink: 0 }}>
            {/* Header Section*/}
            <div className="p-3 border-bottom d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Chats</h4>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-outline-primary btn-sm"
                        onClick={onFindChats}
                        title="Find and join new chats"
                    >
                        <i className="bi bi-search me-1"></i>
                        Find Chats
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={onNewChat}>
                        + New
                    </button>
                </div>
            </div>
            {/* Search Bar Section*/}
            <div className="p-3 border-bottom">
                <input
                    type="text"
                    className="form-control"
                    placeholder="Search your chats..."
                    value={searchTerm}
                    onChange={(e) => onSearchTermChange(e.target.value)}
                />
            </div>
            {/* Chat List Section*/}
            <div className="flex-grow-1 overflow-auto">
                {isLoading ? <p className="p-3 text-muted">Loading...</p> : (
                    <>
                        {/* checks if the conversation list is empty */}
                        {conversations.length === 0 ? (
                            //checks if the search term is empty and if so display the no search result placeholder
                            //and if not display the no chat placeholder
                            searchTerm ? <NoSearchResultsPlaceholder /> : <NoChatsPlaceholder />
                        ) : (
                            //if it has conversations
                            <div className="list-group list-group-flush">
                                {conversations.map(chat => (
                                    <ConversationListItem
                                        key={chat.id}
                                        chat={chat}
                                        isActive={activeChatId === chat.id}
                                        onClick={() => onSelectChat(chat.originalChat)}
                                        onDelete={onDeleteChat}
                                        isDeleting={isDeletingId === chat.id}
                                    />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}