import React, {useState} from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Signup(){
    const [inputs, setInput] = useState({
        username: "",
        email: "",
        password: "",
        description: "",
    });

    const {username, email, password, description} = inputs;
    const [errorMessage, setErrorMessage] = useState(""); // State for handling error messages
    const [showErrorPopup, setShowErrorPopup] = useState(false);
    const navigate = useNavigate();

    const onChange = (e) => {
        setInput({...inputs, [e.target.name]: e.target.value});
    };
    const closeErrorPopup = () => {
        setShowErrorPopup(false); // Close the error popup
    };

    const onClick = () => {
        axios({
            method: 'post',
            url: "http://localhost:8080/api/user/signup",
            headers: { 'Content-Type': 'application/json' },
            data: {
                username: username,
                email: email,
                password: password,
                description: description,
            }
        })
        .then((res) => {
            localStorage.setItem("token", res.headers['authentication']);
            navigate("/");
        })
        .catch((err)=>{
            console.log(err);
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
                username: "",
                email: "",
                password: "",
                description: "",
            });
        });
    };

    return (
        <>
            <input 
                type="text" 
                name="username" 
                value={username} 
                onChange={onChange} 
                placeholder="Username"
            />
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
            <textarea
                name="description"
                value={description}
                onChange={onChange}
                placeholder="Description"
            />
            <button onClick={onClick}>Signup</button>

            {showErrorPopup && ( // Render the error popup conditionally
                <div className="error-popup">
                    <div className="error-message">
                        {errorMessage}
                        <button onClick={closeErrorPopup}>Close</button>
                    </div>
                </div>
            )}
        </>
    )
}

export default Signup;