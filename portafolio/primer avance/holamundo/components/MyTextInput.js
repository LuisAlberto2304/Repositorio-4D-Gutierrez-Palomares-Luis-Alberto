import { TextInput, StyleSheet } from "react-native";

export default function MyTextInput({text}) {
    return(
        <TextInput 
        value={text}
        style = {styles.input}
      />
    );
};

const styles = StyleSheet.create({
    input: {
      height: 40,
      margin: 12,
    }
  });
