import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';

const OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  // Fiş uzun ve dar olabilir; kırpmaya zorlamıyoruz.
  allowsEditing: false,
  quality: 0.7,
};

const fromCamera = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('İzin Gerekli', 'Fiş fotoğrafı çekebilmek için kamera izni vermeniz gerekiyor.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync(OPTIONS);
  return !result.canceled && result.assets.length > 0 ? result.assets[0].uri : null;
};

const fromLibrary = async (): Promise<string | null> => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('İzin Gerekli', 'Görsel seçebilmek için galeri erişim izni vermeniz gerekiyor.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync(OPTIONS);
  return !result.canceled && result.assets.length > 0 ? result.assets[0].uri : null;
};

/** Kullanıcıya "Fotoğraf çek / Galeriden seç" sorar; seçilen görselin URI'sini döner. */
export const pickReceipt = (): Promise<string | null> =>
  new Promise((resolve) => {
    Alert.alert('Fiş veya Görsel Ekle', undefined, [
      { text: 'Fotoğraf Çek', onPress: () => fromCamera().then(resolve, () => resolve(null)) },
      { text: 'Galeriden Seç', onPress: () => fromLibrary().then(resolve, () => resolve(null)) },
      { text: 'İptal', style: 'cancel', onPress: () => resolve(null) },
    ]);
  });
