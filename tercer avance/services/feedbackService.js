import { db, auth } from '../firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  getDoc,
  orderBy,
  serverTimestamp,
  limit,
  setDoc
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// services/authService.js


// Función mejorada para validar UIDs
const isValidUID = (uid) => {
  return uid && typeof uid === 'string' && 
         uid.length >= 28 &&  // Los UIDs de Firebase suelen tener 28+ caracteres
         /^[a-zA-Z0-9_-]+$/.test(uid); // Caracteres válidos en UIDs
};

// Función para obtener datos del usuario
const getUserData = async (uid) => {
  try {
    // 1. Intentar obtener de Firestore
    const userDoc = await getDoc(doc(db, "User", uid));
    if (userDoc.exists()) {
      return userDoc.data();
    }

    // 2. Si no existe en Firestore, crear registro básico
    const authData = getAuth().currentUser;
    const minimalUserData = {
      uid: uid,
      email: authData?.email || null,
      displayName: authData?.displayName || 'Usuario sin nombre',
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp()
    };

    await setDoc(doc(db, "User", uid), minimalUserData);
    return minimalUserData;

  } catch (error) {
    console.error("Error al obtener datos del usuario:", error);
    return {
      displayName: 'Usuario no identificado',
      email: null
    };
  }
};

// Función principal para crear feedback
export const createInitialFeedback = async (feedbackData) => {
  try {
    // Validación: Asegurarse de que el email del empleado y del técnico no sean iguales
    if (feedbackData.employee.email === feedbackData.technician.email) {
      throw new Error("ValidationError: Employee and technician emails must be different");
    }

    // Estructura final del documento usando email del empleado y técnico
    const docData = {
      employee: {
        email: feedbackData.employee.email,  // Cambiado de uid a email
        name: feedbackData.employee.name,
      },
      technician: {
        uid: feedbackData.technician.uid,  // El UID del técnico sigue siendo necesario
        name: feedbackData.technician.name,
        email: feedbackData.technician.email
      },
      ticket: feedbackData.ticket,
      rating: 0,
      status: 'pending',
      createdAt: new Date().toISOString(),
      system: {
        version: '2.4',
        source: 'ticketSystem',
        validatedAt: new Date().toISOString()
      }
    };

    const docRef = await addDoc(collection(db, 'Feedback'), docData);

    console.log('Feedback creado con emails verificados:', {
      id: docRef.id,
      employeeEmail: docData.employee.email,
      technicianUID: docData.technician.uid,
      differentEmails: docData.employee.email !== docData.technician.email
    });

    return { id: docRef.id, ...docData };
  } catch (error) {
    console.error("Error crítico al crear feedback:", {
      error: error.message,
      receivedData: {
        employeeEmail: feedbackData?.employee?.email,
        technicianUID: feedbackData?.technician?.uid,
        sameEmails: feedbackData?.employee?.email === feedbackData?.technician?.email
      }
    });
    throw new Error("No se pudo crear la evaluación. Verifica los datos del ticket.");
  }
};


// Función mejorada para obtener feedback pendiente
export const getPendingFeedbackByEmail = async (email) => {
  try {
    // Validación del email del empleado
    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw new Error('El email proporcionado no es válido');
    }

    const q = query(
      collection(db, 'Feedback'),
      where('employee.email', '==', email),
      where('status', '==', 'pending'),
      limit(50) // Limitar resultados para evitar cargas grandes
    );

    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      console.log(`No hay feedback pendiente para el email: ${email}`);
      return [];
    }

    return snapshot.docs.map(doc => {
      const data = doc.data();
    
      let createdAt = null;
    
      // Verificación robusta del campo de fecha
      if (data.createdAt?.toDate) {
        createdAt = data.createdAt.toDate();
      } else if (typeof data.createdAt === 'string') {
        createdAt = new Date(data.createdAt);
      } else {
        createdAt = new Date(); // Fallback (puedes dejarlo como null si prefieres)
      }
    
      return {
        id: doc.id,
        technician: data.technician || {
          name: 'Técnico desconocido',
          email: null
        },
        ticket: data.ticket || {
          number: 'N/A'
        },
        createdAt, // Ya es un objeto Date aquí
        status: data.status || 'pending',
        _rawData: data // Opcional: incluir datos completos
      };
    });
  } catch (error) {
    console.error(`Error al obtener feedback para el email ${email}:`, {
      error: error.message,
      stack: error.stack
    });
    throw new Error(`No se pudieron cargar las evaluaciones: ${error.message}`);
  }
};

// Función mejorada para enviar feedback
export const submitFeedback = async (feedbackId, rating, comment, userEmail) => {
  try {
    // Validación del email del usuario
    if (!userEmail || typeof userEmail !== 'string' || userEmail.trim().length === 0) {
      throw new Error('Debes estar autenticado para enviar feedback');
    }

    if (!feedbackId || feedbackId.length < 8) {
      throw new Error('ID de feedback inválido');
    }

    const numericRating = Number(rating);
    if (isNaN(numericRating)) {
      throw new Error('La calificación debe ser un número');
    }

    if (numericRating < 1 || numericRating > 5) {
      throw new Error('La calificación debe estar entre 1 y 5');
    }

    // Verificar que el feedback existe y pertenece al usuario
    const feedbackRef = doc(db, 'Feedback', feedbackId);
    const feedbackDoc = await getDoc(feedbackRef);

    if (!feedbackDoc.exists()) {
      throw new Error('La evaluación no existe');
    }

    const feedbackData = feedbackDoc.data();

    if (feedbackData.employee.email !== userEmail) {
      throw new Error('No tienes permiso para modificar esta evaluación');
    }

    // Actualización con validación
    await updateDoc(feedbackRef, {
      rating: numericRating,
      comment: comment?.trim() || '',
      status: 'completed',
      completedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      'system.lastUpdatedBy': userEmail
    });

    // Log de auditoría
    console.log('Feedback actualizado:', {
      feedbackId,
      userEmail,
      rating: numericRating,
      timestamp: new Date().toISOString()
    });

    return { 
      success: true, 
      feedbackId,
      updatedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('Error al actualizar feedback:', {
      feedbackId,
      error: {
        message: error.message,
        stack: error.stack
      },
      timestamp: new Date().toISOString()
    });

    throw new Error(`Error al guardar la evaluación: ${error.message}`);
  }
};

export const getTechnicianRatings = async (email) => {
  try {
    const q = query(
      collection(db, 'Feedback'),
      where('technician.email', '==', email),
      where('status', '==', 'completed')
    );

    const snapshot = await getDocs(q);
    const ratings = snapshot.docs.map(doc => doc.data().rating).filter(Boolean);

    if (ratings.length === 0) return { average: null };

    const average = ratings.reduce((acc, curr) => acc + curr, 0) / ratings.length;
    return { average };
  } catch (error) {
    console.error('Error obteniendo calificaciones:', error.message);
    throw error;
  }
};
