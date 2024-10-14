import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import "./User.css"; // Import the CSS file

function Post({ post, onDelete, isOwner }) {
    const navigate = useNavigate();
    return (
        <div className="post-card">
            <div>
                <b>{post.name}</b> <span>{post.date}</span>
            </div>
            <div>
                <button onClick={() => navigate("/post/" + post.id)}>View</button>
                {isOwner && (
                    <>
                        <button onClick={() => navigate("/post/edit/" + post.id)}>Edit</button>
                        <button className="delete-button" onClick={() => onDelete(post.id)}>
                            Delete
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

function User() {
    const { username } = useParams();
    const navigate = useNavigate(); // Add useNavigate hook
    const [user, setUser] = useState({
        username: "",
        email: "",
        description: "",
        posts: [],
    });

    const [loggedInUsername, setLoggedInUsername] = useState("");

    const { email, description, posts } = user;

    useEffect(() => {
        const token = localStorage.getItem("token");

        axios({
            method: "get",
            url: "http://localhost:8080/api/user/view", // Assuming this API endpoint returns logged-in user's profile info
            headers: {
                "Content-Type": "application/json",
                Authentication: token,
            },
        })
        .then((res) => {
            setLoggedInUsername(res.data.username); // Save logged-in user's username
        })
        .catch((err) => {
            console.log(err);
        });

        axios({
            method: "get",
            url: "http://localhost:8080/api/user/view/" + username,
            headers: {
                "Content-Type": "application/json",
                Authentication: token,
            },
        })
        .then((res) => {
            setUser({
                username: res.data.username,
                email: res.data.email,
                description: res.data.description,
                posts: res.data.posts,
            });
        })
        .catch((err) => {
            console.log(err);
        });
    }, [username]);

    const deletePost = (id) => {
        const token = localStorage.getItem("token");
        axios({
            method: "delete",
            url: "http://localhost:8080/api/post/" + id.toString(),
            headers: {
                "Content-Type": "application/json",
                Authentication: token,
            },
        })
        .then((res) => {
            setUser((prev) => ({
                ...prev,
                posts: prev.posts.filter((post) => post.id !== id),
            }));
            console.log(res);
        })
        .catch((err) => {
            console.log(err);
        });
    };

    const isOwner = loggedInUsername === username;

    return (
        <div className="user-container">
            <ul className="user-info">
                <li>Username: {username}</li>
                <li>Email: {email}</li>
                <li>Description: {description}</li>
            </ul>
            {isOwner && (
                <button className="edit-profile-button" onClick={() => navigate('/user/edit')}>
                    Edit Profile
                </button>
            )}
            <div className="posts-container">
                {posts.map((post) => (
                    <Post post={post} key={post.id} onDelete={deletePost} isOwner={isOwner} />
                ))}
            </div>
        </div>
    );
}

export default User;