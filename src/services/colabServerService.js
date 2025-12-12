/**
 * Colab Server Service
 * Connects to your fine-tuned model hosted on Google Colab
 */

class ColabServerService {
  constructor() {
    // Your actual ngrok URL from Colab
    this.baseUrl = 'https://overvigorous-carina-unoccasionally.ngrok-free.dev';
    
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Update the server URL (call this after getting ngrok URL from Colab)
   */
  setServerUrl(url) {
    // Remove trailing slash if present
    this.baseUrl = url.replace(/\/$/, '');
    console.log(`📡 Colab server URL updated: ${this.baseUrl}`);
  }

  /**
   * Check if server is running
   */
  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        headers: this.headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('🟢 Server health check passed:', result);
      return result;
    } catch (error) {
      console.error('🔴 Server health check failed:', error);
      throw error;
    }
  }

  /**
   * Compare student answer with model answer using your fine-tuned model
   */
  async compareAnswers(studentAnswer, modelAnswer, maxMark) {
    try {
      console.log('📤 Sending answer comparison request...');
      console.log('🔍 INPUT DATA TO LLM:');
      console.log('  📝 Student Answer:', studentAnswer);
      console.log('  ✅ Model Answer:', modelAnswer);
      console.log('  🎯 Max Mark:', maxMark);
      
      const requestData = {
        studentAnswer,
        modelAnswer,
        maxMark
      };
      
      console.log('📦 Full Request Payload:', JSON.stringify(requestData, null, 2));

      const response = await fetch(`${this.baseUrl}/compare`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      console.log('📥 RAW LLM RESPONSE:', JSON.stringify(result, null, 2));
      
      // Validate response structure
      if (typeof result.markAwarded !== 'number' || typeof result.explanation !== 'string') {
        console.warn('⚠️ Invalid response format from server:', result);
        throw new Error('Invalid response format from server');
      }

      console.log('📥 Answer comparison result:', result);
      return {
        awardedMarks: Math.max(0, Math.min(result.markAwarded, maxMark)),
        explanation: result.explanation || 'No explanation provided.'
      };

    } catch (error) {
      console.error('❌ Answer comparison failed:', error);
      
      // Return fallback result
      return {
        awardedMarks: 0,
        explanation: `Error: ${error.message}. Using fallback evaluation.`
      };
    }
  }

  /**
   * Compare questions to determine if they are the same
   */
  async compareQuestions(studentQuestion, modelQuestion) {
    try {
      // First, try basic normalization check
      const normalizeQuestion = (q) => {
        return q.trim()
          .toLowerCase()
          .replace(/[\s\.,]+/g, ' ') // Replace multiple spaces/dots/commas with single space
          .replace(/^q\.?\s*\d+\.?\s*/i, '') // Remove question numbers
          .trim();
      };
      
      const normalizedStudent = normalizeQuestion(studentQuestion);
      const normalizedModel = normalizeQuestion(modelQuestion);
      
      console.log(`🔍 Normalized questions - Student: "${normalizedStudent}", Model: "${normalizedModel}"`);
      
      if (normalizedStudent === normalizedModel) {
        console.log('✅ Questions match after normalization - skipping AI call');
        return true;
      }
      
      console.log('📤 Sending question comparison request to AI...');
      console.log('🔍 QUESTION INPUT DATA TO LLM:');
      console.log('  📝 Student Question:', studentQuestion);
      console.log('  ✅ Model Question:', modelQuestion);
      
      const requestData = {
        studentQuestion,
        modelQuestion
      };
      
      console.log('📦 Full Question Request Payload:', JSON.stringify(requestData, null, 2));

      const response = await fetch(`${this.baseUrl}/compare-questions`, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      
      console.log('📥 RAW LLM QUESTION RESPONSE:', JSON.stringify(result, null, 2));
      console.log('📥 Question comparison result:', result);
      
      return result.isSame === true;

    } catch (error) {
      console.error('❌ Question comparison failed:', error);
      
      // Fallback to basic string comparison
      const student = studentQuestion.trim().toLowerCase();
      const model = modelQuestion.trim().toLowerCase();
      return student === model;
    }
  }

  /**
   * Test the server with sample data
   */
  async testServer() {
    console.log('🧪 Testing Colab server...');
    
    try {
      // Test health endpoint
      await this.checkHealth();
      
      // Test answer comparison
      const answerResult = await this.compareAnswers(
        "Paris is the capital of France",
        "The capital of France is Paris",
        5
      );
      console.log('✅ Answer test result:', answerResult);
      
      // Test question comparison
      const questionResult = await this.compareQuestions(
        "What is the capital of France?",
        "What is the capital city of France?"
      );
      console.log('✅ Question test result:', questionResult);
      
      console.log('🎉 All tests passed!');
      return true;
      
    } catch (error) {
      console.error('❌ Server test failed:', error);
      return false;
    }
  }

  /**
   * Get server status information
   */
  getStatus() {
    return {
      serverUrl: this.baseUrl,
      isConfigured: this.baseUrl !== 'YOUR_NGROK_URL_HERE',
      healthEndpoint: `${this.baseUrl}/health`,
      compareEndpoint: `${this.baseUrl}/compare`,
      questionEndpoint: `${this.baseUrl}/compare-questions`
    };
  }
}

// Export singleton instance
export default new ColabServerService();