import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signin() {
    const [inputs, setInput] = useState({
        email: "",
        password: "",
    });

    const [errorMessage, setErrorMessage] = useState(""); // State for handling error messages
    const [showErrorPopup, setShowErrorPopup] = useState(false); // State for showing error popup

    const { email, password } = inputs;
    const navigate = useNavigate(); // Initialize the navigate function

    const onChange = (e) => {
        setInput({ ...inputs, [e.target.name]: e.target.value });
    };

    const onClick = () => {
        axios({
            method: 'post',
            url: "http://localhost:8080/api/user/signin", // Update this URL to match your API endpoint
            headers: { 'Content-Type': 'application/json' },
            data: {
                email: email,
                password: password,
            }
        })
        .then((res) => {
            localStorage.setItem("token", res.headers['authentication']); // Assuming the token is returned in res.data.token
            navigate("/"); // Redirect to the home page after successful signin
        })
        .catch((err) => {
            console.error(err); // Log the error for debugging

            let message = "An error occurred. Please try again."; // Default error message

            if (err.response && err.response.data) {
                try {
                    const errorData = JSON.parse(err.response.data); // Parse the JSON string
                    message = errorData.detail || errorData.errorMessage || message; // Use specific error message if available
                } catch (parseError) {
                    console.error("Error parsing response data:", parseError);
                }
            }

            setErrorMessage(message); // Set the error message to display
            setShowErrorPopup(true); // Show the error popup
            setInput({ // Reset the form inputs
                email: "",
                password: "",
            });
        });
    };

    const closeErrorPopup = () => {
        setShowErrorPopup(false); // Close the error popup
    };

    return (
        <>
            <input 
                type="email" 
                name="email" 
                value={email} 
                onChange={onChange} 
                placeholder="Email"
            />
            <input 
                type="password" 
                name="password" 
                value={password} 
                onChange={onChange} 
                placeholder="Password"
            />
            <button onClick={onClick}>Sign In</button>

            {showErrorPopup && ( // Render the error popup conditionally
                <div className="error-popup">
                    <div className="error-message">
                        {errorMessage}
                        <button onClick={closeErrorPopup}>Close</button>
                    </div>
                </div>
            )}
        </>
    );
}

export default Signin;