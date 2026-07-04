import openRouter from "../config/openrouter.js";

export const askAI = async (prompt) => {

    try {

        const response = await openRouter.post(

            "/chat/completions",

            {

                model: process.env.OPENROUTER_MODEL,

                messages: [

                    {

                        role: "user",

                        content: prompt

                    }

                ]

            }

        );

        return response.data.choices[0].message.content;

    } catch (error) {
        console.error("OpenRouter Error:", error.response?.data || error.message);
        
        // Extract the actual error message from the OpenRouter API response if available
        const actualError = error.response?.data?.error?.message || 
                            error.response?.data?.message || 
                            error.message || 
                            "Failed to generate AI response";
                            
        throw new Error(actualError);
    }
};