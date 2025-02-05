import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Button, TextInput, Alert, Image} from 'react-native';

export default function App() {
  const [data, setData] = useState({
    ID: '',
    NOMBRE: '',
    EMAIL: '',
    PHONE: ''
  });

  const [submittedData, setSubmittedData] = useState(null);

  const handleInputChange = (name, value) => {
    setData((prevData) => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = () => {
    if (data.ID || data.NOMBRE || data.EMAIL || data.PHONE) {
      setSubmittedData(data);
    } else {
      Alert.alert('Error', 'Por favor completa todos los campos.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={{color: '#ff0000'}}>NFL GamePass</Text>

      <Image source={require('./assets/logo1.jpg')} style={{ width: 200, height: 100, margin: 10 }} />

      <Text>Llene todos los campos porfavor</Text>

      <Text>ID:</Text>
      <TextInput
        placeholder="Escribe id"
        value={data.ID}
        onChangeText={(value) => handleInputChange('ID', value)}
        style={styles.input}
      />

      <Text>NAME:</Text>
      <TextInput
        placeholder="Escribe nombre"
        value={data.NOMBRE}
        onChangeText={(value) => handleInputChange('NOMBRE', value)}
        style={styles.input}
      />

      <Text>EMAIL:</Text>
      <TextInput
        placeholder="Escribe email"
        value={data.EMAIL}
        onChangeText={(value) => handleInputChange('EMAIL', value)}
        style={styles.input}
      />

      <Text>PHONE:</Text>
      <TextInput
        placeholder="Escribe celular"
        value={data.PHONE}
        onChangeText={(value) => handleInputChange('PHONE', value)}
        style={styles.input}
      />

      <View style={{ marginVertical: 10 }}>
        <Button title="Enviar" onPress={handleSubmit} />
      </View>

      {submittedData && (
        <View style={styles.result}>
          <Text style={styles.resultText}>ID: {submittedData.ID}</Text>
          <Text style={styles.resultText}>NOMBRE: {submittedData.NOMBRE}</Text>
          <Text style={styles.resultText}>EMAIL: {submittedData.EMAIL}</Text>
          <Text style={styles.resultText}>PHONE: {submittedData.PHONE}</Text>
        </View>
      )}

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 10,
    marginBottom: 16,
    borderColor: '#000000',
    backgroundColor: '#fff',
  },
  result: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#e0f7fa',
    borderRadius: 5,
  },
  resultText: {
    fontSize: 16,
  },
});
