import { Redirect } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, ImageBackground, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../src/context/AuthContext';
import { fonts } from '../src/theme/fonts';

 
const splashBg = require('../assets/splash-bg.png');

export default function Index() {
  const { session, loading } = useAuth();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!loading) {
      SplashScreen.hideAsync();
    }
  }, [loading]);

  if (loading) {
    return (
      <ImageBackground source={splashBg} style={styles.backgroundImage} resizeMode="cover">
        <LinearGradient
          colors={['transparent', 'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.75)']}
          locations={[0, 0.3, 0.65, 1]}
          style={styles.gradient}
        >
          <View style={[styles.container, { paddingBottom: insets.bottom + 40 }]}>
            <View style={{ flex: 1 }} />
            <Text style={styles.title}>Welly</Text>
            <ActivityIndicator size="large" color="rgba(255, 255, 255, 0.8)" />
          </View>
        </LinearGradient>
      </ImageBackground>
    );
  }

  if (!session) {
    return <Redirect href="/login" />;
  }

  return <Redirect href="/(tabs)/map" />;
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: 28,
  },
  title: {
    fontSize: 110,
    fontFamily: fonts.pacifico,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 24,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 12,
  },
});
