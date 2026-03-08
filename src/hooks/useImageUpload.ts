import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../lib/supabase';

export function useImageUpload() {
  async function pickAndUpload(bucket: string, path: string): Promise<string | null> {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to your photo library.');
      return null;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]) return null;

    const asset = result.assets[0];
    const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
    const mimeType = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;

    try {
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      const { error } = await supabase.storage
        .from(bucket)
        .upload(path, blob, { contentType: mimeType, upsert: true });

      if (error) {
        Alert.alert('Upload failed', error.message);
        return null;
      }

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      // Append timestamp to bust CDN cache on re-uploads
      return `${data.publicUrl}?t=${Date.now()}`;
    } catch (err: any) {
      Alert.alert('Upload failed', err.message ?? 'Unknown error');
      return null;
    }
  }

  return { pickAndUpload };
}
