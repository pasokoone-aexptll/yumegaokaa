import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "../apps/mobile/node_modules/typescript/lib/typescript.js";

const compiled = ts.transpileModule(
  readFileSync("apps/mobile/src/components/map/ChatMessageReveal.tsx", "utf8"),
  {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.ReactJSX,
    },
  },
).outputText;

function renderRow({ grow, reduced = false }) {
  const state = [];
  let index = 0,
    effects = [],
    timing;
  class Value {
    constructor(value) {
      this.value = value;
    }
    interpolate() {
      return this;
    }
    setValue(value) {
      this.value = value;
    }
  }
  const Animated = {
    View: "animated-row",
    Value,
    multiply: (p, h) => p.value * h,
    timing(progress, options) {
      return {
        start(done) {
          timing = { progress, options, done };
        },
        stop() {},
      };
    },
  };
  const modules = {
    react: {
      useContext: () => reduced,
      useState(init) {
        const i = index++;
        if (i === state.length)
          state.push(typeof init === "function" ? init() : init);
        return [
          state[i],
          (value) => {
            state[i] = value;
          },
        ];
      },
      useCallback: (fn) => fn,
      useEffect: (fn) => {
        effects.push(fn);
      },
    },
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }) },
    "react-native": { Animated, Easing: { out: (x) => x }, View: "measurer" },
    "../icons/IconMotion": {},
  };
  const component = {};
  new Function("require", "exports", compiled)(
    (name) => modules[name],
    component,
  );
  let ready;
  return {
    render() {
      index = 0;
      effects = [];
      const element = component.ChatMessageReveal({
        grow,
        animate: true,
        waitForImage: true,
        children: (onReady) => {
          ready = onReady;
          return "message";
        },
      });
      effects.forEach((run) => run());
      return element.props;
    },
    ready: () => ready(),
    timing: () => timing,
  };
}

test("short chat opens space gradually for the measured row, including an image arriving late", () => {
  const row = renderRow({ grow: true });
  const initial = row.render();
  initial.children.props.onLayout({ nativeEvent: { layout: { height: 46 } } });
  row.render();
  assert.equal(row.timing(), undefined);
  row.ready();
  const start = row.render();
  assert.equal(start.style[1].height, 0);
  const { progress, options, done } = row.timing();
  assert.equal(options.useNativeDriver, false);
  assert.equal(options.duration, 260);
  progress.setValue(0.5);
  assert.equal(row.render().style[1].height, 23);
  progress.setValue(1);
  done({ finished: true });
  assert.equal(row.render().style[1], false);
});

test("long chat keeps native motion, and reduced motion adds no height animation", () => {
  const long = renderRow({ grow: false });
  long.render();
  long.ready();
  long.render();
  assert.equal(long.timing().options.useNativeDriver, true);
  const reduced = renderRow({ grow: true, reduced: true });
  reduced.render();
  reduced.ready();
  assert.equal(reduced.render().style[1], false);
  assert.equal(reduced.timing(), undefined);
});
