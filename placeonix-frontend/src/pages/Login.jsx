import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function Login() {

    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {

        try {

            const response = await axios.post(
                "http://localhost:8080/api/auth/login",
                {
                    email,
                    password
                }
            );

            const token = response.data.token;

            localStorage.setItem(
                "token",
                token
            );

            const payload = JSON.parse(
                atob(
                    token.split(".")[1]
                )
            );

            console.log(
                "TOKEN:",
                token
            );

            console.log(
                "PAYLOAD:",
                payload
            );

            const role = payload.role;

            if (role === "ADMIN") {

                navigate("/admin");

            } else if (role === "TPO") {

                navigate("/tpo");

            } else if (role === "COMPANY") {

                navigate("/company");

            } else {

                navigate("/student");
            }

        } catch (error) {

            console.log(
                "LOGIN ERROR:",
                error
            );

            if (error.response) {

                alert(
                    "Login Failed\n\n" +
                    JSON.stringify(
                        error.response.data
                    )
                );

            } else {

                alert(
                    "Cannot connect to backend."
                );
            }
        }
    };

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "100vh",
                backgroundColor: "#f4f4f4"
            }}
        >
            <div
                style={{
                    backgroundColor: "white",
                    padding: "30px",
                    borderRadius: "10px",
                    width: "350px",
                    boxShadow: "0 0 10px rgba(0,0,0,0.2)"
                }}
            >
                <h2
                    style={{
                        textAlign: "center"
                    }}
                >
                    Placeonix Login
                </h2>

                <input
                    type="email"
                    placeholder="Enter Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px"
                    }}
                />

                <input
                    type="password"
                    placeholder="Enter Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    style={{
                        width: "100%",
                        padding: "10px",
                        marginBottom: "10px"
                    }}
                />

                <button
                    onClick={handleLogin}
                    style={{
                        width: "100%",
                        padding: "10px",
                        backgroundColor: "#1976d2",
                        color: "white",
                        border: "none",
                        cursor: "pointer"
                    }}
                >
                    Login
                </button>
            </div>
        </div>
    );
}