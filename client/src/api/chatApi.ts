import API from "./api";

export const chatStream = async (question: string): Promise<string> => {
    const response = await API.post("/chat/stream", { question }, {
        responseType: "text",
        transformResponse: [(data: string) => data],
    });
    return response.data;
}

export const getChatHistory = async () => {
    const response = await API.get("/chat/history");
    return response.data;
}

export const newChat = async () => {
    const response = await API.post("/chat/new");
    return response.data;
}
