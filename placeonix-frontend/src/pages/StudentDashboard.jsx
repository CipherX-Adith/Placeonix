import { useEffect, useState } from "react";
import api from "../services/api";

export default function StudentDashboard() {

    const [students, setStudents] = useState([]);

    useEffect(() => {

        api.get("/students")
            .then((response) => {

                console.log(response.data);

                setStudents(response.data);
            })
            .catch((error) => {

                console.log(error);
            });

    }, []);

    return (
        <div>
            <h1>Student Dashboard</h1>

            <h2>Students List</h2>

            {students.map((student) => (

                <div key={student.id}>
                    <p>{student.name}</p>
                </div>

            ))}
        </div>
    );
}