import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import {AuthProvider} from "@/context/AuthContext";
import {Heebo} from "next/font/google"

const heebo = Heebo({
    subsets:["latin","hebrew"],
    weight: ["300", "400", "500", "700"]
});

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata = {
    title: "Travel Buddy",
    description: "Find your perfect travel companion",
};

export default function RootLayout({ children }) {
    return (
        <html lang="en">
        <head>
            <link
                href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css"
                rel="stylesheet"
                integrity="sha384-9ndCyUaIbzAi2FUVXJi0CjmCapSmO7SnpJef0486qhLnuZ2cdeRhO02iuK6FUUVM"
                crossOrigin="anonymous"
            />
        </head>
        <body
            className={`${heebo.className} antialiased`}
        >
        <AuthProvider>{children}</AuthProvider>
        <script
            src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"
            integrity="sha384-geWF76RCwLtnZ8qwWowPQNguL3RmwHVBC9FhGdlKrxdiJJigb/j/68SIy3Te4Bkz"
            crossOrigin="anonymous"
            async
        />
        </body>
        </html>
    );
}