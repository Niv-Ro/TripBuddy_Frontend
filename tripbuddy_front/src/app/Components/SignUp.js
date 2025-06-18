"use client"
import 'bootstrap/dist/css/bootstrap.min.css';
import { useSignUp } from './Hooks/useSignUp';
import SignUpForm from './Components/SignUpForm';

const SignUp = () => {
    const {
        formData,
        profileImage,
        countries,
        handleInputChange,
        handleImageChange,
        registerUser
    } = useSignUp();

    return (
        <div className="container vh-50 d-flex justify-content-center align-items-center">
            <SignUpForm
                formData={formData}
                profileImage={profileImage}
                countries={countries}
                isLoading={isLoading}
                onInputChange={handleInputChange}
                onImageChange={handleImageChange}
                onSubmit={registerUser}
            />
        </div>
    );
};

export default SignUp;