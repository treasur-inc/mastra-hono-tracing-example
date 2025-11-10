export const serviceMastraClient = {
    getMessage: async (url: string) => {
        const response = await fetch(`${url}/service-mastra`);
        return response.json();
    }
}