// src/utils/errorHandler.js

export function getApiErrorMessage(
    error,
    fallback = "Something went wrong."
) {
    const response = error?.response;

    if (!response) {
        return "Cannot connect to the server.";
    }

    const data = response.data;

    if (typeof data?.message === "string") {
        return data.message;
    }

    if (typeof data?.title === "string") {
        return data.title;
    }

    if (data?.errors) {
        if (Array.isArray(data.errors)) {
            return data.errors.join(", ");
        }

        if (
            typeof data.errors === "object"
        ) {
            return Object.values(data.errors)
                .flat()
                .join(", ");
        }
    }

    switch (response.status) {
        case 400:
            return "Invalid request.";

        case 401:
            return "You are not authenticated.";

        case 403:
            return "You do not have permission.";

        case 404:
            return "The requested resource was not found.";

        case 409:
            return "This operation conflicts with existing data.";

        case 500:
            return "Internal server error.";

        default:
            return fallback;
    }
}

export default getApiErrorMessage;