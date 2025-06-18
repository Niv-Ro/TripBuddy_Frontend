"use client"
import Image from "next/image";
import SignUp from "@/app/Components/SignUp";
import 'bootstrap/dist/css/bootstrap.min.css';
import SignIn from "@/app/Components/SignIn";
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import Dashboard from "@/app/Components/Dashboard";
import { auth } from './components/FireBase.js';
import MainScreen from "@/app/Components/MainScreen";

export default function Home() {
    function ProtectedRoute({ children }) {
        const user = auth.currentUser;
        return user ? children : <Navigate to="/" replace />;
    }

  return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 ">
          <div className="card p-4 " style={{minWidth: '400px'}}>
              <BrowserRouter>
                  <Routes>
                      <Route path="/" element={<SignIn />} />
                      <Route path="/SignUp" element={<SignUp />} />
                      <Route path="/Dashboard" element={<Dashboard />} />
                      <Route path="/MainScreen" element={
                          <ProtectedRoute>
                              <Dashboard />
                          </ProtectedRoute>
                      } />
                  </Routes>
              </BrowserRouter>

          </div>
      </div>
  );
}
