"use client"

import { Slider as SliderPrimitive } from "@base-ui/react/slider"

import { glassVariantStyles } from "@/lib/glass-variants"
import { cn } from "@/lib/utils"

type GlassSliderProps = SliderPrimitive.Root.Props<number> & {
  thumbLabel?: string
}

// Barra de cristal: carril transparente, relleno con el degradado del botón
// principal y tirador de cristal "liquid".
function GlassSlider({ className, thumbLabel, ...props }: GlassSliderProps) {
  return (
    <SliderPrimitive.Root
      data-slot="glass-slider"
      className={cn("w-full touch-none select-none", className)}
      {...props}
    >
      <SliderPrimitive.Control className="flex h-7 w-full cursor-pointer items-center">
        <SliderPrimitive.Track
          className={cn(
            glassVariantStyles.clear,
            "relative h-3 w-full rounded-full shadow-[inset_0_1px_3px_rgba(15,23,42,0.12)]"
          )}
        >
          <SliderPrimitive.Indicator className="rounded-full bg-indigo-500 [background-image:linear-gradient(180deg,rgba(255,255,255,0.3)_0%,rgba(255,255,255,0)_70%),linear-gradient(90deg,#8b5cf6,#6366f1,#0ea5e9)] dark:bg-indigo-600 dark:[background-image:linear-gradient(180deg,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_60%),linear-gradient(90deg,#7c3aed,#4f46e5,#0284c7)]" />
          <SliderPrimitive.Thumb
            getAriaLabel={thumbLabel ? () => thumbLabel : undefined}
            className={cn(
              glassVariantStyles.liquid,
              "size-6 rounded-full bg-white/70 transition-transform outline-none focus-visible:ring-3 focus-visible:ring-indigo-400/50 active:scale-110 data-dragging:scale-110 dark:bg-white/25"
            )}
          />
        </SliderPrimitive.Track>
      </SliderPrimitive.Control>
    </SliderPrimitive.Root>
  )
}

export { GlassSlider }
