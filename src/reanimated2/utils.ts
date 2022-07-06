import { Component } from 'react';
import { measure } from './NativeMethods';
import { RefObjectFunction } from './hook/commonTypes';

export interface ComponentCoords {
  x: number;
  y: number;
}

export function getRelativeCoords(
  parentRef: RefObjectFunction<Component>,
  x: number,
  y: number
): ComponentCoords {
  'worklet';
  const parentCoords = measure(parentRef);
  return {
    x: x - parentCoords.x,
    y: y - parentCoords.y,
  };
}

export type NestedArray<T> = T | NestedArray<T>[];
export function flattenArray<T>(array: NestedArray<T>): T[] {
  if (!Array.isArray(array)) {
    return [array];
  }
  const resultArr: T[] = [];

  const _flattenArray = (arr: NestedArray<T>[]): void => {
    arr.forEach((item) => {
      if (Array.isArray(item)) {
        _flattenArray(item);
      } else {
        resultArr.push(item);
      }
    });
  };
  _flattenArray(array);
  return resultArr;
}
