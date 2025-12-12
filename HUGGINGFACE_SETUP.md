# Hugging Face Model Integration Setup

This guide will help you set up your custom Llama 2B model (`Sathvik19/Answer-Evaluator-Model`) to replace the Gemini evaluator in your AiAE app.

## Setup Steps

### 1. Get Your Hugging Face API Token

1. Go to [Hugging Face Settings - Tokens](https://huggingface.co/settings/tokens)
2. Click "Create new token" or use an existing one
3. Make sure it has "Read" permission (write not needed for inference)
4. Copy the token

### 2. Configure Your API Token

Edit the file `src/config/huggingface.config.js` and replace `YOUR_HUGGING_FACE_API_TOKEN_HERE` with your actual token:

```javascript
export const HUGGING_FACE_CONFIG = {
  // Replace this with your actual Hugging Face API token
  API_TOKEN: 'hf_your_actual_token_here',
  
  // ... rest of the config
};
```

### 3. What's Changed

The following functions have been replaced:

- **`compareAnswersWithAI`**: Now uses your Llama 2B model instead of Gemini
- **`compareQuestionsWithAI`**: Now uses your Llama 2B model instead of Gemini

### 4. Files Modified

- **`src/SubmitAnswerScreen.jsx`**: Main screen where evaluation happens
  - Removed Google Generative AI imports
  - Added Hugging Face service import
  - Updated both AI comparison functions

- **`src/services/huggingFaceService.js`**: New service for your model
  - Handles API calls to your Hugging Face model
  - Manages prompt formatting and response parsing
  - Includes error handling and fallbacks

- **`src/config/huggingface.config.js`**: Configuration file
  - Centralized place for API token and model parameters
  - Easy to modify model settings

### 5. Model Behavior

Your model will:
- Evaluate student answers against model answers
- Provide marks and explanations
- Compare questions to determine if they match
- Handle JSON response parsing
- Fallback to basic comparison if model fails

### 6. Testing the Integration

1. Add your API token to the config file
2. Run the app: `npm start` or `yarn start`
3. Test answer evaluation with a few sample questions
4. Check console logs for any errors or API issues

### 7. Model Loading

Note: Since your model isn't deployed to an inference endpoint, it may take 15-20 seconds to "wake up" on first use. The service includes automatic retry logic for this case.

### 8. Optional: Remove Gemini Dependency

If you want to completely remove Gemini, you can:

```bash
npm uninstall @google/generative-ai
```

And remove line 14 from `package.json`.

### 9. Troubleshooting

**Model not responding:**
- Check your API token is correct
- Verify the model URL: `https://api-inference.huggingface.co/models/Sathvik19/Answer-Evaluator-Model`
- Wait for model to load (first request can be slow)

**Parsing errors:**
- The service includes fallback logic
- Check console logs for raw model responses
- Adjust prompt format in the service if needed

**Rate limiting:**
- Hugging Face has rate limits on free tier
- Consider upgrading to Pro if you need higher limits

## Benefits of This Change

1. **Custom Model**: Uses your specifically trained answer evaluator
2. **Cost Control**: May be more cost-effective than Gemini
3. **Customization**: Full control over model parameters
4. **Privacy**: Data stays within Hugging Face ecosystem
5. **Specialized**: Model trained specifically for answer evaluation

## Support

If you encounter issues:
1. Check the console logs
2. Verify your API token has the right permissions
3. Test the model directly on Hugging Face website
4. Adjust model parameters in the config file if needed