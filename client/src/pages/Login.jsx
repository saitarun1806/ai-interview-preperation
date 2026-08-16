import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
    loginUser,
    getIdToken,
    googleLogin,
} from "../services/authService.js";

import "./login.css";


function Login() {

    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            email: "",
            password: "",
        });

    const [loading, setLoading] =
        useState(false);

    const [error, setError] =
        useState("");


    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]:
                e.target.value,
        });
    };


    
    
    

    const verifyWithBackend =
        async () => {

            const firebaseToken =
                await getIdToken();

            if (!firebaseToken) {
                throw new Error(
                    "Firebase token not found."
                );
            }

            const response =
                await axios.get(
                    `${import.meta.env.VITE_API_URL}/auth/verify`,
                    {
                        headers: {
                            Authorization:
                                `Bearer ${firebaseToken}`,
                        },
                    }
                );

            return response.data;
        };


    
    
    

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");

        try {

            setLoading(true);

            
            await loginUser(
                formData.email,
                formData.password
            );

            
            const data =
                await verifyWithBackend();

            
            localStorage.setItem(
                "token",
                data.token
            );

            
            localStorage.setItem(
                "user",
                JSON.stringify(
                    data.user
                )
            );

            console.log(
                "Login successful"
            );

            navigate("/dashboard");

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Login failed."
            );

        } finally {

            setLoading(false);

        }
    };


    
    
    

    const handleGoogleLogin =
        async () => {

            setError("");

            try {

                setLoading(true);

                
                await googleLogin();

                
                const data =
                    await verifyWithBackend();

                
                localStorage.setItem(
                    "token",
                    data.token
                );

                
                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.user
                    )
                );

                console.log(
                    "Google login successful"
                );

                navigate("/dashboard");

            } catch (err) {

                console.error(err);

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Google login failed."
                );

            } finally {

                setLoading(false);

            }
        };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <h1>Log in</h1>

                <p className="auth-subtitle">
                    Enter your details to continue.
                </p>


                {error && (
                    <div className="error-banner">
                        {error}
                    </div>
                )}


                <form
                    className="auth-form"
                    onSubmit={handleSubmit}
                    noValidate
                >

                    <div className="field">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            id="email"
                            type="email"
                            name="email"
                            placeholder="you@example.com"
                            value={
                                formData.email
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>


                    <div className="field">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            id="password"
                            type="password"
                            name="password"
                            placeholder="••••••••"
                            value={
                                formData.password
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>


                    <button
                        className="btn-primary"
                        type="submit"
                        disabled={loading}
                    >
                        {loading
                            ? "Logging in…"
                            : "Log in"}
                    </button>

                </form>


                <div className="divider">
                    or
                </div>


                <button
                    className="btn-google"
                    onClick={
                        handleGoogleLogin
                    }
                    disabled={loading}
                    type="button"
                >
                    Continue with Google
                </button>


                <p className="auth-footer-note">

                    Don't have an account?{" "}

                    <button
                        className="link-btn"
                        onClick={() =>
                            navigate(
                                "/register"
                            )
                        }
                        type="button"
                    >
                        Create one
                    </button>

                </p>

            </div>

        </div>
    );
}

export default Login;