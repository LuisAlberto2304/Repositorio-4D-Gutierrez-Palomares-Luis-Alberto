import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput } from 'react-native';

import MyTextInput from './components/MyTextInput';

export default function App() {
  return (
    <View style={styles.container}>
      <Text>Hola mundo!</Text>
      <MyTextInput text={"Hola mundo"}/>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 40,
    margin: 12,
  }
});
