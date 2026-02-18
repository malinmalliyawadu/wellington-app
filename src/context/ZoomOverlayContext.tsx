import React, {
  createContext,
  useContext,
  useRef,
  useMemo,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { StyleSheet, ImageSourcePropType } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  SharedValue,
} from "react-native-reanimated";

interface ZoomOverlayContextType {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  originWidth: SharedValue<number>;
  originHeight: SharedValue<number>;
  showImage: (source: ImageSourcePropType) => void;
  hideImage: () => void;
}

const ZoomOverlayContext = createContext<ZoomOverlayContextType | null>(null);

export function useZoomOverlay() {
  const ctx = useContext(ZoomOverlayContext);
  if (!ctx) throw new Error("useZoomOverlay must be within ZoomOverlayProvider");
  return ctx;
}

interface OverlayRendererHandle {
  show: (source: ImageSourcePropType) => void;
  hide: () => void;
}

interface OverlayRendererProps {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  originWidth: SharedValue<number>;
  originHeight: SharedValue<number>;
}

/** Isolated component — its state changes don't re-render the provider or consumers */
const OverlayRenderer = forwardRef<OverlayRendererHandle, OverlayRendererProps>(
  function OverlayRenderer(
    { scale, translateX, translateY, originX, originY, originWidth, originHeight },
    ref
  ) {
    const [imageSource, setImageSource] = useState<ImageSourcePropType | null>(null);

    useImperativeHandle(ref, () => ({
      show: (src: ImageSourcePropType) => setImageSource(src),
      hide: () => setImageSource(null),
    }));

    const imageStyle = useAnimatedStyle(() => ({
      position: "absolute" as const,
      left: originX.value,
      top: originY.value,
      width: originWidth.value,
      height: originHeight.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

    if (!imageSource) return null;

    return (
      <Animated.View style={StyleSheet.absoluteFill} pointerEvents="none">
        <Animated.Image
          source={imageSource}
          style={imageStyle}
          resizeMode="cover"
        />
      </Animated.View>
    );
  }
);

export function ZoomOverlayProvider({ children }: { children: React.ReactNode }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const originWidth = useSharedValue(0);
  const originHeight = useSharedValue(0);

  const overlayRef = useRef<OverlayRendererHandle>(null);

  // Stable context value — never changes, so consumers never re-render from context
  const contextValue = useMemo<ZoomOverlayContextType>(
    () => ({
      scale,
      translateX,
      translateY,
      originX,
      originY,
      originWidth,
      originHeight,
      showImage: (src) => overlayRef.current?.show(src),
      hideImage: () => overlayRef.current?.hide(),
    }),
    []
  );

  return (
    <ZoomOverlayContext.Provider value={contextValue}>
      {children}
      <OverlayRenderer
        ref={overlayRef}
        scale={scale}
        translateX={translateX}
        translateY={translateY}
        originX={originX}
        originY={originY}
        originWidth={originWidth}
        originHeight={originHeight}
      />
    </ZoomOverlayContext.Provider>
  );
}
