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
  active: SharedValue<number>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  originWidth: SharedValue<number>;
  originHeight: SharedValue<number>;
  setSource: (source: ImageSourcePropType) => void;
}

const ZoomOverlayContext = createContext<ZoomOverlayContextType | null>(null);

export function useZoomOverlay() {
  const ctx = useContext(ZoomOverlayContext);
  if (!ctx) throw new Error("useZoomOverlay must be within ZoomOverlayProvider");
  return ctx;
}

interface OverlayRendererProps {
  scale: SharedValue<number>;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
  active: SharedValue<number>;
  originX: SharedValue<number>;
  originY: SharedValue<number>;
  originWidth: SharedValue<number>;
  originHeight: SharedValue<number>;
}

interface OverlayRendererHandle {
  setSource: (source: ImageSourcePropType) => void;
}

/** Always mounted — avoids mount/unmount delay. Visibility driven by shared value. */
const OverlayRenderer = forwardRef<OverlayRendererHandle, OverlayRendererProps>(
  function OverlayRenderer(
    { scale, translateX, translateY, active, originX, originY, originWidth, originHeight },
    ref
  ) {
    const [imageSource, setImageSource] = useState<ImageSourcePropType>({ uri: "" });

    useImperativeHandle(ref, () => ({
      setSource: (src: ImageSourcePropType) => setImageSource(src),
    }));

    const imageStyle = useAnimatedStyle(() => ({
      position: "absolute" as const,
      left: originX.value,
      top: originY.value,
      width: originWidth.value,
      height: originHeight.value,
      opacity: active.value,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: scale.value },
      ],
    }));

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
  const active = useSharedValue(0);
  const originX = useSharedValue(0);
  const originY = useSharedValue(0);
  const originWidth = useSharedValue(0);
  const originHeight = useSharedValue(0);

  const overlayRef = useRef<OverlayRendererHandle>(null);

  const contextValue = useMemo<ZoomOverlayContextType>(
    () => ({
      scale,
      translateX,
      translateY,
      active,
      originX,
      originY,
      originWidth,
      originHeight,
      setSource: (src) => overlayRef.current?.setSource(src),
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
        active={active}
        originX={originX}
        originY={originY}
        originWidth={originWidth}
        originHeight={originHeight}
      />
    </ZoomOverlayContext.Provider>
  );
}
