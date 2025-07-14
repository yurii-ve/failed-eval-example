import { generateText } from 'ai'
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { Client } from 'langsmith';
import { evaluate } from 'langsmith/evaluation';
import dotenv from 'dotenv';
import { initializeOTEL } from "langsmith/experimental/otel/setup";

dotenv.config({ quiet: true });

const googleProvider = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });

async function target() {
    const llmResponse = await generateText({
        model: googleProvider('gemini-2.5-flash-preview-05-20'),
        system: 'You are a calculator',
        messages: [{role: 'user', content: 'What is 2 + 2?'}],
        experimental_telemetry: { isEnabled: true },
    });

    return '4'        
}

function testEvaluator() {
    return [{ key: 'calculation-result', score: 1 }]
};

async function main() {
    const { DEFAULT_LANGSMITH_SPAN_PROCESSOR } = initializeOTEL();
    const langSmithClient = new Client();
    const evalResult = await evaluate(target, {
        data: langSmithClient.listExamples({
            datasetName: process.env.LANGSMITH_DATASET_NAME,
            limit: 1
        }),
        evaluators: [testEvaluator],
        client: langSmithClient,
    });

    await DEFAULT_LANGSMITH_SPAN_PROCESSOR.forceFlush();
    await DEFAULT_LANGSMITH_SPAN_PROCESSOR.shutdown();
}

main().then(() => {
    console.log('Evaluation completed successfully');
}).catch((error) => {
    console.error('Error during evaluation:', error);
});