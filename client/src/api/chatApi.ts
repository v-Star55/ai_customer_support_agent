import API from "./api";

export const chatStream = async (question: string, sessionId?: string): Promise<string> => {
    const response = await API.post("/chat/stream", { question, sessionId }, {
        responseType: "text",
        transformResponse: [(data: string) => data],
    });
    return response.data;
}

export const getChatHistory = async (sessionId?: string) => {
    const response = await API.get("/chat/history", {
        params: sessionId ? { sessionId } : {}
    });
    return response.data;
}

export const newChat = async (sessionId?: string) => {
    const response = await API.post("/chat/new", { sessionId });
    return response.data;
}
