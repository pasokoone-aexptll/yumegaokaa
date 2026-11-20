import { useContext, useEffect, useState } from "react";
import { Animated, Easing, View } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Rect,
  Stop,
  SvgXml,
} from "react-native-svg";
import assets from "../icons/superassets.json";
import { ReducedIconMotion } from "../icons/IconMotion";
const original = assets["非常口から人が出る"];
const paths = original.match(/<path\b[^>]*\/>/g) ?? [];
const figure = assets["非常口の人物"].replace(/fill="#[^"]*"/g, 'fill="white"');
const welcomeFigure = figure
  .replace(
    'fill="white"',
    'fill="url(#person-light)" stroke="#00AF6B" stroke-width="1.5"',
  )
  .replace(
    "</svg>",
    '<defs><linearGradient id="person-light" x1="68" y1="26" x2="30" y2="88" gradientUnits="userSpaceOnUse"><stop stop-color="white"/><stop offset="1" stop-color="#00AF6B"/></linearGradient></defs></svg>',
  );
const person = original.replace(paths[0] ?? "", "");
/** The door stays anchored while the supplied figure and letter change independently. */
export function OnboardingArtwork({
  stage,
  scale = 1,
  codeFigureOpacity,
}: {
  stage: "welcome" | "email" | "code";
  scale?: number;
  codeFigureOpacity?: Animated.AnimatedInterpolation<number>;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [phase] = useState(
    () =>
      new Animated.Value(stage === "welcome" ? 0 : stage === "email" ? 1 : 2),
  );
  const [float] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const move = Animated.timing(phase, {
      toValue: stage === "welcome" ? 0 : stage === "email" ? 1 : 2,
      duration: reduced ? 0 : 650,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    });
    move.start();
    return () => move.stop();
  }, [stage, reduced, phase]);
  useEffect(() => {
    if (stage !== "email" || reduced) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(float, {
          toValue: 1,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(float, {
          toValue: 0,
          duration: 1200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [stage, reduced, float]);
  return (
    <View
      pointerEvents="none"
      style={{ width: 220 * scale, height: 250 * scale }}
    >
      <View
        style={{
          width: 220,
          height: 250,
          transformOrigin: "top left",
          transform: [{ scale }],
        }}
      >
        <Svg width={220} height={250} viewBox="0 0 220 250">
          <Defs>
            <LinearGradient
              id="entry-floor"
              x1="39"
              y1="116"
              x2="170"
              y2="247"
              gradientUnits="userSpaceOnUse"
            >
              <Stop stopColor="#00AF6B" stopOpacity={0.55} />
              <Stop offset="1" stopColor="#00AF6B" stopOpacity={0} />
            </LinearGradient>
          </Defs>
          <Rect width={78} height={116} fill="#00AF6B" />
          <Path d="M0 116H78L209 247H131Z" fill="url(#entry-floor)" />
        </Svg>
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            opacity: phase.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [1, 0, 0],
            }),
            transform: [
              {
                translateX: phase.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [0, -28, -28],
                }),
              },
            ],
          }}
        >
          <SvgXml xml={welcomeFigure} width={94} height={116} />
          <SvgXml
            width={210}
            height={116}
            xml={`<svg viewBox="0 0 210 116" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="fade" x2="0" y2="1"><stop offset="0.8" stop-color="white"/><stop offset="1" stop-color="white" stop-opacity="0"/></linearGradient><mask id="m"><rect width="210" height="116" fill="url(#fade)"/></mask></defs><g mask="url(#m)"><g transform="matrix(1.35 0 -1.4 -1.4 107.6 124.6)">${figure.replace(/<svg[^>]*>/, "").replace(/<\/svg>$/, "")}</g></g></svg>`}
          />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            top: -6,
            left: -69,
            opacity:
              codeFigureOpacity ??
              phase.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [0, 0, 1],
              }),
            transform: [
              {
                translateX: phase.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [-12, -12, 0],
                }),
              },
            ],
          }}
        >
          <SvgXml xml={person} width={271} height={325} />
        </Animated.View>
        <Animated.View
          style={{
            position: "absolute",
            top: 70,
            left: 86,
            opacity: phase.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [0, 1, 0],
            }),
            transform: [
              {
                translateX: phase.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [-45, 0, 50],
                }),
              },
              {
                translateY: float.interpolate({
                  inputRange: [0, 1],
                  outputRange: [2, -6],
                }),
              },
            ],
          }}
        >
          <SvgXml
            xml={assets.letter.replace(
              'stroke="black"',
              'stroke="rgba(0,0,0,0.3)"',
            )}
            width={92}
            height={43}
          />
        </Animated.View>
      </View>
    </View>
  );
}
