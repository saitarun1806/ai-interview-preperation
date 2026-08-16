import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import {
    registerUser,
    getIdToken,
    googleLogin,
} from "../services/authService.js";

import "./login.css";


function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] =
        useState({
            name: "",
            email: "",
            password: "",
            confirmPassword: "",
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


        if (
            formData.password !==
            formData.confirmPassword
        ) {
            setError(
                "Passwords do not match."
            );

            return;
        }


        try {

            setLoading(true);


            
            await registerUser(
                formData.name,
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
                "Registration successful"
            );


            navigate("/dashboard");

        } catch (err) {

            console.error(err);

            setError(
                err.response?.data?.message ||
                err.message ||
                "Registration failed."
            );

        } finally {

            setLoading(false);

        }
    };


    
    
    

    const handleGoogleSignup =
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
                    "Google signup successful"
                );


                navigate("/dashboard");

            } catch (err) {

                console.error(err);

                setError(
                    err.response?.data?.message ||
                    err.message ||
                    "Google signup failed."
                );

            } finally {

                setLoading(false);

            }
        };


    return (
        <div className="auth-page">

            <div className="auth-card">

                <h1>Create account</h1>

                <p className="auth-subtitle">
                    Fill in your details to get started.
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

                        <label htmlFor="name">
                            Full name
                        </label>

                        <input
                            id="name"
                            type="text"
                            name="name"
                            placeholder="Jane Doe"
                            value={
                                formData.name
                            }
                            onChange={
                                handleChange
                            }
                            required
                        />

                    </div>


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


                    <div className="field">

                        <label htmlFor="confirmPassword">
                            Confirm password
                        </label>

                        <input
                            id="confirmPassword"
                            type="password"
                            name="confirmPassword"
                            placeholder="••••••••"
                            value={
                                formData.confirmPassword
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
                            ? "Creating account…"
                            : "Create account"}
                    </button>

                </form>


                <div className="divider">
                    or
                </div>


                <button
                    className="btn-google"
                    onClick={
                        handleGoogleSignup
                    }
                    disabled={loading}
                    type="button"
                >
                    Continue with Google
                </button>


                <p className="auth-footer-note">

                    Already have an account?{" "}

                    <button
                        className="link-btn"
                        onClick={() =>
                            navigate("/")
                        }
                        type="button"
                    >
                        Log in
                    </button>

                </p>

            </div>

        </div>
    );
}

export default Register;