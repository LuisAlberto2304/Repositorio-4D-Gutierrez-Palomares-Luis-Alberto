import React, { useState } from "react";
import { View, Text, Button, TextInput, StyleSheet } from "react-native";

export default function MyForm() {
  const [text, setText] = useState(""); // Uso correcto de useState
  const [displayText, setDisplayText] = useState(""); // Uso correcto de useState

  const handlePress = () => {
    setDisplayText(text); // Actualiza el texto mostrado
    setText(""); // Limpia el campo de entrada
  };

  return (
    <View style={styles.container}>
      <Text>Text to Show: {displayText}</Text>
      <TextInput
        placeholder="Type something"
        value={text}
        onChangeText={setText}
        style={styles.input} // Corregido: "style" en lugar de "styles"
      />
      <Button title="Click Me" onPress={handlePress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 120,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EEBB11",
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    width: "80%",
    backgroundColor: "#FFF",
  },
});
