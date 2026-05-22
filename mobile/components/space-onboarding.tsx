import { useState, useRef, useEffect } from "react";
import {
  StyleSheet, View, Text, Pressable, Dimensions, Animated, Platform, ScrollView,
} from "react-native";
import * as Icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, fonts } from "@/constants/theme";

const ONBOARDING_KEY = "research_navigator_mobile.space_onboarding.v1";
const { width: SCREEN_W } = Dimensions.get("window");

const SLIDES = [
  {
    emoji: "🗂",
    title: "Простір — це контейнер",
    body: "Кожен Простір організовує проєкти за контекстом: бакалаврат, магістратура, робота, особисте — створюйте окремі.",
    accent: "#0f766e",
  },
  {
    emoji: "📚",
    title: "Проєкти живуть у Просторах",
    body: "Лабораторії, дипломні роботи, курси, гранти. Один проєкт може бути одночасно у кількох Просторах — наприклад, курс, який ви ведете і де навчаєтесь.",
    accent: "#7c3aed",
  },
  {
    emoji: "👆",
    title: "Перемикайтесь зверху",
    body: "Тапніть на назву Простору вгорі — побачите усі ваші Простори. \"+\" праворуч створює новий проєкт у поточному Просторі.",
    accent: "#0369a1",
  },
];

export function SpaceOnboarding({ onDone }: { onDone: () => void }) {
  const [visible, setVisible] = useState(false);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then(v => {
      if (!v) {
        setVisible(true);
        Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }).start();
      }
    });
  }, []);

  function complete() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AsyncStorage.setItem(ONBOARDING_KEY, "1").catch(() => undefined);
    Animated.timing(fadeAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
      setVisible(false);
      onDone();
    });
  }

  function goNext() {
    if (page < SLIDES.length - 1) {
      Haptics.selectionAsync();
      scrollRef.current?.scrollTo({ x: (page + 1) * SCREEN_W, animated: true });
      setPage(page + 1);
    } else {
      complete();
    }
  }

  function handleScroll(e: any) {
    const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    if (idx !== page) setPage(idx);
  }

  if (!visible) return null;

  return (
    <Animated.View style={[s.root, { opacity: fadeAnim }]} pointerEvents="auto">
      <BlurView intensity={Platform.OS === "ios" ? 90 : 100} tint="light" style={StyleSheet.absoluteFill}>
        <LinearGradient
          colors={[SLIDES[page].accent + "18", SLIDES[page].accent + "04", "#fff"]}
          style={StyleSheet.absoluteFill}
        />
      </BlurView>

      <Pressable style={s.skipBtn} onPress={complete} hitSlop={10}>
        <Text style={s.skipText}>Пропустити</Text>
      </Pressable>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
      >
        {SLIDES.map((slide, idx) => (
          <View key={idx} style={[s.slide, { width: SCREEN_W }]}>
            <View style={[s.emojiCircle, { backgroundColor: slide.accent + "18", borderColor: slide.accent + "40" }]}>
              <Text style={s.emoji}>{slide.emoji}</Text>
            </View>
            <Text style={[s.title, { color: slide.accent }]}>{slide.title}</Text>
            <Text style={s.body}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={s.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[s.dot, i === page && [s.dotActive, { backgroundColor: SLIDES[page].accent }]]}
          />
        ))}
      </View>

      <Pressable
        onPress={goNext}
        style={({ pressed }) => [s.nextBtn, { backgroundColor: SLIDES[page].accent }, pressed && { opacity: 0.9 }]}
      >
        <Text style={s.nextBtnText}>
          {page === SLIDES.length - 1 ? "Розпочати" : "Далі"}
        </Text>
        <Icons.ArrowRight size={16} color="#fff" strokeWidth={2.4} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  root:        { ...StyleSheet.absoluteFillObject, zIndex: 2000, justifyContent: "center" },
  skipBtn:     { position: "absolute", top: 60, right: 20, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999, backgroundColor: "rgba(100,116,139,0.12)", zIndex: 10 },
  skipText:    { fontSize: 12, fontFamily: fonts.bold, color: colors.muted },

  slide:       { alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 24 },
  emojiCircle: { width: 140, height: 140, borderRadius: 70, alignItems: "center", justifyContent: "center", borderWidth: 1.5, shadowColor: "#000", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  emoji:       { fontSize: 72 },
  title:       { fontSize: 24, fontFamily: fonts.title, letterSpacing: -0.6, textAlign: "center" },
  body:        { fontSize: 15, color: colors.ink, opacity: 0.75, textAlign: "center", lineHeight: 22, paddingHorizontal: 10 },

  dotsRow:     { flexDirection: "row", justifyContent: "center", gap: 8, paddingVertical: 20 },
  dot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: "#cbd5e1" },
  dotActive:   { width: 26 },

  nextBtn:     { marginHorizontal: 32, marginBottom: 50, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16, borderRadius: 18, shadowColor: "#0f766e", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 8 },
  nextBtnText: { fontSize: 16, color: "#fff", fontFamily: fonts.bold, letterSpacing: -0.3 },
});
