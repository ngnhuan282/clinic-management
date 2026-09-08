import { useEffect, useState } from "react";
import axiosClient from "./api/axiosClient";

function App() {
    const [message, setMessage] = useState("");

    useEffect(() => {
        axiosClient
            .get("/test")
            .then(response => {
                setMessage(response.data.message);
            })
            .catch(error => {
                console.error(error);
            });
    }, []);

    return (
        <div>
            <h2>Clinic Management System</h2>
            <p>{message}</p>
        </div>
    );
}

export default App;