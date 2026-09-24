"use client";

import { transform, useTransform, type MotionValue } from "motion/react";
import { useMemo } from "react";

/**
 * Scroll-linked mapping evaluated in JS on every frame.
 * (Motion can otherwise hand opacity/filter/clip-path to native
 * ScrollTimeline animations, which misreport progress inside sticky layouts.)
 */
export function useRange(value: MotionValue<number>, input: number[], output: number[]): MotionValue<number>;
export function useRange(value: MotionValue<number>, input: number[], output: string[]): MotionValue<string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useRange(value: MotionValue<number>, input: number[], output: (number | string)[]): MotionValue<any> {
  const key = JSON.stringify([input, output]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const map = useMemo(() => transform(input, output as number[]) as (v: number) => number | string, [key]);
  return useTransform(value, (v: number) => map(v));
}
