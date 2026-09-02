import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import TPODashboard from "./pages/TPODashboard";
import CompanyDashboard from "./pages/CompanyDashboard";
import StudentDashboard from "./pages/StudentDashboard";

function App() {

    return (
        <BrowserRouter>

            <Routes>

                <Route
                    path="/"
                    element={<Login />}
                />

                <Route
                    path="/admin"
                    element={<AdminDashboard />}
                />

                <Route
                    path="/tpo"
                    element={<TPODashboard />}
                />

                <Route
                    path="/company"
                    element={<CompanyDashboard />}
                />

                <Route
                    path="/student"
                    element={<StudentDashboard />}
                />

            </Routes>

        </BrowserRouter>
    );
}

export default App;