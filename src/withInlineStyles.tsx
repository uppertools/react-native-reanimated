import React, { Component, ComponentType } from 'react';
import { useAnimatedStyle } from './reanimated2/hook/useAnimatedStyle';
import * as animation from './reanimated2/animation';
import { flattenArray } from './reanimated2/utils';
import { StyleProps } from './reanimated2/commonTypes';
import {
  AnimatedComponentProps,
  InitialComponentProps,
} from './createAnimatedComponent';

const isSharedValue = (v: any) => {
  'worklet';
  return typeof v === 'object' && typeof v.value !== undefined;
};

const isFunction = (v: any) => {
  'worklet';
  return typeof v === 'function';
};

export const withInlineStyles = (
  Component: ComponentType<AnimatedComponentProps<InitialComponentProps>>
) => {
  const ComponentWithInlineStyles = (
    props: AnimatedComponentProps<InitialComponentProps>
  ) => {
    const styles: StyleProps[] = [];
    const sharedValuesStyles = {};
    const functionsStyles = {};

    flattenArray(props.style).forEach((style) => {
      const newStyle = {};
      // style returned from useAnimatedStyle
      if (style?.viewDescriptors) {
        styles.push(style);
        return;
      }
      for (const key in style) {
        // case {width: sharedValue}
        if (isSharedValue(style[key])) {
          sharedValuesStyles[key] = style[key];
          // cases like  {width: withTiming(sharedValue)}
        } else if (isFunction(style[key])) {
          functionsStyles[key] = style[key];
        } else {
          newStyle[key] = style[key];
        }
      }
      styles.push(newStyle);
    });

    const updater = () => {
      'worklet';
      const style = {};

      for (const key in sharedValuesStyles) {
        style[key] = sharedValuesStyles[key].value;
      }

      // input: f: () -> animation object | sharedvalue | number/string/etc
      // output: animation
      const parseTree = (val) => {
        'worklet';

        if (isSharedValue(val)) {
          return val.value;
        } else if (isFunction(val)) {
          const animationObject = val();
          const {
            functionName,
            functionArguments,
            animatedArgumentsIndices = [],
          } = animationObject.animationFunctionCall;
          const parsedFunctionArguments = functionArguments.map((arg, i) =>
            animatedArgumentsIndices.includes(i) ? parseTree(arg) : arg
          );
          const fun = animation[functionName];
          return fun(...parsedFunctionArguments);
        } else {
          return val;
        }
      };

      // functions withTiming etc. must be called in updater function
      // also functions can be nested (for example withDelay(100, withTiming(...)))
      // so they create a tree of calls and we need to traverse the tree to call them all
      for (const key in functionsStyles) {
        style[key] = parseTree(functionsStyles[key]);
      }

      return style;
    };

    let sharedValueId = 0;

    // add shared values to function closure to run updater on value change
    // normally in useAnimatedStyle it's done by babel plugin
    const parseTree = (val) => {
      if (isSharedValue(val)) {
        // @ts-ignore disable-next-line
        updater._closure['_shared_value#' + sharedValueId] = val;
        sharedValueId += 1;
      } else if (isFunction(val)) {
        const animationObject = val();
        const { functionArguments, animatedArgumentsIndices = [] } =
          animationObject.animationFunctionCall;
        functionArguments.forEach((arg, i) =>
          animatedArgumentsIndices.includes(i) ? parseTree(arg) : arg
        );
      }
    };

    for (const key in functionsStyles) {
      parseTree(functionsStyles[key]);
    }

    const animatedStyle = useAnimatedStyle(updater);

    return <Component {...props} style={[...styles, animatedStyle]} />;
  };

  ComponentWithInlineStyles.displayName = `ComponentWithInlineStyles(${
    Component.displayName || Component.name || 'Component'
  })`;

  return React.forwardRef<Component>((props, ref) => {
    return (
      <ComponentWithInlineStyles
        {...props}
        {...(ref === null ? null : { forwardedRef: ref })}
      />
    );
  });
};
