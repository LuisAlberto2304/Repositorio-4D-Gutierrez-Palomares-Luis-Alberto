import { getAuth, fetchSignInMethodsForEmail } from 'firebase/auth';

export const getUIDByEmail = async (email) => {
  try {
    const auth = getAuth();
    
    // Primero verificar si el email existe
    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.length === 0) {
      throw new Error('No existe usuario con este email');
    }
    
    // Obtener el usuario actual (si está logueado con ese email)
    if (auth.currentUser && auth.currentUser.email === email) {
      return auth.currentUser.uid;
    }
    
    // Si necesitas el UID de otro usuario, deberás:
    // 1. Tener una colección Users donde guardes email-UID
    // 2. Hacer una consulta a Firestore:
    const userDoc = await getDocs(
      query(collection(db, 'Users'), where('email', '==', email))
    );
    
    if (!userDoc.empty) {
      return userDoc.docs[0].id; // Asumiendo que el ID del documento es el UID
    }
    
    throw new Error('No se pudo obtener el UID');
  } catch (error) {
    console.error('Error al obtener UID por email:', error);
    throw error;
  }
};