/**
 * Test script to verify Colab server connection
 * Run this with: node test_colab_connection.js
 */

// Import fetch for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const COLAB_URL = 'https://overvigorous-carina-unoccasionally.ngrok-free.dev';

async function testColabServer() {
    console.log('🧪 Testing Colab server connection...\n');
    console.log(`📡 Server URL: ${COLAB_URL}\n`);

    // Test 1: Health Check
    try {
        console.log('1️⃣ Testing health endpoint...');
        const healthResponse = await fetch(`${COLAB_URL}/health`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });

        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Health check passed!');
            console.log('   Server status:', healthData.status);
            console.log('   GPU available:', healthData.gpu_available);
            console.log('   GPU memory:', healthData.gpu_memory);
        } else {
            console.log('❌ Health check failed:', healthResponse.status, healthResponse.statusText);
            return;
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
        return;
    }

    console.log();

    // Test 2: Answer Comparison
    try {
        console.log('2️⃣ Testing answer comparison...');
        const testData = {
            studentAnswer: "The capital of France is Paris. It is a beautiful city with many landmarks.",
            modelAnswer: "Paris is the capital of France.",
            maxMark: 5
        };

        const compareResponse = await fetch(`${COLAB_URL}/compare`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testData)
        });

        if (compareResponse.ok) {
            const compareData = await compareResponse.json();
            console.log('✅ Answer comparison passed!');
            console.log('   Marks awarded:', compareData.markAwarded);
            console.log('   Explanation:', compareData.explanation);
        } else {
            console.log('❌ Answer comparison failed:', compareResponse.status);
            const errorText = await compareResponse.text();
            console.log('   Error:', errorText);
        }
    } catch (error) {
        console.log('❌ Answer comparison error:', error.message);
    }

    console.log();

    // Test 3: Question Comparison
    try {
        console.log('3️⃣ Testing question comparison...');
        const questionData = {
            studentQuestion: "What is the capital of France?",
            modelQuestion: "What is the capital city of France?"
        };

        const questionResponse = await fetch(`${COLAB_URL}/compare-questions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(questionData)
        });

        if (questionResponse.ok) {
            const questionResult = await questionResponse.json();
            console.log('✅ Question comparison passed!');
            console.log('   Questions match:', questionResult.isSame);
            console.log('   Explanation:', questionResult.explanation);
        } else {
            console.log('❌ Question comparison failed:', questionResponse.status);
        }
    } catch (error) {
        console.log('❌ Question comparison error:', error.message);
    }

    console.log('\n🎉 Testing completed!');
    console.log('📱 Your React Native app should now work with the Colab server.');
}

// Run the test
testColabServer().catch(console.error);