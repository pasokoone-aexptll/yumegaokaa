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
const person = original.replace(paths[0] ?? "", "");
/** The door stays anchored while the supplied figure and letter change independently. */
export function OnboardingArtwork({
  stage,
  scale = 1,
  codeFigureOpacity,
  hideDoorway = false,
  entrance,
}: {
  stage: "welcome" | "email" | "code";
  scale?: number;
  codeFigureOpacity?: Animated.AnimatedInterpolation<number>;
  hideDoorway?: boolean;
  entrance?: Animated.Value;
}) {
  const reduced = useContext(ReducedIconMotion);
  const [phase] = useState(
    () =>
      new Animated.Value(stage === "welcome" ? 0 : stage === "email" ? 1 : 2),
  );
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
        <Svg
          width={220}
          height={250}
          viewBox="0 0 220 250"
          opacity={hideDoorway ? 0 : 1}
        >
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
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 78,
            height: 116,
            overflow: "hidden",
          }}
        >
          <Animated.View
            style={{
              transform: [
                {
                  translateX: phase.interpolate({
                    inputRange: [0, 1, 2],
                    outputRange: [0, -94, -94],
                  }),
                },
              ],
            }}
          >
            <SvgXml xml={figure} width={94} height={116} />
          </Animated.View>
        </View>
        <Animated.View
          style={{
            position: "absolute",
            top: 116,
            left: 0,
            opacity: phase.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [1, 0, 0],
            }),
          }}
        >
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
            top: 67,
            left: 94,
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
        {entrance && (
          <View style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
            <Animated.View
              style={{
                transform: [
                  {
                    translateX: entrance.interpolate({
                      inputRange: [0, 0.2, 0.28, 0.38, 0.5, 0.7, 1],
                      outputRange: [0, 0, 12, 38, 78, 230, 230],
                      extrapolate: "clamp",
                    }),
                  },
                ],
              }}
            >
              <Svg width={440} height={250} viewBox="0 0 440 250">
                <Path d="M0 0H440V250H134L0 116Z" fill="white" />
              </Svg>
            </Animated.View>
          </View>
        )}
      </View>
    </View>
  );
}
