import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ImagePickerScreen from './src/ImagePickerScreen.jsx';
import GalleryScreen from './src/GalleryScreen.jsx';
import ResultsScreen from './src/ResultsScreen.jsx';
import SaveResultsScreen from './src/SaveResultsScreen.jsx';
import SavedModelsScreen from './src/SavedModelScreen.jsx';
import ModelDetailsScreen from './src/ModelDetailsScreen.jsx';
import SubmitAnswerScreen from './src/SubmitAnswerScreen.jsx';
import Answerpicker from './src/Answerpicker.jsx';
import UploadAnswerServer from './src/UploadAnswerServer.jsx';
import ModeofFile from './src/ModeofFile.jsx';

// Create a stack navigator
const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Define the first screen of the stack navigator */}
        <Stack.Screen
          name="ImagePicker"
          component={ImagePickerScreen}
          options={{ headerShown: false }}
        />
        {/* Define the second screen of the stack navigator */}
        <Stack.Screen
          name="GalleryScreen"
          component={GalleryScreen}
          options={{ title: 'Gallery' }}
        />
        {/* Define the third screen of the stack navigator */}
        <Stack.Screen
          name="ResultsScreen"
          component={ResultsScreen}
          options={{ title: 'Question and Answer Detection' }} />

        <Stack.Screen
          name="SaveResultsScreen"
          component={SaveResultsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SavedModelScreen"
          component={SavedModelsScreen}
          options={{ title: 'Saved Models' }}
        />
        <Stack.Screen
          name="ModeofFile"
          component={ModeofFile}
          options={{ title: 'Pick your file' }}
        />
        <Stack.Screen name="ModelDetailsScreen"
         component={ModelDetailsScreen} />

         <Stack.Screen 
         name = "SubmitAnswerScreen"
         component={SubmitAnswerScreen} />

        <Stack.Screen 
         name = "Answerpicker"
         component={Answerpicker} />

        <Stack.Screen 
         name = "UploadAnswerServer"
         component={UploadAnswerServer} />


      </Stack.Navigator>
    </NavigationContainer>
  );
}
