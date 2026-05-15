import React from 'react'
import ReactDOM from 'react-dom/client'
import { ChakraProvider } from '@chakra-ui/react'
import { createStandaloneToast } from '@chakra-ui/react'
import theme from './theme'
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./components/login/Login.jsx";
import Signup from "./components/signup/Signup";
import AuthProvider from "./components/context/AuthContext.jsx";
import ProtectedRoute from "./components/shared/ProtectedRoute.jsx";
import PracticeScreen from "./components/PracticeScreen.jsx";
import './index.css'

const { ToastContainer } = createStandaloneToast();

const defaultTopics = [
    { text: "Introduce yourself", difficulty: "easy", category: "General" },
    { text: "Describe your biggest challenge", difficulty: "medium", category: "Personal" },
    { text: "Explain a technical concept", difficulty: "hard", category: "Technical" },
]

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />
    },
    {
        path: "/signup",
        element: <Signup />
    },
    {
        path: "/dashboard",
        element: <ProtectedRoute><PracticeScreen initialTopics={defaultTopics} /></ProtectedRoute>
    }
])

ReactDOM
    .createRoot(document.getElementById('root'))
    .render(
        <React.StrictMode>
            <ChakraProvider theme={theme}>
                <AuthProvider>
                    <RouterProvider router={router} />
                </AuthProvider>
                <ToastContainer />
            </ChakraProvider>
        </React.StrictMode>,
    )
