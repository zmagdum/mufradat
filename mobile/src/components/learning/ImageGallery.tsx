/**
 * Image Gallery Component
 * Displays visual associations for vocabulary words
 */

import React, { useState } from 'react';
import {
  View,
  Image,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Modal,
} from 'react-native';

interface ImageGalleryProps {
  images: string[];
  onImagePress?: (imageUrl: string, index: number) => void;
}

const { width } = Dimensions.get('window');
const imageSize = (width - 40) / 3; // 3 columns with spacing

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  onImagePress,
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleImagePress = (imageUrl: string, index: number) => {
    setSelectedImage(imageUrl);
    onImagePress?.(imageUrl, index);
  };

  const closeModal = () => {
    setSelectedImage(null);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={images}
        keyExtractor={(item, index) => `${item}-${index}`}
        numColumns={3}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={() => handleImagePress(item, index)}
          >
            <Image
              source={{ uri: item }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </TouchableOpacity>
        )}
      />

      {/* Full screen image modal */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={closeModal}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={closeModal}
        >
          {selectedImage && (
            <Image
              source={{ uri: selectedImage }}
              style={styles.fullImage}
              resizeMode="contain"
            />
          )}
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageWrapper: {
    margin: 5,
    borderRadius: 8,
    overflow: 'hidden',
  },
  thumbnail: {
    width: imageSize,
    height: imageSize,
    borderRadius: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: width - 40,
    height: '80%',
  },
});

