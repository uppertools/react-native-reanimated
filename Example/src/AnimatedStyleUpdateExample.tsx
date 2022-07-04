import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
  withDelay,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { View, Button } from 'react-native';
import React from 'react';

function AnimatedStyleUpdateExample(): React.ReactElement {
  const randomWidth = useSharedValue(10);
  const randomWidth2 = useSharedValue(10);

  const config = {
    duration: 500,
    easing: Easing.bezierFn(0.5, 0.01, 0, 1),
  };

  // const style = useAnimatedStyle(() => {
  //   return {
  //     width: withTiming(randomWidth.value, config),
  //   };
  // });


  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
        backgroundColor: 'white'
      }}>
      <Animated.View
        style={[
          { width: 100, height: 80, backgroundColor: 'blue', margin: 30 },
          {
            width: withSequence(withTiming(randomWidth, config), withTiming(randomWidth2, config)),
          },
          //style,
        ]}
      />
      <Button
        title="toggle"
        onPress={() => {
          randomWidth.value = Math.random() * 350;
          randomWidth2.value = Math.random() * 350;
        }}
      />
    </View>
  );
}

export default AnimatedStyleUpdateExample;
