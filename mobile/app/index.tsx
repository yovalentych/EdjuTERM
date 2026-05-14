import { router } from "expo-router";
import { StyleSheet, View, Image } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Screen } from "@/components/screen";
import { ActionButton, Body, Title, Eyebrow } from "@/components/ui";
import { colors, spacing } from "@/constants/theme";

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primaryDark, colors.primary]}
        style={StyleSheet.absoluteFill}
      />
      <Screen scroll={false} style={styles.screen}>
        <View style={styles.content}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Title inverse style={styles.logoText}>RN</Title>
            </View>
          </View>

          <View style={styles.textContainer}>
            <Eyebrow inverse>Research Navigator</Eyebrow>
            <Title inverse style={styles.mainTitle}>Ваш науковий простір у кишені</Title>
            <Body inverse style={styles.description}>
              Керуйте проєктами, фіксуйте ідеї та контролюйте бюджет досліджень де завгодно.
            </Body>
          </View>

          <View style={styles.footer}>
            <ActionButton 
              label="Почати роботу" 
              onPress={() => router.push("/login")} 
            />
            <View style={styles.spacer} />
          </View>
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  screen: {
    backgroundColor: "transparent",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 60,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  logoText: {
    fontSize: 40,
    fontWeight: "900",
  },
  textContainer: {
    paddingHorizontal: 10,
  },
  mainTitle: {
    fontSize: 42,
    lineHeight: 48,
    marginTop: 12,
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    lineHeight: 28,
  },
  footer: {
    gap: 16,
  },
  spacer: {
    height: 20,
  },
});
