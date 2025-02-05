import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { Button, Text, Appbar, TextInput } from 'react-native-paper';

export default function App() {

  const [text, setText] = React.useState('');

  return (
    <View style={styles.container}>

      {/*APP BAR COMPONENT PAPER / HEADER */}
      <Appbar>
        <Appbar.Content title="Reat Native Paper" />
      </Appbar>

      {/* TEXTINPUT*/}
      <TextInput 
        label='Type Something'
        value={text}
        onChangeText={text => setText(text)}
        textColor="red"
        style={styles.input}
      />

      {/* BUTTON COMPONENT PAPER */}
      <Button mode="contained" onPress={() => alert(`Texto: ${text}`)}>
        Show Text!  
      </Button> 

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
    padding: 16,
  },
  input: {
    marginBottom: 16,
  },
});
