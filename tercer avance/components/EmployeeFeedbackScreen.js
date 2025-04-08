import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { getPendingFeedbackByEmail, submitFeedback } from '../services/feedbackService';
import { AuthContext } from '../context/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../firebaseConfig';

const EmployeeFeedbackScreen = ({ navigation }) => {
  const { userEmail } = useContext(AuthContext); // Obtenemos el email del contexto
  const [pendingFeedback, setPendingFeedback] = useState([]);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  

  // Función para obtener UID por email
  const getUIDByEmail = async (email) => {
    try {
      const auth = getAuth();
      
      // 1. Verificar usuario actual
      if (auth.currentUser?.email === email) {
        console.log('UID obtenido de usuario autenticado:', auth.currentUser.uid);
        return auth.currentUser.uid;
      }
      
      // 2. Buscar en Firestore
      console.log('Buscando UID para email:', email);
      const emailDoc = await getDoc(doc(db, 'User', email));
      
      if (emailDoc.exists()) {
        console.log('UID encontrado en Firestore:', emailDoc.data().uid);
        return emailDoc.data().uid;
      }
      
      throw new Error(`No se encontró usuario registrado con email: ${email}`);
    } catch (error) {
      console.error('Error en getUIDByEmail:', {
        email,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  };

  // Obtener feedback pendiente
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        if (!userEmail) {
          throw new Error('No hay email de usuario disponible');
        }
  
        setLoading(true);
        setError(null);
  
        const feedback = await getPendingFeedbackByEmail(userEmail); // ahora usamos email
        setPendingFeedback(feedback);
      } catch (error) {
        console.error('Error al cargar feedback:', {
          error: error.message,
          userEmail,
          timestamp: new Date().toISOString()
        });
        setError(error.message.includes('registrado') 
          ? 'Tu usuario no está registrado correctamente' 
          : 'Error al cargar evaluaciones');
      } finally {
        setLoading(false);
      }
    };
  
    fetchFeedback();
  }, [userEmail]);
  

  const handleSubmitFeedback = async () => {
    if (!selectedFeedback || rating === 0) {
      Alert.alert("Error", "Debes seleccionar una calificación");
      return;
    }
  
    try {
      await submitFeedback(selectedFeedback.id, rating, comment, userEmail); // usamos email
  
      setPendingFeedback(prev => 
        prev.filter(fb => fb.id !== selectedFeedback.id)
      );
  
      setSelectedFeedback(null);
      setRating(0);
      setComment('');
  
      Alert.alert("Éxito", "¡Gracias por tu evaluación!");
    } catch (error) {
      console.error("Error al enviar feedback:", {
        error: error.message,
        feedbackId: selectedFeedback?.id,
        userEmail,
        timestamp: new Date().toISOString()
      });
      Alert.alert("Error", error.message.includes('permiso') 
        ? 'No tienes permiso para realizar esta acción'
        : 'No se pudo enviar la evaluación. Intenta nuevamente.');
    }
  };
  

  const renderFeedbackItem = ({ item }) => (
    <TouchableOpacity 
      style={[
        styles.feedbackItem,
        selectedFeedback?.id === item.id && styles.selectedItem
      ]}
      onPress={() => {
        setSelectedFeedback(item);
        setRating(item.rating || 0);
        setComment(item.comment || '');
      }}
    >
      <View style={styles.itemContent}>
        <Text style={styles.techName}>
          {item.technician?.name || 'unspecified technician'}
        </Text>
        <Text style={styles.ticketNumber}>
          Ticket: {item.ticket?.id || 'N/A'}
        </Text>
        <Text style={styles.date}> Date: 
          {item.createdAt instanceof Date 
            ? item.createdAt.toLocaleDateString('es-ES') 
            : 'Date not available'}
        </Text>

      </View>
      <MaterialIcons name="chevron-right" size={24} color="#3b82f6" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading pending evaluations...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        {error.includes('autenticado') && (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pending Evaluations</Text>
      
      {pendingFeedback.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="assignment" size={48} color="#9ca3af" />
          <Text style={styles.emptyText}>You do not have pending evaluations</Text>
        </View>
      ) : (
        <FlatList
          data={pendingFeedback}
          renderItem={renderFeedbackItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Modal de Evaluación */}
      {selectedFeedback && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>
              Evaluate {selectedFeedback.technician?.name}
            </Text>
            
            <Text style={styles.modalSubtitle}>
              Ticket: {selectedFeedback.ticket?.id}
            </Text>
            
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => setRating(star)}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={star <= rating ? "star" : "star-outline"}
                    size={40}
                    color={star <= rating ? "#f59e0b" : "#d1d5db"}
                  />
                </TouchableOpacity>
              ))}
            </View>
            
            <Text style={styles.ratingText}>
              {rating > 0 ? `${rating} star${rating !== 1 ? 's' : ''}` : "Select a rating"}
            </Text>
            
            <TextInput
              style={styles.commentInput}
              placeholder="Comments (optional)"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={4}
              value={comment}
              onChangeText={setComment}
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => {
                  setSelectedFeedback(null);
                  setRating(0);
                  setComment('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.submitButton]}
                onPress={handleSubmitFeedback}
                disabled={rating === 0}
              >
                <Text style={styles.submitButtonText}>Submit Review</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9fafb',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    textAlign: 'center',
    marginTop: 20,
    fontSize: 16,
  },
  loginButton: {
    marginTop: 20,
    backgroundColor: '#3b82f6',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'center',
  },
  loginButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -50,
  },
  emptyText: {
    marginTop: 16,
    color: '#6b7280',
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  feedbackItem: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  selectedItem: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  itemContent: {
    flex: 1,
  },
  techName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  ticketNumber: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#6b7280',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 16,
  },
  ratingText: {
    textAlign: 'center',
    color: '#4b5563',
    fontSize: 16,
    marginBottom: 16,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    marginBottom: 24,
    textAlignVertical: 'top',
    backgroundColor: '#f9fafb',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
    marginRight: 8,
  },
  submitButton: {
    backgroundColor: '#3b82f6',
    marginLeft: 8,
    opacity: 1,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  submitButtonText: {
    color: '#e5e7eb',
    marginRight: 8,
  }
});

export default EmployeeFeedbackScreen;