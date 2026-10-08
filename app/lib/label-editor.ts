import type { LabelElement } from "./label-types";

export type DragStart = {
  pointerX: number;
  pointerY: number;
  elementX: number;
  elementY: number;
};

export type ResizeStart = {
  pointerX: number;
  pointerY: number;
  elementWidth: number;
  elementHeight: number;
};

export function clampPosition(
  x: number,
  y: number,
  element: LabelElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  return {
    x: Math.max(
      0,
      Math.min(x, canvasWidth - element.width),
    ),
    y: Math.max(
      0,
      Math.min(y, canvasHeight - element.height),
    ),
  };
}

export function calculateDragPosition(
  start: DragStart,
  pointerX: number,
  pointerY: number,
  scale: number,
  element: LabelElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const deltaX = (pointerX - start.pointerX) / scale;
  const deltaY = (pointerY - start.pointerY) / scale;

  const position = clampPosition(
    start.elementX + deltaX,
    start.elementY + deltaY,
    element,
    canvasWidth,
    canvasHeight,
  );

  return position;
}

export function calculateResize(
  start: ResizeStart,
  pointerX: number,
  pointerY: number,
  scale: number,
  element: LabelElement,
  canvasWidth: number,
  canvasHeight: number,
) {
  const deltaX = (pointerX - start.pointerX) / scale;
  const deltaY = (pointerY - start.pointerY) / scale;

  const minimumWidth = 5;
  const minimumHeight = 5;

  const maximumWidth = Math.max(
    minimumWidth,
    canvasWidth - element.x,
  );

  const maximumHeight = Math.max(
    minimumHeight,
    canvasHeight - element.y,
  );

  return {
    width: Math.max(
      minimumWidth,
      Math.min(
        maximumWidth,
        start.elementWidth + deltaX,
      ),
    ),

    height: Math.max(
      minimumHeight,
      Math.min(
        maximumHeight,
        start.elementHeight + deltaY,
      ),
    ),
  };
}
