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

        throw new Error("Failed to generate AI response");

    }

};