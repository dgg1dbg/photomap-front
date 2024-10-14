import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './EditUser.css'; // Import the CSS file if you have styles

function EditUser() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        // Fetch current user details to pre-fill the form
        const token = localStorage.getItem('token');
        axios.get('http://localhost:8080/api/user/view', {
            headers: {
                'Content-Type': 'application/json',
                'Authentication': token,
            },
        })
        .then(response => {
            const user = response.data;
            setUsername(user.username);
            setDescription(user.description || '');
        })
        .catch(err => {
            setError('Failed to fetch user details.');
            console.error(err);
        });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        const token = localStorage.getItem('token');

        axios.put('http://localhost:8080/api/user/edit', {
            username,
            password,
            description,
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Authentication': token,
            },
        })
        .then(response => {
            setSuccess('Profile updated successfully!');
            setError('');
            navigate('/user/' + username);
            // Optionally redirect to profile page or another page
            // navigate(`/user/${username}`);
        })
        .catch(err => {
            setError('Failed to update profile.');
            console.error(err);
        });
    };

    return (
        <div className="edit-user-container">
            <h2>Edit Profile</h2>
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="username">Username</label>
                    <input
                        type="text"
                        id="username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                </div>
                <button type="submit">Save Changes</button>
            </form>
        </div>
    );
}

export default EditUser;