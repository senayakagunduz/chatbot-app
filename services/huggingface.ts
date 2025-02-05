import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.NEXT_PUBLIC_HUGGING_FACE_API_TOKEN);

export const generateResponse = async (message: string, previousMessages: string[] = []) => {
  try {
    const response = await hf.textGeneration({
      model: 'facebook/blenderbot-400M-distill',
      inputs: message,
      parameters: {
        max_new_tokens: 100,
        temperature: 0.7,
        top_p: 0.95,
        repetition_penalty: 1.2
      }

    });
    return response.generated_text;

  } catch (error) {
    console.error('Error generating response:', error);
    throw error;
  }
};
export const speechToText = async (audioBlob: Blob) => {
  try {
    const response = await hf.automaticSpeechRecognition({
      model: 'openai/whisper-base',
      data: audioBlob
    });
    return response.text;
  } catch (error) {
    console.error('Error in speech to text:', error);
    throw error;
  }
};

export const textToSpeech = async (text: string) => {
  try {
    const response = await hf.textToSpeech({
      model: 'espnet/kan-bayashi_ljspeech_vits',
      inputs: text
    });
    return response;
  } catch (error) {
    console.error('Error in text to speech:', error);
    throw error;
  }
};