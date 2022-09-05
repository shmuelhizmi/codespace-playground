import React from "react";
import Emitter from "./emitter";

// TODO - replace with lodash
function throttle<T extends (...args: any[]) => void>(fn: T, wait: number): T {
  let timer: number | undefined;
  return function (...args: Parameters<T>): void {
    if (!timer) {
      fn(...args);
      timer = setTimeout(() => {
        timer = undefined;
      }, wait);
    }
  } as T;
}

export function mouseFollower(container: HTMLElement) {
  const emitter = new Emitter<{
    mouseMove: (x: number, y: number) => void;
    mouseClick: (x: number, y: number, e: MouseEvent) => void;
    mouseEnterState: (mouseIn: boolean) => void;
  }>();
  let position = [0, 0];
  let offset = [0, 0];
  function onMouseEnter(event: MouseEvent) {
    emitter.call.mouseEnterState(true);
    position = [event.offsetX, event.offsetY];
    offset = [0, 0];
  }
  function onMouseMove(e: MouseEvent) {
    // offset[0] += e.movementX;
    // offset[1] += e.movementY;
    const bounding = container.getBoundingClientRect();
    position = [e.clientX - bounding.left, e.clientY - bounding.top];
    emitter.call.mouseMove(position[0] + offset[0], position[1] + offset[1]);
  }
  function onMouseLeave(event: MouseEvent) {
    emitter.call.mouseEnterState(false);
  }
  function onClick(event: MouseEvent) {
    emitter.call.mouseClick(event.offsetX, event.offsetY, event);
  }
  container.addEventListener("mouseenter", onMouseEnter);
  container.addEventListener("mousemove", onMouseMove);
  container.addEventListener("mouseleave", onMouseLeave);
  container.addEventListener("click", onClick);
  return {
    listen: emitter.listen,
    destroy: () => {
      container.removeEventListener("mouseenter", onMouseEnter);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("click", onClick);
    },
  };
}

interface MouseCursorProps {
  render: (x: number, y: number) => React.ReactNode;
  onClick: (x: number, y: number, e: MouseEvent) => void;
  onEnterState?: (mouseIn: boolean) => void;
  element: HTMLElement;
  throttle: number;
}

interface MouseCursorState {
  position: [number, number];
  mouseIn: boolean;
}

export class MouseCursor extends React.Component<
  MouseCursorProps,
  MouseCursorState
> {
  private mouseFollower?: ReturnType<typeof mouseFollower>;
  componentDidMount() {
    this.mouseFollower = mouseFollower(this.props.element);
    this.mouseFollower.listen.mouseMove(
      throttle((x, y) => {
        this.setState({
          position: [x, y],
        });
      }, this.props.throttle)
    );
    this.mouseFollower.listen.mouseEnterState((mouseIn) => {
      this.setState({
        mouseIn: mouseIn,
        position: mouseIn ? this.state.position : [0, 0],
      });
      if (this.props.onEnterState) {
        this.props.onEnterState(mouseIn);
      }
    });
    this.mouseFollower.listen.mouseClick(this.props.onClick);
  }
  state: MouseCursorState = {
    position: [0, 0],
    mouseIn: false,
  };
  render() {
    if (!this.state.mouseIn) {
      return null;
    }
    return this.props.render(this.state.position[0], this.state.position[1]);
  }
}

const MAX_WIDTH = 100;

export class TriangleCursor extends React.Component<
  Pick<MouseCursorProps, "element">
> {
  render() {
    return (
      <MouseCursor
        element={this.props.element}
        render={(x, y) => {
          const containerWidth = this.props.element.offsetWidth;
          const amountOfPixels = containerWidth * (MAX_WIDTH / 100) / 2;
          const isLeft = x < amountOfPixels;
          const isRight = x > containerWidth - amountOfPixels;
          const direction = isRight ? "right" : "left";
          const bounding = this.props.element.getBoundingClientRect();
          const elementUnderMouse = document.elementFromPoint(
            x + bounding.left,
            y + bounding.top
          );
          const isInteractive =
            elementUnderMouse && elementUnderMouse instanceof HTMLButtonElement;
          if (!isLeft && !isRight) {
            return null;
          }
          return (
            <div
              style={{
                position: "absolute",
                top: y,
                left: x,
                width: 50,
                height: 50,
                transform: `translate(-50%, -50%) rotate(${
                  !isInteractive ? `${direction === "right" ? "-" : ""}90` : "0"
                }deg)`,
                transition: "all 50ms ease-in-out",
                pointerEvents: "none",
                opacity: 0.8,
              }}
            >
              <svg width="50" height="50" viewBox="0 0 50 50">
                <polygon points="0,0 50,0 25,50" fill="#fff" />
              </svg>
            </div>
          );
        }}
        onClick={(x, y, e) => {
          // cancel the click event
          for (const ele of (e as any).path as HTMLElement[]) {
            if (ele instanceof HTMLElement && ele.getAttribute('pg-clickable') === 'true') {
              return;
            }
          }
          e.preventDefault();
          e.stopPropagation();
        }}
        throttle={50}
      />
    );
  }
}

export function clickableFactory(): {
  [Ele in keyof React.ReactHTML]: React.ReactHTML[Ele];
} {
  return new Proxy(
    {},
    {
      get(target, name) {
        return (props: any) => React.createElement(name as any, {...props, 'pg-clickable': 'true'});
      }
    }) as any;
}

export const clickable = clickableFactory();
