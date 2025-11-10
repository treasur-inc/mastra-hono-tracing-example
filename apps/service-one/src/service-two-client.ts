export const serviceTwoClient = {
    getMessage: async (url: string) => {
        const response = await fetch(`${url}/service-two`);
        return response.json();
    }
}