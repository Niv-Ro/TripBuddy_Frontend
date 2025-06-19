"use client";
import React from "react";


function NewChat() {
    return (
        <div className="flex flex-col items-center justify-center p-5 text-center">

            <div className="w-full max-w-md">
                <h2 className="text-3xl font-bold text-slate-800">
                    Start a New Chat
                </h2>
                <p className="text-base text-slate-500">
                    Search users or groups to begin a conversation with
                </p>
                <div className="mt-8 flex flex-col gap-4 ">
                    <input
                        className="form-control w-100 mx-auto"
                        type="text"
                        placeholder="Search users..."
                    />
                    <button className="btn btn-primary" type="button">
                        Create Chat
                    </button>
                </div>
            </div>

        </div>
    );
}

export default NewChat;