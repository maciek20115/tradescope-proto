
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { AnalysisResult, Recommendation } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const model = 'gemini-2.5-flash';

const prompt = `You are an expert market analyst AI named TradeScope. Analyze the provided stock market or cryptocurrency chart image. Based on the patterns, indicators, and trends visible in the chart, provide a detailed analysis. Your response must be in JSON format. The analysis should include: 1. A brief "prediction" of the likely future price movement. 2. A clear "recommendation" to either "BUY", "SELL", or "HOLD". 3. A "confidence" score from 0 to 100 on your recommendation. 4. A detailed "rationale" explaining the technical analysis that led to your conclusion. 5. An "annotation" object to draw the predicted trend. It must have a "type" of "arrow", a "start" point {\"x\": number, \"y\": number}, and an "end" point {\"x\": number, \"y\": number}. Coordinates are percentages (0-100) from the top-left corner.`;

const annotationSchema = {
  type: Type.OBJECT,
  properties: {
    type: {
      type: Type.STRING,
      enum: ['arrow', 'line'],
    },
    start: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
      },
      required: ['x', 'y'],
    },
    end: {
      type: Type.OBJECT,
      properties: {
        x: { type: Type.NUMBER },
        y: { type: Type.NUMBER },
      },
      required: ['x', 'y'],
    },
  },
  required: ['type', 'start', 'end'],
};

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    prediction: {
      type: Type.STRING,
      description: 'A brief prediction of future price movement.',
    },
    recommendation: {
      type: Type.STRING,
      enum: ['BUY', 'SELL', 'HOLD'],
      description: 'The trading recommendation.',
    },
    confidence: {
      type: Type.INTEGER,
      description: 'Confidence score from 0 to 100.',
    },
    rationale: {
      type: Type.STRING,
      description: 'Detailed rationale for the recommendation.',
    },
    annotation: {
      ...annotationSchema,
      description: 'Annotation for drawing the predicted trend on the chart image.'
    }
  },
  required: ['prediction', 'recommendation', 'confidence', 'rationale', 'annotation'],
};

export const analyzeChart = async (imageBase64: string, mimeType: string): Promise<AnalysisResult> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const textPart = {
      text: prompt,
    };

    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: [imagePart, textPart] },
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.2,
      }
    });
    
    const jsonString = response.text.trim();
    const result = JSON.parse(jsonString);

    // Validate the received data structure
    if (
      !result.prediction ||
      !result.recommendation ||
      !Object.values(Recommendation).includes(result.recommendation as Recommendation) ||
      typeof result.confidence !== 'number' ||
      !result.rationale ||
      !result.annotation ||
      !result.annotation.type ||
      !result.annotation.start ||
      typeof result.annotation.start.x !== 'number' ||
      typeof result.annotation.start.y !== 'number' ||
      !result.annotation.end ||
      typeof result.annotation.end.x !== 'number' ||
      typeof result.annotation.end.y !== 'number'
    ) {
      throw new Error('Invalid analysis data structure received from API.');
    }

    return result as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing chart:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to analyze chart: ${error.message}`);
    }
    throw new Error('An unknown error occurred during chart analysis.');
  }
};

export const continueChart = async (imageBase64: string, mimeType: string, analysis: AnalysisResult): Promise<string> => {
  try {
    const imagePart = {
      inlineData: {
        data: imageBase64,
        mimeType,
      },
    };

    const generationPrompt = `You are a data visualization expert. The user has provided a financial chart and an AI analysis of it. 
    Your task is to generate a continuation of this chart that visually represents the prediction.
    - Extend the chart to the right, adding about 25% more horizontal space.
    - Draw the future price movement based on the analysis.
    - The style of the extension (background, grid lines, colors, candle stick style) must seamlessly match the original image.
    
    Analysis:
    - Recommendation: ${analysis.recommendation}
    - Prediction: ${analysis.prediction}

    Based on this, draw the chart's future. For a 'BUY' recommendation, show a clear upward trend. For a 'SELL', show a downward trend. For a 'HOLD', show a sideways or volatile movement without a clear direction.`;


    const textPart = {
      text: generationPrompt,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [imagePart, textPart] },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    
    throw new Error('No image was generated in the response.');

  } catch (error) {
    console.error("Error continuing chart:", error);
    if (error instanceof Error) {
        throw new Error(`Failed to continue chart: ${error.message}`);
    }
    throw new Error('An unknown error occurred during chart continuation.');
  }
};
