import { create } from "zustand";
import { devtools } from "zustand/middleware";

export const customCreate = (
  import.meta.env.DEV
    ? // @ts-ignore
      (...args: any[]) => create(devtools(...args))
    : // @ts-ignore
      (...args: any[]) => create(...args)
) as typeof create;
