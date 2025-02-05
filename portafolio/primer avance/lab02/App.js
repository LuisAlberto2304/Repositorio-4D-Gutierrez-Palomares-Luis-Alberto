import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Source: Local Image!</Text>
      <Image style={styles.image} source={require('./assets/gato.jpg')}/>

      <Text style={styles.title}>Source: Third Image!</Text>
      <Image style={styles.image} source={{ uri:'https://www.purina.es/sites/default/files/styles/ttt_image_original/public/2024-02/sitesdefaultfilesstylessquare_medium_440x440public2022-07Affenpinscher.webp?itok=TsNcDJ0I' }}/>
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

  image:{
    width: 200,
    height: 200,
    marginBottom: 20,
  },  

  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
