import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button } from 'react-native';
import MyForm from './components/MyForm';

export default function App() {
  const [text, setText] = useState(""); // Corregido: uso de destructuración de arreglos
  const [displayText, setDisplayText] = useState(""); // Corregido: uso de destructuración de arreglos

  const handlePress = () => {
    setDisplayText(text); // Actualiza el estado con el texto ingresado
    setText(''); // Limpia el campo de entrada
  };

  return (
    <View style={styles.container}>
      <MyForm>
        
      </MyForm>
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
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: '80%',
  },
});


