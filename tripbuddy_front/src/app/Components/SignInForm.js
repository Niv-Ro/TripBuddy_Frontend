import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {useNavigation,useNavigate} from "react-router-dom";

const SignInForm = ({ onSubmit }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");


    const handleSubmit = async e => {
        e.preventDefault();
        await onSubmit({ email, password });
        navigate('/MainScreen');
    };

    return (
        <div className="text-center">
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <input
                        type="email"
                        className="form-control"
                        placeholder="Enter your email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="mb-6">
                    <input
                        type="password"
                        className="form-control"
                        placeholder="Enter your password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="btn btn-primary w-100 mb-3">Login</button>

            </form>
            <button className="btn btn-secondary" onClick={() => navigate('/SignUp')}>Sign Up</button>
        </div>
    )
        ;
};

export default SignInForm;