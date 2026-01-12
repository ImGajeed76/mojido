import {type ClassValue, clsx} from "clsx";
import {twMerge} from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Type helper for element refs in shadcn components
export type WithElementRef<T, E extends HTMLElement = HTMLElement> = T & {
  ref?: E | null;
};
