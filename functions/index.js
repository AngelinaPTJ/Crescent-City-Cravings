const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { GoogleGenAI } = require("@google/genai");

// Initialize Gemini API client.
// We expect the GEMINI_API_KEY environment variable to be available.
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

exports.generateBackstory = onCall({ cors: true }, async (request) => {
  try {
    const data = request.data || {};

    // Validate required fields
    if (!data.name || !data.concept) {
      throw new HttpsError(
        "invalid-argument",
        "The function must be called with a 'name' and 'concept' argument."
      );
    }

    const { name, concept, stats } = data;
    const statsString = stats
      ? `Strength: ${stats.strength}, Agility: ${stats.agility}, Intelligence: ${stats.intelligence}, Charisma: ${stats.charisma}`
      : "Average capabilities";

    // Construct the prompt for Gemini
    const prompt = `You are an expert RPG narrative designer. Create a compelling, brief backstory (max 2 paragraphs) for a character with the following details:
    Name: ${name}
    Concept: ${concept}
    Stats: ${statsString}

    Make the backstory dramatic and fitting the tone of a dark fantasy RPG. Explain briefly how their highest or lowest stat impacts their story. Do not include stats or names explicitly if it breaks the narrative flow, but weave them in conceptually.`;

    // Call the Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    return {
      backstory: response.text
    };
  } catch (error) {
    console.error("Error generating backstory:", error);

    // Pass specific errors through if they are HttpsErrors
    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      "An internal error occurred while generating the backstory."
    );
  }
});
