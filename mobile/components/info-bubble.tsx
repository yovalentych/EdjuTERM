import { useState } from "react";
import {
  StyleSheet, View, Text, Pressable, Modal, Platform,
} from "react-native";
import * as Icons from "lucide-react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { colors, fonts } from "@/constants/theme";

// Tap on tiny (?) → modal popover with one-liner explanation
export function InfoBubble({
  title,
  body,
  color = colors.primary,
}: {
  title: string;
  body: string;
  color?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        hitSlop={6}
        style={[s.qBtn, { backgroundColor: color + "18", borderColor: color + "33" }]}
      >
        <Icons.HelpCircle size={11} color={color} strokeWidth={2.2} />
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={s.bubble} onPress={() => {}}>
            <BlurView intensity={Platform.OS === "ios" ? 80 : 100} tint="light" style={StyleSheet.absoluteFill}>
              <LinearGradient colors={["rgba(255,255,255,0.95)", "rgba(238,243,248,0.95)"]} style={StyleSheet.absoluteFill} />
            </BlurView>
            <View style={[s.bubbleAccent, { backgroundColor: color }]} />
            <View style={{ padding: 18 }}>
              <View style={s.titleRow}>
                <Icons.Sparkles size={16} color={color} strokeWidth={2} />
                <Text style={[s.title, { color }]}>{title}</Text>
              </View>
              <Text style={s.body}>{body}</Text>
              <Pressable onPress={() => setOpen(false)} style={[s.dismiss, { backgroundColor: color + "15" }]}>
                <Text style={[s.dismissText, { color }]}>Зрозуміло</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  qBtn:        { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  backdrop:    { flex: 1, backgroundColor: "rgba(15,23,42,0.55)", justifyContent: "center", paddingHorizontal: 32 },
  bubble:      { borderRadius: 20, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 28, elevation: 16 },
  bubbleAccent:{ height: 4, width: "100%" },
  titleRow:    { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title:       { fontSize: 14, fontFamily: fonts.bold, letterSpacing: -0.2 },
  body:        { fontSize: 13, color: colors.ink, lineHeight: 19 },
  dismiss:     { marginTop: 14, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  dismissText: { fontSize: 12, fontFamily: fonts.bold, letterSpacing: -0.1 },
});
